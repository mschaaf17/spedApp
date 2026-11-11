import mongoose from "mongoose";
import { models } from "../src/models.mjs";
if (!process.env.MONGODB_URI)
  throw new Error("Set MONGODB_URI before importing your existing roster.");
await mongoose.connect(process.env.MONGODB_URI);
try {
  const teachers = await models.User.find({
    $or: [{ role: { $in: ["teacher", "admin"] } }, { isAdmin: true }],
  });
  const students = await models.User.find({
    isAdmin: { $ne: true },
    role: { $nin: ["teacher", "admin"] },
  });
  let imported = 0;
  for (const student of students) {
    if (await models.Profile.exists({ studentId: student._id })) continue;
    const raw = await mongoose.connection
      .collection("users")
      .findOne({ _id: student._id });
    const cards = await mongoose.connection
      .collection("accommodationcards")
      .find({ _id: { $in: raw.accommodations || [] } })
      .toArray();
    await models.Profile.create({
      studentId: student._id,
      name:
        `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
        student.username,
      schoolId: student.studentSchoolId || "",
      grade: "",
      planType: "Support",
      teacherIds: teachers
        .filter((t) =>
          t.students?.some((id) => String(id) === String(student._id)),
        )
        .map((t) => t._id),
      accommodations: cards.map((a) => ({
        id: String(a._id),
        title: a.title,
        description: a.description || "",
      })),
      drafts: [],
    });
    imported++;
  }
  console.log(
    `Imported ${imported} classroom profiles. Existing profiles and historical frequency/duration records were preserved. Review plan types, grades, goals, and teacher assignments before use.`,
  );
} finally {
  await mongoose.disconnect();
}
