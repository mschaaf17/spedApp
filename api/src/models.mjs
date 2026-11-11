import mongoose from "mongoose";
const { Schema } = mongoose;
const ref = { type: Schema.Types.ObjectId, ref: "ModernUser" };
// The original user collection and password hashes are reused; historical fields remain intact.
const userSchema = new Schema(
  {
    username: String,
    firstName: String,
    lastName: String,
    password: { type: String, select: false },
    studentSchoolId: String,
    isAdmin: Boolean,
    role: { type: String, enum: ["admin", "teacher", "student"] },
    students: [Schema.Types.ObjectId],
  },
  { collection: "users", strict: false },
);
const profileSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, required: true, unique: true },
    name: { type: String, required: true },
    grade: String,
    schoolId: String,
    planType: { type: String, enum: ["IEP", "504", "Support"], default: "IEP" },
    teacherIds: [ref],
    accommodations: [
      {
        id: String,
        title: String,
        description: String,
        picture: String,
        studentLabel: String,
      },
    ],
    goal: { title: String, baseline: Number, target: Number, unit: String },
    behavior: { name: String, definition: String },
    drafts: [
      {
        id: String,
        type: String,
        body: String,
        source: String,
        status: {
          type: String,
          enum: ["draft", "approved", "rejected"],
          default: "draft",
        },
        createdAt: Date,
        createdBy: ref,
        reviewedAt: Date,
        reviewedBy: ref,
      },
    ],
  },
  { timestamps: true },
);
const eventSchema = new Schema(
  {
    studentId: { ...ref, required: true, index: true },
    actorId: ref,
    type: {
      type: String,
      enum: ["frequency", "duration", "progress", "observation"],
      required: true,
    },
    behavior: String,
    value: Number,
    seconds: Number,
    note: String,
    targetOnTask: Boolean,
    peerOnTask: Boolean,
    sharedWithFamily: { type: Boolean, default: false },
    voided: { type: Boolean, default: false },
    voidedAt: Date,
  },
  { timestamps: true },
);
eventSchema.index({ studentId: 1, createdAt: -1 });
const requestSchema = new Schema(
  {
    studentId: { ...ref, required: true },
    teacherId: { ...ref, required: true, index: true },
    accommodationId: String,
    title: String,
    status: {
      type: String,
      enum: ["requested", "acknowledged", "offered", "provided", "cancelled"],
      default: "requested",
    },
    clientRequestId: { type: String, required: true },
    history: [{ status: String, at: Date, actorId: ref }],
  },
  { timestamps: true },
);
requestSchema.index({ studentId: 1, clientRequestId: 1 }, { unique: true });
const settingsSchema = new Schema({
  userId: { ...ref, unique: true },
  timezone: String,
  start: String,
  end: String,
  days: [Number],
  paused: Boolean,
  subscriptions: [Schema.Types.Mixed],
});
const shareSchema = new Schema(
  {
    studentId: ref,
    createdBy: ref,
    tokenHash: { type: String, unique: true },
    expiresAt: { type: Date, index: { expires: 0 } },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true },
);
export const models = {
  User: mongoose.models.ModernUser || mongoose.model("ModernUser", userSchema),
  Profile:
    mongoose.models.ClassroomProfile ||
    mongoose.model("ClassroomProfile", profileSchema),
  Event:
    mongoose.models.ClassroomEvent ||
    mongoose.model("ClassroomEvent", eventSchema),
  Request:
    mongoose.models.SupportRequest ||
    mongoose.model("SupportRequest", requestSchema),
  Settings:
    mongoose.models.ClassroomSettings ||
    mongoose.model("ClassroomSettings", settingsSchema),
  Share:
    mongoose.models.FamilyShare || mongoose.model("FamilyShare", shareSchema),
};
export function serialize(document) {
  if (!document) return null;
  const value = document.toObject ? document.toObject() : { ...document };
  value.id = String(
    value.studentId && value.name ? value.studentId : value._id,
  );
  for (const key of ["studentId", "teacherId", "actorId", "createdBy"])
    if (value[key]) value[key] = String(value[key]);
  if (value.teacherIds) value.teacherIds = value.teacherIds.map(String);
  delete value._id;
  delete value.__v;
  delete value.password;
  delete value.subscriptions;
  return value;
}
