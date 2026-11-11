import { pictureFor } from "./pictures.mjs";
import { watchWorkspace } from "./live.mjs";
const $ = (id) => document.getElementById(id);
let session,
  workspace,
  stopUpdates,
  refreshTimer,
  receiptId,
  receiptIntroUntil = 0;
const activeStatuses = ["requested", "acknowledged", "offered"];
const statusLabel = {
  requested: "Request sent",
  acknowledged: "Teacher acknowledged",
  offered: "Support offered",
  provided: "Support provided",
};
const show = (message) => {
  $("status").textContent = message;
};
async function call(path, options = {}) {
  const response = await fetch(`${session.origin}/api/v2${path}`, {
    method: options.method || "GET",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) {
      await chrome.storage.session.remove("inclusionSession");
      session.token = null;
      stopUpdates?.();
      clearInterval(refreshTimer);
      $("connect").hidden = false;
      $("supports").hidden = true;
    }
    throw new Error(
      data.error || "Your school app could not complete this request.",
    );
  }
  return data;
}
function renderCards() {
  $("cards").replaceChildren();
  const student = workspace.students.find((s) => s.id === workspace.user.id);
  if (!student) {
    show(
      "Your school is still setting up your supports. Ask your teacher for help.",
    );
    return;
  }
  $("greeting").textContent = `Hi, ${workspace.user.name.split(" ")[0]}.`;
  const teacherId = $("teacher").value;
  for (const support of student.accommodations) {
    const card = document.createElement("article");
    card.className = "card";
    const title = document.createElement("h2");
    title.textContent = support.studentLabel || support.title;
    const picture = document.createElement("img");
    picture.src = `pictures/${pictureFor(support)}.svg`;
    picture.alt = "";
    picture.className = "support-picture";
    const description = document.createElement("p");
    description.textContent = support.description;
    const button = document.createElement("button");
    const active = workspace.requests.find(
      (r) =>
        r.accommodationId === support.id &&
        r.teacherId === teacherId &&
        activeStatuses.includes(r.status),
    );
    button.textContent = "☝ Ask";
    button.setAttribute(
      "aria-label",
      `${support.title}. ${active ? statusLabel[active.status] : "Ask my teacher"}`,
    );
    button.disabled = Boolean(active) || !teacherId;
    button.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = "Sending…";
      const key = `${support.id}:${teacherId}`;
      const retries =
        (await chrome.storage.session.get("inclusionRetries"))
          .inclusionRetries || {};
      const clientRequestId = retries[key] || crypto.randomUUID();
      retries[key] = clientRequestId;
      await chrome.storage.session.set({ inclusionRetries: retries });
      try {
        const saved = await call("/requests", {
          method: "POST",
          body: {
            accommodationId: support.id,
            teacherId,
            clientRequestId,
            source: "extension",
          },
        });
        delete retries[key];
        await chrome.storage.session.set({ inclusionRetries: retries });
        receiptId = saved.id;
        await chrome.storage.session.set({ inclusionReceipt: receiptId });
        show("");
        await load();
        renderReceipt(true);
      } catch (e) {
        show(
          e.message ||
            "Could not connect. Your request has not been confirmed. Try again.",
        );
        button.disabled = false;
        button.textContent = "Try again";
      }
    });
    button.prepend(picture);
    card.append(title, button);
    if ("speechSynthesis" in window) {
      const listen = document.createElement("button");
      listen.className = "secondary";
      listen.textContent = "🔊 Listen";
      listen.setAttribute("aria-label", `Listen: ${support.title}`);
      listen.addEventListener("click", () => {
        speechSynthesis.cancel();
        const words = new SpeechSynthesisUtterance(
          `${support.title}. ${support.description}`,
        );
        words.rate = 0.85;
        speechSynthesis.speak(words);
      });
      card.append(listen);
    }
    $("cards").append(card);
  }
  if (!student.accommodations.length)
    show("No supports have been added yet. Your teacher can help.");
}
async function load() {
  workspace = await call("/workspace");
  if (workspace.user.role !== "student")
    throw new Error(
      "Use your student account to request support. Teachers use the school app inbox.",
    );
  const previous = $("teacher").value;
  $("teacher").replaceChildren();
  const student = workspace.students.find((s) => s.id === workspace.user.id);
  for (const teacher of workspace.teachers.filter((t) =>
    student?.teacherIds.includes(t.id),
  )) {
    const option = document.createElement("option");
    option.value = teacher.id;
    option.textContent = teacher.name;
    $("teacher").append(option);
  }
  if ([...$("teacher").options].some((o) => o.value === previous))
    $("teacher").value = previous;
  $("connect").hidden = true;
  $("supports").hidden = false;
  renderCards();
  renderReceipt();
}
$("connect").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("login").disabled = true;
  try {
    const parsed = new URL($("origin").value);
    if (
      parsed.protocol !== "https:" &&
      !(
        parsed.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(parsed.hostname)
      )
    )
      throw new Error("Use your school’s secure HTTPS app address.");
    if (parsed.username || parsed.password)
      throw new Error("Use an app address without login details.");
    const origin = parsed.origin;
    const granted = await chrome.permissions.request({
      origins: [`${origin}/*`],
    });
    if (!granted)
      throw new Error(
        "Permission to connect to your school app was not granted.",
      );
    session = { origin };
    const login = await call("/login", {
      method: "POST",
      body: { username: $("username").value, password: $("password").value },
    });
    if (login.user.role !== "student")
      throw new Error("Sign in with your student account.");
    session.token = login.token;
    $("password").value = "";
    await chrome.storage.session.set({ inclusionSession: session });
    await chrome.storage.local.set({ inclusionOrigin: origin });
    show("Your supports are private. Choose what you need.");
    await load();
    startUpdates();
  } catch (e) {
    show(e.message || "Could not connect to the school app.");
  } finally {
    $("login").disabled = false;
  }
});
$("teacher").addEventListener("change", renderCards);
$("refresh").addEventListener("click", () =>
  load()
    .then(() => show("Your request status is up to date."))
    .catch((e) => show(e.message)),
);
$("signout").addEventListener("click", async () => {
  await chrome.storage.session.remove(["inclusionSession", "inclusionRetries"]);
  stopUpdates?.();
  clearInterval(refreshTimer);
  document.getElementById("receipt")?.remove();
  session = null;
  $("supports").hidden = true;
  $("connect").hidden = false;
  show("You have signed out.");
});
async function start() {
  session = (await chrome.storage.session.get("inclusionSession"))
    .inclusionSession;
  $("origin").value =
    (await chrome.storage.local.get("inclusionOrigin")).inclusionOrigin || "";
  receiptId = (await chrome.storage.session.get("inclusionReceipt"))
    .inclusionReceipt;
  if (session?.token) {
    try {
      await load();
      startUpdates();
      show("Your supports are private. Choose what you need.");
      return;
    } catch (e) {
      show(e.message);
    }
  }
  $("connect").hidden = false;
  if (
    !$("status").textContent ||
    $("status").textContent === "Opening your supports…"
  )
    show("Connect to your school to get started.");
}
start().catch(() =>
  show("The extension could not open. Close it and try again."),
);

function startUpdates() {
  stopUpdates?.();
  clearInterval(refreshTimer);
  stopUpdates = watchWorkspace({
    origin: session.origin,
    token: session.token,
    onChange: () => load().catch((e) => show(e.message)),
  });
  refreshTimer = setInterval(() => {
    if (session?.token) load().catch(() => {});
  }, 5000);
}
window.addEventListener("unload", () => {
  stopUpdates?.();
  clearInterval(refreshTimer);
});
function renderReceipt(intro = false) {
  const request =
    workspace?.requests.find((r) => r.id === receiptId) ||
    workspace?.requests.find((r) => activeStatuses.includes(r.status));
  if (!request) return;
  let root = $("receipt");
  if (!root) {
    root = document.createElement("aside");
    root.id = "receipt";
    const panel = document.createElement("section");
    panel.id = "receipt-panel";
    panel.hidden = true;
    panel.setAttribute("aria-label", "My request conversation");
    const chip = document.createElement("button");
    chip.id = "receipt-chip";
    chip.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      chip.setAttribute("aria-expanded", String(!panel.hidden));
    });
    root.append(panel, chip);
    document.body.append(root);
  }
  const chip = $("receipt-chip"),
    panel = $("receipt-panel");
  if (intro) receiptIntroUntil = Date.now() + 2200;
  chip.className = Date.now() < receiptIntroUntil ? "arriving" : "";
  chip.setAttribute(
    "aria-label",
    `${statusLabel[request.status] || request.status}. Open my request conversation.`,
  );
  chip.textContent = "";
  const thumb = document.createElement("img");
  thumb.src = "thumb.svg";
  thumb.alt = "";
  chip.append(thumb);
  panel.replaceChildren();
  const heading = document.createElement("strong");
  heading.textContent = request.title;
  const status = document.createElement("p");
  status.textContent = statusLabel[request.status] || request.status;
  panel.append(heading, status);
  const log = document.createElement("div");
  log.setAttribute("role", "log");
  log.setAttribute("aria-label", "Request messages");
  for (const m of request.messages || []) {
    const row = document.createElement("p");
    row.textContent = m.text;
    log.append(row);
    if ("speechSynthesis" in window) {
      const listen = document.createElement("button");
      listen.className = "text";
      listen.textContent = "🔊";
      listen.setAttribute("aria-label", `Listen: ${m.text}`);
      listen.addEventListener("click", () => {
        speechSynthesis.cancel();
        speechSynthesis.speak(new SpeechSynthesisUtterance(m.text));
      });
      log.append(listen);
    }
  }
  panel.append(log);
  if (activeStatuses.includes(request.status))
    for (const [kind, label] of [
      ["still_need_help", "☝ Help"],
      ["thanks", "👍 Thanks"],
    ]) {
      const reply = document.createElement("button");
      reply.className = "secondary";
      reply.textContent = label;
      reply.addEventListener("click", async () => {
        reply.disabled = true;
        try {
          await call(`/requests/${request.id}/messages`, {
            method: "POST",
            body: { kind },
          });
          await load();
        } catch (e) {
          show(e.message);
          reply.disabled = false;
        }
      });
      panel.append(reply);
    }
}
