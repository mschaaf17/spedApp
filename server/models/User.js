const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");
const moment = require("moment");
const dateFormat = require("../utils/dateFormat");

// User Model Schema
const UserSchema = new Schema({
  isAdmin: {
    type: Boolean,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  studentSchoolId: {
    type: String,
  },
  students: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  accommodations: [
    {
      type: Schema.Types.ObjectId,
      ref: "AccommodationCards",
    },
  ],
  behaviorFrequencies: [
    {
      type: Schema.Types.ObjectId,
      ref: "Frequency",
    },
  ],
  behaviorDurations: [
    {
      type: Schema.Types.ObjectId,
      ref: "Duration",
    },
  ],
  interventions: [
    {
      type: Schema.Types.ObjectId,
      ref: "InterventionList",
    },
  ],
});

// set up pre-save middleware to create password
UserSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("password")) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
  next();
});

// compare the incoming password with the hashed password
UserSchema.methods.isCorrectPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = model("User", UserSchema);
module.exports = User;
