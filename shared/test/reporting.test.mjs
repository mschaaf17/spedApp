import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReport,
  dayKey,
  reportHTML,
  summarizeBehavior,
  validatePeriod,
} from "../reporting.mjs";
const options = {
  start: "2026-11-01",
  end: "2026-11-30",
  timezone: "UTC",
  mode: "team",
};
const student = {
  id: "private-id",
  name: "Private Student",
  teacherIds: ["t"],
  accommodations: [
    { id: "quiet", title: "Quiet room for Private Student", picture: "quiet" },
  ],
};
const data = {
  students: [student],
  teachers: [{ id: "t", name: "Teacher Name" }],
  events: [
    {
      id: "e1",
      studentId: student.id,
      actorId: "t",
      type: "frequency",
      createdAt: "2026-11-03T12:00:00Z",
    },
    {
      id: "e2",
      studentId: student.id,
      actorId: "t",
      type: "duration",
      seconds: 90,
      createdAt: "2026-11-18T12:00:00Z",
    },
  ],
  requests: [
    {
      studentId: student.id,
      teacherId: "t",
      accommodationId: "quiet",
      title: "Quiet room for Private Student",
      source: "extension",
      status: "provided",
      createdAt: "2026-11-18T12:00:00Z",
      messages: [{ text: "private conversation" }],
    },
  ],
  phases: [
    {
      id: "p1",
      studentId: student.id,
      name: "First phase private description",
      description: "Private phase details",
      startsOn: "2026-11-01",
    },
    {
      id: "p2",
      studentId: student.id,
      name: "Second phase",
      startsOn: "2026-11-15",
    },
  ],
  reviewNotes: [
    {
      studentId: student.id,
      reflection: "Private reflection",
      proposal: "Private proposed 504 change",
      planType: "504",
      createdAt: "2026-11-19T12:00:00Z",
    },
  ],
};
test("phase comparisons preserve missing measurements instead of inventing zeroes", () => {
  const r = buildReport(data, options);
  assert.equal(r.phaseComparisons[0].frequency, 1);
  assert.equal(r.phaseComparisons[0].durationSeconds, null);
  assert.equal(r.phaseComparisons[1].frequency, null);
  assert.equal(r.phaseComparisons[1].durationSeconds, 90);
  assert.equal(r.reflections[0].planType, "504");
  assert.equal(r.teacherSummaries[0].entries, 2);
});
test("board projection excludes identifiers, conversations, notes, phase text and small groups", () => {
  const r = buildReport(data, { ...options, mode: "board" }),
    serialized = JSON.stringify(r);
  for (const secret of [
    "Private Student",
    "private-id",
    "private conversation",
    "Private reflection",
    "Private proposed",
    "Private phase",
    "Teacher Name",
  ])
    assert.ok(!serialized.includes(secret));
  assert.equal(r.studentCount, null);
  assert.equal(r.totalRequests, null);
  assert.deepEqual(r.students, []);
  assert.deepEqual(r.reflections, []);
  assert.deepEqual(r.phaseComparisons, []);
  assert.deepEqual(r.teacherSummaries, []);
  assert.equal(r.supports[0].title, "Withheld support groups");
});
test("aggregate board counts require five distinct contributors, not five events for one student", () => {
  const many = {
    ...data,
    requests: Array.from({ length: 20 }, (_, i) => ({
      ...data.requests[0],
      id: String(i),
    })),
  };
  assert.equal(
    buildReport(many, { ...options, mode: "board" }).totalRequests,
    null,
  );
  const students = Array.from({ length: 5 }, (_, i) => ({
    ...student,
    id: `s${i}`,
    name: `Name${i}`,
  }));
  const r = buildReport(
    {
      ...data,
      students,
      requests: students.map((s) => ({ ...data.requests[0], studentId: s.id })),
    },
    { ...options, mode: "board" },
  );
  assert.equal(r.totalRequests, 5);
  assert.equal(r.supports[0].title, "Quiet space");
  assert.equal(r.supports[0].requests, 5);
});
test("source channel counts use complementary suppression in a board report", () => {
  const students = Array.from({ length: 5 }, (_, i) => ({
    ...student,
    id: `s${i}`,
  }));
  const r = buildReport(
    {
      ...data,
      students,
      requests: students.map((s, i) => ({
        ...data.requests[0],
        studentId: s.id,
        source: i === 0 ? "extension" : "web",
      })),
    },
    { ...options, mode: "board" },
  );
  assert.equal(r.totalRequests, 5);
  assert.equal(r.webRequests, null);
  assert.equal(r.extensionRequests, null);
});
test("period filtering respects the selected timezone and ignores voided records", () => {
  assert.equal(dayKey("2026-11-11T06:30:00Z", "America/Denver"), "2026-11-10");
  const r = buildReport(
    { ...data, events: [{ ...data.events[0], voided: true }] },
    options,
  );
  assert.equal(r.behavior.frequency, null);
  assert.equal(summarizeBehavior([]).studentOnTask, null);
});
test("invalid dates, reversed ranges and oversized periods are rejected", () => {
  for (const period of [
    ["2026-02-30", "2026-03-01"],
    ["2026-11-10", "2026-11-01"],
    ["2020-01-01", "2026-11-01"],
  ])
    assert.throws(() => validatePeriod(...period));
});
test("presentation exports escape educator-entered markup and preserve review status", () => {
  const r = buildReport(
    {
      ...data,
      reviewNotes: [
        { ...data.reviewNotes[0], proposal: '<script>alert("x")</script>' },
      ],
    },
    options,
  );
  const html = reportHTML(r);
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("Proposed for team review"));
  const board = reportHTML(buildReport(data, { ...options, mode: "board" }));
  assert.ok(!board.includes("Private Student"));
});

test("a completion after the report end is not counted as support delivered in that period", () => {
  const future = {
    ...data,
    requests: [
      {
        ...data.requests[0],
        history: [
          { status: "requested", at: "2026-11-18T12:00:00Z" },
          { status: "provided", at: "2026-12-02T12:00:00Z" },
        ],
      },
    ],
  };
  assert.equal(buildReport(future, options).providedRequests, 0);
});
test("behavior comparison filters preserve independent measurement types", () => {
  const example = {
    ...data,
    events: [
      { ...data.events[0], behavior: "Leaving area" },
      { ...data.events[1], behavior: "Calling out" },
    ],
  };
  const r = buildReport(example, { ...options, behavior: "Leaving area" });
  assert.equal(r.behavior.frequency, 1);
  assert.equal(r.behavior.durationSeconds, null);
  assert.deepEqual(r.availableBehaviors, ["Calling out", "Leaving area"]);
  assert.equal(r.behaviorBreakdown.length, 1);
});
test("demo presentation exports are clearly labeled as fictional", () => {
  assert.ok(
    reportHTML({ ...buildReport(data, options), demo: true }).includes(
      "Fictional demonstration data",
    ),
  );
});

test("unlabeled historical observations remain visible in the behavior comparison", () => {
  const r = buildReport(
    {
      ...data,
      events: [
        {
          id: "obs",
          studentId: student.id,
          type: "observation",
          targetOnTask: true,
          peerOnTask: true,
          createdAt: "2026-11-03T12:00:00Z",
        },
      ],
    },
    options,
  );
  assert.equal(r.behaviorBreakdown[0].name, "Unlabeled behavior");
  assert.equal(r.behaviorBreakdown[0].observationPairs, 1);
});
