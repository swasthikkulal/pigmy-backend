const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  collectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collector',
    required: true
  },
  accountType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  dailyAmount: {
    type: Number,
    required: true
  },
  totalBalance: {
    type: Number,
    default: 0
  },
  lastTransaction: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'suspended'],
    default: 'active'
  },
  openingDate: {
    type: Date,
    default: Date.now
  },
  closingDate: {
    type: Date
  },
  transactions: [{
    date: {
      type: Date,
      default: Date.now
    },
    amount: Number,
    type: {
      type: String,
      enum: ['deposit', 'withdrawal']
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collector'
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);