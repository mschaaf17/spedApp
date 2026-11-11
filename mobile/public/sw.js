/* No student records, API responses, or authenticated pages are cached offline. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("push", (event) => {
  let message = {};
  try {
    message = event.data?.json() || {};
  } catch {
    /* Generic notification below. */
  }
  event.waitUntil(
    self.registration.showNotification("Inclusion", {
      body: message.body || "A student requested support. Open your inbox.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "inclusion-support",
      data: { url: "/?view=requests" },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const url = new URL("/?view=requests", self.location.origin).href;
      for (const client of windows) {
        if (
          new URL(client.url).origin === self.location.origin &&
          "focus" in client
        ) {
          await client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
