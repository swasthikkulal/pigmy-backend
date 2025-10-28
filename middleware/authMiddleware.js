// middleware/authMiddleware.js - UPDATED
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  try {
    console.log('🛡️ Auth Middleware - Starting authentication check');
    
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('✅ Token found in header');
    } else {
      console.log('❌ No token found in header');
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    console.log('🔑 Token received:', token ? `${token.substring(0, 20)}...` : 'None');

    if (!token) {
      console.log('❌ Token is empty');
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    try {
      // Verify token with consistent secret
      console.log('🔐 Verifying token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('✅ Token verified. Admin ID:', decoded.id);

      // Get admin from token
      console.log('👤 Finding admin in database...');
      req.admin = await Admin.findById(decoded.id);

      if (!req.admin) {
        console.log('❌ Admin not found in database');
        return res.status(401).json({
          success: false,
          message: 'Not authorized, admin not found'
        });
      }

      console.log('✅ Admin found:', req.admin.email);
      
      if (!req.admin.isActive) {
        console.log('❌ Admin account is inactive');
        return res.status(401).json({
          success: false,
          message: 'Not authorized, account is deactivated'
        });
      }

      console.log('✅ Authentication successful!');
      next();
    } catch (jwtError) {
      console.log('❌ JWT Verification failed:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  } catch (error) {
    console.error('💥 Error in auth middleware:', error);  
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Role-based authorization middleware
// middleware/authMiddleware.js - FIXED AUTHORIZATION
const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('🎭 Checking authorization for role:', req.admin?.role);
    console.log('📋 Required roles:', roles);
    console.log('👤 User role:', req.admin?.role);
    
    if (!req.admin) {
      console.log('❌ No admin object in request');
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Fix: Handle nested arrays and flatten the roles
    const requiredRoles = roles.flat();
    
    console.log('🔧 Flattened required roles:', requiredRoles);

    if (!requiredRoles.includes(req.admin.role)) {
      console.log('❌ Role not authorized. Required:', requiredRoles, 'User role:', req.admin.role);
      return res.status(403).json({
        success: false,
        message: `User role ${req.admin.role} is not authorized to access this route`
      });
    }

    console.log('✅ Authorization successful for role:', req.admin.role);
    next();
  };
};

module.exports = { protect, authorize };