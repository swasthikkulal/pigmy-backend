const express = require('express');
const router = express.Router();

// Fix the import path - use 'conroller' since that's your folder name
const {
  loginCustomer,
  getMe,
  changePassword
} = require('../conroller/customerAuthController');

const { protect } = require('../middleware/customerAuthMiddleware');

// Customer authentication routes
router.post('/login', loginCustomer);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

// Add a test route to verify it's working
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Customer auth routes are working!' 
  });
});

module.exports = router;