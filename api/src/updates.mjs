import { EventEmitter } from "node:events";
export function createUpdateBus() {
  const bus = new EventEmitter();
  bus.setMaxListeners(0);
  return {
    publish(userIds) {
      bus.emit("change", new Set(userIds.map(String)));
    },
    subscribe(user, notify) {
      const onChange = (audience) => {
        if (user.role === "admin" || audience.has(String(user.id))) notify();
      };
      bus.on("change", onChange);
      return () => bus.off("change", onChange);
    },
    get size() {
      return bus.listenerCount("change");
    },
  };
}
