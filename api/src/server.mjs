import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import express from "express";
import mongoose from "mongoose";
import { createApp } from "./app.mjs";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
if (
  process.env.NODE_ENV === "production" &&
  (!process.env.JWT_SECRET || !process.env.MONGODB_URI)
)
  throw new Error(
    "Configure JWT_SECRET and MONGODB_URI before starting production.",
  );
const secret = process.env.JWT_SECRET || randomBytes(48).toString("hex");
if (!process.env.JWT_SECRET)
  console.warn(
    "Development session secret is temporary. Set JWT_SECRET for persistent sessions.",
  );
const app = createApp({ secret });
const dist = path.join(root, "mobile/dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
}
const port = process.env.PORT || 3001;
const server = app.listen(port, "0.0.0.0", () =>
  console.log(`Inclusion API listening on port ${port}`),
);
if (process.env.MONGODB_URI)
  mongoose
    .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
    .then(() => console.log("School database connected."))
    .catch(() =>
      console.error("School database connection failed. Check MONGODB_URI."),
    );
else
  console.warn(
    "MONGODB_URI is not configured. Live API requests will return 503; the browser demo remains available.",
  );
async function shutdown() {
  server.close();
  await mongoose.disconnect();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
