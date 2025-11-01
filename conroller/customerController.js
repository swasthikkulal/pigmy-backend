const Customer = require('../models/Customer');

// @desc    Get all customers

// const deleteCustomer = async (req, res) => {
//     try {
//         const customerId = req.params.id;
        
//         // Find the customer first to check if they exist
//         const customer = await Customer.findById(customerId);
        
//         if (!customer) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Customer not found'
//             });
//         }

//         // Check if customer has any active accounts or transactions
//         const activeAccounts = await Account.countDocuments({ customerId: customerId });
//         const activePayments = await Payment.countDocuments({ customerId: customerId });
//         const activeWithdrawals = await Withdrawal.countDocuments({ customerId: customerId });

//         if (activeAccounts > 0 || activePayments > 0 || activeWithdrawals > 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Cannot delete customer with active accounts or transaction history. Please deactivate the customer instead.',
//                 data: {
//                     activeAccounts,
//                     activePayments,
//                     activeWithdrawals
//                 }
//             });
//         }

//         // Delete the customer
//         await Customer.findByIdAndDelete(customerId);

//         res.status(200).json({
//             success: true,
//             message: 'Customer deleted successfully',
//             data: {
//                 deletedCustomerId: customerId,
//                 customerName: customer.name
//             }
//         });

//     } catch (error) {
//         console.error('Error deleting customer:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error deleting customer',
//             error: error.message
//         });
//     }
// };
const deleteCustomer = async (req, res) => {
    try {
        const customerId = req.params.id;
        
        // Use findByIdAndDelete for permanent deletion
        const customer = await Customer.findByIdAndDelete(customerId);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Customer permanently deleted successfully',
            data: {
                customerId: customer.customerId,
                customerName: customer.name
            }
        });

    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting customer',
            error: error.message
        });
    }
};

// @route   GET /api/customers
// @access  Public
const getAllCustomers = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Customer.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Public
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Public
const createCustomer = async (req, res) => {
  try {
    const { 
      customerId, 
      phone, 
      email, 
      aadhaarNumber,
      panNumber,
      dateOfBirth
    } = req.body;

    console.log('Creating customer with data:', req.body);

    // Check if customer ID already exists
    const existingCustomerId = await Customer.findOne({ customerId });
    if (existingCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID already exists'
      });
    }

    // Check if phone already exists
    const existingPhone = await Customer.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already exists'
      });
    }

    // Check if Aadhaar already exists
    const existingAadhaar = await Customer.findOne({ aadhaarNumber });
    if (existingAadhaar) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number already registered'
      });
    }

    // Check if PAN exists (if provided)
    if (panNumber) {
      const existingPAN = await Customer.findOne({ panNumber });
      if (existingPAN) {
        return res.status(400).json({
          success: false,
          message: 'PAN number already registered'
        });
      }
    }

    // Age validation
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: 'Customer must be at least 18 years old'
      });
    }

    const customer = new Customer(req.body);
    const newCustomer = await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: newCustomer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Public
const updateCustomer = async (req, res) => {
  try {
    const { customerId, phone, email, aadhaarNumber, panNumber } = req.body;

    // Check for duplicates (excluding current customer)
    if (customerId) {
      const existingCustomerId = await Customer.findOne({ 
        customerId, 
        _id: { $ne: req.params.id } 
      });
      if (existingCustomerId) {
        return res.status(400).json({
          success: false,
          message: 'Customer ID already exists'
        });
      }
    }

    if (phone) {
      const existingPhone = await Customer.findOne({ 
        phone, 
        _id: { $ne: req.params.id } 
      });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already exists'
        });
      }
    }

    if (aadhaarNumber) {
      const existingAadhaar = await Customer.findOne({ 
        aadhaarNumber, 
        _id: { $ne: req.params.id } 
      });
      if (existingAadhaar) {
        return res.status(400).json({
          success: false,
          message: 'Aadhaar number already registered'
        });
      }
    }

    if (panNumber) {
      const existingPAN = await Customer.findOne({ 
        panNumber, 
        _id: { $ne: req.params.id } 
      });
      if (existingPAN) {
        return res.status(400).json({
          success: false,
          message: 'PAN number already registered'
        });
      }
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update customer savings
// @route   PATCH /api/customers/:id/savings
// @access  Public
const updateCustomerSavings = async (req, res) => {
  try {
    const { amount, type } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    let newTotalSavings = customer.totalSavings;
    
    if (type === 'add') {
      newTotalSavings += amount;
    } else if (type === 'subtract') {
      if (customer.totalSavings < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient savings balance'
        });
      }
      newTotalSavings -= amount;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation type'
      });
    }

    customer.totalSavings = newTotalSavings;
    customer.lastCollectionDate = new Date();
    await customer.save();

    res.status(200).json({
      success: true,
      message: `Savings ${type === 'add' ? 'added' : 'deducted'} successfully`,
      data: {
        customerId: customer.customerId,
        name: customer.name,
        previousSavings: customer.totalSavings - (type === 'add' ? amount : -amount),
        newSavings: customer.totalSavings,
        operation: type
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  updateCustomerSavings,
  deleteCustomer
};