import { pictureFor } from "./pictures.mjs";
const $ = (id) => document.getElementById(id);
let session, workspace;
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
    button.textContent = active ? `✓ ${statusLabel[active.status]}` : "☝ Ask";
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
        await call("/requests", {
          method: "POST",
          body: { accommodationId: support.id, teacherId, clientRequestId },
        });
        delete retries[key];
        await chrome.storage.session.set({ inclusionRetries: retries });
        show("Your teacher has received your request.");
        await load();
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
  if (session?.token) {
    try {
      await load();
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
