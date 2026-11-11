import React, { useEffect, useRef } from "react";
import { X, ArrowUpRight, Check, Clock3, Minus } from "lucide-react";
import { progressPercent } from "../../shared/classroom.mjs";

export function Icon({ icon: Component, size = 20, ...props }) {
  return (
    <Component size={size} strokeWidth={1.8} aria-hidden="true" {...props} />
  );
}
export function Avatar({ student, small = false }) {
  return (
    <span
      className={`avatar color-${student.id.charCodeAt(0) % 5}${small ? " small" : ""}`}
      aria-hidden="true"
    >
      {student.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export function Badge({ children, tone = "green" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Empty({ icon, title, children }) {
  return (
    <div className="empty">
      {icon && <Icon icon={icon} size={32} />}
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Modal({ title, subtitle, children, onClose, wide = false }) {
  const ref = useRef();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const focusable = [
          ...ref.current.querySelectorAll(
            'button, input, select, textarea, a[href], [tabindex="0"]',
          ),
        ].filter((el) => !el.disabled && el.getClientRects().length);
        if (!focusable.length) {
          e.preventDefault();
          return;
        }
        const first = focusable[0],
          last = focusable.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        ref={ref}
      >
        <div className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <Icon icon={X} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function StudentCard({ student, events, onOpen, onTrack }) {
  const progress = progressPercent(student, events);
  const latest = events
    .filter(
      (e) => e.studentId === student.id && e.type === "progress" && !e.voided,
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  return (
    <article className="student-card">
      <div className="student-card-top">
        <Avatar student={student} />
        <Badge tone={student.planType === "504" ? "purple" : "neutral"}>
          {student.planType}
        </Badge>
      </div>
      <button className="name-button" onClick={onOpen}>
        {student.name}
        <Icon icon={ArrowUpRight} size={16} />
      </button>
      <p className="muted small-text">
        Grade {student.grade || "—"} · {student.accommodations.length} supports
      </p>
      <div className="student-goal">
        <span>{student.goal?.title || "Add a goal to get started"}</span>
        {latest && (
          <strong>
            {latest.value}
            {student.goal?.unit === "%" ? "%" : ` ${student.goal?.unit || ""}`}
          </strong>
        )}
      </div>
      <div className="progress-track">
        <span style={{ width: `${progress ?? 0}%` }} />
      </div>
      <div className="student-card-bottom">
        <span>
          {progress === null
            ? "No progress data yet"
            : `${progress}% toward goal`}
        </span>
        <button className="text-button" onClick={onTrack}>
          Quick log <span aria-hidden="true">↗</span>
        </button>
      </div>
    </article>
  );
}
export function RequestCard({
  request,
  student,
  onAdvance,
  onCancel,
  busy = false,
  compact = false,
}) {
  const labels = {
    requested: "New request",
    acknowledged: "On my way",
    offered: "Support offered",
    provided: "Support provided",
    cancelled: "Cancelled",
  };
  const next = {
    requested: ["acknowledged", "Acknowledge"],
    acknowledged: ["offered", "Mark offered"],
    offered: ["provided", "Mark provided"],
  }[request.status];
  const at = new Date(request.createdAt);
  return (
    <article className={`request-card ${compact ? "compact" : ""}`}>
      <Avatar student={student || { id: "x", name: "Student" }} small />
      <div className="request-details">
        <div className="request-name">
          {student?.name || "Student"}
          <span>
            {at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>
        <p>{request.title}</p>
        <div className="request-meta">
          <span className={`status-dot ${request.status}`} />
          {labels[request.status]}
        </div>
      </div>
      {onAdvance && next ? (
        <button
          className={`button ${request.status === "requested" ? "primary" : "secondary"} small-button`}
          disabled={busy}
          onClick={() => onAdvance(request, next[0])}
        >
          {busy ? "Saving…" : next[1]}
        </button>
      ) : request.status === "provided" ? (
        <span className="provided-check">
          <Icon icon={Check} size={18} />
        </span>
      ) : null}
      {onCancel && next && (
        <button
          className="text-button"
          disabled={busy}
          onClick={() => onCancel(request)}
        >
          Cancel request
        </button>
      )}
    </article>
  );
}
export function ProgressChart({ student, events, family = false }) {
  const points = events
    .filter(
      (e) => e.studentId === student.id && e.type === "progress" && !e.voided,
    )
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (!student.goal || !points.length)
    return (
      <Empty icon={Clock3} title="Your next step starts here">
        Record a progress measurement to start this graph.
      </Empty>
    );
  const { target, baseline, unit } = student.goal;
  const w = 600,
    h = 210,
    l = 42,
    r = 12,
    t = 16,
    b = 34;
  const max =
    Math.max(target, baseline, ...points.map((p) => p.value), 1) * 1.15;
  const y = (value) => h - b - (value / max) * (h - t - b);
  const x = (index) =>
    l + (index / Math.max(1, points.length - 1)) * (w - l - r);
  const path = points
    .map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`)
    .join(" ");
  return (
    <div className="chart">
      <div className="chart-legend">
        <span>
          <i className="legend-dot" /> Recorded progress
        </span>
        <span>
          <i className="legend-line" /> Goal: {target}
          {unit}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={`${student.name}: ${student.goal.title}. Latest ${points.at(-1).value}${unit}, target ${target}${unit}.`}
      >
        <defs>
          <linearGradient id={`fill-${student.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a947d" stopOpacity=".17" />
            <stop offset="100%" stopColor="#3a947d" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((n) => (
          <g key={n}>
            <line
              x1={l}
              x2={w - r}
              y1={y(max * n)}
              y2={y(max * n)}
              stroke="#e9ede8"
              strokeDasharray="3 5"
            />
            <text x={l - 10} y={y(max * n) + 4} textAnchor="end">
              {Math.round(max * n)}
              {unit === "%" ? "%" : ""}
            </text>
          </g>
        ))}
        <line
          x1={l}
          x2={w - r}
          y1={y(target)}
          y2={y(target)}
          stroke="#bd9bcb"
          strokeDasharray="5 5"
        />
        <path
          d={`${path} L${x(points.length - 1)},${h - b} L${l},${h - b} Z`}
          fill={`url(#fill-${student.id})`}
        />
        <path
          d={path}
          fill="none"
          stroke="#277f68"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle
            key={p.id}
            cx={x(i)}
            cy={y(p.value)}
            r={i === points.length - 1 ? 5 : 3.5}
            stroke="#fff"
            strokeWidth="2"
            fill="#277f68"
          >
            <title>
              {new Date(p.createdAt).toLocaleDateString()}: {p.value}
              {unit}
            </title>
          </circle>
        ))}
        {[0, Math.floor((points.length - 1) / 2), points.length - 1]
          .filter((v, i, a) => a.indexOf(v) === i)
          .map((i) => (
            <text key={i} x={x(i)} y={h - 8} textAnchor="middle">
              {new Date(points[i].createdAt).toLocaleDateString([], {
                month: "short",
                day: "numeric",
              })}
            </text>
          ))}
      </svg>
      <details className="chart-data">
        <summary>View measurements</summary>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">Progress measurements</caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Measurement</th>
                {!family && <th>Reflection</th>}
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td>
                    {p.value}
                    {unit}
                  </td>
                  {!family && <td>{p.note || "—"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
