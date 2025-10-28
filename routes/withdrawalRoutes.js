const express = require('express');
const router = express.Router();
const {
    createWithdrawalRequest,
    getWithdrawalRequests,
    getWithdrawalById,
    updateWithdrawalStatus,
    getMyWithdrawalRequests,
    getWithdrawalStats
} = require('../conroller/withdrawalController');

const { protect: adminProtect, authorize } = require('../middleware/authMiddleware');
const { protect: collectorProtect } = require('../middleware/collectorAuthMiddleware');
const { protect: customerProtect } = require('../middleware/customerAuthMiddleware');

// Customer routes
router.post('/', customerProtect, createWithdrawalRequest);
router.get('/customer/my-requests', customerProtect, getMyWithdrawalRequests);

// Collector routes
router.get('/collector/pending', collectorProtect, getWithdrawalRequests);
router.get('/collector/stats', collectorProtect, getWithdrawalStats);
router.patch('/:id/status', collectorProtect, updateWithdrawalStatus);

// Admin routes
router.get('/', adminProtect, authorize(['admin']), getWithdrawalRequests);
router.get('/:id', adminProtect, authorize(['admin', 'collector']), getWithdrawalById);

module.exports = router;