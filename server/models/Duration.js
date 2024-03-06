const { Schema, model} = require('mongoose')
const  TimeScalar  = require('../utils/TimeScalar');

// Duration Model Schema
const DurationSchema = new Schema({
    timeLength: {
      type: String
    },
    behaviorTitle: {
      type: String,
      required: true
    },
    operationalDefinition: {
      type: String
    },
    createdAt: {
      type: Date
    },
    endedAt: {
      type: Date
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
    averageTimeSpentDaily: {
      type: String
    },
    totalLengthOfTime: {
      type: String 
    },
    timeMostOccurrences: {
      type: Date
    }
  });
  

 const Duration = model('Duration', DurationSchema)
 module.exports = Duration