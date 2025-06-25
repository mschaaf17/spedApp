const { Schema, model } = require("mongoose");

const ContractMeasureSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['behavior', 'academic', 'social', 'other'],
    default: 'behavior'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
ContractMeasureSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ContractMeasure = model("ContractMeasure", ContractMeasureSchema);
module.exports = ContractMeasure;
