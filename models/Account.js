const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'interest', 'penalty', 'maturity'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'verified'],
    default: 'completed'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'cheque', 'bank_transfer'],
    default: 'cash'
  },
  referenceNumber: {
    type: String
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collector'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collector'
  },
  verifiedAt: {
    type: Date
  },
  description: {
    type: String
  },
  isPartialPayment: {
    type: Boolean,
    default: false
  },
  remainingPendingAmount: {
    type: Number,
    default: 0
  }
}, { _id: false });

const accountSchema = new mongoose.Schema({
  // Basic Account Information - Use only accountNumber, remove accountId
  accountNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  // References
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

  // Account Type and Plan Details
  accountType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  type: {
    type: String,
    enum: ['Savings Account', 'Pigmy Deposit', 'Daily Deposit', 'Fixed Deposit'],
    default: 'Savings Account'
  },

  // Financial Details
  dailyAmount: {
    type: Number,
    required: true
  },
  totalBalance: {
    type: Number,
    default: 0
  },
  totalDeposits: {
    type: Number,
    default: 0
  },
  totalWithdrawals: {
    type: Number,
    default: 0
  },
  totalInterest: {
    type: Number,
    default: 0
  },

  // Account Status and Dates
  status: {
    type: String,
    enum: ['active', 'closed', 'suspended', 'completed', 'matured'],
    default: 'active'
  },
  openingDate: {
    type: Date,
    default: Date.now
  },
  closingDate: {
    type: Date
  },
  lastTransaction: {
    type: Date
  },
  lastPaymentDate: {
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
  maturityAmount: {
    type: Number,
    default: 0
  },
  maturityStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Due'],
    default: 'Pending'
  },
  withdrawalDate: {
    type: Date
  },

  // Payment Information
  paymentMode: {
    type: String
  },
  paymentReference: {
    type: String
  },

  // Display Fields (for quick access)
  customerName: {
    type: String
  },
  planName: {
    type: String
  },
  collectorName: {
    type: String
  },

  // Payment Tracking and Statistics
  paymentStats: {
    totalPayments: {
      type: Number,
      default: 0
    },
    successfulPayments: {
      type: Number,
      default: 0
    },
    pendingPayments: {
      type: Number,
      default: 0
    },
    lastPaymentAmount: {
      type: Number,
      default: 0
    },
    averagePaymentAmount: {
      type: Number,
      default: 0
    }
  },

  // Transactions History (linked to Payment model)
  transactions: [transactionSchema]

}, { 
  timestamps: true 
});

// Indexes for better performance
accountSchema.index({ customerId: 1, status: 1 });
accountSchema.index({ collectorId: 1, status: 1 });
accountSchema.index({ accountNumber: 1 });
accountSchema.index({ status: 1, maturityDate: 1 });
accountSchema.index({ 'transactions.date': -1 });
accountSchema.index({ lastPaymentDate: -1 });

// Virtual for progress calculation
accountSchema.virtual('progress').get(function() {
  if (this.maturityAmount && this.maturityAmount > 0) {
    return Math.min((this.totalBalance / this.maturityAmount) * 100, 100);
  }
  return 0;
});

// Virtual for account age in days
accountSchema.virtual('accountAge').get(function() {
  const today = new Date();
  const openingDate = new Date(this.openingDate);
  return Math.floor((today - openingDate) / (1000 * 60 * 60 * 24));
});

// Methods
accountSchema.methods.addTransactionFromPayment = async function(payment) {
  const transaction = {
    paymentId: payment._id,
    date: payment.createdAt,
    amount: payment.amount,
    type: 'deposit',
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    referenceNumber: payment.referenceNumber,
    collectedBy: payment.collectorId,
    verifiedBy: payment.verifiedBy,
    verifiedAt: payment.verifiedAt,
    description: `${payment.paymentMethod} payment`,
    isPartialPayment: payment.isPartialPayment,
    remainingPendingAmount: payment.remainingPendingAmount
  };

  this.transactions.push(transaction);
  
  // Update balance and stats
  if (payment.status === 'completed') {
    this.totalBalance += payment.amount;
    this.totalDeposits += payment.amount;
    this.lastPaymentDate = payment.createdAt;
    this.lastTransaction = payment.createdAt;
    
    // Update payment stats
    this.paymentStats.totalPayments += 1;
    this.paymentStats.successfulPayments += 1;
    this.paymentStats.lastPaymentAmount = payment.amount;
    
    // Calculate average payment amount
    const totalAmount = (this.paymentStats.averagePaymentAmount * (this.paymentStats.successfulPayments - 1)) + payment.amount;
    this.paymentStats.averagePaymentAmount = totalAmount / this.paymentStats.successfulPayments;
  }

  return this.save();
};

accountSchema.methods.calculatePendingAmount = function() {
  const today = new Date();
  const openingDate = new Date(this.openingDate);
  let expectedPayments = 0;
  let paidPayments = 0;

  // Calculate expected payments based on account type
  switch (this.accountType) {
    case 'daily':
      const daysDiff = Math.floor((today - openingDate) / (1000 * 60 * 60 * 24));
      expectedPayments = Math.max(0, daysDiff);
      break;
    case 'weekly':
      const weeksDiff = Math.floor((today - openingDate) / (1000 * 60 * 60 * 24 * 7));
      expectedPayments = Math.max(0, weeksDiff);
      break;
    case 'monthly':
      const monthsDiff = (today.getFullYear() - openingDate.getFullYear()) * 12 + 
                        (today.getMonth() - openingDate.getMonth());
      expectedPayments = Math.max(0, monthsDiff);
      break;
  }

  // Count completed payment transactions
  paidPayments = this.transactions.filter(t => 
    t.type === 'deposit' && t.status === 'completed'
  ).length;

  const pendingCount = Math.max(0, expectedPayments - paidPayments);
  const pendingAmount = pendingCount * this.dailyAmount;

  return {
    count: pendingCount,
    amount: pendingAmount,
    expectedPayments,
    paidPayments
  };
};

// Static Methods
accountSchema.statics.findByCustomer = function(customerId) {
  return this.find({ customerId })
    .populate('planId collectorId')
    .sort({ createdAt: -1 });
};

accountSchema.statics.findActiveAccounts = function() {
  return this.find({ status: 'active' })
    .populate('customerId', 'name phone')
    .populate('collectorId', 'name area');
};

module.exports = mongoose.model('Account', accountSchema);