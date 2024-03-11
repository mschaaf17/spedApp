const { Schema, model } = require("mongoose");

// AccommodationCard Model Schema
const AccommodationCardSchema = new Schema({
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
});

const AccommodationCards = model("AccommodationCards", AccommodationCardSchema);
module.exports = AccommodationCards;
