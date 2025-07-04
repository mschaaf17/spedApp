const { Schema, model } = require("mongoose");

const ContractEntrySchema = new Schema({
  time: String, // e.g., '9:00am' or 'Mon'
  value: String, // 'smiley', 'neutral', 'sad', or a number
  note: String,
  row: String // behavior name
}, { _id: false });

const ContractChartDaySchema = new Schema({
  date: String, // 'YYYY-MM-DD'
  entries: [ContractEntrySchema]
}, { _id: false });

const ContractSchema = new Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  assignedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  }, // teacher
  student: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  }, // student
  contractMeasures: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'ContractMeasure',
    required: true
  }], // behaviors
  type: { 
    type: String, 
    enum: ['daily', 'weekly'], 
    required: true 
  },
  times: [String], // e.g., ['9:00am', '10:15am'] or ['Mon', 'Tues', ...]
  measureType: { 
    type: String, 
    enum: ['smileys', 'numbers'], 
    default: 'smileys' 
  },
  rows: [String], // e.g., ['Follow Directions', 'Complete Work']
  chart: [ContractChartDaySchema],
  notes: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
ContractSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Contract = model("Contract", ContractSchema);
module.exports = Contract;