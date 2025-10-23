const mongoose = require('mongoose');

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
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    required: true
  },
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
  nomineeName: {
    type: String,
    required: true,
    trim: true
  },
  nomineeRelation: {
    type: String,
    required: true,
    trim: true
  },
  nomineeContact: {
    type: String,
    required: true
  },

  // System Fields
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  totalSavings: {
    type: Number,
    default: 0
  },
  lastCollectionDate: {
    type: Date
  },
  totalAccounts: {
    type: Number,
    default: 0
  },
  activeAccounts: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

// Calculate age virtual field
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

module.exports = mongoose.model('Customer', customerSchema);