const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  // Basic Personal Details
  customerId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },

  // Address Information
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'India'
    }
  },

  // KYC Documents
  aadhaarNumber: {
    type: String,
    required: true,
    unique: true
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true
  },

  // Nominee Details
  nominee: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    relation: {
      type: String,
      required: true,
      trim: true
    },
    contact: {
      type: String,
      required: true
    },
    aadhaarNumber: {
      type: String
    },
    address: {
      type: String
    }
  },

  // Authentication & Security
  password: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },

  // Payment Preferences & Settings
  paymentPreferences: {
    preferredMethod: {
      type: String,
      enum: ['cash', 'online', 'auto_deduction'],
      default: 'cash'
    },
    autoPay: {
      type: Boolean,
      default: false
    },
    notificationPreferences: {
      paymentReminders: { type: Boolean, default: true },
      paymentReceipts: { type: Boolean, default: true },
      accountUpdates: { type: Boolean, default: true },
      smsAlerts: { type: Boolean, default: true },
      emailAlerts: { type: Boolean, default: true }
    }
  },

  // Bank Details for Auto-deduction
  bankDetails: {
    accountNumber: String,
    accountHolderName: String,
    bankName: String,
    ifscCode: String,
    branch: String,
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date
  },

  // KYC Status
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'under_review'],
    default: 'pending'
  },
  kycVerifiedAt: {
    type: Date
  },
  kycVerifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  kycDocuments: [{
    documentType: String,
    documentNumber: String,
    fileUrl: String,
    verified: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Customer Statistics (Auto-updated)
  stats: {
    totalAccounts: {
      type: Number,
      default: 0
    },
    activeAccounts: {
      type: Number,
      default: 0
    },
    closedAccounts: {
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
    totalInterestEarned: {
      type: Number,
      default: 0
    },
    currentBalance: {
      type: Number,
      default: 0
    },
    lastPaymentDate: {
      type: Date
    },
    lastPaymentAmount: {
      type: Number,
      default: 0
    },
    averageMonthlyDeposit: {
      type: Number,
      default: 0
    },
    paymentConsistency: {
      type: Number,
      default: 0 // Percentage of on-time payments
    }
  },

  // Payment History Summary
  paymentSummary: {
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
    failedPayments: {
      type: Number,
      default: 0
    },
    totalAmountPaid: {
      type: Number,
      default: 0
    },
    lastPaymentMethod: {
      type: String,
      enum: ['cash', 'online', 'cheque', 'bank_transfer'],
      default: 'cash'
    }
  },

  // Reference to collector
  collectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collector',
    required: true
  },

  // Customer Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'blacklisted'],
    default: 'active'
  },

  // Risk Assessment
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  creditScore: {
    type: Number,
    default: 0
  },

  // Communication History
  communicationPreferences: {
    preferredLanguage: {
      type: String,
      default: 'english'
    },
    contactTime: {
      from: String,
      to: String
    }
  },

  // Remarks & Notes
  remarks: {
    type: String
  },
  internalNotes: [{
    note: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'internalNotes.createdByModel'
    },
    createdByModel: {
      type: String,
      enum: ['Admin', 'Collector']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }

}, { 
  timestamps: true 
});

// Indexes for better performance
customerSchema.index({ customerId: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ aadhaarNumber: 1 });
customerSchema.index({ collectorId: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ 'stats.lastPaymentDate': -1 });
customerSchema.index({ createdAt: -1 });

// Virtual Fields
customerSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

customerSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}, ${addr.country}`;
});

customerSchema.virtual('customerSince').get(function() {
  return this.createdAt;
});

customerSchema.virtual('isKYCVerified').get(function() {
  return this.kycStatus === 'verified';
});

// Methods
customerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

customerSchema.methods.isAccountLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

customerSchema.methods.incrementLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise we're incrementing
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock the account if we've reached max attempts and it's not locked already
  if (this.loginAttempts + 1 >= 5 && !this.isAccountLocked()) {
    updates.$set = { lockUntil: Date.now() + (2 * 60 * 60 * 1000) }; // 2 hours
  }
  
  return this.updateOne(updates);
};

customerSchema.methods.getPaymentHistory = async function(limit = 20, skip = 0) {
  const Payment = mongoose.model('Payment');
  return Payment.find({ customerId: this._id })
    .populate('accountId collectorId verifiedBy')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .exec();
};

customerSchema.methods.getAccounts = async function() {
  const Account = mongoose.model('Account');
  return Account.find({ customerId: this._id })
    .populate('planId collectorId')
    .sort({ createdAt: -1 })
    .exec();
};

customerSchema.methods.updateStats = async function() {
  const Account = mongoose.model('Account');
  const Payment = mongoose.model('Payment');
  
  // Get account statistics
  const accountStats = await Account.aggregate([
    { $match: { customerId: this._id } },
    {
      $group: {
        _id: null,
        totalAccounts: { $sum: 1 },
        activeAccounts: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        closedAccounts: {
          $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
        },
        totalBalance: { $sum: '$totalBalance' },
        totalDeposits: { $sum: '$totalDeposits' }
      }
    }
  ]);
  
  // Get payment statistics
  const paymentStats = await Payment.aggregate([
    { 
      $match: { 
        customerId: this._id,
        status: 'completed'
      } 
    },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmountPaid: { $sum: '$amount' },
        lastPaymentDate: { $max: '$createdAt' },
        lastPaymentAmount: { $last: '$amount' }
      }
    }
  ]);
  
  // Get pending payments count
  const pendingPayments = await Payment.countDocuments({
    customerId: this._id,
    status: 'pending'
  });
  
  // Update stats
  const stats = accountStats.length > 0 ? accountStats[0] : {};
  const paymentData = paymentStats.length > 0 ? paymentStats[0] : {};
  
  this.stats = {
    totalAccounts: stats.totalAccounts || 0,
    activeAccounts: stats.activeAccounts || 0,
    closedAccounts: stats.closedAccounts || 0,
    totalDeposits: stats.totalDeposits || 0,
    currentBalance: stats.totalBalance || 0,
    lastPaymentDate: paymentData.lastPaymentDate || null,
    lastPaymentAmount: paymentData.lastPaymentAmount || 0,
    // Calculate payment consistency (simplified)
    paymentConsistency: this.calculatePaymentConsistency()
  };
  
  this.paymentSummary = {
    totalPayments: paymentData.totalPayments || 0,
    successfulPayments: paymentData.totalPayments || 0,
    pendingPayments: pendingPayments || 0,
    failedPayments: 0, // You might want to calculate this from failed payments
    totalAmountPaid: paymentData.totalAmountPaid || 0,
    lastPaymentMethod: this.paymentSummary?.lastPaymentMethod || 'cash'
  };
  
  return this.save();
};

customerSchema.methods.calculatePaymentConsistency = function() {
  // This is a simplified calculation
  // In a real system, you'd calculate based on payment history
  const totalExpectedPayments = this.stats.totalAccounts * 30; // Example
  const actualPayments = this.paymentSummary.successfulPayments;
  
  if (totalExpectedPayments === 0) return 0;
  return Math.min((actualPayments / totalExpectedPayments) * 100, 100);
};

customerSchema.methods.getPendingPayments = async function() {
  const Payment = mongoose.model('Payment');
  return Payment.find({
    customerId: this._id,
    status: 'pending'
  })
  .populate('accountId collectorId')
  .sort({ createdAt: -1 })
  .exec();
};

// Static Methods
customerSchema.statics.findByCollector = function(collectorId) {
  return this.find({ collectorId })
    .populate('collectorId', 'name phone area')
    .sort({ name: 1 });
};

customerSchema.statics.getCustomerStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBalance: { $sum: '$stats.currentBalance' },
        totalDeposits: { $sum: '$stats.totalDeposits' }
      }
    }
  ]);
};

customerSchema.statics.searchCustomers = function(searchTerm) {
  return this.find({
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { customerId: { $regex: searchTerm, $options: 'i' } },
      { phone: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { 'address.city': { $regex: searchTerm, $options: 'i' } }
    ]
  })
  .populate('collectorId', 'name phone')
  .limit(50);
};

// Pre-save middleware
customerSchema.pre('save', async function(next) {
  // Only hash the password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

customerSchema.pre('save', function(next) {
  // Update address string for backward compatibility
  if (this.isModified('address') && typeof this.address === 'object') {
    this.address = this.fullAddress;
  }
  next();
});

// Remove sensitive information from JSON output
customerSchema.methods.toJSON = function() {
  const customer = this.toObject();
  delete customer.password;
  delete customer.loginAttempts;
  delete customer.lockUntil;
  delete customer.internalNotes;
  return customer;
};

// Ensure virtual fields are serialized
customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Customer', customerSchema);