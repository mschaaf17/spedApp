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
});

const InterventionList = model("InterventionList", InterventionListSchema);
module.exports = InterventionList;
