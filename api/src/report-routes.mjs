import { buildReport, validatePeriod } from "../../shared/reporting.mjs";
import { serialize } from "./models.mjs";
const fail = (status, message) => Object.assign(new Error(message), { status });
const route = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
export function addReportRoutes(app, { db, staff, profileFor }) {
  app.get(
    "/api/v2/reports",
    staff,
    route(async (req, res) => {
      let period;
      try {
        period = validatePeriod(req.query.start, req.query.end);
      } catch (e) {
        throw fail(400, e.message);
      }
      const filter = req.role === "admin" ? {} : { teacherIds: req.user._id };
      let profiles = await db.Profile.find(filter);
      if (
        req.query.studentId &&
        !profiles.some((p) => String(p.studentId) === req.query.studentId)
      )
        throw fail(403, "This student is outside your report scope.");
      if (req.query.studentId)
        profiles = profiles.filter(
          (p) => String(p.studentId) === req.query.studentId,
        );
      if (req.role === "admin" && req.query.teacherId)
        profiles = profiles.filter((p) =>
          p.teacherIds.some((id) => String(id) === req.query.teacherId),
        );
      const ids = profiles.map((p) => p.studentId);
      const teachers = await db.User.find({
        _id: {
          $in: [...new Set(profiles.flatMap((p) => p.teacherIds.map(String)))],
        },
      });
      const window = {
        $gte: new Date(Date.parse(period.start) - 86400000),
        $lt: new Date(Date.parse(period.end) + 2 * 86400000),
      };
      const [events, requests, phases, notes] = await Promise.all([
        db.Event.find({
          studentId: { $in: ids },
          createdAt: window,
          voided: false,
        }).limit(50001),
        db.Request.find({ studentId: { $in: ids }, createdAt: window }).limit(
          10001,
        ),
        db.Phase.find({
          studentId: { $in: ids },
          startsOn: { $lte: period.end },
        }).limit(5001),
        db.ReviewNote.find({
          studentId: { $in: ids },
          createdAt: window,
        }).limit(5001),
      ]);
      if (
        events.length > 50000 ||
        requests.length > 10000 ||
        phases.length > 5000 ||
        notes.length > 5000
      )
        throw fail(
          413,
          "This range contains too many records. Choose a shorter report period.",
        );
      let report;
      try {
        report = buildReport(
          {
            teachers: teachers.map((t) => ({
              id: String(t._id),
              name:
                `${t.firstName || ""} ${t.lastName || ""}`.trim() || t.username,
            })),
            students: profiles.map(serialize),
            events: events.map(serialize),
            requests: requests.map(serialize),
            phases: phases.map(serialize),
            reviewNotes: notes.map(serialize),
          },
          {
            ...period,
            behavior:
              typeof req.query.behavior === "string"
                ? req.query.behavior.slice(0, 160)
                : undefined,
            studentId: req.query.studentId,
            teacherId: req.role === "admin" ? req.query.teacherId : undefined,
            timezone: req.query.timezone || "America/Denver",
            mode: req.query.mode === "board" ? "board" : "team",
          },
        );
      } catch {
        throw fail(400, "Check the date range and time zone.");
      }
      res.json(report);
    }),
  );
  app.post(
    "/api/v2/students/:id/phases",
    staff,
    route(async (req, res) => {
      await profileFor(req, req.params.id);
      const { name, description, startsOn, teamConfirmed } = req.body;
      try {
        validatePeriod(startsOn, startsOn);
      } catch {
        throw fail(400, "Choose a valid phase start date.");
      }
      if (
        typeof name !== "string" ||
        !name.trim() ||
        name.length > 160 ||
        typeof description !== "string" ||
        !description.trim() ||
        description.length > 2000 ||
        teamConfirmed !== true
      )
        throw fail(
          400,
          "Provide a phase name, implementation details, and confirmation that it matches the team-approved plan.",
        );
      const item = await db.Phase.create({
        studentId: req.params.id,
        name: name.trim(),
        description: description.trim(),
        startsOn,
        createdBy: req.user._id,
        teamConfirmed: true,
      });
      res.status(201).json(serialize(item));
    }),
  );
  app.post(
    "/api/v2/students/:id/reviews",
    staff,
    route(async (req, res) => {
      await profileFor(req, req.params.id);
      const { reflection = "", proposal = "", planType = "IEP" } = req.body;
      if (
        !["IEP", "504", "BIP"].includes(planType) ||
        typeof reflection !== "string" ||
        typeof proposal !== "string" ||
        (!reflection.trim() && !proposal.trim()) ||
        reflection.length > 2000 ||
        proposal.length > 2000
      )
        throw fail(
          400,
          "Add a reflection or a proposed team discussion item (up to 2,000 characters each).",
        );
      const item = await db.ReviewNote.create({
        studentId: req.params.id,
        reflection: reflection.trim(),
        proposal: proposal.trim(),
        planType,
        status: "proposed",
        createdBy: req.user._id,
      });
      res.status(201).json(serialize(item));
    }),
  );
}
