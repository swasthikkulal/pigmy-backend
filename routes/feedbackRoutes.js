const express = require('express');
const router = express.Router();
const {
    createFeedback,
    getFeedback,
    getFeedbackById,
    updateFeedbackStatus,
    getMyFeedback,
    getFeedbackStats
} = require('../conroller/feedbackController');

const { protect: adminProtect, authorize } = require('../middleware/authMiddleware');
const { protect: collectorProtect } = require('../middleware/collectorAuthMiddleware');
const { protect: customerProtect } = require('../middleware/customerAuthMiddleware');

// Customer routes
router.post('/', customerProtect, createFeedback);
router.get('/customer/my-feedback', customerProtect, getMyFeedback);

// Collector routes
router.get('/collector', collectorProtect, getFeedback);
router.get('/collector/stats', collectorProtect, getFeedbackStats);

// Admin routes
router.get('/', adminProtect, authorize(['admin']), getFeedback);
router.get('/:id', adminProtect, authorize(['admin', 'collector']), getFeedbackById);
router.patch('/:id/status', adminProtect, authorize(['admin', 'collector']), updateFeedbackStatus);

module.exports = router;