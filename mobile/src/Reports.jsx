import React, { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  MessageCircle,
  Plus,
  Presentation,
  Printer,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
import { api } from "./api.js";
import { Badge, Empty, Icon, Modal } from "./components.jsx";
import { buildReport, dayKey, reportHTML } from "../../shared/reporting.mjs";
const display = (value) =>
  value === null || value === undefined ? "—" : value;
function Trend({ rows, metric, title, unit }) {
  const points = rows.filter(
    (r) => r[metric] !== null && r[metric] !== undefined,
  );
  if (!points.length)
    return (
      <div className="report-no-data">
        No reportable {title.toLowerCase()} records in this period.
      </div>
    );
  const max = Math.max(1, ...points.map((p) => p[metric])),
    first = Date.parse(points[0].date),
    last = Date.parse(points.at(-1).date);
  const x = (p) =>
      35 + ((Date.parse(p.date) - first) / (last - first || 1)) * 510,
    y = (p) => 150 - (p[metric] / max) * 115;
  return (
    <figure className="report-trend">
      <figcaption>
        {title} <small>· {unit} · recorded dates only</small>
      </figcaption>
      <svg
        viewBox="0 0 580 190"
        role="img"
        aria-label={`${title}, ${points.length} recorded dates. Values: ${points.map((p) => `${p.date}: ${p[metric]}`).join("; ")}`}
      >
        <line x1="35" x2="555" y1="150" y2="150" stroke="#dce7d5" />
        <text x="6" y="38">
          {max}
        </text>
        <polyline
          points={points.map((p) => `${x(p)},${y(p)}`).join(" ")}
          fill="none"
          stroke="#397c66"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        {points.map((p) => (
          <circle key={p.date} cx={x(p)} cy={y(p)} r="5" fill="#397c66">
            <title>
              {p.date}: {p[metric]} {unit}
            </title>
          </circle>
        ))}
        <text x="35" y="177">
          {points[0].date}
        </text>
        <text x="550" y="177" textAnchor="end">
          {points.at(-1).date}
        </text>
      </svg>
    </figure>
  );
}
export default function Reports({ data, demo, user, onUpdate }) {
  const timezone = data.settings?.timezone || "America/Denver";
  const [start, setStart] = useState(
      dayKey(Date.now() - 30 * 86400000, timezone),
    ),
    [end, setEnd] = useState(dayKey(Date.now(), timezone)),
    [mode, setMode] = useState("team"),
    [studentId, setStudentId] = useState(""),
    [teacherId, setTeacherId] = useState(""),
    [behavior, setBehavior] = useState("");
  const [storedReport, setReport] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [reload, setReload] = useState(0),
    [modal, setModal] = useState(null),
    [busy, setBusy] = useState(false),
    [presenting, setPresenting] = useState(false),
    [slide, setSlide] = useState(0);
  const report = storedReport?.mode === mode ? storedReport : null;
  useEffect(() => {
    let cancelled = false;
    setError("");
    setLoading(true);
    const options = {
      start,
      end,
      mode,
      studentId,
      teacherId,
      timezone,
      behavior: mode === "board" ? "" : behavior,
    };
    const task = demo
      ? Promise.resolve().then(() => buildReport(data, options))
      : api("/reports?" + new URLSearchParams(options));
    task
      .then((r) => {
        if (!cancelled) setReport({ ...r, demo });
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setReport(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    data,
    demo,
    start,
    end,
    mode,
    studentId,
    teacherId,
    timezone,
    behavior,
    reload,
  ]);
  useEffect(() => {
    if (!presenting) return;
    const escape = (e) => {
      if (e.key === "Escape") setPresenting(false);
    };
    document.addEventListener("keydown", escape);
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", escape);
      document.body.style.overflow = before;
    };
  }, [presenting]);
  async function saveRecord(fields) {
    setBusy(true);
    setError("");
    try {
      const kind = modal === "phase" ? "phases" : "reviews";
      const result = demo
        ? {
            ...fields,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            createdBy: user.id,
            status: "proposed",
          }
        : await api(`/students/${fields.studentId}/${kind}`, {
            method: "POST",
            body: fields,
          });
      if (demo) {
        if (
          kind === "phases" &&
          (data.phases || []).some(
            (p) =>
              p.studentId === fields.studentId &&
              p.startsOn === fields.startsOn,
          )
        )
          throw new Error(
            "A phase is already recorded for that student and date.",
          );
        onUpdate((d) => ({
          ...d,
          [kind === "phases" ? "phases" : "reviewNotes"]: [
            ...(d[kind === "phases" ? "phases" : "reviewNotes"] || []),
            result,
          ],
        }));
      }
      setModal(null);
      setReload((n) => n + 1);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([reportHTML(report)], { type: "text/html;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `inclusion-${mode}-summary-${end}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className={`reports-view ${presenting ? "report-presentation" : ""}`}>
      {presenting ? (
        <div className="presentation-toolbar">
          <span>
            {mode === "board" ? "Board summary" : "School-team review"} ·{" "}
            {slide + 1}/4 {demo && " · Demo"}
          </span>
          <div className="button-row">
            <button
              className="button secondary"
              disabled={slide === 0}
              onClick={() => setSlide((n) => n - 1)}
              aria-label="Previous report slide"
            >
              <Icon icon={ArrowLeft} />
            </button>
            <button
              className="button secondary"
              disabled={slide === 3}
              onClick={() => setSlide((n) => n + 1)}
              aria-label="Next report slide"
            >
              <Icon icon={ArrowRight} />
            </button>
            <button className="button secondary" onClick={() => window.print()}>
              <Icon icon={Printer} />
              Print
            </button>
            <button
              className="icon-button"
              aria-label="Exit presentation"
              onClick={() => setPresenting(false)}
            >
              <Icon icon={X} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <section className="panel report-controls">
            <div className="panel-body">
              <div className="report-controls-grid">
                <label className="field">
                  From
                  <input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </label>
                <label className="field">
                  Through
                  <input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </label>
                <label className="field">
                  Student scope
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  >
                    <option value="">All assigned students</option>
                    {data.students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                {user.role === "admin" && (
                  <label className="field">
                    Educator caseload
                    <select
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                    >
                      <option value="">All educators</option>
                      {data.teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {mode === "team" && (
                  <label className="field">
                    Behavior
                    <select
                      value={behavior}
                      onChange={(e) => setBehavior(e.target.value)}
                    >
                      <option value="">All recorded behaviors</option>
                      {(report?.availableBehaviors || []).map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="field">
                  Audience
                  <select
                    aria-label="Report audience"
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                  >
                    <option value="team">School team · detailed</option>
                    <option value="board">Board · aggregate</option>
                  </select>
                </label>
              </div>
              <div className="report-actions">
                <div className="button-row">
                  <button
                    className="button primary"
                    disabled={!report || loading}
                    onClick={() => {
                      setSlide(0);
                      setPresenting(true);
                    }}
                  >
                    <Icon icon={Presentation} size={18} />
                    Present summary
                  </button>
                  <button
                    className="button secondary"
                    disabled={!report || loading}
                    onClick={download}
                  >
                    <Icon icon={ArrowDownToLine} size={17} />
                    Export presentation
                  </button>
                  <button
                    className="button secondary"
                    disabled={!report || loading}
                    onClick={() => window.print()}
                  >
                    <Icon icon={Printer} size={17} />
                    Print / PDF
                  </button>
                </div>
                {mode === "team" && (
                  <div className="button-row">
                    <button
                      className="text-button"
                      onClick={() => setModal("phase")}
                    >
                      <Icon icon={Plus} size={15} />
                      Record intervention phase
                    </button>
                    <button
                      className="text-button"
                      onClick={() => setModal("review")}
                    >
                      <Icon icon={MessageCircle} size={15} />
                      Add reflection / plan review
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!report ? (
        <Empty
          icon={ClipboardList}
          title={loading ? "Preparing your report…" : "Choose a report period"}
        >
          Reports use the records your school team entered.
        </Empty>
      ) : (
        <div className="report-document">
          <section
            className={`panel report-page ${slide === 0 ? "current-slide" : ""}`}
          >
            <div className="panel-body">
              <Badge tone={mode === "board" ? "purple" : "green"}>
                {mode === "board"
                  ? "BOARD · AGGREGATE SUMMARY"
                  : "SCHOOL TEAM · DETAILED REVIEW"}
              </Badge>
              {demo && (
                <p className="demo-report-label">
                  Fictional demonstration data
                </p>
              )}
              <h2 className="report-title">
                The support behind each step forward.
              </h2>
              <p className="muted">
                {report.start} – {report.end} · {report.timezone}
              </p>
              <div className="report-metrics">
                {[
                  ["Students in scope", report.studentCount],
                  ["Support requests", report.totalRequests],
                  ["Support provided", report.providedRequests],
                ].map(([label, value]) => (
                  <div key={label}>
                    <strong>{display(value)}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div className="notice">
                <Icon icon={ShieldCheck} size={18} />
                {report.limitation}
              </div>
              <p className="form-hint">
                A thumbs-up confirms a saved request or acknowledgment. It is
                separate from the recorded “support provided” stage. — means
                unavailable or withheld.
              </p>
            </div>
          </section>
          <section
            className={`panel report-page ${slide === 1 ? "current-slide" : ""}`}
          >
            <div className="panel-body">
              <h2>Which supports are students asking for?</h2>
              <p className="muted report-subtitle">
                Web and Chromebook requests share one history.
              </p>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Assigned support</th>
                      <th>Requests</th>
                      <th>Provided</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.supports.map((s, i) => (
                      <tr key={i}>
                        <td>{s.title}</td>
                        <td>{display(s.requests)}</td>
                        <td>{display(s.provided)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="form-hint">
                Web: {display(report.webRequests)} · Chrome extension:{" "}
                {display(report.extensionRequests)}. Request frequency alone
                does not establish which support works best.
              </p>
              {report.teacherSummaries?.length > 0 && (
                <>
                  <h3 className="subheading">
                    Educator contributions in this scope
                  </h3>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Educator</th>
                          <th>Entries recorded</th>
                          <th>Requests received</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.teacherSummaries.map((t) => (
                          <tr key={t.name}>
                            <td>{t.name}</td>
                            <td>{t.entries}</td>
                            <td>{t.requests}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </section>
          <section
            className={`panel report-page ${slide === 2 ? "current-slide" : ""}`}
          >
            <div className="panel-body">
              <h2>Behavior over the recorded period</h2>
              <div className="report-metrics">
                <div>
                  <strong>{display(report.behavior.frequency)}</strong>
                  <span>Frequency entries</span>
                </div>
                <div>
                  <strong>{display(report.behavior.durationSeconds)}</strong>
                  <span>Duration · seconds</span>
                </div>
                <div>
                  <strong>{display(report.behavior.observationPairs)}</strong>
                  <span>Paired observations</span>
                </div>
              </div>
              {report.behaviorBreakdown?.length > 0 && (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Recorded behavior</th>
                        <th>Frequency</th>
                        <th>Duration (seconds)</th>
                        <th>Observation pairs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.behaviorBreakdown.map((b) => (
                        <tr key={b.name}>
                          <td>{b.name}</td>
                          <td>{display(b.frequency)}</td>
                          <td>{display(b.durationSeconds)}</td>
                          <td>{display(b.observationPairs)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="report-charts">
                <Trend
                  rows={report.daily}
                  metric="frequency"
                  title="Behavior frequency"
                  unit="occurrences"
                />
                <Trend
                  rows={report.daily}
                  metric="durationSeconds"
                  title="Behavior duration"
                  unit="seconds"
                />
              </div>
              <p className="form-hint">
                Student on task: {display(report.behavior.studentOnTask)}% ·
                Anonymous peer on task: {display(report.behavior.peerOnTask)}%.
                Both percentages use the same paired observation samples.
              </p>
            </div>
          </section>
          <section
            className={`panel report-page ${slide === 3 ? "current-slide" : ""}`}
          >
            <div className="panel-body">
              <h2>
                {mode === "board"
                  ? "Questions for the school team"
                  : "Intervention timeline & reflection"}
              </h2>
              {mode === "board" ? (
                <div className="notice">
                  Review the completeness of tracking, consistency of support
                  delivery, and questions for the appropriate school team.
                  Individual phase names, student reflections, and proposed
                  IEP/504/BIP changes are excluded from the board view.
                </div>
              ) : (
                <>
                  <ol className="intervention-timeline">
                    {report.phaseComparisons.map((p) => (
                      <li key={p.id}>
                        <span className="phase-date">{p.startsOn}</span>
                        <h3>
                          {p.student} · {p.name}
                        </h3>
                        <p>{p.description}</p>
                        <div className="phase-comparison">
                          <span>
                            Frequency: <b>{display(p.frequency)}</b>
                          </span>
                          <span>
                            Duration:{" "}
                            <b>{display(p.durationSeconds)} seconds</b>
                          </span>
                          <span>
                            Observation pairs:{" "}
                            <b>{display(p.observationPairs)}</b>
                          </span>
                          <span>
                            On task: <b>{display(p.studentOnTask)}%</b> · Peer:{" "}
                            <b>{display(p.peerOnTask)}%</b>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {!report.phaseComparisons.length && (
                    <p className="report-no-data">
                      Record the intervention phases that were actually
                      implemented to compare entered data across dates.
                    </p>
                  )}
                  <h3 className="subheading">Reflections below the timeline</h3>
                  {report.reflections.length ? (
                    report.reflections.map((r) => (
                      <article className="review-reflection" key={r.id}>
                        <div>
                          <strong>{r.student}</strong>
                          <Badge tone="peach">
                            {r.planType} · Proposed review
                          </Badge>
                        </div>
                        <p>{r.reflection}</p>
                        {r.proposal && (
                          <p>
                            <b>For team discussion:</b> {r.proposal}
                          </p>
                        )}
                        <span>
                          {new Date(r.createdAt).toLocaleDateString()} · No plan
                          change has been applied
                        </span>
                      </article>
                    ))
                  ) : (
                    <p className="report-no-data">
                      Add what the team noticed, what the student said helped,
                      and a proposed IEP, 504, or BIP review topic.
                    </p>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      )}
      {modal && (
        <RecordModal
          kind={modal}
          students={data.students}
          selected={studentId}
          onClose={() => setModal(null)}
          onSave={saveRecord}
          busy={busy}
          error={error}
          timezone={timezone}
        />
      )}
    </div>
  );
}
function RecordModal({
  kind,
  students,
  selected,
  onClose,
  onSave,
  busy,
  error,
  timezone,
}) {
  const [form, setForm] = useState({
    studentId: selected || students[0]?.id || "",
    name: "",
    description: "",
    startsOn: dayKey(Date.now(), timezone),
    teamConfirmed: false,
    reflection: "",
    proposal: "",
    planType: "IEP",
  });
  const field = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  return (
    <Modal
      title={
        kind === "phase"
          ? "Record an intervention phase"
          : "Reflect and prepare a plan review"
      }
      subtitle={
        kind === "phase"
          ? "Record what was implemented and when."
          : "Keep observations and proposed changes distinct."
      }
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
      >
        <label className="field">
          Student
          <select
            required
            value={form.studentId}
            onChange={(e) => field("studentId", e.target.value)}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {kind === "phase" ? (
          <>
            <label className="field">
              Phase name
              <input
                required
                maxLength={160}
                value={form.name}
                onChange={(e) => field("name", e.target.value)}
              />
            </label>
            <label className="field">
              Start date
              <input
                type="date"
                required
                value={form.startsOn}
                onChange={(e) => field("startsOn", e.target.value)}
              />
            </label>
            <label className="field">
              What was implemented?
              <textarea
                required
                rows={4}
                maxLength={2000}
                value={form.description}
                onChange={(e) => field("description", e.target.value)}
              />
            </label>
            <label className="check-label">
              <input
                required
                type="checkbox"
                checked={form.teamConfirmed}
                onChange={(e) => field("teamConfirmed", e.target.checked)}
              />
              This phase matches the support plan approved by the school team.
            </label>
          </>
        ) : (
          <>
            <label className="field">
              Review topic
              <select
                value={form.planType}
                onChange={(e) => field("planType", e.target.value)}
              >
                <option>IEP</option>
                <option>504</option>
                <option>BIP</option>
              </select>
            </label>
            <label className="field">
              What did the team or student notice?
              <textarea
                rows={4}
                maxLength={2000}
                value={form.reflection}
                onChange={(e) => field("reflection", e.target.value)}
              />
            </label>
            <label className="field">
              Proposed change or question for the team
              <textarea
                rows={4}
                maxLength={2000}
                value={form.proposal}
                onChange={(e) => field("proposal", e.target.value)}
              />
            </label>
            <p className="form-hint">
              This records a proposal for discussion. It does not update an
              approved plan or determine eligibility.
            </p>
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button primary"
            disabled={
              busy ||
              !form.studentId ||
              (kind === "review" &&
                !form.reflection.trim() &&
                !form.proposal.trim())
            }
          >
            {busy ? "Saving…" : "Save record"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
