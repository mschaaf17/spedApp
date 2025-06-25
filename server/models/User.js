const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");
const moment = require("moment");
const dateFormat = require("../utils/dateFormat");

// User Model Schema
const UserSchema = new Schema({
  isAdmin: {
    type: Boolean,
    required: true,
    default: false,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    default: '',
  },
  lastName: {
    type: String,
    default: '',
  },
  password: {
    type: String,
    required: true,
  },
  studentSchoolId: {
    type: String,
    default: '',
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
      ref: "AccommodationList",
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
  studentViewConfig: {
    showAccommodations: {
      type: Boolean,
      default: false,
    },
    selectedCharts: [
      {
        type: {
          type: String,
          enum: ['frequency', 'duration', 'break-frequency', 'break-duration'],
        },
        id: {
          type: Schema.Types.Mixed,
          required: false,
        },
        title: {
          type: String,
        },
      },
    ],
  },
  breakSettings: {
    isEnabled: { type: Boolean, default: false },
    duration: { type: Number, default: 5 }, // in minutes
    hasDelay: { type: Boolean, default: false },
    delayDuration: { type: Number, default: 15 }, // in minutes
    dailyLimit: { type: Number, default: 0 }, // 0 for unlimited
  },
  breakHistory: [{
    startTime: { type: Date, required: false },
    endTime: { type: Date },
    duration: { 
      type: Number, 
      min: 0,
      validate: {
        validator: function(v) {
          return v === null || v === undefined || (!isNaN(v) && v >= 0);
        },
        message: 'Duration must be a non-negative number or null'
      }
    }, // duration in minutes
  }],
  contracts: [{
    type: Schema.Types.ObjectId,
    ref: "Contract",
  }],
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
