const express = require('express');
const router = express.Router();
const {
    getMyCustomers,
    getMyCollections,
    getMyWithdrawalRequests,
    getMyStatements,
    getMyFeedback,
    updateCollectionStatus,
    getCollectorDashboard
} = require('../conroller/collectorController');

const { loginCollector } = require('../conroller/collectorAuthController');
const { protect } = require('../middleware/collectorAuthMiddleware');

// Public routes
router.post('/login', loginCollector);

// Protected collector routes
router.use(protect);

// Collector dashboard
router.get('/dashboard', getCollectorDashboard);

// Customer management
router.get('/customers', getMyCustomers);

// Payment management
router.get('/collections', getMyCollections);
router.patch('/collections/:id/status', updateCollectionStatus);

// Withdrawal management
router.get('/withdrawals', getMyWithdrawalRequests);

// Statement management
router.get('/statements', getMyStatements);

// Feedback management
router.get('/feedback', getMyFeedback);

module.exports = router;