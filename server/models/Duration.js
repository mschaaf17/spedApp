const { Schema, model } = require("mongoose");
const TimeScalar = require("../utils/TimeScalar");

// Duration Model Schema
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
    ref: "User",
    required: true,
  },
  averageTimeSpentDaily: {
    type: String,
  },
  timeMostOccurrences: {
    type: Date,
  },
});

const Duration = model("Duration", DurationSchema);
module.exports = Duration;
