const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    required: true,
    unique: true
  },
  accountId: {
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
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
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
    enum: ['active', 'closed', 'suspended', 'completed'],
    default: 'active'
  },
  openingDate: {
    type: Date,
    default: Date.now
  },
  closingDate: {
    type: Date
  },
  // Pigmy Account Specific Fields
  startDate: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: String,
    default: '12'
  },
  interestRate: {
    type: Number,
    default: 0
  },
  totalDays: {
    type: Number,
    default: 0
  },
  maturityDate: {
    type: Date
  },
  maturityStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Due'],
    default: 'Pending'
  },
  withdrawalDate: {
    type: Date
  },
  paymentMode: {
    type: String
  },
  paymentReference: {
    type: String
  },
  customerName: {
    type: String
  },
  planName: {
    type: String
  },
  collectorName: {
    type: String
  },
  createdBy: {
    type: String,
    default: 'Admin'
  },
  updatedBy: {
    type: String
  },
  remarks: {
    type: String
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