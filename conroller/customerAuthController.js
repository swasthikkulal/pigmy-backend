const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');

// Generate JWT Token for customers
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d',
  });
};

// @desc    Login customer
// @route   POST /api/auth/customer/login
// @access  Public
// const loginCustomer = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Check if email and password are provided
//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide email and password'
//       });
//     }

//     // Check if customer exists and is active
//     const customer = await Customer.findOne({ 
//       email: email.toLowerCase(), 
//       status: 'active' 
//     }).populate('collectorId', 'name phone area');

//     if (!customer) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials or account not active'
//       });
//     }

//     // Check password (customer should use their Customer ID as password)
//     const isPasswordMatch = await customer.comparePassword(password);

//     if (!isPasswordMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials - Use your Customer ID as password'
//       });
//     }

//     // Update last login
//     customer.lastLogin = new Date();
//     await customer.save();

//     const token = generateToken(customer._id);

//     res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       data: {
//         _id: customer._id,
//         customerId: customer.customerId,
//         name: customer.name,
//         email: customer.email,
//         phone: customer.phone,
//         collector: customer.collectorId,
//         token
//       }
//     });
//   } catch (error) {
//     console.error('Error logging in customer:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server Error',
//       error: error.message
//     });
//   }
// };

// const loginCustomer = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     console.log('🔐 Login attempt:', { email, password });

//     // Check if email and password are provided
//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide email and password'
//       });
//     }

//     // Check if customer exists and is active
//     const customer = await Customer.findOne({ 
//       email: email.toLowerCase()
//     }).populate('collectorId', 'name phone area');

//     console.log('📋 Found customer:', customer ? {
//       id: customer._id,
//       email: customer.email,
//       customerId: customer.customerId,
//       status: customer.status,
//       hasPassword: !!customer.password
//     } : 'No customer found');

//     if (!customer) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials or account not active'
//       });
//     }

//     if (customer.status !== 'active') {
//       return res.status(401).json({
//         success: false,
//         message: 'Account is not active'
//       });
//     }

//     // Check password (customer should use their Customer ID as password)
//     console.log('🔑 Checking password...');
//     const isPasswordMatch = await customer.comparePassword(password);
//     console.log('Password match:', isPasswordMatch);

//     if (!isPasswordMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials - Use your Customer ID as password'
//       });
//     }

//     // Update last login
//     customer.lastLogin = new Date();
//     await customer.save();

//     const token = generateToken(customer._id);

//     console.log('✅ Login successful for:', customer.email);

//     res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       data: {
//         _id: customer._id,
//         customerId: customer.customerId,
//         name: customer.name,
//         email: customer.email,
//         phone: customer.phone,
//         collector: customer.collectorId,
//         token
//       }
//     });
//   } catch (error) {
//     console.error('❌ Error logging in customer:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server Error',
//       error: error.message
//     });
//   }
// };
const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email, password });

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find customer WITHOUT triggering full document validation
    const customer = await Customer.findOne({ 
      email: email.toLowerCase()
    })
    .select('+password') // Make sure password is included
    .populate('collectorId', 'name phone area');

    console.log('📋 Found customer:', customer ? {
      id: customer._id,
      email: customer.email,
      customerId: customer.customerId,
      status: customer.status,
      hasPassword: !!customer.password
    } : 'No customer found');

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or account not active'
      });
    }

    if (customer.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Check password (customer should use their Customer ID as password)
    console.log('🔑 Checking password...');
    const isPasswordMatch = await customer.comparePassword(password);
    console.log('Password match:', isPasswordMatch);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials - Use your Customer ID as password'
      });
    }

    // Update last login WITHOUT triggering validation
    // Use updateOne instead of save() to avoid validation
    await Customer.updateOne(
      { _id: customer._id },
      { 
        lastLogin: new Date(),
        $inc: { __v: 1 } // Optional: increment version to avoid conflicts
      }
    );

    const token = generateToken(customer._id);

    console.log('✅ Login successful for:', customer.email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: customer._id,
        customerId: customer.customerId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        collector: customer.collectorId,
        token
      }
    });
  } catch (error) {
    console.error('❌ Error logging in customer:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get current customer profile
// @route   GET /api/auth/customer/me
// @access  Private (Customer)
const getMe = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id)
      .select('-password')
      .populate('collectorId', 'name phone area');

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error getting customer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Change customer password
// @route   PUT /api/auth/customer/change-password
// @access  Private (Customer)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const customer = await Customer.findById(req.customer._id);

    // Check current password (which is their Customer ID)
    const isMatch = await customer.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update to new password
    customer.password = newPassword;
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  loginCustomer,
  getMe,
  changePassword
};