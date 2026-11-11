import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS,
  isSchoolHours,
  validateSettings,
  canTransition,
  validateEvent,
  progressPercent,
  familyProjection,
  roleFor,
} from "../classroom.mjs";
test("school hours use the educator’s timezone, respect weekends, pause, and the end boundary", () => {
  assert.equal(
    isSchoolHours(DEFAULT_SETTINGS, new Date("2026-11-11T15:00:00Z")),
    true,
  ); // 08:00 Mountain
  assert.equal(
    isSchoolHours(DEFAULT_SETTINGS, new Date("2026-11-11T22:30:00Z")),
    false,
  );
  assert.equal(
    isSchoolHours(DEFAULT_SETTINGS, new Date("2026-11-14T17:00:00Z")),
    false,
  );
  assert.equal(
    isSchoolHours(
      { ...DEFAULT_SETTINGS, paused: true },
      new Date("2026-11-11T17:00:00Z"),
    ),
    false,
  );
  assert.equal(
    isSchoolHours(DEFAULT_SETTINGS, new Date("2026-07-08T14:00:00Z")),
    true,
  ); // Daylight saving time
  assert.equal(
    isSchoolHours({ ...DEFAULT_SETTINGS, timezone: "invalid" }),
    false,
  );
});
test("settings reject reversed hours, malformed times, invalid days and timezones", () => {
  for (const override of [
    { start: "17:00" },
    { start: "25:00" },
    { days: [] },
    { days: [8] },
    { timezone: "invalid" },
  ])
    assert.throws(() => validateSettings({ ...DEFAULT_SETTINGS, ...override }));
});
test("a received request cannot be marked provided without acknowledge and offer stages", () => {
  assert.equal(canTransition("requested", "provided", "teacher"), false);
  assert.equal(canTransition("requested", "acknowledged", "teacher"), true);
  assert.equal(canTransition("acknowledged", "offered", "teacher"), true);
  assert.equal(canTransition("offered", "provided", "teacher"), true);
  assert.equal(canTransition("provided", "requested", "teacher"), false);
  assert.equal(canTransition("requested", "provided", "student"), false);
  assert.equal(canTransition("requested", "cancelled", "student"), true);
  assert.equal(canTransition("provided", "cancelled", "student"), false);
});
test("student measurements cannot be used to impersonate staff behavior observations", () => {
  assert.throws(() => validateEvent({ type: "frequency" }, "student"));
  assert.throws(() =>
    validateEvent({ type: "duration", seconds: -1 }, "teacher"),
  );
  assert.throws(() =>
    validateEvent({ type: "observation", targetOnTask: true }, "teacher"),
  );
  assert.throws(() =>
    validateEvent({ type: "progress", value: NaN }, "student"),
  );
  assert.equal(
    validateEvent({ type: "progress", value: 50, actorId: "forged" }, "student")
      .actorId,
    undefined,
  );
});
test("progress handles increasing and decreasing goals, missing data, and timestamp ordering", () => {
  const student = { id: "a", goal: { baseline: 20, target: 80 } };
  const events = [
    { studentId: "a", type: "progress", value: 50, createdAt: "2026-11-11" },
    { studentId: "a", type: "progress", value: 25, createdAt: "2026-11-01" },
  ];
  assert.equal(progressPercent(student, events), 50);
  assert.equal(progressPercent(student, []), null);
  assert.equal(
    progressPercent({ id: "a", goal: { baseline: 80, target: 20 } }, events),
    50,
  );
});
test("family projection explicitly excludes behavior logs, unshared measurements, and reflections", () => {
  const result = familyProjection(
    {
      name: "Avery Example",
      schoolId: "sensitive",
      behavior: { definition: "private" },
      grade: "4",
      goal: { target: 80 },
    },
    [
      {
        id: "1",
        type: "progress",
        value: 60,
        sharedWithFamily: true,
        note: "Private reflection",
        createdAt: "2026-11-11",
      },
      { id: "2", type: "progress", value: 40, sharedWithFamily: false },
      { id: "3", type: "frequency", sharedWithFamily: true },
      {
        id: "4",
        type: "progress",
        value: 30,
        sharedWithFamily: true,
        voided: true,
      },
    ],
  );
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].note, undefined);
  assert.equal(result.student.schoolId, undefined);
  assert.equal(result.student.firstName, "Avery");
});
test("legacy educator accounts map to teachers without granting school administrator privileges", () => {
  assert.equal(roleFor({ isAdmin: true }), "teacher");
  assert.equal(roleFor({ isAdmin: false }), "student");
  assert.equal(roleFor({ isAdmin: true, role: "admin" }), "admin");
});
