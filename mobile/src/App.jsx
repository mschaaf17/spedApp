import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Home,
  Leaf,
  LogIn,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { api, getSession, setSession } from "./api.js";
import { watchWorkspace } from "../../shared/live.mjs";
import { StudentReceipt, RequestConversation } from "./RequestReceipt.jsx";
import Reports from "./Reports.jsx";
import {
  readDemo,
  saveDemo,
  seedDemo,
  demoUser,
  makeDemoDraft,
} from "./demo.js";
import {
  DEFAULT_SETTINGS,
  REQUEST_STEPS,
  TERMINAL_REQUESTS,
  canTransition,
  isSchoolHours,
  validateEvent,
  validateSettings,
  progressPercent,
} from "../../shared/classroom.mjs";
import {
  Avatar,
  Badge,
  Empty,
  Icon,
  Modal,
  ProgressChart,
  RequestCard,
  StudentCard,
} from "./components.jsx";
import {
  Tracker,
  Plans,
  Settings,
  StudentSpace,
  StudentEditor,
  ProgressEntry,
} from "./views.jsx";

const navigation = [
  ["today", "Overview", Home],
  ["students", "My students", Users],
  ["requests", "Support inbox", Bell],
  ["track", "Quick tracking", Activity],
  ["progress", "Progress", TrendingUp],
  ["plans", "Plans & drafts", ClipboardList],
  ["reports", "Reports & review", ClipboardList],
];
const EMPTY_WORKSPACE = {
  students: [],
  events: [],
  requests: [],
  teachers: [],
  settings: { ...DEFAULT_SETTINGS },
  aiEnabled: false,
  pushEnabled: false,
};
const titleMap = {
  today: "A little support. A lot of possibility.",
  students: "Every student, their own path.",
  requests: "A quiet request. A meaningful response.",
  track: "Less paperwork. More presence.",
  progress: "Make their growth visible.",
  plans: "Thoughtful support starts with a plan.",
  settings: "Make Inclusion work for your day.",
  reports: "Bring the classroom story to the table.",
};

export default function App() {
  const familyToken = new URLSearchParams(location.search).get("family");
  if (familyToken) return <FamilyView token={familyToken} />;
  return <Workspace />;
}
function Workspace() {
  const [session, setAuth] = useState(getSession);
  const [demoRole, setDemoRole] = useState("teacher");
  const [data, setData] = useState(() =>
    getSession() ? EMPTY_WORKSPACE : readDemo(),
  );
  const [loading, setLoading] = useState(Boolean(session));
  const [view, setView] = useState(
    new URLSearchParams(location.search).get("view") || "today",
  );
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState({});
  const pending = useRef(new Set());
  const [offline, setOffline] = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [menu, setMenu] = useState(false);
  const demo = !session;
  const user = demo ? demoUser(demoRole) : data.user || session.user;
  const studentMode = user.role === "student";
  const visibleStudents = studentMode
    ? data.students.filter((s) => s.id === user.id)
    : data.students;
  const student =
    visibleStudents.find((s) => s.id === selectedId) || visibleStudents[0];
  const activeRequests = data.requests.filter(
    (r) =>
      !TERMINAL_REQUESTS.includes(r.status) &&
      (!studentMode || r.studentId === user.id),
  );
  const closeModal = useCallback(() => setModal(null), []);
  const update = (fn) =>
    setData((previous) => {
      const next = fn(previous);
      if (demo) saveDemo(next);
      return next;
    });
  const go = (next, id) => {
    if (id) setSelectedId(id);
    setView(next);
    setMenu(false);
    setSearch("");
    setError("");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const fresh = await api("/workspace");
      setData(fresh);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session]);
  useEffect(() => {
    if (session) refresh();
  }, [session, refresh]);
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      if (!document.hidden && !pending.current.size) refresh();
    }, 5000);
    const stop = watchWorkspace({
      token: session.token,
      onChange: () => {
        if (!document.hidden && !pending.current.size) refresh();
      },
    });
    const visible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearInterval(id);
      stop();
      document.removeEventListener("visibilitychange", visible);
    };
  }, [session, refresh]);
  useEffect(() => {
    const on = () => setOffline(!navigator.onLine);
    const install = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    window.addEventListener("beforeinstallprompt", install);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
      window.removeEventListener("beforeinstallprompt", install);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  async function run(key, action, message) {
    if (pending.current.has(key)) return null;
    pending.current.add(key);
    setBusy((b) => ({ ...b, [key]: true }));
    setError("");
    try {
      const result = await action();
      if (message) setToast(message);
      return result ?? true;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      pending.current.delete(key);
      setBusy((b) => ({ ...b, [key]: false }));
    }
  }
  const advance = (request, status) =>
    run(
      request.id,
      async () => {
        if (!canTransition(request.status, status, user.role))
          throw new Error("This request has already changed. Please refresh.");
        const result = demo
          ? {
              ...request,
              status,
              history: [
                ...request.history,
                { status, at: new Date().toISOString(), actorId: user.id },
              ],
            }
          : await api(`/requests/${request.id}`, {
              method: "PATCH",
              body: { status },
            });
        update((d) => ({
          ...d,
          requests: d.requests.map((r) => (r.id === request.id ? result : r)),
        }));
      },
      status === "cancelled" ? "Request cancelled." : "Support status updated.",
    );
  const requestSupport = (accommodation, teacherId) =>
    run(`support-${accommodation.id}`, async () => {
      if (!teacherId)
        throw new Error(
          "Your school needs to assign a teacher before you can send a request.",
        );
      const clientRequestId = crypto.randomUUID();
      const result = demo
        ? {
            id: clientRequestId,
            studentId: user.id,
            teacherId,
            title: accommodation.title,
            accommodationId: accommodation.id,
            status: "requested",
            source: "web",
            createdAt: new Date().toISOString(),
            history: [{ status: "requested", at: new Date().toISOString() }],
          }
        : await api("/requests", {
            method: "POST",
            body: {
              accommodationId: accommodation.id,
              teacherId,
              clientRequestId,
            },
          });
      update((d) => ({ ...d, requests: [result, ...d.requests] }));
      return result;
    });
  const sendMessage = (request, message) =>
    run(`message-${request.id}`, async () => {
      const phrases = {
        still_need_help: "I still need help.",
        thanks: "Thank you.",
        on_my_way: "I am on my way.",
        please_wait: "I have your request. Please wait a moment.",
      };
      const updated = demo
        ? {
            ...request,
            messages: [
              ...(request.messages || []),
              {
                id: crypto.randomUUID(),
                role: user.role,
                text: phrases[message.kind] || message.text,
                kind: message.kind,
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : await api(`/requests/${request.id}/messages`, {
            method: "POST",
            body: message,
          });
      update((d) => ({
        ...d,
        requests: d.requests.map((r) => (r.id === request.id ? updated : r)),
      }));
      return updated;
    });
  const logEvent = (entry) =>
    run(
      "log",
      async () => {
        const valid = validateEvent(entry, user.role);
        const result = demo
          ? {
              ...valid,
              id: crypto.randomUUID(),
              actorId: user.id,
              studentId: entry.studentId,
              createdAt: new Date().toISOString(),
            }
          : await api("/events", {
              method: "POST",
              body: { ...entry, ...valid },
            });
        update((d) => ({ ...d, events: [result, ...d.events] }));
        return result;
      },
      "Entry saved. Your graph is up to date.",
    );
  const undoEvent = (entry) =>
    run(
      "undo",
      async () => {
        if (!demo) await api(`/events/${entry.id}`, { method: "DELETE" });
        update((d) => ({
          ...d,
          events: d.events.filter((e) => e.id !== entry.id),
        }));
      },
      "Entry undone.",
    );
  const saveStudent = (id, fields) =>
    run(
      "student",
      async () => {
        const result = demo
          ? { ...data.students.find((s) => s.id === id), ...fields }
          : await api(`/students/${id}`, { method: "PATCH", body: fields });
        update((d) => ({
          ...d,
          students: d.students.map((s) => (s.id === id ? result : s)),
        }));
        setModal(null);
      },
      "Student supports saved.",
    );
  const addStudent = (fields) =>
    run(
      "add-student",
      async () => {
        const result = demo
          ? {
              id: crypto.randomUUID(),
              name: fields.name.trim(),
              schoolId: fields.schoolId,
              grade: fields.grade,
              planType: fields.planType,
              accommodations: [],
              teacherIds: ["teacher-demo"],
              drafts: [],
            }
          : await api("/students", { method: "POST", body: fields });
        update((d) => ({ ...d, students: [...d.students, result] }));
        setModal(null);
        return result;
      },
      "Student added. You can now attach supports and a goal.",
    );
  const createDraft = (type, useAI) =>
    run(
      "draft",
      async () => {
        const result = demo
          ? makeDemoDraft(student, type)
          : await api(`/students/${student.id}/drafts`, {
              method: "POST",
              body: { type, useAI },
            });
        update((d) => ({
          ...d,
          students: d.students.map((s) =>
            s.id === student.id
              ? { ...s, drafts: [...(s.drafts || []), result] }
              : s,
          ),
        }));
        return result;
      },
      "Draft created for review.",
    );
  const reviewDraft = (draft, fields) =>
    run(
      "review",
      async () => {
        const result = demo
          ? { ...draft, ...fields, reviewedAt: new Date().toISOString() }
          : await api(`/students/${student.id}/drafts/${draft.id}`, {
              method: "PATCH",
              body: fields,
            });
        update((d) => ({
          ...d,
          students: d.students.map((s) =>
            s.id === student.id
              ? {
                  ...s,
                  drafts: s.drafts.map((p) => (p.id === draft.id ? result : p)),
                }
              : s,
          ),
        }));
        return result;
      },
      "Draft review saved.",
    );
  const saveSettings = (fields) =>
    run(
      "settings",
      async () => {
        const valid = validateSettings(fields);
        const result = demo
          ? valid
          : await api("/settings", { method: "PUT", body: valid });
        update((d) => ({ ...d, settings: result }));
      },
      "School hours saved.",
    );
  const share = () =>
    run("share", async () => {
      if (demo) {
        setModal({ type: "demo-family", student });
        return;
      }
      const result = await api(`/students/${student.id}/shares`, {
        method: "POST",
      });
      setModal({
        type: "share",
        url: `${location.origin}/?family=${result.token}`,
        expiresAt: result.expiresAt,
      });
    });
  function signOut() {
    setSession(null);
    setAuth(null);
    setData(readDemo());
    setLoading(false);
    setView("today");
    setSelectedId("");
    setError("");
  }
  function exportProgress() {
    if (!student) return;
    const rows = [
      ["Date", "Measurement", "Unit", "Student reflection"],
      ...data.events
        .filter((e) => e.studentId === student.id && e.type === "progress")
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map((e) => [
          new Date(e.createdAt).toISOString(),
          e.value,
          student.goal?.unit || "",
          e.note || "",
        ]),
    ];
    const cell = (value) => {
      let s = String(value);
      if (/^[=+@\-\t\r]/.test(s)) s = `'${s}`;
      return `"${s.replaceAll('"', '""')}"`;
    };
    const url = URL.createObjectURL(
      new Blob(
        ["\ufeff" + rows.map((r) => r.map(cell).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "student-progress.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const filtered = visibleStudents.filter((s) =>
    `${s.name} ${s.schoolId}`.toLowerCase().includes(search.toLowerCase()),
  );
  const schoolHours = isSchoolHours(data.settings);
  const date = new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const common = { data, student, user, demo, busy, logEvent, go };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {demo && (
        <div className="demo-strip">
          <span>
            <span className="demo-dot" /> Preview workspace{" "}
            <span className="demo-detail">
              · Fictional students, fully interactive
            </span>
          </span>
          <button onClick={() => setModal({ type: "login" })}>
            Sign in to your school <Icon icon={ArrowRight} size={13} />
          </button>
        </div>
      )}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <a className="brand" href="#main" onClick={() => go("today")}>
          <Brand />
          <span>
            inclusion<span className="brand-tagline">Every step matters.</span>
          </span>
        </a>
        <button
          className="mobile-close icon-button"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        >
          <Icon icon={X} />
        </button>
        <div className="workspace-label">
          {studentMode ? "MY LEARNING SPACE" : "YOUR WORKSPACE"}
        </div>
        <nav aria-label="Main navigation">
          {(studentMode
            ? [
                ["today", "My supports", BookOpen],
                ["progress", "My progress", TrendingUp],
              ]
            : navigation
          ).map(([key, label, icon]) => (
            <button
              key={key}
              className={`nav-item ${view === key ? "active" : ""}`}
              onClick={() => go(key)}
              aria-current={view === key ? "page" : undefined}
            >
              <Icon icon={icon} />
              <span>{label}</span>
              {key === "requests" && activeRequests.length > 0 && (
                <b>{activeRequests.length}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="growth-note">
            <Leaf size={23} strokeWidth={1.4} />
            <p>
              Small steps.
              <br />
              <strong>Meaningful growth.</strong>
            </p>
            <span>A little support can change a whole day.</span>
          </div>
          {!studentMode && (
            <button
              className={`nav-item ${view === "settings" ? "active" : ""}`}
              onClick={() => go("settings")}
            >
              <Icon icon={Settings2} />
              <span>Settings</span>
            </button>
          )}
          <button
            className="nav-item"
            onClick={() => setModal({ type: "install" })}
          >
            <Icon icon={ArrowDownToLine} />
            <span>Add to your phone</span>
          </button>
          <div className="profile-block">
            <Avatar student={{ id: user.id, name: user.name }} small />
            <div>
              <strong>{user.name}</strong>
              <span>
                {demo ? "Demo · " : ""}
                {user.role === "admin"
                  ? "School administrator"
                  : studentMode
                    ? "Student"
                    : "Educator"}
              </span>
            </div>
            {!demo && (
              <button
                className="icon-button"
                aria-label="Sign out"
                onClick={signOut}
              >
                <Icon icon={LogOut} size={17} />
              </button>
            )}
          </div>
        </div>
      </aside>
      {menu && (
        <button
          className="menu-scrim"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button menu-toggle"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Icon icon={Menu} />
            </button>
            <span>My workspace</span>
            <ChevronRight size={13} />
            <strong>
              {studentMode
                ? "My learning"
                : navigation.find((n) => n[0] === view)?.[1] || "Settings"}
            </strong>
          </div>
          <div className="topbar-actions">
            {demo && (
              <label className="role-switch">
                <span>Preview as</span>
                <select
                  aria-label="Preview role"
                  value={demoRole}
                  onChange={(e) => {
                    setDemoRole(e.target.value);
                    setSelectedId("");
                    setView("today");
                  }}
                >
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="admin">Administrator</option>
                </select>
              </label>
            )}
            <button
              className="icon-button notification-button"
              aria-label={`Support inbox, ${activeRequests.length} open requests`}
              onClick={() => go(studentMode ? "today" : "requests")}
            >
              <Icon icon={Bell} />
              {activeRequests.length > 0 && <span />}
            </button>
            <span className="top-avatar">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
          </div>
        </header>
        <main id="main" className="main-content" tabIndex={-1}>
          {offline && (
            <div className="alert warning">
              <Icon icon={WifiOff} />
              You’re offline. Live changes need a connection and will not be
              silently queued.
            </div>
          )}
          {error && (
            <div className="alert error" role="alert">
              <span>{error}</span>
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <Icon icon={X} size={17} />
              </button>
            </div>
          )}
          {loading ? (
            <div className="empty">
              <span className="loading-spinner" />
              <h2>Opening your workspace…</h2>
              <button className="button secondary" onClick={signOut}>
                Return to preview
              </button>
            </div>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    {studentMode ? "YOUR SPACE TO GROW" : date.toUpperCase()}
                  </div>
                  <h1>
                    {studentMode
                      ? `Hi, ${user.name.split(" ")[0]}. You belong here.`
                      : view === "today"
                        ? `A good day starts with support.`
                        : titleMap[view] || titleMap.today}
                  </h1>
                  <p>
                    {studentMode
                      ? "Your supports, your progress, your voice."
                      : view === "today"
                        ? "A clear view of your students, their needs, and the little wins along the way."
                        : "Simple tools. Shared understanding. Meaningful progress."}
                  </p>
                </div>
                {!studentMode && (
                  <button
                    className="button primary heading-action"
                    onClick={() => {
                      if (student) setModal({ type: "progress" });
                      else go("students");
                    }}
                  >
                    <Icon icon={Plus} size={17} />
                    Log progress
                  </button>
                )}
              </div>
              {studentMode ? (
                <StudentSpace
                  {...common}
                  view={view}
                  requests={activeRequests}
                  requestSupport={requestSupport}
                  onSent={setReceipt}
                  advance={advance}
                  onProgress={() => setModal({ type: "progress" })}
                />
              ) : (
                <>
                  {view === "today" && (
                    <>
                      <section
                        className="stat-grid"
                        aria-label="Classroom overview"
                      >
                        <Stat
                          icon={Users}
                          label="Students in your care"
                          value={data.students.length}
                          note={`${data.students.filter((s) => s.planType === "IEP").length} IEP · ${data.students.filter((s) => s.planType === "504").length} 504 plans`}
                        />
                        <Stat
                          icon={Bell}
                          label="Open support requests"
                          value={activeRequests.length}
                          note={`${data.requests.filter((r) => r.status === "provided").length} supports provided`}
                          tone="peach"
                          onClick={() => go("requests")}
                        />
                        <Stat
                          icon={TrendingUp}
                          label="Students moving toward goals"
                          value={
                            data.students.filter(
                              (s) => (progressPercent(s, data.events) ?? 0) > 0,
                            ).length
                          }
                          note="Based on recorded measurements"
                          tone="purple"
                        />
                      </section>
                      <div className="dashboard-grid">
                        <section className="panel inbox-panel">
                          <PanelHeading
                            icon={Bell}
                            title="A little help, right on time"
                            detail="Private requests from your students"
                            action={
                              <button
                                className="text-button"
                                onClick={() => go("requests")}
                              >
                                View inbox <Icon icon={ArrowRight} size={15} />
                              </button>
                            }
                          />
                          <div className="panel-body request-list">
                            {activeRequests.length ? (
                              activeRequests
                                .slice(0, 3)
                                .map((r) => (
                                  <RequestCard
                                    key={r.id}
                                    request={r}
                                    student={data.students.find(
                                      (s) => s.id === r.studentId,
                                    )}
                                    onAdvance={advance}
                                    busy={busy[r.id]}
                                  />
                                ))
                            ) : (
                              <Empty icon={Check} title="You’re all caught up">
                                New student requests will appear here.
                              </Empty>
                            )}
                          </div>
                          <div className="panel-foot">
                            <span
                              className={`status-dot ${schoolHours ? "provided" : "offered"}`}
                            />
                            {schoolHours
                              ? "Within your school hours"
                              : "Quiet hours · push notifications paused"}
                            <button
                              className="text-button"
                              onClick={() => go("settings")}
                            >
                              Manage
                            </button>
                          </div>
                        </section>
                        <section className="panel progress-panel">
                          <PanelHeading
                            icon={TrendingUp}
                            title="See the small steps add up"
                            detail="Progress that students can see and celebrate"
                            action={
                              student && (
                                <select
                                  className="compact-select"
                                  aria-label="Chart student"
                                  value={student.id}
                                  onChange={(e) =>
                                    setSelectedId(e.target.value)
                                  }
                                >
                                  {data.students.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name.split(" ")[0]}
                                    </option>
                                  ))}
                                </select>
                              )
                            }
                          />
                          {student ? (
                            <div className="panel-body">
                              <div className="chart-title">
                                <strong>
                                  {student.goal?.title ||
                                    "Progress toward a goal"}
                                </strong>
                                <Badge tone="green">
                                  {student.name.split(" ")[0]}’s progress
                                </Badge>
                              </div>
                              <ProgressChart
                                student={student}
                                events={data.events}
                              />
                            </div>
                          ) : (
                            <Empty
                              icon={TrendingUp}
                              title="Growth starts with a baseline"
                            >
                              Add a student and a measurable goal.
                            </Empty>
                          )}
                        </section>
                        <section className="panel students-panel">
                          <PanelHeading
                            icon={Users}
                            title="Your students"
                            detail="Different needs. Shared possibilities."
                            action={
                              <button
                                className="text-button"
                                onClick={() => go("students")}
                              >
                                View all <Icon icon={ArrowRight} size={15} />
                              </button>
                            }
                          />
                          <div className="student-grid panel-body">
                            {data.students.slice(0, 3).map((s) => (
                              <StudentCard
                                key={s.id}
                                student={s}
                                events={data.events}
                                onOpen={() =>
                                  setModal({ type: "student", student: s })
                                }
                                onTrack={() => go("track", s.id)}
                              />
                            ))}
                            {!data.students.length && (
                              <Empty
                                icon={Users}
                                title="Welcome to your classroom"
                              >
                                A school administrator can add students and
                                assign their teachers.
                              </Empty>
                            )}
                          </div>
                        </section>
                        <section className="gentle-card">
                          <div className="leaf-mark">
                            <Icon icon={Leaf} size={30} />
                          </div>
                          <span className="eyebrow">THE STUDENT’S VOICE</span>
                          <h2>“What helped you today?”</h2>
                          <p>
                            A number tells part of the story. A student’s
                            reflection helps you understand the rest.
                          </p>
                          <button
                            className="text-button"
                            onClick={() => {
                              if (student) setModal({ type: "progress" });
                            }}
                          >
                            Make room for reflection{" "}
                            <Icon icon={ArrowRight} size={16} />
                          </button>
                        </section>
                      </div>
                    </>
                  )}
                  {view === "students" && (
                    <>
                      <div className="section-toolbar">
                        <label className="search-box">
                          <Icon icon={Search} size={18} />
                          <input
                            aria-label="Search students by name or ID"
                            placeholder="Search by name or student ID"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </label>
                        {user.role === "admin" && (
                          <button
                            className="button primary"
                            onClick={() => setModal({ type: "add-student" })}
                          >
                            <Icon icon={Plus} size={17} />
                            Add student
                          </button>
                        )}
                      </div>
                      <div className="student-grid full-grid">
                        {filtered.map((s) => (
                          <StudentCard
                            key={s.id}
                            student={s}
                            events={data.events}
                            onOpen={() =>
                              setModal({ type: "student", student: s })
                            }
                            onTrack={() => go("track", s.id)}
                          />
                        ))}
                      </div>
                      {!filtered.length && (
                        <Empty
                          icon={Users}
                          title={
                            search
                              ? "No students match that search"
                              : "Your classroom is ready"
                          }
                        >
                          {search
                            ? "Try another name or student ID."
                            : "Add a student or ask your administrator to assign your caseload."}
                        </Empty>
                      )}
                    </>
                  )}
                  {view === "requests" && (
                    <section className="panel">
                      <PanelHeading
                        icon={Bell}
                        title="Support inbox"
                        detail="Acknowledge, offer, and record when support is provided."
                      />
                      <div className="panel-body request-list">
                        {data.requests.length ? (
                          [...data.requests]
                            .sort(
                              (a, b) =>
                                Number(TERMINAL_REQUESTS.includes(a.status)) -
                                Number(TERMINAL_REQUESTS.includes(b.status)),
                            )
                            .map((r) => (
                              <div key={r.id}>
                                <RequestCard
                                  request={r}
                                  student={data.students.find(
                                    (s) => s.id === r.studentId,
                                  )}
                                  onAdvance={advance}
                                  busy={busy[r.id]}
                                />
                                <details className="request-history">
                                  <summary>Conversation & history</summary>
                                  <RequestConversation
                                    request={r}
                                    onMessage={sendMessage}
                                    busy={busy[`message-${r.id}`]}
                                  />
                                </details>
                              </div>
                            ))
                        ) : (
                          <Empty icon={Bell} title="No requests yet">
                            Students can ask privately from their own workspace
                            or the Chromebook extension.
                          </Empty>
                        )}
                      </div>
                    </section>
                  )}
                  {["track", "progress", "plans"].includes(view) && (
                    <StudentPicker
                      students={data.students}
                      student={student}
                      setSelectedId={setSelectedId}
                    />
                  )}
                  {view === "track" &&
                    (student ? (
                      <Tracker
                        key={student.id}
                        {...common}
                        undoEvent={undoEvent}
                      />
                    ) : (
                      <Empty icon={Activity} title="Choose a student to begin">
                        Add a student to start tracking.
                      </Empty>
                    ))}
                  {view === "progress" && student && (
                    <section className="panel">
                      <PanelHeading
                        icon={TrendingUp}
                        title={student.goal?.title || "Student progress"}
                        detail={`${student.name} · Baseline ${student.goal?.baseline ?? "—"}${student.goal?.unit || ""} · Target ${student.goal?.target ?? "—"}${student.goal?.unit || ""}`}
                        action={
                          <div className="button-row">
                            <button
                              className="button secondary"
                              onClick={exportProgress}
                            >
                              <Icon icon={ArrowDownToLine} size={16} />
                              Export
                            </button>
                            <button className="button primary" onClick={share}>
                              Family view
                            </button>
                          </div>
                        }
                      />
                      <div className="panel-body">
                        <ProgressChart student={student} events={data.events} />
                      </div>
                      <div className="panel-foot">
                        <ShieldCheck size={16} />
                        Family links show only measurements marked for sharing.
                        Reflections and behavior logs stay in the classroom.
                      </div>
                    </section>
                  )}
                  {view === "plans" && student && (
                    <Plans
                      {...common}
                      createDraft={createDraft}
                      reviewDraft={reviewDraft}
                      onEdit={() => setModal({ type: "edit", student })}
                    />
                  )}
                  {view === "reports" && (
                    <Reports
                      data={data}
                      demo={demo}
                      user={user}
                      onUpdate={update}
                    />
                  )}
                  {view === "settings" && (
                    <Settings
                      {...common}
                      saveSettings={saveSettings}
                      onInstall={() => setModal({ type: "install" })}
                      onError={setError}
                      onToast={setToast}
                    />
                  )}
                </>
              )}
              <div className="workspace-footer">
                <span>
                  <Brand small /> inclusion
                </span>
                <span>Every student deserves to be seen.</span>
                <span className="footer-status">
                  <i />
                  {demo ? "Demo workspace" : "School workspace"}
                </span>
              </div>
            </>
          )}
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {(studentMode
          ? [
              ["today", "Supports", BookOpen],
              ["progress", "Progress", TrendingUp],
            ]
          : [
              navigation[0],
              navigation[1],
              ["track", "Track", Activity],
              ["requests", "Inbox", Bell],
              ["progress", "Progress", TrendingUp],
            ]
        ).map(([key, label, icon]) => (
          <button
            key={key}
            className={view === key ? "active" : ""}
            onClick={() => go(key)}
            aria-current={view === key ? "page" : undefined}
          >
            <Icon icon={icon} size={20} />
            <span>{label}</span>
            {key === "requests" && activeRequests.length > 0 && (
              <b>{activeRequests.length}</b>
            )}
          </button>
        ))}
      </nav>
      {studentMode && (
        <StudentReceipt
          requests={data.requests.filter((r) => r.studentId === user.id)}
          student={student}
          receipt={receipt}
          onMessage={sendMessage}
          busy={busy}
          onCancel={(r) => advance(r, "cancelled")}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon icon={Check} size={18} />
          {toast}
        </div>
      )}
      {modal?.type === "login" && (
        <Login
          onClose={closeModal}
          onLogin={(s) => {
            setSession(s);
            setAuth(s);
            setData(EMPTY_WORKSPACE);
            setLoading(true);
            setModal(null);
            setView("today");
            setSelectedId("");
          }}
        />
      )}
      {modal?.type === "progress" && student && (
        <ProgressEntry
          student={student}
          user={user}
          onClose={closeModal}
          onSave={logEvent}
          busy={busy.log}
          error={error}
        />
      )}
      {modal?.type === "student" && (
        <Modal
          title={modal.student.name}
          subtitle={`Grade ${modal.student.grade} · ${modal.student.planType} · ${modal.student.schoolId}`}
          onClose={closeModal}
        >
          <h3 className="subheading">Approved classroom supports</h3>
          <div className="support-summary">
            {modal.student.accommodations.map((a) => (
              <div key={a.id}>
                <Icon icon={Check} size={17} />
                <div>
                  <strong>{a.title}</strong>
                  <p>{a.description}</p>
                </div>
              </div>
            ))}
            {!modal.student.accommodations.length && (
              <p className="muted">No accommodations attached yet.</p>
            )}
          </div>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setModal({ type: "edit", student: modal.student })}
            >
              Edit supports & goal
            </button>
            <button
              className="button primary"
              onClick={() => {
                go("track", modal.student.id);
                setModal(null);
              }}
            >
              Start tracking
            </button>
          </div>
        </Modal>
      )}
      {modal?.type === "edit" && (
        <StudentEditor
          student={modal.student}
          demo={demo}
          isAdmin={user.role === "admin"}
          teachers={data.teachers}
          onClose={closeModal}
          onSave={saveStudent}
          busy={busy.student}
          error={error}
        />
      )}
      {modal?.type === "add-student" && (
        <AddStudent
          demo={demo}
          onClose={closeModal}
          onSave={addStudent}
          busy={busy["add-student"]}
          error={error}
        />
      )}
      {modal?.type === "install" && (
        <Modal
          title="Your classroom, in your pocket."
          subtitle="Add Inclusion to your home screen."
          onClose={closeModal}
        >
          <div className="install-instructions">
            <h3>iPhone or iPad</h3>
            <p>
              Open the school’s app link in Safari. Tap Share, then Add to Home
              Screen.
            </p>
            <h3>Android</h3>
            <p>
              Open the school’s app link in Chrome. Open the browser menu, then
              choose Install app or Add to Home screen.
            </p>
            {installPrompt && (
              <button
                className="button primary"
                onClick={async () => {
                  await installPrompt.prompt();
                  setInstallPrompt(null);
                }}
              >
                Install Inclusion
              </button>
            )}
            <div className="notice">
              This is a mobile web app. Your school’s connected, HTTPS app
              address is needed for home-screen use and push notifications.
            </div>
          </div>
        </Modal>
      )}
      {modal?.type === "demo-family" && (
        <Modal
          title="Family progress view"
          subtitle="Preview · fictional student data"
          wide
          onClose={closeModal}
        >
          <h3>{modal.student.name.split(" ")[0]}’s growth</h3>
          <p className="muted">{modal.student.goal?.title}</p>
          <ProgressChart
            student={modal.student}
            events={data.events.filter((e) => e.sharedWithFamily)}
            family
          />
          <div className="notice">
            A connected school workspace can create a private link that expires
            in seven days and can be revoked.
          </div>
        </Modal>
      )}
      {modal?.type === "share" && (
        <Modal
          title="Share a little growth."
          subtitle="Anyone with this private link can view the selected progress measurements."
          onClose={closeModal}
        >
          <p className="muted">
            Expires {new Date(modal.expiresAt).toLocaleDateString()}. Only
            measurements marked for family sharing are included.
          </p>
          <label className="field">
            Private family link
            <input
              readOnly
              value={modal.url}
              onFocus={(e) => e.target.select()}
            />
          </label>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() =>
                run(
                  "revoke",
                  async () => {
                    await api(`/students/${student.id}/shares`, {
                      method: "DELETE",
                    });
                    setModal(null);
                  },
                  "Family links revoked.",
                )
              }
            >
              Revoke all links
            </button>
            <button
              className="button primary"
              onClick={() =>
                run(
                  "copy",
                  async () => {
                    await navigator.clipboard.writeText(modal.url);
                  },
                  "Private link copied.",
                )
              }
            >
              Copy link
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function Brand({ small }) {
  return (
    <span className={`brand-symbol ${small ? "tiny" : ""}`} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}
function Stat({ icon, label, value, note, tone = "green", onClick }) {
  const Tag = onClick ? "button" : "article";
  return (
    <Tag className="stat-card" onClick={onClick}>
      <span className={`stat-icon ${tone}`}>
        <Icon icon={icon} size={21} />
      </span>
      <div>
        <span className="stat-label">{label}</span>
        <strong>
          {value}
          <span className="stat-note">{note}</span>
        </strong>
      </div>
      {onClick && <ChevronRight size={16} className="stat-arrow" />}
    </Tag>
  );
}
export function PanelHeading({ icon, title, detail, action }) {
  return (
    <div className="panel-heading">
      <div>
        <h2>
          {icon && <Icon icon={icon} size={18} />}
          {title}
        </h2>
        {detail && <p>{detail}</p>}
      </div>
      {action}
    </div>
  );
}
function StudentPicker({ students, student, setSelectedId }) {
  return (
    <label className="student-picker">
      <span>Tracking for</span>
      <select
        value={student?.id || ""}
        onChange={(e) => setSelectedId(e.target.value)}
        aria-label="Selected student"
      >
        {!students.length && <option value="">No students assigned</option>}
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} · Grade {s.grade}
          </option>
        ))}
      </select>
      {student && <Badge tone="neutral">{student.planType}</Badge>}
    </label>
  );
}
function Login({ onClose, onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title="Welcome back."
      subtitle="Sign in with the account your school provided."
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            onLogin(await api("/login", { method: "POST", body: form }));
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="field">
          Username
          <input
            required
            autoComplete="username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </label>
        <label className="field">
          Password
          <input
            required
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full-width" disabled={busy}>
          {busy ? "Signing in…" : "Sign in to Inclusion"}
          <Icon icon={ArrowRight} size={17} />
        </button>
        <p className="form-hint">
          Your existing school username and password can be used after your
          administrator connects the database and imports the student roster.
        </p>
      </form>
    </Modal>
  );
}
function AddStudent({ demo, onSave, onClose, busy, error }) {
  const [form, setForm] = useState({
    name: "",
    schoolId: "",
    grade: "4",
    planType: "IEP",
    username: "",
    password: "",
    teacherIds: [],
  });
  const [teachers, setTeachers] = useState([]);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    if (!demo)
      api("/teachers")
        .then(setTeachers)
        .catch((e) => setLoadError(e.message));
  }, [demo]);
  const field = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  return (
    <Modal
      title="Make space for a student."
      subtitle={
        demo
          ? "Demo students stay in this preview session."
          : "Create an account and assign the student’s educators."
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
          Student name
          <input
            required
            maxLength={160}
            value={form.name}
            onChange={(e) => field("name", e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label className="field">
            Student ID
            <input
              required
              value={form.schoolId}
              onChange={(e) => field("schoolId", e.target.value)}
            />
          </label>
          <label className="field">
            Grade
            <select
              value={form.grade}
              onChange={(e) => field("grade", e.target.value)}
            >
              {[
                "K",
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "10",
                "11",
                "12",
              ].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          Plan type
          <select
            value={form.planType}
            onChange={(e) => field("planType", e.target.value)}
          >
            <option>IEP</option>
            <option>504</option>
            <option>Support</option>
          </select>
        </label>
        {!demo && (
          <>
            <label className="field">
              Student username
              <input
                required
                autoComplete="off"
                value={form.username}
                onChange={(e) => field("username", e.target.value)}
              />
            </label>
            <label className="field">
              Initial password
              <input
                required
                minLength={12}
                maxLength={128}
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => field("password", e.target.value)}
              />
              <small>
                At least 12 characters. Share directly using your school’s
                account process.
              </small>
            </label>
            <fieldset className="field">
              <legend>Assigned educators</legend>
              {teachers.map((t) => (
                <label className="check-label" key={t.id}>
                  <input
                    type="checkbox"
                    checked={form.teacherIds.includes(t.id)}
                    onChange={(e) =>
                      field(
                        "teacherIds",
                        e.target.checked
                          ? [...form.teacherIds, t.id]
                          : form.teacherIds.filter((id) => id !== t.id),
                      )
                    }
                  />
                  {t.name}
                </label>
              ))}
            </fieldset>
          </>
        )}
        {(error || loadError) && (
          <p className="form-error" role="alert">
            {error || loadError}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button primary"
            disabled={busy || Boolean(loadError)}
          >
            {busy ? "Adding…" : "Add student"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function FamilyView({ token }) {
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    api(`/family/${encodeURIComponent(token)}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token]);
  const student = data
    ? { ...data.student, id: "family", name: data.student.firstName }
    : null;
  return (
    <div className="family-page">
      <a className="brand" href="/">
        <Brand />
        <span>inclusion</span>
      </a>
      <section className="panel">
        <div className="panel-body">
          <Badge>FAMILY PROGRESS VIEW</Badge>
          {error ? (
            <div className="empty">
              <CircleHelp />
              <h1>This link is unavailable.</h1>
              <p>{error}</p>
            </div>
          ) : !data ? (
            <p>Loading shared progress…</p>
          ) : (
            <>
              <h1>{data.student.firstName}’s steps forward.</h1>
              <p className="muted">
                {data.student.goal?.title || "Progress measurements"} · Grade{" "}
                {data.student.grade}
              </p>
              <ProgressChart
                student={student}
                events={data.events.map((e) => ({ ...e, studentId: "family" }))}
                family
              />
              <p className="form-hint">
                Shared measurements only · Link expires{" "}
                {new Date(data.expiresAt).toLocaleDateString()}.
              </p>
            </>
          )}
        </div>
      </section>
      <p>Every step matters.</p>
    </div>
  );
}
