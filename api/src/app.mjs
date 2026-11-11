import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import mongoose from "mongoose";
import webpush from "web-push";
import { models as defaultModels, serialize } from "./models.mjs";
import {
  roleFor,
  STAFF_ROLES,
  DEFAULT_SETTINGS,
  validateSettings,
  validateEvent,
  canTransition,
  familyProjection,
  guidedDraft,
  isSchoolHours,
} from "../../shared/classroom.mjs";
import { draftPlan } from "./ai.mjs";
import { pictureFor } from "../../shared/pictures.mjs";

import { createUpdateBus } from "./updates.mjs";
import { addReportRoutes } from "./report-routes.mjs";

const fail = (status, message) => Object.assign(new Error(message), { status });
const route = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
const safeUser = (user) => ({
  id: String(user._id),
  username: user.username,
  name:
    `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username,
  role: roleFor(user),
});
const text = (value, max = 160) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const hash = (token) => createHash("sha256").update(token).digest("hex");

export function createApp({
  models: db = defaultModels,
  secret,
  isReady = () => mongoose.connection.readyState === 1,
  env = process.env,
  updates = createUpdateBus(),
} = {}) {
  if (!secret || secret.length < 32)
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  const app = express();
  app.disable("x-powered-by");
  if (env.TRUST_PROXY) app.set("trust proxy", Number(env.TRUST_PROXY));
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "same-site" },
    }),
  );
  const allowed = new Set(
    (env.APP_ORIGINS || "http://localhost:5173")
      .split(",")
      .map((s) => s.trim()),
  );
  const extensionOrigins = new Set(
    (env.CHROME_EXTENSION_IDS || "")
      .split(",")
      .filter(Boolean)
      .map((id) => `chrome-extension://${id}`),
  );
  app.use(
    cors({
      origin: (origin, cb) =>
        cb(
          null,
          !origin || allowed.has(origin) || extensionOrigins.has(origin),
        ),
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
      allowedHeaders: ["Authorization", "Content-Type"],
    }),
  );
  app.use(express.json({ limit: "48kb" }));
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("Referrer-Policy", "no-referrer");
    next();
  });
  app.get("/api/health", (req, res) =>
    res.status(isReady() ? 200 : 503).json({ ready: isReady() }),
  );
  app.use(
    "/api/v2",
    rateLimit({
      windowMs: 60000,
      limit: 240,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  app.use("/api/v2", (req, res, next) =>
    isReady()
      ? next()
      : next(
          fail(
            503,
            "The school database is not connected. You can explore the demo while setup is completed.",
          ),
        ),
  );
  app.post(
    "/api/v2/login",
    rateLimit({
      windowMs: 15 * 60000,
      limit: 20,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
    route(async (req, res) => {
      const username = text(req.body.username);
      const password =
        typeof req.body.password === "string"
          ? req.body.password.slice(0, 256)
          : "";
      if (!username || !password)
        throw fail(400, "Enter your username and password.");
      const user = await db.User.findOne({ username }).select("+password");
      if (!user || !(await bcrypt.compare(password, user.password)))
        throw fail(401, "The username or password is incorrect.");
      const token = jwt.sign({ uid: String(user._id) }, secret, {
        expiresIn: "2h",
        algorithm: "HS256",
        issuer: "inclusion-v2",
        audience: "inclusion-app",
      });
      res.json({ token, user: safeUser(user) });
    }),
  );
  app.get(
    "/api/v2/family/:token",
    route(async (req, res) => {
      if (!/^[a-f0-9]{64}$/.test(req.params.token))
        throw fail(404, "This sharing link is unavailable.");
      const share = await db.Share.findOne({
        tokenHash: hash(req.params.token),
        revoked: false,
        expiresAt: { $gt: new Date() },
      });
      if (!share)
        throw fail(404, "This sharing link has expired or been revoked.");
      const profile = await db.Profile.findOne({ studentId: share.studentId });
      if (!profile) throw fail(404, "This student is unavailable.");
      const events = await db.Event.find({
        studentId: share.studentId,
        type: "progress",
        sharedWithFamily: true,
        voided: false,
      })
        .sort({ createdAt: 1 })
        .limit(500);
      res.json({
        ...familyProjection(serialize(profile), events.map(serialize)),
        expiresAt: share.expiresAt,
      });
    }),
  );
  app.use(
    "/api/v2",
    route(async (req, res, next) => {
      try {
        const raw = req.headers.authorization || "";
        if (!raw.startsWith("Bearer ")) throw new Error();
        const claims = jwt.verify(raw.slice(7), secret, {
          algorithms: ["HS256"],
          issuer: "inclusion-v2",
          audience: "inclusion-app",
        });
        req.user = await db.User.findById(claims.uid);
        if (!req.user) throw new Error();
        req.role = roleFor(req.user);
        req.sessionExpiresAt = claims.exp * 1000;
      } catch {
        throw fail(401, "Please sign in again.");
      }
      req.notifyUsers = new Set();
      res.on("finish", () => {
        if (
          res.statusCode < 300 &&
          ["POST", "PATCH", "PUT", "DELETE"].includes(req.method) &&
          req.notifyUsers.size
        )
          updates.publish([...req.notifyUsers]);
      });
      next();
    }),
  );
  app.get("/api/v2/updates", (req, res) => {
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    res.write("event: ready\ndata: {}\n\n");
    const unsubscribe = updates.subscribe(
      { id: String(req.user._id), role: req.role },
      () => {
        if (!res.destroyed) res.write("event: changed\ndata: {}\n\n");
      },
    );
    const heartbeat = setInterval(() => {
      if (!res.destroyed) res.write(": heartbeat\n\n");
    }, 15000);
    const expiry = setTimeout(
      () => res.end(),
      Math.max(0, req.sessionExpiresAt - Date.now()),
    );
    res.on("close", () => {
      clearInterval(heartbeat);
      clearTimeout(expiry);
      unsubscribe();
    });
  });
  const staff = (req, res, next) =>
    STAFF_ROLES.includes(req.role)
      ? next()
      : next(fail(403, "This action is available to educators."));
  async function profileFor(req, studentId) {
    if (!mongoose.isValidObjectId(studentId))
      throw fail(404, "Student not found.");
    const profile = await db.Profile.findOne({ studentId });
    if (!profile) throw fail(404, "Student not found.");
    const self = String(req.user._id) === String(studentId);
    const assigned = profile.teacherIds.some(
      (id) => String(id) === String(req.user._id),
    );
    if (req.role !== "admin" && !(req.role === "student" ? self : assigned))
      throw fail(403, "You do not have access to this student.");
    req.notifyUsers?.add(String(studentId));
    for (const id of profile.teacherIds) req.notifyUsers?.add(String(id));
    return profile;
  }
  addReportRoutes(app, { db, staff, profileFor });
  app.get(
    "/api/v2/workspace",
    route(async (req, res) => {
      const filter =
        req.role === "admin"
          ? {}
          : req.role === "student"
            ? { studentId: req.user._id }
            : { teacherIds: req.user._id };
      const profiles = await db.Profile.find(filter).sort({ name: 1 });
      const ids = profiles.map((p) => p.studentId);
      const since = new Date(Date.now() - 90 * 86400000);
      const events = await db.Event.find({
        studentId: { $in: ids },
        createdAt: { $gte: since },
        voided: false,
      })
        .sort({ createdAt: -1 })
        .limit(2000);
      const requestFilter =
        req.role === "student"
          ? { studentId: req.user._id }
          : req.role === "admin"
            ? { studentId: { $in: ids } }
            : { teacherId: req.user._id };
      const requests = await db.Request.find(requestFilter)
        .sort({ createdAt: -1 })
        .limit(200);
      const settings = await db.Settings.findOne({ userId: req.user._id });
      const teacherIds = [
        ...new Set(profiles.flatMap((p) => p.teacherIds.map(String))),
      ];
      const teachers = await db.User.find({ _id: { $in: teacherIds } });
      res.json({
        user: safeUser(req.user),
        students: profiles.map((p) => {
          const s = serialize(p);
          if (req.role === "student") {
            delete s.drafts;
            delete s.behavior;
          }
          return s;
        }),
        events: events
          .map(serialize)
          .filter((e) => req.role !== "student" || e.type === "progress"),
        requests: requests.map(serialize),
        teachers: teachers.map(safeUser),
        settings: {
          ...DEFAULT_SETTINGS,
          ...(settings ? serialize(settings) : {}),
        },
        aiEnabled: Boolean(
          env.OPENAI_API_KEY &&
            env.OPENAI_MODEL &&
            env.AI_DRAFTS_ENABLED === "true",
        ),
        pushEnabled: Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY),
      });
    }),
  );
  app.post(
    "/api/v2/students",
    staff,
    route(async (req, res) => {
      if (req.role !== "admin")
        throw fail(403, "A school administrator must create student accounts.");
      const { name, schoolId, grade, planType, username, password } = req.body;
      if (
        !text(name) ||
        !text(schoolId) ||
        !text(username) ||
        typeof password !== "string" ||
        password.length < 12 ||
        password.length > 128 ||
        !["IEP", "504", "Support"].includes(planType)
      )
        throw fail(
          400,
          "Provide a name, student ID, username, plan type, and a password of at least 12 characters.",
        );
      if (
        await db.User.exists({
          $or: [
            { username: text(username) },
            { studentSchoolId: text(schoolId) },
          ],
        })
      )
        throw fail(409, "That username or student ID is already in use.");
      const teacherIds = Array.isArray(req.body.teacherIds)
        ? [...new Set(req.body.teacherIds)]
        : [];
      if (teacherIds.some((id) => !mongoose.isValidObjectId(id)))
        throw fail(400, "Choose valid teacher accounts.");
      const teachers = await db.User.find({ _id: { $in: teacherIds } });
      if (
        teachers.length !== teacherIds.length ||
        teachers.some((u) => !STAFF_ROLES.includes(roleFor(u)))
      )
        throw fail(400, "Choose valid teacher accounts.");
      const parts = text(name).split(" ");
      const user = await db.User.create({
        username: text(username),
        studentSchoolId: text(schoolId),
        firstName: parts.shift(),
        lastName: parts.join(" "),
        password: await bcrypt.hash(password, 12),
        isAdmin: false,
        role: "student",
      });
      try {
        const profile = await db.Profile.create({
          studentId: user._id,
          name: text(name),
          schoolId: text(schoolId),
          grade: text(grade, 30),
          planType,
          teacherIds,
          accommodations: [],
          drafts: [],
        });
        res.status(201).json(serialize(profile));
      } catch (error) {
        await db.User.deleteOne({ _id: user._id });
        throw error;
      }
    }),
  );
  app.get(
    "/api/v2/teachers",
    staff,
    route(async (req, res) => {
      if (req.role !== "admin")
        throw fail(403, "Administrator access required.");
      const users = await db.User.find({
        $or: [
          { role: { $in: STAFF_ROLES } },
          { role: { $exists: false }, isAdmin: true },
        ],
      });
      res.json(users.map(safeUser));
    }),
  );
  app.patch(
    "/api/v2/students/:id",
    staff,
    route(async (req, res) => {
      const profile = await profileFor(req, req.params.id);
      if (req.body.teacherIds !== undefined) {
        if (req.role !== "admin")
          throw fail(
            403,
            "Only school administrators can change educator assignments.",
          );
        if (
          !Array.isArray(req.body.teacherIds) ||
          req.body.teacherIds.length > 30 ||
          req.body.teacherIds.some((id) => !mongoose.isValidObjectId(id))
        )
          throw fail(400, "Choose valid educator accounts.");
        const ids = [...new Set(req.body.teacherIds)];
        const assigned = await db.User.find({ _id: { $in: ids } });
        if (
          assigned.length !== ids.length ||
          assigned.some((u) => !STAFF_ROLES.includes(roleFor(u)))
        )
          throw fail(400, "Choose valid educator accounts.");
        profile.teacherIds = ids;
      }
      if (req.body.accommodations !== undefined) {
        if (
          !Array.isArray(req.body.accommodations) ||
          req.body.accommodations.length > 40
        )
          throw fail(400, "Provide up to 40 accommodations.");
        profile.accommodations = req.body.accommodations.map((a) => {
          if (!text(a.title))
            throw fail(400, "Every accommodation needs a title.");
          return {
            id: text(a.id) || randomUUID(),
            title: text(a.title),
            description: text(a.description, 1000),
            picture: pictureFor(a),
            studentLabel: text(a.studentLabel, 40),
          };
        });
      }
      if (req.body.goal) {
        const g = req.body.goal;
        if (
          !text(g.title) ||
          !Number.isFinite(g.baseline) ||
          !Number.isFinite(g.target) ||
          g.baseline === g.target ||
          g.baseline < 0 ||
          g.target < 0
        )
          throw fail(
            400,
            "Provide a measurable goal with different baseline and target values.",
          );
        profile.goal = {
          title: text(g.title),
          baseline: g.baseline,
          target: g.target,
          unit: text(g.unit, 40),
        };
      }
      if (req.body.behavior)
        profile.behavior = {
          name: text(req.body.behavior.name),
          definition: text(req.body.behavior.definition, 2000),
        };
      await profile.save();
      res.json(serialize(profile));
    }),
  );
  app.post(
    "/api/v2/requests",
    route(async (req, res) => {
      if (req.role !== "student")
        throw fail(403, "Support requests are sent by students.");
      const profile = await profileFor(req, String(req.user._id));
      const accommodation = profile.accommodations.find(
        (a) => a.id === req.body.accommodationId,
      );
      const teacherId = req.body.teacherId;
      if (
        !accommodation ||
        !profile.teacherIds.some((id) => String(id) === teacherId)
      )
        throw fail(400, "Choose an assigned accommodation and teacher.");
      if (!/^[a-zA-Z0-9-]{8,80}$/.test(req.body.clientRequestId || ""))
        throw fail(400, "A request identifier is required.");
      let request = await db.Request.findOne({
        studentId: req.user._id,
        clientRequestId: req.body.clientRequestId,
      });
      if (request) return res.json(serialize(request));
      request = await db.Request.create({
        studentId: req.user._id,
        teacherId,
        accommodationId: accommodation.id,
        title: accommodation.title,
        clientRequestId: req.body.clientRequestId,
        source: req.body.source === "extension" ? "extension" : "web",
        history: [
          { status: "requested", at: new Date(), actorId: req.user._id },
        ],
      });
      res.status(201).json(serialize(request));
      // Notification delivery never changes whether the request is saved successfully.
      notify(teacherId).catch(() =>
        console.warn("A support push notification could not be delivered."),
      );
    }),
  );
  app.patch(
    "/api/v2/requests/:id",
    route(async (req, res) => {
      if (!mongoose.isValidObjectId(req.params.id))
        throw fail(404, "Request not found.");
      const request = await db.Request.findById(req.params.id);
      if (!request) throw fail(404, "Request not found.");
      if (
        req.role === "student"
          ? String(request.studentId) !== String(req.user._id)
          : req.role !== "admin" &&
            String(request.teacherId) !== String(req.user._id)
      )
        throw fail(403, "You cannot change this request.");
      await profileFor(req, String(request.studentId));
      if (!canTransition(request.status, req.body.status, req.role))
        throw fail(409, "Refresh the request before changing its status.");
      const updated = await db.Request.findOneAndUpdate(
        { _id: request._id, status: request.status },
        {
          $set: { status: req.body.status },
          $push: {
            history: {
              status: req.body.status,
              at: new Date(),
              actorId: req.user._id,
            },
          },
        },
        { new: true, runValidators: true },
      );
      if (!updated)
        throw fail(409, "This request was updated elsewhere. Please refresh.");
      res.json(serialize(updated));
    }),
  );
  app.post(
    "/api/v2/requests/:id/messages",
    route(async (req, res) => {
      if (!mongoose.isValidObjectId(req.params.id))
        throw fail(404, "Request not found.");
      const request = await db.Request.findById(req.params.id);
      if (!request) throw fail(404, "Request not found.");
      if (
        req.role === "student"
          ? String(request.studentId) !== String(req.user._id)
          : req.role !== "admin" &&
            String(request.teacherId) !== String(req.user._id)
      )
        throw fail(403, "You cannot join this request conversation.");
      await profileFor(req, String(request.studentId));
      if (["provided", "cancelled"].includes(request.status))
        throw fail(
          409,
          "This request is closed. Send a new request if support is still needed.",
        );
      const phrases = {
        still_need_help: "I still need help.",
        thanks: "Thank you.",
        on_my_way: "I am on my way.",
        please_wait: "I have your request. Please wait a moment.",
      };
      const kind = req.body.kind;
      if (
        req.role === "student" &&
        !["still_need_help", "thanks"].includes(kind)
      )
        throw fail(400, "Choose a student picture reply.");
      const messageText =
        phrases[kind] ||
        (req.role !== "student" && kind === "text"
          ? text(req.body.text, 500)
          : "");
      if (!messageText)
        throw fail(400, "Choose a reply or enter a short message.");
      const message = {
        id: randomUUID(),
        kind,
        text: messageText,
        role: req.role,
        actorId: req.user._id,
        createdAt: new Date(),
      };
      const result = await db.Request.findOneAndUpdate(
        {
          _id: request._id,
          status: request.status,
          "messages.99": { $exists: false },
        },
        { $push: { messages: message } },
        { new: true, runValidators: true },
      );
      if (!result)
        throw fail(
          409,
          "Refresh this conversation; it changed or reached its message limit.",
        );
      res.status(201).json(serialize(result));
    }),
  );
  app.post(
    "/api/v2/events",
    route(async (req, res) => {
      const profile = await profileFor(req, req.body.studentId);
      if (
        req.body.type === "progress" &&
        (!profile.goal?.title ||
          (profile.goal.unit === "%" && req.body.value > 100))
      )
        throw fail(
          400,
          "Use the measurement range in the student’s approved goal.",
        );
      if (
        req.body.type !== "progress" &&
        (!profile.behavior?.name || !profile.behavior?.definition)
      )
        throw fail(
          400,
          "Add an operational behavior definition before recording observations.",
        );
      let data;
      try {
        data = validateEvent(req.body, req.role);
      } catch (e) {
        throw fail(400, e.message);
      }
      const event = await db.Event.create({
        ...data,
        studentId: req.body.studentId,
        actorId: req.user._id,
      });
      res.status(201).json(serialize(event));
    }),
  );
  app.delete(
    "/api/v2/events/:id",
    staff,
    route(async (req, res) => {
      if (!mongoose.isValidObjectId(req.params.id))
        throw fail(404, "Entry not found.");
      const event = await db.Event.findById(req.params.id);
      if (!event) throw fail(404, "Entry not found.");
      await profileFor(req, String(event.studentId));
      if (
        req.role !== "admin" &&
        String(event.actorId) !== String(req.user._id)
      )
        throw fail(403, "Only the recording educator can undo this entry.");
      event.voided = true;
      event.voidedAt = new Date();
      await event.save();
      res.json({ id: String(event._id) });
    }),
  );
  app.put(
    "/api/v2/settings",
    staff,
    route(async (req, res) => {
      let settings;
      try {
        settings = validateSettings(req.body);
      } catch (e) {
        throw fail(400, e.message);
      }
      await db.Settings.findOneAndUpdate(
        { userId: req.user._id },
        { $set: settings },
        { upsert: true, new: true },
      );
      req.notifyUsers.add(String(req.user._id));
      res.json(settings);
    }),
  );
  app.post(
    "/api/v2/students/:id/drafts",
    staff,
    route(async (req, res) => {
      const profile = await profileFor(req, req.params.id);
      const type = [
        "IEP goal",
        "504 review",
        "BIP",
        "Operational definition",
      ].includes(req.body.type)
        ? req.body.type
        : "IEP goal";
      if (profile.drafts.length >= 100)
        throw fail(400, "This student has reached the draft history limit.");
      const events = await db.Event.find({
        studentId: req.params.id,
        voided: false,
      })
        .sort({ createdAt: -1 })
        .limit(30);
      const draft = req.body.useAI
        ? await draftPlan(serialize(profile), type, events.map(serialize), {
            env,
          })
        : {
            body: guidedDraft(serialize(profile), type),
            source: "Guided template",
          };
      const item = {
        id: randomUUID(),
        type,
        ...draft,
        status: "draft",
        createdAt: new Date(),
        createdBy: req.user._id,
      };
      profile.drafts.push(item);
      await profile.save();
      res.status(201).json(item);
    }),
  );
  app.patch(
    "/api/v2/students/:id/drafts/:draftId",
    staff,
    route(async (req, res) => {
      const profile = await profileFor(req, req.params.id);
      const draft = profile.drafts.find((d) => d.id === req.params.draftId);
      if (!draft || draft.status !== "draft")
        throw fail(409, "This draft is unavailable or already reviewed.");
      if (req.body.status === "approved" && req.body.teamConfirmed !== true)
        throw fail(400, "Confirm team review before approving this draft.");
      if (req.body.body !== undefined) {
        if (!text(req.body.body, 12000))
          throw fail(400, "The draft cannot be empty.");
        draft.body = text(req.body.body, 12000);
      }
      if (["approved", "rejected"].includes(req.body.status)) {
        draft.status = req.body.status;
        draft.reviewedBy = req.user._id;
        draft.reviewedAt = new Date();
      }
      await profile.save();
      res.json(draft);
    }),
  );
  app.post(
    "/api/v2/students/:id/shares",
    staff,
    route(async (req, res) => {
      await profileFor(req, req.params.id);
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 86400000);
      const share = await db.Share.create({
        studentId: req.params.id,
        createdBy: req.user._id,
        tokenHash: hash(token),
        expiresAt,
      });
      res.status(201).json({ id: String(share._id), token, expiresAt });
    }),
  );
  app.delete(
    "/api/v2/students/:id/shares",
    staff,
    route(async (req, res) => {
      await profileFor(req, req.params.id);
      await db.Share.updateMany(
        { studentId: req.params.id, revoked: false },
        { $set: { revoked: true } },
      );
      res.json({ revoked: true });
    }),
  );
  app.get("/api/v2/push", staff, (req, res) =>
    res.json({
      configured: Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY),
      publicKey: env.VAPID_PUBLIC_KEY || null,
    }),
  );
  app.post(
    "/api/v2/push",
    staff,
    route(async (req, res) => {
      const subscription = req.body;
      let endpoint;
      try {
        endpoint = new URL(subscription.endpoint);
      } catch {
        throw fail(400, "Invalid push subscription.");
      }
      if (
        endpoint.protocol !== "https:" ||
        ![
          "fcm.googleapis.com",
          "updates.push.services.mozilla.com",
          "web.push.apple.com",
        ].includes(endpoint.hostname) ||
        !subscription.keys?.auth ||
        !subscription.keys?.p256dh
      )
        throw fail(400, "Unsupported push subscription.");
      await db.Settings.updateOne(
        { userId: req.user._id },
        {
          $addToSet: { subscriptions: subscription },
          $setOnInsert: DEFAULT_SETTINGS,
        },
        { upsert: true },
      );
      res.json({ subscribed: true });
    }),
  );
  async function notify(teacherId) {
    if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT)
      return;
    const settings = await db.Settings.findOne({ userId: teacherId });
    if (!isSchoolHours(settings ? settings.toObject() : DEFAULT_SETTINGS))
      return;
    webpush.setVapidDetails(
      env.VAPID_SUBJECT,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY,
    );
    for (const subscription of settings?.subscriptions || []) {
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            body: "A student requested support. Open your inbox.",
          }),
          { TTL: 60, urgency: "normal" },
        );
      } catch (e) {
        if ([404, 410].includes(e.statusCode))
          await db.Settings.updateOne(
            { userId: teacherId },
            { $pull: { subscriptions: { endpoint: subscription.endpoint } } },
          );
      }
    }
  }
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "This endpoint does not exist." }),
  );
  app.use((error, req, res, next) => {
    const status =
      error.status ||
      (error.code === 11000
        ? 409
        : error.name === "ValidationError" || error.name === "CastError"
          ? 400
          : 500);
    if (status >= 500) console.error("API operation failed:", error.name);
    res.status(status).json({
      error:
        status >= 500 && !error.status
          ? "The request could not be completed. Please try again."
          : error.code === 11000
            ? "This record already exists."
            : error.message,
    });
  });
  return app;
}
