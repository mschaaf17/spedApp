// Bearer-authenticated SSE; tokens never appear in URLs. Callers retain a polling fallback.
export function watchWorkspace({
  origin = "",
  token,
  onChange,
  fetcher = fetch,
}) {
  const controller = new AbortController();
  let stopped = false,
    retry;
  async function connect() {
    try {
      const response = await fetcher(`${origin}/api/v2/updates`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        signal: controller.signal,
        cache: "no-store",
      });
      if (response.status === 401) return;
      if (!response.ok || !response.body) throw new Error("Stream unavailable");
      const reader = response.body.getReader(),
        decoder = new TextDecoder();
      let buffer = "";
      try {
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder
            .decode(value, { stream: true })
            .replace(/\r\n/g, "\n");
          let index;
          while ((index = buffer.indexOf("\n\n")) >= 0) {
            const frame = buffer.slice(0, index);
            buffer = buffer.slice(index + 2);
            if (/^event: changed$/m.test(frame)) onChange();
          }
          if (buffer.length > 65536) throw new Error("Invalid event stream");
        }
      } finally {
        reader.releaseLock();
      }
    } catch {
      /* Polling remains available; retry while this view is open. */
    }
    if (!stopped) retry = setTimeout(connect, 5000);
  }
  connect();
  return () => {
    stopped = true;
    clearTimeout(retry);
    controller.abort();
  };
}
