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
  createdFor: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false,
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
   isActive: { type: Boolean, default: true }
});

const InterventionList = model("InterventionList", InterventionListSchema);
module.exports = InterventionList;
