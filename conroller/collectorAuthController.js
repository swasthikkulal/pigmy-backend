const Collector = require('../models/Collector');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'pigmy-collector-secret-2024';
// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d',
  });
};

// @desc    Login collector with email OR phone
// @route   POST /api/auth/collector/login
// @access  Public
const loginCollector = async (req, res) => {
  try {
    const { username, password } = req.body; // username can be email or phone
console.log(req.body)
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username (email/phone) and password'
      });
    }

    // Find collector by email OR phone
    const collector = await Collector.findOne({
      $or: [
        { email: username },
        { phone: username }
      ]
    });

    if (!collector) {
      return res.status(401).json({
        success: false,
        message: 'No collector found with this email or phone number'
      });
    }

    // Check if password matches phone number (plain comparison)
    if (!collector.matchPassword(password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please use your phone number as password.'
      });
    }

    // Update last login
    collector.lastLogin = new Date();
    await collector.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: collector._id,
        name: collector.name,
        collectorId: collector.collectorId,
        email: collector.email,
        phone: collector.phone,
        area: collector.area,
        address: collector.address,
        status: collector.status,
        token: generateToken(collector._id),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get current collector
// @route   GET /api/auth/collector/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const collector = await Collector.findById(req.collector._id);
    
    res.json({
      success: true,
      data: {
        _id: collector._id,
        name: collector.name,
        collectorId: collector.collectorId,
        email: collector.email,
        phone: collector.phone,
        area: collector.area,
        address: collector.address,
        status: collector.status,
        totalCustomers: collector.totalCustomers,
        totalCollections: collector.totalCollections,
        joinDate: collector.joinDate
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Change password (now changes to new phone number)
// @route   PUT /api/auth/collector/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const collector = await Collector.findById(req.collector._id);

    // Current password should match current phone number
    if (currentPassword !== collector.phone) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update both phone number and password
    collector.phone = newPassword;
    collector.password = newPassword; // This will be handled by pre-save middleware
    await collector.save();

    res.json({
      success: true,
      message: 'Password (phone number) updated successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/collector/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, area, address } = req.body;
    
    const collector = await Collector.findById(req.collector._id);

    // Update fields
    if (name) collector.name = name;
    if (email) collector.email = email;
    if (area) collector.area = area;
    if (address) collector.address = address;
    
    // If phone is being updated, also update password
    if (phone && phone !== collector.phone) {
      collector.phone = phone;
      // Password will be auto-set to phone by pre-save middleware
    }

    await collector.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: collector._id,
        name: collector.name,
        collectorId: collector.collectorId,
        email: collector.email,
        phone: collector.phone,
        area: collector.area,
        address: collector.address,
        status: collector.status
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  loginCollector,
  getMe,
  changePassword,
  updateProfile,
};