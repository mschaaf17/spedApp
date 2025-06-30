const { Schema, model } = require("mongoose");
const TimeScalar = require("../utils/TimeScalar");
const mongoose = require("mongoose");

// Duration Model Schema
const TimerSchema = new Schema({
  timerId: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  status: { type: String, enum: ['running', 'stopped', 'saved'], default: 'running' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  note: { type: String }, // Store optional notes for this timer entry
});

const DurationSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  duration: {
    type: String,
  },
  behaviorTitle: {
    type: String,
    required: true,
  },
  operationalDefinition: {
    type: String,
  },
  createdAt: {
    type: Date,
  },
  startTimes: {
    type: [{ type: Date }],
  },
  startDurationId: {
    type: [Schema.Types.ObjectId],
    ref: "Duration",
  },
  endTimes: {
    type: [{ type: Date }],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdFor: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  averageTimeSpentDaily: {
    type: String,
  },
  timeMostOccurrences: {
    type: Date,
  },
  isActive: { type: Boolean, default: true },
  timers: [TimerSchema],
  isTemplate: { type: Boolean, default: false },
  templateId: { type: Schema.Types.ObjectId, ref: 'Duration' },
});

const Duration = model("Duration", DurationSchema);
module.exports = Duration;

//need to uodate this to use template logic so that that the out of seat duration will filter out students that have already been assigned that behavior