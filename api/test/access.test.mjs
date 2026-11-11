import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.mjs";
import { draftPlan } from "../src/ai.mjs";
import bcrypt from "bcryptjs";
const secret = "test-only-secret-at-least-thirty-two-characters";
const uid = "507f1f77bcf86cd799439011";
const other = "507f1f77bcf86cd799439012";
const token = (id) =>
  jwt.sign({ uid: id }, secret, {
    issuer: "inclusion-v2",
    audience: "inclusion-app",
    algorithm: "HS256",
  });
const user = { _id: uid, role: "teacher", username: "teacher" };
test("existing bcrypt accounts can sign in without inheriting school administrator access", async () => {
  const password = await bcrypt.hash("existing-password", 4);
  const app = createApp({
    secret,
    isReady: () => true,
    models: {
      User: {
        findOne: () => ({
          select: async () => ({
            _id: uid,
            isAdmin: true,
            username: "teacher",
            password,
          }),
        }),
      },
    },
  });
  const response = await request(app)
    .post("/api/v2/login")
    .send({ username: "teacher", password: "existing-password" });
  assert.equal(response.status, 200);
  assert.equal(response.body.user.role, "teacher");
  assert.equal(jwt.verify(response.body.token, secret).uid, uid);
  assert.equal(response.body.user.password, undefined);
});
test("saved progress uses the authenticated actor and rejects out-of-range percentages", async () => {
  let saved;
  const app = createApp({
    secret,
    isReady: () => true,
    models: {
      User: { findById: async () => user },
      Profile: {
        findOne: async () => ({
          studentId: other,
          teacherIds: [uid],
          goal: { title: "Completion", unit: "%" },
        }),
      },
      Event: {
        create: async (data) => {
          saved = data;
          return { _id: other, ...data, createdAt: new Date() };
        },
      },
    },
  });
  const response = await request(app)
    .post("/api/v2/events")
    .set("Authorization", `Bearer ${token(uid)}`)
    .send({
      studentId: other,
      type: "progress",
      value: 70,
      actorId: other,
      sharedWithFamily: true,
    });
  assert.equal(response.status, 201);
  assert.equal(String(saved.actorId), uid);
  assert.equal(saved.value, 70);
  assert.equal(
    (
      await request(app)
        .post("/api/v2/events")
        .set("Authorization", `Bearer ${token(uid)}`)
        .send({ studentId: other, type: "progress", value: 101 })
    ).status,
    400,
  );
});
test("live API fails closed while the school database is unavailable", async () => {
  const app = createApp({ secret, isReady: () => false });
  const response = await request(app).get("/api/v2/workspace");
  assert.equal(response.status, 503);
  assert.equal(response.body.students, undefined);
});
test("student data requires a valid session, rejecting forged and legacy tokens", async () => {
  const app = createApp({
    secret,
    isReady: () => true,
    models: { User: { findById: async () => user } },
  });
  assert.equal((await request(app).get("/api/v2/workspace")).status, 401);
  assert.equal(
    (
      await request(app)
        .get("/api/v2/workspace")
        .set("Authorization", "Bearer bogus")
    ).status,
    401,
  );
  const legacy = jwt.sign(
    { data: { _id: uid, isAdmin: true } },
    "mysecretsshhhhh",
  );
  assert.equal(
    (
      await request(app)
        .get("/api/v2/workspace")
        .set("Authorization", `Bearer ${legacy}`)
    ).status,
    401,
  );
});
test("teachers cannot log events for students outside their assigned caseload", async () => {
  let created = false;
  const app = createApp({
    secret,
    isReady: () => true,
    models: {
      User: { findById: async () => user },
      Profile: {
        findOne: async () => ({ studentId: other, teacherIds: [other] }),
      },
      Event: {
        create: async () => {
          created = true;
        },
      },
    },
  });
  const response = await request(app)
    .post("/api/v2/events")
    .set("Authorization", `Bearer ${token(uid)}`)
    .send({ studentId: other, type: "frequency" });
  assert.equal(response.status, 403);
  assert.equal(created, false);
});
test("students cannot create student accounts or write another student’s progress", async () => {
  const app = createApp({
    secret,
    isReady: () => true,
    models: {
      User: { findById: async () => ({ ...user, role: "student" }) },
      Profile: { findOne: async () => ({ studentId: other, teacherIds: [] }) },
    },
  });
  assert.equal(
    (
      await request(app)
        .post("/api/v2/students")
        .set("Authorization", `Bearer ${token(uid)}`)
        .send({ name: "X" })
    ).status,
    403,
  );
  assert.equal(
    (
      await request(app)
        .post("/api/v2/events")
        .set("Authorization", `Bearer ${token(uid)}`)
        .send({ studentId: other, type: "progress", value: 90 })
    ).status,
    403,
  );
});
test("a support request cannot be updated by an unrelated teacher", async () => {
  const app = createApp({
    secret,
    isReady: () => true,
    models: {
      User: { findById: async () => user },
      Request: {
        findById: async () => ({
          _id: other,
          teacherId: other,
          studentId: other,
          status: "requested",
        }),
      },
    },
  });
  const response = await request(app)
    .patch(`/api/v2/requests/${other}`)
    .set("Authorization", `Bearer ${token(uid)}`)
    .send({ status: "acknowledged" });
  assert.equal(response.status, 403);
});
test("an expired or revoked family link cannot return student records", async () => {
  const app = createApp({
    secret,
    isReady: () => true,
    models: {
      Share: {
        findOne: async (filter) => {
          assert.equal(filter.revoked, false);
          assert.ok(filter.expiresAt.$gt instanceof Date);
          return null;
        },
      },
    },
  });
  const response = await request(app).get(`/api/v2/family/${"a".repeat(64)}`);
  assert.equal(response.status, 404);
  assert.equal(response.body.student, undefined);
});
test("AI drafts default to an honest guided template without making an external call", async () => {
  const result = await draftPlan(
    { goal: { title: "Reading" }, behavior: {}, accommodations: [] },
    "IEP goal",
    [],
    {
      env: {},
      fetcher: () => {
        throw new Error("Should not call an AI service.");
      },
    },
  );
  assert.equal(result.source, "Guided template");
  assert.match(result.body, /Draft for team review/);
});
test("an enabled AI integration omits account/name fields and rejects incomplete output", async () => {
  const env = {
    OPENAI_API_KEY: "test",
    OPENAI_MODEL: "configured-model",
    AI_DRAFTS_ENABLED: "true",
  };
  let sent;
  await assert.rejects(
    draftPlan(
      {
        name: "Private Name",
        schoolId: "ID123",
        goal: {},
        behavior: {},
        accommodations: [],
      },
      "BIP",
      [
        {
          type: "progress",
          value: 60,
          note: "private reflection",
          createdAt: "2026-11-11",
        },
      ],
      {
        env,
        fetcher: async (url, options) => {
          sent = JSON.parse(options.body);
          return {
            ok: true,
            json: async () => ({ status: "incomplete", output: [] }),
          };
        },
      },
    ),
  );
  assert.equal(sent.store, false);
  assert.ok(!sent.input.includes("Private Name"));
  assert.ok(!sent.input.includes("private reflection"));
});
