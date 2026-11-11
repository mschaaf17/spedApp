import React, { useEffect, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  ClipboardList,
  Clock3,
  Coffee,
  Ear,
  FileText,
  Hand,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Timer,
  Trash2,
  TrendingUp,
  Volume2,
} from "lucide-react";
import { api } from "./api.js";
import {
  Badge,
  Empty,
  Icon,
  Modal,
  ProgressChart,
  RequestCard,
} from "./components.jsx";
import { isSchoolHours } from "../../shared/classroom.mjs";
import { pictureFor, SUPPORT_PICTURES } from "../../shared/pictures.mjs";

function Heading({ icon, title, detail, action }) {
  return (
    <div className="panel-heading">
      <div>
        <h2>
          <Icon icon={icon} size={19} />
          {title}
        </h2>
        {detail && <p>{detail}</p>}
      </div>
      {action}
    </div>
  );
}
const today = (e) =>
  new Date(e.createdAt).toDateString() === new Date().toDateString();
const secondsLabel = (seconds) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
export function Tracker({
  data,
  student,
  user,
  demo,
  busy,
  logEvent,
  undoEvent,
}) {
  const [method, setMethod] = useState("frequency");
  const timerKey = `inclusion.timer.${demo ? "demo" : user.id}.${student.id}`;
  const [startedAt, setStartedAt] = useState(() => {
    try {
      const n = Number(sessionStorage.getItem(timerKey));
      return n > 0 && Date.now() - n < 86400000 ? n : null;
    } catch {
      return null;
    }
  });
  const [now, setNow] = useState(Date.now());
  const [observing, setObserving] = useState(false);
  const [intervalEnd, setIntervalEnd] = useState(null);
  const [sample, setSample] = useState({
    targetOnTask: null,
    peerOnTask: null,
  });
  const [note, setNote] = useState("");
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  const events = data.events.filter(
    (e) => e.studentId === student.id && today(e),
  );
  const count = events.filter((e) => e.type === "frequency").length;
  const duration = events
    .filter((e) => e.type === "duration")
    .reduce((sum, e) => sum + e.seconds, 0);
  const observations = events.filter((e) => e.type === "observation");
  const last = events
    .filter((e) => e.actorId === user.id && e.type === method)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  const remaining = intervalEnd
    ? Math.max(0, Math.ceil((intervalEnd - now) / 1000))
    : 10;
  const definitionReady = Boolean(
    student.behavior?.name && student.behavior?.definition,
  );
  const record = (extra) =>
    logEvent({
      studentId: student.id,
      behavior: student.behavior?.name || "",
      note,
      ...extra,
    });
  function startTimer() {
    const at = Date.now();
    setStartedAt(at);
    try {
      sessionStorage.setItem(timerKey, String(at));
    } catch {
      /* Timer still runs in memory. */
    }
  }
  async function stopTimer() {
    const result = await record({
      type: "duration",
      seconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
    });
    if (result) {
      setStartedAt(null);
      sessionStorage.removeItem(timerKey);
      setNote("");
    }
  }
  async function saveSample() {
    const result = await record({ type: "observation", ...sample });
    if (result) {
      setSample({ targetOnTask: null, peerOnTask: null });
      setIntervalEnd(Date.now() + 10000);
      setNote("");
    }
  }
  return (
    <div className="tracking-layout">
      <section className="panel tracking-panel">
        <Heading
          icon={Activity}
          title="Be present. Capture the moment."
          detail="One student. One clear definition. Consistent data."
        />
        <div className="panel-body">
          <div className="segmented" aria-label="Tracking method">
            {[
              ["frequency", "Frequency"],
              ["duration", "Duration"],
              ["observation", "10-second observation"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={method === key ? "active" : ""}
                aria-pressed={method === key}
                onClick={() => setMethod(key)}
              >
                {label}
              </button>
            ))}
          </div>
          {!definitionReady && (
            <div className="notice">
              Add an observable behavior definition in Plans & drafts before
              recording behavior data.
            </div>
          )}
          <div className="tracker-center">
            <span className="eyebrow">
              {student.behavior?.name || "No behavior defined yet"}
            </span>
            {method === "frequency" && (
              <>
                <div className="big-number" aria-live="polite">
                  {count}
                </div>
                <span className="muted">occurrences recorded today</span>
                <button
                  className="count-button"
                  aria-label="Record one occurrence"
                  disabled={busy.log || !definitionReady}
                  onClick={async () => {
                    if (await record({ type: "frequency" })) setNote("");
                  }}
                >
                  <Icon icon={Plus} size={36} />
                  <span>{busy.log ? "Saving…" : "Record occurrence"}</span>
                </button>
              </>
            )}
            {method === "duration" && (
              <>
                <div
                  className={`big-number timer-number ${startedAt ? "running" : ""}`}
                  aria-live="off"
                >
                  {secondsLabel(
                    startedAt ? Math.max(0, (now - startedAt) / 1000) : 0,
                  )}
                </div>
                <p className="muted">
                  {startedAt
                    ? "Timer is running · stop when the behavior ends"
                    : `${secondsLabel(duration)} total recorded today`}
                </p>
                <button
                  className="button primary timer-control"
                  disabled={busy.log || !definitionReady}
                  onClick={startedAt ? stopTimer : startTimer}
                >
                  <Icon icon={startedAt ? Pause : Play} />
                  {busy.log
                    ? "Saving…"
                    : startedAt
                      ? "Stop & save duration"
                      : "Start duration timer"}
                </button>
                <p className="form-hint">
                  Elapsed time uses the clock, including when you switch tabs.
                  Review context before saving.
                </p>
              </>
            )}
            {method === "observation" && (
              <>
                <div className="observation-clock">
                  <Icon icon={Timer} size={27} />
                  <strong>{observing ? remaining : 10}</strong>
                  <span>seconds</span>
                </div>
                <p className="muted">
                  Compare the student with an anonymous peer every 10 seconds.
                </p>
                {!observing ? (
                  <button
                    className="button primary"
                    disabled={!definitionReady}
                    onClick={() => {
                      setObserving(true);
                      setIntervalEnd(Date.now() + 10000);
                    }}
                  >
                    Start observation
                  </button>
                ) : (
                  <>
                    <div className="observation-grid">
                      {[
                        ["targetOnTask", "Student on task?"],
                        ["peerOnTask", "Peer on task?"],
                      ].map(([key, label]) => (
                        <fieldset key={key}>
                          <legend>{label}</legend>
                          <div className="button-row">
                            {[true, false].map((value) => (
                              <button
                                key={String(value)}
                                className={`button ${sample[key] === value ? "primary" : "secondary"}`}
                                aria-pressed={sample[key] === value}
                                onClick={() =>
                                  setSample((s) => ({ ...s, [key]: value }))
                                }
                              >
                                {value ? "Yes" : "No"}
                              </button>
                            ))}
                          </div>
                        </fieldset>
                      ))}
                    </div>
                    <div className="button-row">
                      <button
                        className="button secondary"
                        onClick={() => {
                          setIntervalEnd(Date.now() + 10000);
                          setSample({ targetOnTask: null, peerOnTask: null });
                        }}
                      >
                        Skip interval
                      </button>
                      <button
                        className="button primary"
                        disabled={
                          remaining > 0 ||
                          busy.log ||
                          sample.targetOnTask === null ||
                          sample.peerOnTask === null
                        }
                        onClick={saveSample}
                      >
                        {busy.log
                          ? "Saving…"
                          : remaining > 0
                            ? `Observe · ${remaining}s`
                            : "Save paired observation"}
                      </button>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setObserving(false)}
                    >
                      End observation
                    </button>
                    <p className="form-hint">
                      No interval is recorded automatically. Skip any interval
                      you did not observe.
                    </p>
                  </>
                )}
              </>
            )}
          </div>
          <label className="field">
            Context note{" "}
            <span className="optional">optional · classroom only</span>
            <textarea
              rows={2}
              maxLength={1000}
              placeholder="What was happening around this moment?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          {last && (
            <button
              className="text-button"
              disabled={busy.undo}
              onClick={() => undoEvent(last)}
            >
              <Icon icon={RotateCcw} size={15} />
              Undo my last{" "}
              {method === "duration"
                ? "duration"
                : method === "observation"
                  ? "observation"
                  : "occurrence"}
            </button>
          )}
        </div>
      </section>
      <aside className="tracking-aside">
        <section className="panel">
          <Heading icon={BookOpen} title="What we’re observing" />
          <div className="panel-body">
            <Badge tone="neutral">OPERATIONAL DEFINITION</Badge>
            <p className="definition-text">
              {student.behavior?.definition ||
                "No operational definition has been added."}
            </p>
            <p className="form-hint">
              Use the same definition each time. Approved breaks and
              accommodations are not automatically problem behaviors.
            </p>
          </div>
        </section>
        <section className="panel">
          <Heading icon={ClipboardList} title="Today’s snapshot" />
          <div className="panel-body snapshot">
            <div>
              <span>Frequency</span>
              <strong>{count}</strong>
            </div>
            <div>
              <span>Total duration</span>
              <strong>{secondsLabel(duration)}</strong>
            </div>
            <div>
              <span>Paired observations</span>
              <strong>{observations.length}</strong>
            </div>
            {observations.length > 0 && (
              <>
                <div>
                  <span>Student on task</span>
                  <strong>
                    {Math.round(
                      (observations.filter((e) => e.targetOnTask).length /
                        observations.length) *
                        100,
                    )}
                    %
                  </strong>
                </div>
                <div>
                  <span>Peer on task</span>
                  <strong>
                    {Math.round(
                      (observations.filter((e) => e.peerOnTask).length /
                        observations.length) *
                        100,
                    )}
                    %
                  </strong>
                </div>
              </>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}

const pictureLabels = {
  quiet: "Quiet place",
  break: "Break",
  directions: "Help me",
  time: "More time",
  read: "Read to me",
  schedule: "My schedule",
  help: "Teacher help",
};
function say(message) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}
export function StudentSpace({
  data,
  student,
  user,
  view,
  requests,
  requestSupport,
  advance,
  busy,
  go,
  onProgress,
}) {
  const [teacherId, setTeacherId] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  if (!student)
    return (
      <Empty icon={Hand} title="Your learning space is almost ready">
        Your school needs to attach your supports and teacher to your account.
      </Empty>
    );
  const teachers = data.teachers.filter((t) =>
    student.teacherIds.includes(t.id),
  );
  const selectedTeacher =
    teachers.find((t) => t.id === teacherId) || teachers[0];
  if (view === "progress")
    return (
      <section className="panel">
        <Heading
          icon={TrendingUp}
          title="Look how far you’ve come."
          detail={student.goal?.title}
          action={
            <button className="button primary" onClick={onProgress}>
              <Icon icon={Plus} size={20} />
              Add my progress
            </button>
          }
        />
        <div className="panel-body">
          <ProgressChart student={student} events={data.events} />
        </div>
      </section>
    );
  return (
    <div className="student-space picture-first">
      <section className="student-picture-heading">
        <img src="/pictures/help.svg" alt="A teacher helping a student" />
        <div>
          <h2>What do you need?</h2>
          <p>Tap a picture.</p>
        </div>
        {"speechSynthesis" in window && (
          <button
            className="listen-button"
            aria-label="Listen to how to ask for help"
            onClick={() =>
              say(
                "What do you need? Tap a picture to ask your teacher for help.",
              )
            }
          >
            <Icon icon={Volume2} size={28} />
            <span>Listen</span>
          </button>
        )}
      </section>
      {teachers.length > 1 && (
        <label className="teacher-choice picture-teacher">
          <span>My teacher</span>
          <select
            aria-label="Teacher to notify"
            value={selectedTeacher?.id || ""}
            onChange={(e) => setTeacherId(e.target.value)}
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {!selectedTeacher && (
        <div className="notice">
          <img
            src="/pictures/help.svg"
            width="70"
            alt="Ask a teacher for help"
          />
          <p>Your teacher needs to connect your supports.</p>
        </div>
      )}
      <section
        className="picture-support-grid"
        aria-label="Choose a picture to ask for support"
      >
        {student.accommodations.map((a) => {
          const picture = pictureFor(a),
            label = a.studentLabel || pictureLabels[picture];
          const active = requests.find(
            (r) =>
              r.accommodationId === a.id && r.teacherId === selectedTeacher?.id,
          );
          return (
            <article
              className={`picture-support-card picture-${picture} ${active ? "request-active" : ""}`}
              key={a.id}
            >
              <button
                className="picture-request"
                aria-label={`${a.title}. ${active ? "Request already sent" : "Ask my teacher for this support"}`}
                disabled={
                  Boolean(active) || busy[`support-${a.id}`] || !selectedTeacher
                }
                onClick={async () => {
                  const result = await requestSupport(a, selectedTeacher.id);
                  setConfirmation({
                    support: a,
                    label,
                    success: Boolean(result),
                  });
                }}
              >
                <div className="support-picture-wrap">
                  <img
                    className="support-picture"
                    src={`/pictures/${picture}.svg`}
                    alt=""
                  />
                  {active && (
                    <span className="picture-sent-mark">
                      <Icon icon={Check} size={30} />
                    </span>
                  )}
                </div>
                <strong>{label}</strong>
                <span className="picture-action">
                  <Icon icon={active ? Clock3 : Hand} size={25} />
                  <span>
                    {active
                      ? active.status === "acknowledged"
                        ? "Teacher knows"
                        : active.status === "offered"
                          ? "Ready for help"
                          : "Sent!"
                      : busy[`support-${a.id}`]
                        ? "Sending…"
                        : "Ask"}
                  </span>
                </span>
              </button>
              {"speechSynthesis" in window && (
                <button
                  className="listen-button card-listen"
                  aria-label={`Listen: ${a.title}`}
                  onClick={() => say(`${label}. ${a.description}`)}
                >
                  <Icon icon={Volume2} size={24} />
                  <span>Listen</span>
                </button>
              )}
            </article>
          );
        })}
      </section>
      {!student.accommodations.length && (
        <Empty icon={BookOpen} title="Your pictures will appear here">
          Your teacher can add your supports.
        </Empty>
      )}
      {requests.length > 0 && (
        <section className="panel picture-request-inbox">
          <Heading
            icon={Bell}
            title="My requests"
            detail="Your teacher can see these."
          />
          <div className="panel-body">
            {requests.map((r) => (
              <article className="picture-request-status" key={r.id}>
                <img
                  src={`/pictures/${pictureFor(student.accommodations.find((a) => a.id === r.accommodationId) || { title: r.title })}.svg`}
                  alt=""
                />
                <div>
                  <strong>{r.title}</strong>
                  <span>
                    <Icon
                      icon={r.status === "requested" ? Clock3 : Check}
                      size={22}
                    />
                    {r.status === "requested"
                      ? "Sent to teacher"
                      : r.status === "acknowledged"
                        ? "Teacher knows"
                        : "Support offered"}
                  </span>
                </div>
                <button
                  className="picture-cancel"
                  aria-label={`Cancel request for ${r.title}`}
                  disabled={busy[r.id]}
                  onClick={() => advance(r, "cancelled")}
                >
                  <Icon icon={Trash2} size={25} />
                  <span>Cancel</span>
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
      <section className="panel student-progress">
        <Heading
          icon={TrendingUp}
          title="My growth"
          detail={student.goal?.title}
          action={
            <button className="button primary" onClick={onProgress}>
              <Icon icon={Plus} size={22} />
              Add progress
            </button>
          }
        />
        <div className="panel-body">
          <ProgressChart student={student} events={data.events} />
          <div className="reflection-prompt">
            <Sparkles size={26} />
            <div>
              <h3>What helped you today?</h3>
              <p>Your voice matters.</p>
            </div>
            {"speechSynthesis" in window && (
              <button
                className="listen-button"
                aria-label="Listen to the reflection question"
                onClick={() =>
                  say("What helped you today? You can tell your teacher.")
                }
              >
                <Icon icon={Volume2} size={25} />
              </button>
            )}
          </div>
        </div>
      </section>
      {confirmation && (
        <Modal
          title={confirmation.success ? "Sent!" : "Try again"}
          subtitle={
            confirmation.success
              ? "Your teacher has your request."
              : "Your request could not be confirmed. Ask a teacher for help."
          }
          onClose={() => setConfirmation(null)}
        >
          <div
            className={`picture-confirmation ${confirmation.success ? "" : "failed"}`}
          >
            <img
              src={`/pictures/${pictureFor(confirmation.support)}.svg`}
              alt={confirmation.label}
            />
            <span className="confirmation-symbol">
              <Icon icon={confirmation.success ? Check : Hand} size={70} />
            </span>
            <img
              className="confirmation-teacher"
              src="/pictures/help.svg"
              alt="Teacher helping a student"
            />
          </div>
          <div className="picture-confirm-actions">
            {"speechSynthesis" in window && (
              <button
                className="listen-button"
                aria-label="Listen to request confirmation"
                onClick={() =>
                  say(
                    confirmation.success
                      ? "Your teacher has your request. You did a good job asking for help."
                      : "Your request could not be sent. Please ask a teacher for help.",
                  )
                }
              >
                <Icon icon={Volume2} size={30} />
                <span>Listen</span>
              </button>
            )}
            <button
              className="button primary picture-done"
              aria-label="Done. Return to my support pictures."
              onClick={() => setConfirmation(null)}
            >
              <Icon icon={Check} size={32} />
              <span>Done</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function ProgressEntry({ student, user, onClose, onSave, busy, error }) {
  const [value, setValue] = useState(""),
    [note, setNote] = useState(""),
    [shared, setShared] = useState(false);
  const [localError, setLocalError] = useState("");
  return (
    <Modal
      title={
        user.role === "student"
          ? "Every step counts."
          : "Capture a step forward."
      }
      subtitle={`${student.name} · ${student.goal?.title || "Add a goal before logging progress"}`}
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const n = Number(value);
          if (
            value === "" ||
            !Number.isFinite(n) ||
            n < 0 ||
            (student.goal?.unit === "%" && n > 100)
          ) {
            setLocalError("Enter a valid measurement in the goal’s units.");
            return;
          }
          if (
            await onSave({
              studentId: student.id,
              type: "progress",
              value: n,
              note,
              sharedWithFamily: shared,
            })
          )
            onClose();
        }}
      >
        <label className="field">
          Measurement {student.goal?.unit && `(${student.goal.unit})`}
          <input
            autoFocus
            required
            inputMode="decimal"
            type="number"
            min="0"
            max={student.goal?.unit === "%" ? 100 : 100000}
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <label className="field">
          {user.role === "student"
            ? "What helped? What felt difficult?"
            : "Student reflection / context"}
          <textarea
            rows={4}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="For example: Quiet music helped me start my work."
          />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={shared}
            onChange={(e) => setShared(e.target.checked)}
          />
          Include this measurement in the family progress view
        </label>
        <p className="form-hint">
          The reflection stays in the classroom. The family view shares the
          number and date only.
        </p>
        {(error || localError) && (
          <p className="form-error" role="alert">
            {localError || error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button primary"
            disabled={busy || !student.goal?.title}
          >
            {busy ? "Saving…" : "Save progress"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function StudentEditor({
  student,
  demo,
  isAdmin,
  teachers,
  onClose,
  onSave,
  busy,
  error,
}) {
  const [supports, setSupports] = useState(student.accommodations);
  const [teacherOptions, setTeacherOptions] = useState(teachers || []);
  const [teacherIds, setTeacherIds] = useState(student.teacherIds || []);
  useEffect(() => {
    if (isAdmin && !demo)
      api("/teachers")
        .then(setTeacherOptions)
        .catch((e) => setLocalError(e.message));
  }, [isAdmin, demo]);
  const [goal, setGoal] = useState(
    student.goal?.title
      ? student.goal
      : { title: "", baseline: "", target: "", unit: "%" },
  );
  const [behavior, setBehavior] = useState(
    student.behavior || { name: "", definition: "" },
  );
  const [localError, setLocalError] = useState("");
  return (
    <Modal
      title="A shared understanding of support."
      subtitle={`${student.name} · Enter the classroom summary of the approved plan.`}
      wide
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const hasGoal = Boolean(goal.title.trim());
          if (
            hasGoal &&
            (goal.baseline === "" ||
              goal.target === "" ||
              Number(goal.baseline) === Number(goal.target))
          ) {
            setLocalError("A goal needs a baseline and a different target.");
            return;
          }
          const fields = {
            accommodations: supports.filter((a) => a.title.trim()),
            behavior,
            ...(isAdmin ? { teacherIds } : {}),
          };
          if (hasGoal)
            fields.goal = {
              ...goal,
              baseline: Number(goal.baseline),
              target: Number(goal.target),
            };
          onSave(student.id, fields);
        }}
      >
        <>
          {isAdmin && (
            <fieldset className="field">
              <legend>Assigned educators</legend>
              {teacherOptions.map((t) => (
                <label className="check-label" key={t.id}>
                  <input
                    type="checkbox"
                    checked={teacherIds.includes(t.id)}
                    onChange={(e) =>
                      setTeacherIds((ids) =>
                        e.target.checked
                          ? [...ids, t.id]
                          : ids.filter((id) => id !== t.id),
                      )
                    }
                  />
                  {t.name}
                </label>
              ))}
            </fieldset>
          )}
        </>
        <h3 className="subheading">Accommodations</h3>
        {supports.map((a, i) => (
          <div className="support-editor" key={a.id}>
            <div>
              <label className="field">
                Support {i + 1}
                <input
                  required
                  maxLength={160}
                  value={a.title}
                  onChange={(e) =>
                    setSupports((s) =>
                      s.map((item, index) =>
                        index === i ? { ...item, title: e.target.value } : item,
                      ),
                    )
                  }
                />
              </label>
              <label className="field">
                Picture the student will tap
                <select
                  aria-label={`Picture for support ${i + 1}`}
                  value={pictureFor(a)}
                  onChange={(e) =>
                    setSupports((s) =>
                      s.map((item, index) =>
                        index === i
                          ? { ...item, picture: e.target.value }
                          : item,
                      ),
                    )
                  }
                >
                  {SUPPORT_PICTURES.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <img
                className="editor-picture-preview"
                src={`/pictures/${pictureFor(a)}.svg`}
                alt="Selected support picture"
              />
              <label className="field">
                Short student label
                <input
                  maxLength={40}
                  placeholder={pictureLabels[pictureFor(a)]}
                  value={a.studentLabel || ""}
                  onChange={(e) =>
                    setSupports((s) =>
                      s.map((item, index) =>
                        index === i
                          ? { ...item, studentLabel: e.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </label>
              <label className="field">
                Student-friendly instructions
                <textarea
                  maxLength={1000}
                  rows={2}
                  value={a.description}
                  onChange={(e) =>
                    setSupports((s) =>
                      s.map((item, index) =>
                        index === i
                          ? { ...item, description: e.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </label>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label={`Remove support ${i + 1}`}
              onClick={() =>
                setSupports((s) => s.filter((_, index) => index !== i))
              }
            >
              <Icon icon={Trash2} size={18} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-button"
          onClick={() =>
            setSupports((s) => [
              ...s,
              {
                id: crypto.randomUUID(),
                title: "",
                description: "",
                picture: "help",
                studentLabel: "",
              },
            ])
          }
        >
          <Icon icon={Plus} size={16} />
          Add accommodation
        </button>
        <h3 className="subheading">Measurable goal</h3>
        <label className="field">
          Goal area
          <input
            maxLength={160}
            value={goal.title}
            onChange={(e) => setGoal({ ...goal, title: e.target.value })}
            placeholder="For example: Independent work completion"
          />
        </label>
        <div className="form-grid three">
          <label className="field">
            Baseline
            <input
              inputMode="decimal"
              type="number"
              min="0"
              value={goal.baseline}
              onChange={(e) => setGoal({ ...goal, baseline: e.target.value })}
            />
          </label>
          <label className="field">
            Target
            <input
              inputMode="decimal"
              type="number"
              min="0"
              value={goal.target}
              onChange={(e) => setGoal({ ...goal, target: e.target.value })}
            />
          </label>
          <label className="field">
            Units
            <input
              maxLength={40}
              value={goal.unit}
              onChange={(e) => setGoal({ ...goal, unit: e.target.value })}
            />
          </label>
        </div>
        <h3 className="subheading">Behavior tracking definition</h3>
        <label className="field">
          Behavior name
          <input
            maxLength={160}
            value={behavior.name}
            onChange={(e) => setBehavior({ ...behavior, name: e.target.value })}
          />
        </label>
        <label className="field">
          Observable definition
          <textarea
            rows={4}
            maxLength={2000}
            value={behavior.definition}
            onChange={(e) =>
              setBehavior({ ...behavior, definition: e.target.value })
            }
            placeholder="Describe what can be seen or heard, when an occurrence begins and ends, and what to exclude."
          />
        </label>
        <div className="notice">
          This updates the classroom summary. Record formal IEP, 504, or BIP
          changes through your team’s review process.
        </div>
        {(error || localError) && (
          <p className="form-error" role="alert">
            {localError || error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? "Saving…" : "Save classroom summary"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function Plans({
  data,
  student,
  busy,
  createDraft,
  reviewDraft,
  onEdit,
}) {
  const [type, setType] = useState("IEP goal"),
    [editing, setEditing] = useState(null),
    [body, setBody] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const open = (draft) => {
    setEditing(draft);
    setBody(draft.body);
    setConfirmed(false);
    setError("");
  };
  return (
    <div className="plans-layout">
      <section className="panel">
        <Heading
          icon={ShieldCheck}
          title="Current classroom summary"
          detail="Keep the approved supports easy to find."
          action={
            <button className="button secondary" onClick={onEdit}>
              Edit summary
            </button>
          }
        />
        <div className="panel-body">
          <Badge tone="neutral">{student.planType}</Badge>
          <h3 className="subheading">
            {student.goal?.title || "No measurable goal added yet"}
          </h3>
          {student.goal?.title && (
            <div className="goal-numbers">
              <span>
                Baseline{" "}
                <strong>
                  {student.goal.baseline}
                  {student.goal.unit}
                </strong>
              </span>
              <ArrowRight size={18} />
              <span>
                Target{" "}
                <strong>
                  {student.goal.target}
                  {student.goal.unit}
                </strong>
              </span>
            </div>
          )}
          <div className="support-summary">
            {student.accommodations.map((a) => (
              <div key={a.id}>
                <Icon icon={Check} size={16} />
                <div>
                  <strong>{a.title}</strong>
                  <p>{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="panel">
        <Heading
          icon={Sparkles}
          title="A thoughtful first draft"
          detail="Create, refine, and review together."
        />
        <div className="panel-body">
          <label className="field">
            What are you working on?
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option>IEP goal</option>
              <option>BIP</option>
              <option>Operational definition</option>
            </select>
          </label>
          <button
            className="button primary full-width"
            disabled={busy.draft}
            onClick={async () => {
              const draft = await createDraft(type, false);
              if (draft?.body) open(draft);
            }}
          >
            <Icon icon={FileText} size={17} />
            {busy.draft ? "Preparing…" : "Start a guided draft"}
          </button>
          <button
            className="button secondary full-width ai-button"
            disabled={busy.draft || !data.aiEnabled}
            onClick={async () => {
              const draft = await createDraft(type, true);
              if (draft?.body) open(draft);
            }}
          >
            <Icon icon={Sparkles} size={17} />
            Draft with AI
          </button>
          <p className="form-hint">
            {data.aiEnabled
              ? "AI suggestions use plan details and recent measurements. Always verify the output with your team."
              : "AI drafting is available after your school connects and enables its approved AI service. Guided templates work now."}
          </p>
          <div className="notice">
            <ShieldCheck size={17} />
            Every draft needs human review. Creating or approving a copy does
            not automatically change classroom supports or your school’s
            official plan.
          </div>
        </div>
      </section>
      <section className="panel draft-history">
        <Heading
          icon={ClipboardList}
          title="Drafts & review history"
          detail="Keep the thinking behind each change."
        />
        <div className="panel-body">
          {student.drafts?.length ? (
            [...student.drafts].reverse().map((d) => (
              <article className="draft-row" key={d.id}>
                <span className="draft-icon">
                  <FileText size={21} />
                </span>
                <div>
                  <strong>{d.type}</strong>
                  <p>
                    {d.source} · {new Date(d.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  tone={
                    d.status === "approved"
                      ? "green"
                      : d.status === "rejected"
                        ? "neutral"
                        : "peach"
                  }
                >
                  {d.status === "approved"
                    ? "Team approval recorded"
                    : d.status === "rejected"
                      ? "Archived"
                      : "Needs review"}
                </Badge>
                <button className="text-button" onClick={() => open(d)}>
                  {d.status === "draft" ? "Review" : "View"}
                  <Icon icon={ArrowRight} size={15} />
                </button>
              </article>
            ))
          ) : (
            <Empty icon={ClipboardList} title="Space for your next idea">
              Create a guided draft or use your school’s connected AI service.
            </Empty>
          )}
        </div>
      </section>
      {editing && (
        <Modal
          title={`${editing.type} · ${editing.status === "draft" ? "Draft for review" : "Review copy"}`}
          subtitle={`${student.name} · ${editing.source}`}
          wide
          onClose={() => setEditing(null)}
        >
          <label className="field">
            Document
            <textarea
              className="draft-document"
              rows={17}
              maxLength={12000}
              value={body}
              readOnly={editing.status !== "draft"}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          {editing.status === "draft" && (
            <>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                The appropriate school team has reviewed and approved this copy.
              </label>
              <p className="form-hint">
                Recording approval preserves this copy. Enter any approved
                changes in the classroom summary and your school’s official
                system.
              </p>
              <div className="modal-actions wrap-actions">
                <button
                  className="button secondary"
                  disabled={busy.review}
                  onClick={async () => {
                    if (
                      await reviewDraft(editing, { body, status: "rejected" })
                    )
                      setEditing(null);
                  }}
                >
                  Archive
                </button>
                <button
                  className="button secondary"
                  disabled={busy.review || !body.trim()}
                  onClick={async () => {
                    if (await reviewDraft(editing, { body })) setEditing(null);
                  }}
                >
                  Save draft
                </button>
                <button
                  className="button primary"
                  disabled={busy.review || !confirmed || !body.trim()}
                  onClick={async () => {
                    if (
                      await reviewDraft(editing, {
                        body,
                        status: "approved",
                        teamConfirmed: confirmed,
                      })
                    )
                      setEditing(null);
                  }}
                >
                  Record team approval
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

export function Settings({
  data,
  demo,
  saveSettings,
  busy,
  onInstall,
  onError,
  onToast,
}) {
  const [settings, setSettings] = useState(data.settings);
  useEffect(() => setSettings(data.settings), [data.settings]);
  const [pushBusy, setPushBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  async function enableNotifications() {
    setPushBusy(true);
    setLocalError("");
    try {
      if (demo)
        throw new Error("Connect a school workspace to enable notifications.");
      if (
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      )
        throw new Error(
          "Push notifications are unavailable here. On iPhone, add the school app to your home screen first.",
        );
      const push = await api("/push");
      if (!push.configured)
        throw new Error(
          "Your school has not connected push notifications yet.",
        );
      const permission = await Notification.requestPermission();
      if (permission !== "granted")
        throw new Error(
          "Notifications were not enabled. You can still use the support inbox.",
        );
      const registration = await navigator.serviceWorker.ready;
      const base64 = push.publicKey.replace(/-/g, "+").replace(/_/g, "/");
      const raw = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
      const key = Uint8Array.from(raw, (c) => c.charCodeAt(0));
      const subscription =
        (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        }));
      await api("/push", { method: "POST", body: subscription.toJSON() });
      onToast("Notifications enabled for your school hours.");
    } catch (e) {
      setLocalError(e.message);
    } finally {
      setPushBusy(false);
    }
  }
  return (
    <div className="settings-layout">
      <section className="panel">
        <Heading
          icon={Clock3}
          title="School hours. Personal time."
          detail="Requests stay in the inbox; push notifications follow your schedule."
        />
        <form
          className="panel-body"
          onSubmit={(e) => {
            e.preventDefault();
            saveSettings(settings);
          }}
        >
          <label className="field">
            Time zone
            <select
              value={settings.timezone}
              onChange={(e) =>
                setSettings({ ...settings, timezone: e.target.value })
              }
            >
              {[
                "America/Denver",
                "America/New_York",
                "America/Chicago",
                "America/Los_Angeles",
                "America/Phoenix",
                "America/Anchorage",
                "Pacific/Honolulu",
                "Europe/London",
                "UTC",
              ].map((zone) => (
                <option key={zone}>{zone}</option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label className="field">
              Start time
              <input
                type="time"
                required
                value={settings.start}
                onChange={(e) =>
                  setSettings({ ...settings, start: e.target.value })
                }
              />
            </label>
            <label className="field">
              End time
              <input
                type="time"
                required
                value={settings.end}
                onChange={(e) =>
                  setSettings({ ...settings, end: e.target.value })
                }
              />
            </label>
          </div>
          <fieldset className="field">
            <legend>School days</legend>
            <div className="day-picker">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day, i) => (
                  <button
                    type="button"
                    key={day}
                    className={settings.days.includes(i) ? "selected" : ""}
                    aria-pressed={settings.days.includes(i)}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        days: settings.days.includes(i)
                          ? settings.days.filter((d) => d !== i)
                          : [...settings.days, i],
                      })
                    }
                  >
                    {day}
                  </button>
                ),
              )}
            </div>
          </fieldset>
          <label className="check-label pause-label">
            <input
              type="checkbox"
              checked={settings.paused}
              onChange={(e) =>
                setSettings({ ...settings, paused: e.target.checked })
              }
            />
            <span>
              <strong>Pause push notifications</strong>
              <small>Use for holidays, sick days, or time away.</small>
            </span>
          </label>
          <div className="notice">
            <span
              className={`status-dot ${isSchoolHours(settings) ? "provided" : "offered"}`}
            />
            {isSchoolHours(settings)
              ? "Within the selected school hours now."
              : "Quiet hours now. Push notifications are paused."}
          </div>
          <button className="button primary" disabled={busy.settings}>
            {busy.settings ? "Saving…" : "Save school hours"}
          </button>
        </form>
      </section>
      <div>
        <section className="panel">
          <Heading icon={Bell} title="A discreet nudge" />
          <div className="panel-body">
            <p className="muted">
              Receive a generic notification when a student needs support. Names
              and accommodation details stay inside the app.
            </p>
            <button
              className="button secondary full-width"
              disabled={pushBusy || demo || !data.pushEnabled}
              onClick={enableNotifications}
            >
              <Icon icon={Bell} size={17} />
              {pushBusy ? "Connecting…" : "Enable notifications on this device"}
            </button>
            <p className="form-hint">
              {demo || !data.pushEnabled
                ? "Your school needs to connect push notifications before they can be enabled."
                : "Notifications need a supported browser and HTTPS. On iPhone, use the installed home-screen app."}
            </p>
            {localError && (
              <p className="form-error" role="alert">
                {localError}
              </p>
            )}
          </div>
        </section>
        <section className="panel settings-phone">
          <Heading icon={ArrowDownToLine} title="Made for your phone" />
          <div className="panel-body">
            <p className="muted">
              Keep quick tracking and your support inbox within reach on iPhone
              and Android.
            </p>
            <button className="button secondary full-width" onClick={onInstall}>
              Add to home screen <Icon icon={ArrowRight} size={17} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
