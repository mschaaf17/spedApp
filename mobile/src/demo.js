import { DEFAULT_SETTINGS, guidedDraft } from "../../shared/classroom.mjs";
const ago = (days, minutes = 0) =>
  new Date(Date.now() - days * 86400000 - minutes * 60000).toISOString();
const accommodationSet = () => [
  {
    id: "quiet",
    title: "A quieter space",
    description: "I can ask for a quieter place to focus on my work.",
  },
  {
    id: "break",
    title: "A movement break",
    description: "I can ask to use my agreed movement break.",
  },
  {
    id: "instructions",
    title: "Help with directions",
    description:
      "I can ask for directions in smaller steps or another explanation.",
  },
  {
    id: "time",
    title: "Extra time",
    description: "I can ask for the extra time listed in my plan.",
  },
];
export function seedDemo() {
  const details = [
    [
      "avery",
      "Avery Brooks",
      "4",
      "IEP",
      40,
      80,
      [42, 45, 43, 52, 49, 57, 61, 60, 68, 72, 76],
    ],
    [
      "jordan",
      "Jordan Lee",
      "3",
      "504",
      45,
      85,
      [45, 48, 53, 51, 59, 58, 64, 67, 69, 72, 78],
    ],
    [
      "riley",
      "Riley Chen",
      "4",
      "IEP",
      35,
      80,
      [35, 40, 43, 41, 48, 51, 56, 54, 58, 63, 67],
    ],
    [
      "sam",
      "Sam Rivera",
      "5",
      "IEP",
      30,
      75,
      [30, 34, 39, 42, 38, 43, 41, 44, 45, 47, 51],
    ],
    [
      "maya",
      "Maya Patel",
      "3",
      "504",
      50,
      85,
      [50, 53, 59, 63, 62, 68, 71, 72, 75, 79, 83],
    ],
    [
      "noah",
      "Noah Kim",
      "5",
      "IEP",
      40,
      80,
      [40, 45, 44, 49, 54, 53, 60, 62, 64, 70, 74],
    ],
  ];
  const students = details.map(
    ([id, name, grade, planType, baseline, target], i) => ({
      id,
      name,
      grade,
      planType,
      schoolId: `DEMO-${1001 + i}`,
      teacherIds: ["teacher-demo"],
      accommodations: accommodationSet(),
      goal: {
        title: "Independent work completion",
        baseline,
        target,
        unit: "%",
      },
      behavior: {
        name: "Leaving assigned work area",
        definition:
          "The student moves more than one step away from the assigned work area during independent work without an agreed transition or break. An occurrence ends when the student returns. Exclude teacher-directed movement and approved breaks.",
      },
      drafts: [],
    }),
  );
  const events = details.flatMap(([id, , , , , , values]) =>
    values.map((value, i) => ({
      id: `${id}-p-${i}`,
      studentId: id,
      type: "progress",
      value,
      note:
        i === values.length - 1 && id === "avery"
          ? "Quiet music helped me get started today."
          : "",
      sharedWithFamily: true,
      createdAt: ago((values.length - 1 - i) * 2, 45 + i),
    })),
  );
  events.push({
    id: "freq-demo",
    studentId: "riley",
    actorId: "teacher-demo",
    type: "frequency",
    behavior: "Leaving assigned work area",
    createdAt: ago(0, 18),
  });
  const requests = [
    {
      id: "req1",
      studentId: "avery",
      teacherId: "teacher-demo",
      accommodationId: "quiet",
      title: "A quieter space",
      status: "requested",
      createdAt: ago(0, 3),
      history: [{ status: "requested", at: ago(0, 3) }],
    },
    {
      id: "req2",
      studentId: "jordan",
      teacherId: "teacher-demo",
      accommodationId: "instructions",
      title: "Help with directions",
      status: "acknowledged",
      createdAt: ago(0, 8),
      history: [
        { status: "requested", at: ago(0, 8) },
        { status: "acknowledged", at: ago(0, 6) },
      ],
    },
    {
      id: "req3",
      studentId: "riley",
      teacherId: "teacher-demo",
      accommodationId: "break",
      title: "A movement break",
      status: "provided",
      createdAt: ago(0, 24),
      history: [
        { status: "requested", at: ago(0, 24) },
        { status: "acknowledged", at: ago(0, 23) },
        { status: "offered", at: ago(0, 22) },
        { status: "provided", at: ago(0, 20) },
      ],
    },
  ];
  return {
    students,
    events,
    requests,
    teachers: [{ id: "teacher-demo", name: "Madison Schaaf", role: "teacher" }],
    settings: { ...DEFAULT_SETTINGS },
    aiEnabled: false,
    pushEnabled: false,
  };
}
export function readDemo() {
  try {
    return (
      JSON.parse(sessionStorage.getItem("inclusion.demo.v2")) || seedDemo()
    );
  } catch {
    return seedDemo();
  }
}
export function saveDemo(data) {
  try {
    sessionStorage.setItem("inclusion.demo.v2", JSON.stringify(data));
  } catch {
    /* Demo remains usable in memory. */
  }
}
export const demoUser = (role) => ({
  id: role === "student" ? "avery" : "teacher-demo",
  name: role === "student" ? "Avery Brooks" : "Madison Schaaf",
  role,
  username: role === "student" ? "avery-demo" : "madison-demo",
});
export function makeDemoDraft(student, type) {
  return {
    id: crypto.randomUUID(),
    type,
    body: guidedDraft(student, type),
    source: "Guided template",
    status: "draft",
    createdAt: new Date().toISOString(),
  };
}
