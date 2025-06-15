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
});

const DurationSchema = new Schema({
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
});

const Duration = model("Duration", DurationSchema);
module.exports = Duration;
