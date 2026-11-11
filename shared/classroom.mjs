export const DEFAULT_SETTINGS = {
  timezone: "America/Denver",
  start: "08:00",
  end: "15:30",
  days: [1, 2, 3, 4, 5],
  paused: false,
};
export const STAFF_ROLES = ["teacher", "admin"];
export const TERMINAL_REQUESTS = ["provided", "cancelled"];
export const REQUEST_STEPS = [
  "requested",
  "acknowledged",
  "offered",
  "provided",
];
export function canTransition(from, to, role) {
  if (role === "student")
    return to === "cancelled" && !TERMINAL_REQUESTS.includes(from);
  return (
    STAFF_ROLES.includes(role) &&
    REQUEST_STEPS.indexOf(to) === REQUEST_STEPS.indexOf(from) + 1 &&
    REQUEST_STEPS.includes(from)
  );
}
export function roleFor(user) {
  return user.role || (user.isAdmin ? "teacher" : "student");
}
export function isSchoolHours(settings, date = new Date()) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  if (s.paused) return false;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: s.timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const get = (name) => parts.find((p) => p.type === name)?.value;
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      get("weekday"),
    );
    const time = `${get("hour")}:${get("minute")}`;
    return s.days.includes(day) && time >= s.start && time < s.end;
  } catch {
    return false;
  }
}
export function validateSettings(settings) {
  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.start) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.end) ||
    settings.start >= settings.end
  )
    throw new Error("Choose an end time after the start time.");
  if (
    !Array.isArray(settings.days) ||
    !settings.days.length ||
    settings.days.some((n) => !Number.isInteger(n) || n < 0 || n > 6)
  )
    throw new Error("Choose at least one school day.");
  if (typeof settings.timezone !== "string" || !settings.timezone.trim())
    throw new Error("Choose a time zone.");
  new Intl.DateTimeFormat("en-US", { timeZone: settings.timezone });
  return {
    timezone: settings.timezone,
    start: settings.start,
    end: settings.end,
    days: [...new Set(settings.days)],
    paused: Boolean(settings.paused),
  };
}
export function validateEvent(input, role) {
  if (
    !["frequency", "duration", "progress", "observation"].includes(input.type)
  )
    throw new Error("Choose a tracking method.");
  if (role === "student" && input.type !== "progress")
    throw new Error("Only educators can record behavior observations.");
  const event = {
    type: input.type,
    note: String(input.note || "")
      .trim()
      .slice(0, 1000),
    behavior: String(input.behavior || "")
      .trim()
      .slice(0, 160),
    sharedWithFamily:
      input.type === "progress" && input.sharedWithFamily === true,
  };
  if (input.type === "progress") {
    if (
      !Number.isFinite(input.value) ||
      input.value < 0 ||
      input.value > 100000
    )
      throw new Error("Enter a valid progress measurement.");
    event.value = input.value;
  }
  if (input.type === "duration") {
    if (
      !Number.isFinite(input.seconds) ||
      input.seconds <= 0 ||
      input.seconds > 86400
    )
      throw new Error("Duration must be between one second and one day.");
    event.seconds = Math.round(input.seconds);
  }
  if (input.type === "observation") {
    if (
      typeof input.targetOnTask !== "boolean" ||
      typeof input.peerOnTask !== "boolean"
    )
      throw new Error("Record both student and peer observations.");
    event.targetOnTask = input.targetOnTask;
    event.peerOnTask = input.peerOnTask;
  }
  return event;
}
export function progressPercent(student, events) {
  const points = events
    .filter(
      (e) => e.studentId === student.id && e.type === "progress" && !e.voided,
    )
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (!points.length || !student.goal) return null;
  const span = student.goal.target - student.goal.baseline;
  if (!span) return null;
  return Math.round(
    Math.max(
      0,
      Math.min(
        100,
        ((points.at(-1).value - student.goal.baseline) / span) * 100,
      ),
    ),
  );
}
export function familyProjection(student, events) {
  return {
    student: {
      firstName: student.name.split(" ")[0],
      grade: student.grade,
      goal: student.goal,
    },
    events: events
      .filter(
        (e) =>
          e.type === "progress" && e.sharedWithFamily === true && !e.voided,
      )
      .map((e) => ({
        id: e.id,
        type: "progress",
        value: e.value,
        createdAt: e.createdAt,
      })),
  };
}
export function guidedDraft(student, type = "IEP goal") {
  const goal = student.goal || {};
  const behavior = student.behavior || {};
  if (type === "504 review")
    return `Draft for school-team review\n\nCurrent assigned accommodations:\n${(student.accommodations || []).map((a) => "- " + a.title + ": " + a.description).join("\n")}\n\nEvidence to review: [Use request frequency, delivery history, classroom observations, and student/family input.]\nWhat is working: [Describe recorded observations.]\nProposed change for discussion: [Describe the support and the evidence behind the proposal.]\nReview date and responsible team: [Complete together.]\n\nRequest counts alone do not establish effectiveness, eligibility, or a need to change a plan. This draft does not update an approved 504 plan.`;

  if (type === "Operational definition")
    return `Draft for educator review\n\nBehavior: ${behavior.name || "Name the behavior"}\n\nObservable definition: ${behavior.definition || "[Describe exactly what an observer can see or hear. Include examples and non-examples.]"}\n\nMeasurement: [Frequency, duration, or interval recording]\nStart: [Observable start criterion]\nEnd: [Observable stop criterion]\nExclude: [Non-examples and appropriate use of approved accommodations]\n\nConfirm that two observers can apply this definition consistently before using it.`;
  if (type === "BIP")
    return `Draft for team review\n\nTarget behavior: ${behavior.name || "[Identify behavior]"}\nOperational definition: ${behavior.definition || "[Add an observable definition]"}\n\nContext and function: [Use observation data; confirm the hypothesis with the team.]\nPrevention: [List approved environmental supports.]\nReplacement skill: [Describe the skill to teach and how to prompt it.]\nReinforcement: [Define specific praise/reinforcement and schedule.]\nResponse: [Describe a calm, supportive response.]\nPhase criteria: [Define the evidence and team review required before changing support.]\n\nPreserve approved accommodations. Document each phase, dates, and review decisions.`;
  return `Draft for team review\n\nGoal area: ${goal.title || "[Goal area]"}\nBaseline: ${goal.baseline ?? "[Baseline]"} ${goal.unit || ""}\nProposed target: ${goal.target ?? "[Target]"} ${goal.unit || ""}\n\nBy [review date], given [approved supports and conditions], the student will [observable skill], measured by [method and schedule], across [number of opportunities/settings].\n\nProgress monitoring: Record measurements and student reflections; review the graph at [interval].\nStudent voice: [Ask what helps and what feels difficult.]\n\nThis draft does not change the approved plan. Confirm accuracy, appropriateness, measurement criteria, and team approval.`;
}
