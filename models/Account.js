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
  // Basic Account Information
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

  // Auto-deduction Settings
  autoDeduction: {
    enabled: {
      type: Boolean,
      default: false
    },
    deductionDate: {
      type: Number, // Day of month (1-31)
      min: 1,
      max: 31
    },
    bankAccount: {
      bankName: String,
      accountNumber: String,
      ifscCode: String
    }
  },

  // Audit Fields
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

  // Transactions History (linked to Payment model)
  transactions: [transactionSchema],

  // Pending Payments Tracking
  pendingPayments: [{
    periodStart: Date,
    periodEnd: Date,
    amount: Number,
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'overdue', 'partial'],
      default: 'pending'
    },
    paidAmount: {
      type: Number,
      default: 0
    }
  }]

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

// Virtual for next payment due date
accountSchema.virtual('nextPaymentDue').get(function() {
  if (!this.lastPaymentDate) return this.openingDate;
  
  const lastPayment = new Date(this.lastPaymentDate);
  let nextDue = new Date(lastPayment);
  
  switch (this.accountType) {
    case 'daily':
      nextDue.setDate(nextDue.getDate() + 1);
      break;
    case 'weekly':
      nextDue.setDate(nextDue.getDate() + 7);
      break;
    case 'monthly':
      nextDue.setMonth(nextDue.getMonth() + 1);
      break;
  }
  
  return nextDue;
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

accountSchema.methods.getPaymentHistory = function(limit = 10) {
  return this.transactions
    .filter(t => t.type === 'deposit')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
};

accountSchema.methods.updateMaturityDetails = function() {
  if (this.maturityDate && new Date() >= new Date(this.maturityDate)) {
    this.maturityStatus = 'Due';
    
    // Calculate maturity amount if not set
    if (this.maturityAmount === 0) {
      const principal = this.totalDeposits;
      const interest = (principal * this.interestRate * parseInt(this.duration)) / (12 * 100);
      this.maturityAmount = principal + interest;
    }
  }
  return this.save();
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

accountSchema.statics.getAccountsSummary = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBalance: { $sum: '$totalBalance' },
        totalDeposits: { $sum: '$totalDeposits' }
      }
    }
  ]);
};

accountSchema.statics.findOverdueAccounts = function() {
  const today = new Date();
  return this.find({
    status: 'active',
    $or: [
      { 
        accountType: 'daily',
        lastPaymentDate: { 
          $lt: new Date(today.setDate(today.getDate() - 1))
        }
      },
      {
        accountType: 'weekly',
        lastPaymentDate: {
          $lt: new Date(today.setDate(today.getDate() - 7))
        }
      },
      {
        accountType: 'monthly',
        lastPaymentDate: {
          $lt: new Date(today.setMonth(today.getMonth() - 1))
        }
      }
    ]
  }).populate('customerId collectorId');
};

// Pre-save middleware
accountSchema.pre('save', function(next) {
  // Update display names if references are populated
  if (this.isModified('customerId') && this.customerId && this.customerId.name) {
    this.customerName = this.customerId.name;
  }
  if (this.isModified('collectorId') && this.collectorId && this.collectorId.name) {
    this.collectorName = this.collectorId.name;
  }
  if (this.isModified('planId') && this.planId && this.planId.name) {
    this.planName = this.planId.name;
  }

  // Update maturity status if maturity date is reached
  if (this.maturityDate && new Date() >= new Date(this.maturityDate)) {
    this.maturityStatus = 'Due';
  }

  next();
});

module.exports = mongoose.model('Account', accountSchema);