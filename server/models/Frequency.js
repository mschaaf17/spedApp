const { Schema, model } = require("mongoose");

// Frequency Model Schema
const FrequencySchema = new Schema({
  count: {
    type: Number
  },
  behaviorTitle: {
    type: String,
    required: true,
  },
  operationalDefinition: {
    type: String,
  },
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date,
    default: Date.now,
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
  log: [
    {
      time: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  averageCountByDay: {
    type: Number,
  },
  totalCount: {
    type: Number,
  },
  mostFrequentTime: {
    type: String,
  },
});

const Frequency = model("Frequency", FrequencySchema);
module.exports = Frequency;
