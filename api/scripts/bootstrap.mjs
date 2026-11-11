import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { models } from "../src/models.mjs";
const {
  MONGODB_URI,
  BOOTSTRAP_USERNAME,
  BOOTSTRAP_PASSWORD,
  BOOTSTRAP_NAME = "",
  BOOTSTRAP_ROLE = "admin",
} = process.env;
if (
  !MONGODB_URI ||
  !BOOTSTRAP_USERNAME ||
  !BOOTSTRAP_PASSWORD ||
  BOOTSTRAP_PASSWORD.length < 12 ||
  !["admin", "teacher"].includes(BOOTSTRAP_ROLE)
)
  throw new Error(
    "Set MONGODB_URI, BOOTSTRAP_USERNAME, a password of at least 12 characters, and BOOTSTRAP_ROLE (admin or teacher).",
  );
await mongoose.connect(MONGODB_URI);
try {
  const existing = await models.User.findOne({ username: BOOTSTRAP_USERNAME });
  if (existing) {
    // Role elevation is an explicit operator command, never a browser-controlled signup option.
    existing.role = BOOTSTRAP_ROLE;
    existing.isAdmin = true;
    await existing.save();
    console.log("Existing account role updated; its password was preserved.");
  } else {
    const [firstName, ...rest] = BOOTSTRAP_NAME.trim().split(" ");
    await models.User.create({
      username: BOOTSTRAP_USERNAME,
      firstName,
      lastName: rest.join(" "),
      role: BOOTSTRAP_ROLE,
      isAdmin: true,
      password: await bcrypt.hash(BOOTSTRAP_PASSWORD, 12),
    });
    console.log("School staff account created.");
  }
} finally {
  await mongoose.disconnect();
}
