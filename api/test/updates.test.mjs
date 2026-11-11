import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";
import { createUpdateBus } from "../src/updates.mjs";
import { createApp } from "../src/app.mjs";
import { watchWorkspace } from "../../shared/live.mjs";
const secret = "test-session-secret-at-least-thirty-two-characters";
const uid = "507f1f77bcf86cd799439011",
  other = "507f1f77bcf86cd799439012";
const token = () =>
  jwt.sign({ uid }, secret, {
    expiresIn: "2h",
    issuer: "inclusion-v2",
    audience: "inclusion-app",
  });
test("live update hints are scoped to participants and admins, and unsubscribe cleanly", () => {
  const bus = createUpdateBus();
  let a = 0,
    b = 0,
    c = 0;
  const stops = [
    bus.subscribe({ id: uid, role: "student" }, () => a++),
    bus.subscribe({ id: other, role: "teacher" }, () => b++),
    bus.subscribe({ id: "admin", role: "admin" }, () => c++),
  ];
  bus.publish([uid]);
  assert.deepEqual([a, b, c], [1, 0, 1]);
  stops.forEach((s) => s());
  assert.equal(bus.size, 0);
});
test("authenticated event stream delivers only invalidation hints, without student payloads", async (t) => {
  const updates = createUpdateBus();
  const app = createApp({
    secret,
    updates,
    isReady: () => true,
    models: { User: { findById: async () => ({ _id: uid, role: "student" }) } },
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  t.after(() => {
    controller.abort();
    clearTimeout(timeout);
    server.closeAllConnections();
    server.close();
  });
  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/v2/updates`,
    {
      headers: { Authorization: `Bearer ${token()}` },
      signal: controller.signal,
    },
  );
  assert.equal(
    response.headers.get("content-type"),
    "text/event-stream; charset=utf-8",
  );
  const reader = response.body.getReader();
  const ready = new TextDecoder().decode((await reader.read()).value);
  assert.match(ready, /event: ready/);
  updates.publish([uid]);
  const next = new TextDecoder().decode((await reader.read()).value);
  assert.match(next, /event: changed/);
  assert.ok(!next.includes(uid));
  await reader.cancel();
});
test("stream client reads split frames with bearer headers and never a token in the URL", async () => {
  let stop,
    count = 0,
    seen;
  await new Promise((resolve) => {
    stop = watchWorkspace({
      token: "private-token",
      fetcher: async (url, options) => {
        seen = { url, options };
        const encoder = new TextEncoder();
        return new Response(
          new ReadableStream({
            start(controller) {
              for (const chunk of [
                "event: rea",
                "dy\ndata: {}\n\n",
                "event: chan",
                "ged\ndata: {}\n\n",
              ])
                controller.enqueue(encoder.encode(chunk));
              controller.close();
            },
          }),
        );
      },
      onChange: () => {
        count++;
        resolve();
      },
    });
  });
  stop();
  assert.equal(count, 1);
  assert.equal(seen.options.headers.Authorization, "Bearer private-token");
  assert.ok(!seen.url.includes("private-token"));
});
test("students cannot access staff reports or create intervention phases", async () => {
  const app = createApp({
    secret,
    isReady: () => true,
    models: { User: { findById: async () => ({ _id: uid, role: "student" }) } },
  });
  assert.equal(
    (
      await request(app)
        .get("/api/v2/reports?start=2026-11-01&end=2026-11-30")
        .set("Authorization", `Bearer ${token()}`)
    ).status,
    403,
  );
  assert.equal(
    (
      await request(app)
        .post(`/api/v2/students/${uid}/phases`)
        .set("Authorization", `Bearer ${token()}`)
        .send({})
    ).status,
    403,
  );
});
test("an unrelated teacher cannot send messages into a student request", async () => {
  const app = createApp({
    secret,
    isReady: () => true,
    models: {
      User: { findById: async () => ({ _id: uid, role: "teacher" }) },
      Request: {
        findById: async () => ({
          _id: other,
          studentId: other,
          teacherId: other,
          status: "requested",
        }),
      },
    },
  });
  assert.equal(
    (
      await request(app)
        .post(`/api/v2/requests/${other}/messages`)
        .set("Authorization", `Bearer ${token()}`)
        .send({ kind: "on_my_way" })
    ).status,
    403,
  );
});
test("student picture replies are recorded with their server-owned actor and role", async () => {
  let saved;
  const app = createApp({
    secret,
    isReady: () => true,
    models: {
      User: { findById: async () => ({ _id: uid, role: "student" }) },
      Profile: {
        findOne: async () => ({ studentId: uid, teacherIds: [other] }),
      },
      Request: {
        findById: async () => ({
          _id: other,
          studentId: uid,
          teacherId: other,
          status: "requested",
        }),
        findOneAndUpdate: async (filter, update) => {
          saved = update.$push.messages;
          return {
            _id: other,
            studentId: uid,
            teacherId: other,
            status: "requested",
            messages: [saved],
          };
        },
      },
    },
  });
  const response = await request(app)
    .post(`/api/v2/requests/${other}/messages`)
    .set("Authorization", `Bearer ${token()}`)
    .send({
      kind: "still_need_help",
      actorId: other,
      role: "admin",
      text: "forged",
    });
  assert.equal(response.status, 201);
  assert.equal(saved.role, "student");
  assert.equal(String(saved.actorId), uid);
  assert.equal(saved.text, "I still need help.");
  const invalid = await request(app)
    .post(`/api/v2/requests/${other}/messages`)
    .set("Authorization", `Bearer ${token()}`)
    .send({ kind: "text", text: "arbitrary" });
  assert.equal(invalid.status, 400);
});
