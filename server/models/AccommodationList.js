const { Schema, model } = require("mongoose");

// AccommodationCard Model Schema
const AccommodationListSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  description: {
    type: String,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
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
   createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const AccommodationList = model("AccommodationList", AccommodationListSchema);
module.exports = AccommodationList;
