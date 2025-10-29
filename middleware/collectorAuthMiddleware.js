const jwt = require('jsonwebtoken');
const Collector = require('../models/Collector');
const JWT_SECRET = 'pigmy-collector-secret-2024';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET || 'your-secret-key');

      // Get collector from token
      req.collector = await Collector.findById(decoded.id).select('-password');

      if (!req.collector) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized as collector'
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

module.exports = { protect };