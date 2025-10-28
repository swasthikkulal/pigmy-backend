const express = require('express');
const {
  loginCollector,
  getMe,
  changePassword,
  updateProfile
} = require('../conroller/collectorAuthController');

const { protect } = require('../middleware/collectorAuthMiddleware');

const router = express.Router();

router.post('/login', loginCollector);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);

module.exports = router;