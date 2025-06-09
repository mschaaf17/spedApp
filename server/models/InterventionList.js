const { Schema, model } = require("mongoose");

// InterventionList Model Schema
const InterventionListSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  function: {
    type: String,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  isTemplate: {
    type: Boolean,
    default: false,
  },
   isActive: { type: Boolean, default: true },
  behaviorId: {
    type: Schema.Types.ObjectId,
    ref: "Frequency",
    required: false,
  },
  behaviorTitle: {
    type: String,
    required: false,
  },
});

const InterventionList = model("InterventionList", InterventionListSchema);
module.exports = InterventionList;
