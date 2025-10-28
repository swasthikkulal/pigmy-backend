const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  planId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  minAmount: {
    type: Number,
    default: 0
  },
  maxAmount: {
    type: Number
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  features: [{
    type: String,
    trim: true
  }],
  termsAndConditions: {
    type: String,
    trim: true
  },
  totalSubscribers: {
    type: Number,
    default: 0
  },
  totalCollections: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'adminModel'
  }
}, { 
  timestamps: true 
});

// Calculate maturity amount virtual field
planSchema.virtual('maturityAmount').get(function() {
  const totalAmount = this.amount * this.duration;
  const interest = (totalAmount * this.interestRate) / 100;
  return totalAmount + interest;
});

// Index for better query performance
planSchema.index({ status: 1, type: 1 });
planSchema.index({ planId: 1 });

module.exports = mongoose.model('Plan', planSchema);