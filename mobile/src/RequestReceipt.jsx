import React, { useEffect, useState } from "react";
import {
  Check,
  Clock3,
  Hand,
  MessageCircle,
  Send,
  ThumbsUp,
  Volume2,
  X,
} from "lucide-react";
import { Icon } from "./components.jsx";
import { pictureFor } from "../../shared/pictures.mjs";
const labels = {
  requested: "Sent to teacher",
  acknowledged: "Teacher is on the way",
  offered: "Support offered",
  provided: "Support provided",
  cancelled: "Request cancelled",
};
function listen(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const words = new SpeechSynthesisUtterance(text);
  words.rate = 0.85;
  speechSynthesis.speak(words);
}
export function RequestConversation({
  request,
  student = false,
  onMessage,
  busy,
}) {
  const [text, setText] = useState("");
  return (
    <div className="request-conversation">
      <ol aria-label="Request status history" className="conversation-history">
        {request.history.map((h, i) => (
          <li key={i}>
            {labels[h.status]} ·{" "}
            {new Date(h.at).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </li>
        ))}
      </ol>
      <div
        className="conversation-log"
        role="log"
        aria-label="Support request conversation"
      >
        {(request.messages || []).map((m) => (
          <div className={`conversation-message from-${m.role}`} key={m.id}>
            <span>{m.role === "student" ? "Student" : "School team"}</span>
            <p>{m.text}</p>
            {"speechSynthesis" in window && (
              <button
                className="icon-button"
                aria-label={`Listen to message: ${m.text}`}
                onClick={() => listen(m.text)}
              >
                <Icon icon={Volume2} size={21} />
              </button>
            )}
          </div>
        ))}
      </div>
      {!["provided", "cancelled"].includes(request.status) && (
        <>
          <div className="conversation-replies">
            {(student
              ? [
                  ["still_need_help", "Help", Hand],
                  ["thanks", "Thanks", ThumbsUp],
                ]
              : [
                  ["on_my_way", "On my way", ThumbsUp],
                  ["please_wait", "Please wait", Clock3],
                ]
            ).map(([kind, label, icon]) => (
              <button
                className="button secondary"
                key={kind}
                disabled={busy}
                onClick={() => onMessage(request, { kind })}
              >
                <Icon icon={icon} size={student ? 29 : 18} />
                {label}
              </button>
            ))}
          </div>
          {!student && (
            <form
              className="message-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  text.trim() &&
                  (await onMessage(request, { kind: "text", text }))
                )
                  setText("");
              }}
            >
              <input
                aria-label="Message for this request"
                placeholder="A short classroom support message"
                maxLength={500}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button
                className="button primary"
                disabled={busy || !text.trim()}
                aria-label="Send request message"
              >
                <Icon icon={Send} size={17} />
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
export function StudentReceipt({
  requests,
  student,
  receipt,
  onMessage,
  busy,
  onCancel,
}) {
  const [open, setOpen] = useState(false),
    [intro, setIntro] = useState(false),
    [selected, setSelected] = useState("");
  const active = requests.filter(
    (r) => !["provided", "cancelled"].includes(r.status),
  );
  const fallback = [...requests].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )[0];
  const request =
    requests.find((r) => r.id === selected) ||
    requests.find((r) => r.id === receipt?.id) ||
    active[0] ||
    fallback;
  useEffect(() => {
    if (!receipt?.id) return;
    setSelected(receipt.id);
    setIntro(true);
    setOpen(false);
    const id = setTimeout(() => setIntro(false), 2200);
    return () => clearTimeout(id);
  }, [receipt?.id]);
  if (!request || !student) return null;
  const support = student.accommodations.find(
    (a) => a.id === request.accommodationId,
  ) || { title: request.title };
  return (
    <aside className="student-receipt" aria-label="Private request status">
      <div className="sr-only" role="status">
        {intro ? "Your support request was sent." : labels[request.status]}
      </div>
      {open && (
        <section
          className="receipt-panel"
          aria-label="My private support request"
        >
          <div className="receipt-panel-heading">
            <img src={`/pictures/${pictureFor(support)}.svg`} alt="" />
            <div>
              <strong>{request.title}</strong>
              <p>{labels[request.status]}</p>
            </div>
            <button
              className="icon-button"
              aria-label="Close request conversation"
              onClick={() => setOpen(false)}
            >
              <Icon icon={X} />
            </button>
          </div>
          {active.length > 1 && (
            <div className="receipt-switcher">
              {active.map((r) => (
                <button
                  key={r.id}
                  aria-label={`Open ${r.title} request`}
                  aria-pressed={r.id === request.id}
                  onClick={() => setSelected(r.id)}
                >
                  <img
                    src={`/pictures/${pictureFor(student.accommodations.find((a) => a.id === r.accommodationId) || { title: r.title })}.svg`}
                    alt=""
                  />
                </button>
              ))}
            </div>
          )}
          <RequestConversation
            request={request}
            student
            onMessage={onMessage}
            busy={busy[`message-${request.id}`]}
          />
          {!["provided", "cancelled"].includes(request.status) && (
            <button className="text-button" onClick={() => onCancel(request)}>
              Cancel this request
            </button>
          )}
        </section>
      )}
      <button
        className={`receipt-chip ${intro ? "receipt-arriving" : ""}`}
        aria-label={`My request: ${labels[request.status]}. Open conversation.`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon
          icon={request.status === "provided" ? Check : ThumbsUp}
          size={27}
        />
        {active.length > 1 && <span>{active.length}</span>}
      </button>
    </aside>
  );
}
