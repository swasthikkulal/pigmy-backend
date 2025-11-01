// routes/feedbackRoutes.js
const express = require('express');
const router = express.Router();
const {
    createFeedback,
    getFeedback,
    getFeedbackById,
    updateFeedbackStatus,
    getMyFeedback,
    getFeedbackStats,
    getFeedbackOverview
} = require('../conroller/feedbackController');

const { protect: adminProtect, authorize } = require('../middleware/authMiddleware');
const { protect: customerProtect } = require('../middleware/customerAuthMiddleware');
const { protect: collectorProtect } = require('../middleware/collectorAuthMiddleware');

// Test endpoint
router.get('/test-auth', adminProtect, authorize(['admin']), (req, res) => {
  console.log('✅ Test auth route - Admin authenticated:', req.admin);
  res.json({
    success: true,
    message: 'Authentication successful!',
    admin: {
      id: req.admin._id,
      email: req.admin.email,
      role: req.admin.role
    }
  });
});

// Customer routes
router.post('/', customerProtect, createFeedback);
router.get('/customer/my-feedback', customerProtect, getMyFeedback);

// Collector routes (NEW)
// router.post('/collector', collectorProtect, createFeedback);
// router.get('/collector/my-feedback', collectorProtect, getMyFeedback);

// Admin routes
router.get('/admin/list', adminProtect, authorize(['admin']), getFeedback);
router.get('/admin/stats/overview', adminProtect, authorize(['admin']), getFeedbackOverview);
router.get('/admin/:id', adminProtect, authorize(['admin']), getFeedbackById);
router.patch('/admin/:id/status', adminProtect, authorize(['admin']), updateFeedbackStatus);

module.exports = router;