export function dayKey(value, timezone = "America/Denver") {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function validatePeriod(start, end) {
  const valid = (s) =>
    /^\d{4}-\d{2}-\d{2}$/.test(s || "") &&
    !Number.isNaN(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s;
  if (
    !valid(start) ||
    !valid(end) ||
    start > end ||
    Date.parse(end) - Date.parse(start) > 366 * 86400000
  )
    throw new Error("Choose a valid date range of up to one year.");
  return { start, end };
}
export function summarizeBehavior(events) {
  const frequency = events.filter((e) => e.type === "frequency");
  const duration = events.filter((e) => e.type === "duration");
  const observations = events.filter((e) => e.type === "observation");
  return {
    frequency: frequency.length || null,
    durationSeconds: duration.length
      ? duration.reduce((n, e) => n + e.seconds, 0)
      : null,
    durationEntries: duration.length,
    observationPairs: observations.length,
    studentOnTask: observations.length
      ? Math.round(
          (100 * observations.filter((e) => e.targetOnTask).length) /
            observations.length,
        )
      : null,
    peerOnTask: observations.length
      ? Math.round(
          (100 * observations.filter((e) => e.peerOnTask).length) /
            observations.length,
        )
      : null,
  };
}
export function buildReport(data, options) {
  const { start, end } = validatePeriod(options.start, options.end);
  const timezone = options.timezone || "America/Denver";
  const board = options.mode === "board";
  const minimum = 5;
  const students = data.students.filter(
    (s) =>
      (!options.studentId || s.id === options.studentId) &&
      (!options.teacherId || s.teacherIds.includes(options.teacherId)),
  );
  const ids = new Set(students.map((s) => s.id));
  const inRange = (d) => {
    const key = dayKey(d, timezone);
    return key >= start && key <= end;
  };
  const scopedEvents = data.events.filter(
    (e) => ids.has(e.studentId) && !e.voided && inRange(e.createdAt),
  );
  const behaviorName = (e) => e.behavior || "Unlabeled behavior";
  const behaviorEvents = scopedEvents.filter((e) =>
    ["frequency", "duration", "observation"].includes(e.type),
  );
  const events = scopedEvents.filter(
    (e) =>
      !options.behavior ||
      (["frequency", "duration", "observation"].includes(e.type) &&
        behaviorName(e) === options.behavior),
  );
  const providedInPeriod = (r) =>
    (r.history || []).some((h) => h.status === "provided" && inRange(h.at));
  const requests = data.requests.filter(
    (r) =>
      ids.has(r.studentId) &&
      inRange(r.createdAt) &&
      (!options.teacherId || r.teacherId === options.teacherId),
  );
  const phases = (data.phases || [])
    .filter((p) => ids.has(p.studentId) && p.startsOn <= end)
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn));
  const notes = (data.reviewNotes || []).filter(
    (n) => ids.has(n.studentId) && inRange(n.createdAt),
  );
  const countStudents = (records) =>
    new Set(records.map((r) => r.studentId)).size;
  const safeCount = (records) =>
    !board || (students.length >= minimum && countStudents(records) >= minimum)
      ? records.length
      : null;
  const supportGroups = new Map();
  // Board labels come from a controlled vocabulary, never educator-entered text.
  const pictures = new Map(
    students.flatMap((s) =>
      s.accommodations.map((a) => [`${s.id}:${a.id}`, a.picture]),
    ),
  );
  const safeLabels = {
    quiet: "Quiet space",
    break: "Break",
    directions: "Directions support",
    time: "Extra time",
    read: "Read-aloud support",
    schedule: "Visual schedule",
    help: "Other assigned support",
  };
  for (const r of requests) {
    const picture = pictures.get(`${r.studentId}:${r.accommodationId}`);
    const label = board
      ? safeLabels[picture] || "Other assigned support"
      : r.title;
    const list = supportGroups.get(label) || [];
    list.push(r);
    supportGroups.set(label, list);
  }
  let supports = [...supportGroups].map(([title, rows]) => ({
    title,
    requests: safeCount(rows),
    provided: safeCount(rows.filter(providedInPeriod)),
    contributors: board ? undefined : countStudents(rows),
  }));
  if (board && supports.some((s) => s.requests === null))
    supports = [
      ...supports.filter((s) => s.requests !== null),
      { title: "Withheld support groups", requests: null, provided: null },
    ];
  const behavior = summarizeBehavior(events);
  if (board) {
    for (const [metric, type] of [
      ["frequency", "frequency"],
      ["durationSeconds", "duration"],
      ["observationPairs", "observation"],
      ["studentOnTask", "observation"],
      ["peerOnTask", "observation"],
    ])
      if (
        students.length < minimum ||
        countStudents(events.filter((e) => e.type === type)) < minimum
      )
        behavior[metric] = null;
    delete behavior.durationEntries;
  }
  const daily = [
    ...new Set(
      events
        .filter((e) =>
          ["frequency", "duration", "observation"].includes(e.type),
        )
        .map((e) => dayKey(e.createdAt, timezone)),
    ),
  ]
    .sort()
    .map((date) => {
      const rows = events.filter((e) => dayKey(e.createdAt, timezone) === date);
      const metrics = summarizeBehavior(rows);
      if (board) {
        if (students.length < minimum || countStudents(rows) < minimum)
          return null;
        for (const [key, type] of [
          ["frequency", "frequency"],
          ["durationSeconds", "duration"],
          ["observationPairs", "observation"],
          ["studentOnTask", "observation"],
          ["peerOnTask", "observation"],
        ])
          if (countStudents(rows.filter((e) => e.type === type)) < minimum)
            metrics[key] = null;
        delete metrics.durationEntries;
      }
      return { date, ...metrics };
    })
    .filter(Boolean);
  const phaseComparisons = board
    ? []
    : phases.map((phase) => {
        const next = phases.find(
          (p) => p.studentId === phase.studentId && p.startsOn > phase.startsOn,
        );
        const rows = events.filter(
          (e) =>
            e.studentId === phase.studentId &&
            dayKey(e.createdAt, timezone) >= phase.startsOn &&
            (!next || dayKey(e.createdAt, timezone) < next.startsOn),
        );
        return {
          id: phase.id,
          student: students.find((s) => s.id === phase.studentId)?.name,
          name: phase.name,
          description: phase.description,
          startsOn: phase.startsOn,
          ...summarizeBehavior(rows),
        };
      });
  return {
    mode: board ? "board" : "team",
    start,
    end,
    timezone,
    studentCount: board && students.length < minimum ? null : students.length,
    totalRequests: safeCount(requests),
    providedRequests: safeCount(requests.filter(providedInPeriod)),
    webRequests:
      board &&
      (safeCount(requests.filter((r) => r.source !== "extension")) === null ||
        safeCount(requests.filter((r) => r.source === "extension")) === null)
        ? null
        : safeCount(requests.filter((r) => r.source !== "extension")),
    extensionRequests:
      board &&
      (safeCount(requests.filter((r) => r.source !== "extension")) === null ||
        safeCount(requests.filter((r) => r.source === "extension")) === null)
        ? null
        : safeCount(requests.filter((r) => r.source === "extension")),
    supports,
    behavior,
    daily,
    phaseComparisons,
    availableBehaviors: board
      ? []
      : [
          ...new Set(scopedEvents.map((e) => e.behavior).filter(Boolean)),
        ].sort(),
    behaviorBreakdown: board
      ? []
      : [
          ...new Set(
            events
              .filter((e) =>
                ["frequency", "duration", "observation"].includes(e.type),
              )
              .map(behaviorName),
          ),
        ].map((name) => ({
          name,
          ...summarizeBehavior(events.filter((e) => behaviorName(e) === name)),
        })),
    teacherSummaries: board
      ? []
      : (data.teachers || []).map((t) => ({
          name: t.name,
          entries: events.filter((e) => e.actorId === t.id).length,
          requests: requests.filter((r) => r.teacherId === t.id).length,
        })),
    // No student identifiers, raw notes, messages or phase descriptions enter a board projection.
    students: board
      ? []
      : students.map((s) => ({ id: s.id, name: s.name, planType: s.planType })),
    reflections: board
      ? []
      : notes.map((n) => ({
          id: n.id,
          student: students.find((s) => s.id === n.studentId)?.name,
          reflection: n.reflection,
          proposal: n.proposal,
          planType: n.planType,
          createdAt: n.createdAt,
          status: "Proposed for team review",
        })),
    limitation: board
      ? "Small groups and metrics with fewer than five contributing students are withheld. This summary does not establish causation or recommend a plan change."
      : "Counts reflect entered records, not a complete observation schedule. A day without entries is missing data, not zero behavior. Phase comparisons describe recorded data; they do not establish causation.",
  };
}
export function reportHTML(report) {
  const escape = (value) =>
    String(value ?? "—").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const n = (value) =>
    value === null || value === undefined ? "—" : escape(value);
  const table = (heads, rows) =>
    `<table><thead><tr>${heads.map((h) => `<th>${escape(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((v) => `<td>${n(v)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Inclusion · ${report.mode === "board" ? "Board summary" : "School-team review"}</title><style>body{font:16px system-ui;color:#244538;max-width:1050px;margin:40px auto;padding:0 24px;line-height:1.65}h1{font-size:34px}h2{margin-top:35px}table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:12px;border-bottom:1px solid #dde8d5}section{break-inside:avoid}p{white-space:pre-wrap}.note{background:#f1f6ea;padding:18px}article{border-left:3px solid #73a47b;padding-left:18px;margin:24px 0}@media print{body{margin:0}section{page-break-after:always}section:last-child{page-break-after:auto}}</style><body>${report.demo ? '<p class="note">Fictional demonstration data — for review only.</p>' : ""}<header><h1>${report.mode === "board" ? "Classroom support · Board summary" : "Classroom support · School-team review"}</h1><p>${escape(report.start)} – ${escape(report.end)} · ${escape(report.timezone)}</p></header><section><h2>Support in practice</h2>${table(["Students in scope", "Requests recorded", "Support provided"], [[report.studentCount, report.totalRequests, report.providedRequests]])}<p class="note">${escape(report.limitation)}</p><h2>Support requests by accommodation</h2>${table(
    ["Assigned support", "Requests", "Provided"],
    report.supports.map((s) => [s.title, s.requests, s.provided]),
  )}</section><section><h2>Recorded behavior</h2>${
    report.mode === "team"
      ? table(
          ["Behavior", "Frequency", "Duration (seconds)", "Observation pairs"],
          (report.behaviorBreakdown || []).map((b) => [
            b.name,
            b.frequency,
            b.durationSeconds,
            b.observationPairs,
          ]),
        )
      : ""
  }${table(["Frequency entries", "Duration (seconds)", "Observation pairs", "Student on task (%)", "Peer on task (%)"], [[report.behavior.frequency, report.behavior.durationSeconds, report.behavior.observationPairs, report.behavior.studentOnTask, report.behavior.peerOnTask]])}${table(
    ["Date", "Frequency", "Duration (seconds)", "Paired observations"],
    report.daily.map((d) => [
      d.date,
      d.frequency,
      d.durationSeconds,
      d.observationPairs,
    ]),
  )}</section>${report.mode === "team" ? `<section><h2>Intervention timeline and phase comparison</h2>${report.phaseComparisons.map((p) => `<article><h3>${escape(p.startsOn)} · ${escape(p.student)} · ${escape(p.name)}</h3><p>${escape(p.description)}</p><p>Frequency: ${n(p.frequency)} · Duration: ${n(p.durationSeconds)} seconds · Observations: ${n(p.observationPairs)}</p></article>`).join("")}<h2>Reflections and proposed plan reviews</h2>${report.reflections.map((r) => `<article><h3>${escape(r.student)} · ${escape(r.planType)} review</h3><p>${escape(r.reflection)}</p><p>${escape(r.proposal)}</p><strong>Proposed for team review</strong></article>`).join("")}</section>` : "<section><h2>Review next steps</h2><p>Discuss the completeness of tracking, consistency of support delivery, and questions for the appropriate school team. IEP, 504, and BIP changes require an explicit team review; this summary does not make those changes.</p></section>"}<footer>Inclusion · Exported recorded-data summary. — means unavailable or withheld.</footer></body></html>`;
}
