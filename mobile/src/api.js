export const SESSION_KEY = "inclusion.session.v2";
export function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}
export function setSession(session) {
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
}
export async function api(path, { method = "GET", body } = {}) {
  const session = getSession();
  let response;
  try {
    response = await fetch(`/api/v2${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error(
      "You’re offline or the school server is unavailable. This change has not been saved.",
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The school server is unavailable. Please try again later.",
    );
  }
  if (!response.ok)
    throw new Error(data.error || "This change could not be saved.");
  return data;
}
