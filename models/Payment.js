const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Reference to Account
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  
  // Reference to Customer
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  
  // Reference to Collector (if applicable)
  collectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collector',
    default: null
  },
  
  // Payment Details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'cheque', 'bank_transfer'],
    required: true,
    default: 'cash'
  },
  
  // Payment Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  
  // For online payments
  referenceNumber: {
    type: String,
    required: function() {
      return this.paymentMethod === 'online';
    },
    sparse: true
  },
  
  // Transaction details
  transactionId: {
    type: String,
    sparse: true
  },
  
  // Payment type
  paymentType: {
    type: String,
    enum: ['regular', 'pending', 'advance', 'partial'],
    default: 'regular'
  },
  
  // For partial payments
  isPartialPayment: {
    type: Boolean,
    default: false
  },
  
  remainingPendingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Verification details (for cash payments)
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collector',
    default: null
  },
  
  verifiedAt: {
    type: Date,
    default: null
  },
  
  verificationNotes: {
    type: String,
    default: ''
  },
  
  // Payment period (for tracking which period this payment covers)
  paymentPeriod: {
    startDate: Date,
    endDate: Date,
    periodType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    }
  },
  
  // Metadata
  notes: {
    type: String,
    default: ''
  },
  
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // For audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel',
    required: true
  },
  
  createdByModel: {
    type: String,
    enum: ['Customer', 'Collector', 'Admin'],
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
paymentSchema.index({ accountId: 1, createdAt: -1 });
paymentSchema.index({ customerId: 1, status: 1 });
paymentSchema.index({ collectorId: 1, status: 1 });
paymentSchema.index({ referenceNumber: 1 }, { sparse: true });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ paymentMethod: 1, status: 1 });
paymentSchema.index({ 'paymentPeriod.startDate': 1, 'paymentPeriod.endDate': 1 });

// Virtual for formatted reference number
paymentSchema.virtual('formattedReference').get(function() {
  if (this.referenceNumber) {
    return `REF-${this.referenceNumber}`;
  }
  return `CASH-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Methods
paymentSchema.methods.markAsCompleted = function(verifiedBy, notes = '') {
  this.status = 'completed';
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();
  this.verificationNotes = notes;
  return this.save();
};

paymentSchema.methods.markAsFailed = function(reason = '') {
  this.status = 'failed';
  this.notes = reason;
  return this.save();
};

paymentSchema.methods.isVerifiable = function() {
  return this.status === 'pending' && this.paymentMethod === 'cash';
};

paymentSchema.methods.getPaymentDetails = function() {
  return {
    id: this._id,
    amount: this.amount,
    paymentMethod: this.paymentMethod,
    status: this.status,
    referenceNumber: this.formattedReference,
    isPartial: this.isPartialPayment,
    remainingAmount: this.remainingPendingAmount,
    createdAt: this.createdAt
  };
};

// Static methods
paymentSchema.statics.findPendingPayments = function(accountId = null) {
  const query = { status: 'pending' };
  if (accountId) {
    query.accountId = accountId;
  }
  return this.find(query).populate('accountId customerId');
};

paymentSchema.statics.findByCustomer = function(customerId, options = {}) {
  const { limit = 50, skip = 0, status = null } = options;
  const query = { customerId };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('accountId collectorId verifiedBy')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

paymentSchema.statics.getPaymentStats = function(customerId = null) {
  const matchStage = customerId ? { customerId: new mongoose.Types.ObjectId(customerId) } : {};
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-set createdByModel based on createdBy reference
  if (this.isNew && this.createdBy) {
    // This would typically be set by the controller based on who's creating the payment
    if (!this.createdByModel) {
      this.createdByModel = 'Customer'; // Default for customer-initiated payments
    }
  }
  
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);