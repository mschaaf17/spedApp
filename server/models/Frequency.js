const { Schema, model } = require("mongoose");

const mongoose = require('mongoose');

const DailyCountSchema = new mongoose.Schema({
  date: {
    type: Date, // Store the specific date
    required: true,
  },
  count: {
    type: Number, // Store the count for that date
    required: true,
  },
  note: {
    type: String, // Store optional notes for this count entry
  },
});

// Frequency Model Schema
const FrequencySchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  dailyCounts: [DailyCountSchema], // Array of daily counts
  
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
  mostFrequentTime: {
    type: Date,
  },
  isTemplate: {
    type: Boolean,
    default: false,
  },
  templateId: { type: Schema.Types.ObjectId, ref: 'Frequency' },
   isActive: { type: Boolean, default: true }
});

const Frequency = model("Frequency", FrequencySchema);
module.exports = Frequency;
