import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.mjs";
const secret = "reports-test-key-over-thirty-two-characters";
const uid = "507f1f77bcf86cd799439011",
  sid = "507f1f77bcf86cd799439012",
  other = "507f1f77bcf86cd799439013";
const auth =
  "Bearer " +
  jwt.sign({ uid }, secret, {
    expiresIn: "2h",
    issuer: "inclusion-v2",
    audience: "inclusion-app",
  });
const profile = {
  _id: sid,
  studentId: sid,
  name: "Private Student",
  teacherIds: [uid],
  accommodations: [],
};
function models() {
  return {
    User: {
      findById: async () => ({ _id: uid, role: "teacher" }),
      find: async () => [
        { _id: uid, firstName: "Private", lastName: "Teacher" },
      ],
    },
    Profile: { find: async () => [profile], findOne: async () => profile },
    Event: { find: () => ({ limit: async () => [] }) },
    Request: { find: () => ({ limit: async () => [] }) },
    Phase: { find: () => ({ limit: async () => [] }) },
    ReviewNote: { find: () => ({ limit: async () => [] }) },
  };
}
test("report scope rejects an unassigned student before reading observation records", async () => {
  const db = models();
  db.Event.find = () => {
    throw Error("must not read events");
  };
  const app = createApp({ secret, isReady: () => true, models: db });
  const result = await request(app)
    .get(`/api/v2/reports?start=2026-11-01&end=2026-11-30&studentId=${other}`)
    .set("Authorization", auth);
  assert.equal(result.status, 403);
});
test("server-generated board summaries contain neither roster names nor teacher names", async () => {
  const app = createApp({ secret, isReady: () => true, models: models() });
  const result = await request(app)
    .get("/api/v2/reports?start=2026-11-01&end=2026-11-30&mode=board")
    .set("Authorization", auth);
  assert.equal(result.status, 200);
  assert.ok(!JSON.stringify(result.body).includes("Private"));
  assert.deepEqual(result.body.students, []);
});
test("an intervention phase requires team confirmation and keeps its own record ID", async () => {
  const db = models();
  let saved;
  db.Phase.create = async (body) => {
    saved = body;
    return { _id: other, ...body };
  };
  const app = createApp({ secret, isReady: () => true, models: db });
  const body = {
    name: "Visual task prompts",
    description: "Use the approved picture prompt.",
    startsOn: "2026-11-01",
    teamConfirmed: false,
  };
  const path = `/api/v2/students/${sid}/phases`;
  assert.equal(
    (await request(app).post(path).set("Authorization", auth).send(body))
      .status,
    400,
  );
  const result = await request(app)
    .post(path)
    .set("Authorization", auth)
    .send({ ...body, teamConfirmed: true });
  assert.equal(result.status, 201);
  assert.equal(result.body.id, other);
  assert.equal(String(saved.createdBy), uid);
});
