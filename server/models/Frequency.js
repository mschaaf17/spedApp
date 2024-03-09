const { Schema, model} = require('mongoose');

// Frequency Model Schema
const FrequencySchema = new Schema({
  count: {
    type: Number,
    required: true
  },
  behaviorTitle: {
    type: String,
    required: true
  },
  operationalDefinition: {
    type: String
  },
  createdAt: {
    type: Date,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdFor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  log: [{
    time: {
      type: Date,
      default: Date.now
    }
  }],
  averageCountByDay: {
    type: Number
  },
  totalCount: {
    type: Number
  },
  mostFrequentTime: {
    type: String
  }
});

const Frequency = model('Frequency', FrequencySchema);
module.exports = Frequency;
