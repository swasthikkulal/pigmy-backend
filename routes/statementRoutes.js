const express = require('express');
const router = express.Router();
const {
    generateStatement,
    getStatements,
    getStatementById,
    getMyStatements,
    getStatementStats
} = require('../conroller/statementController');

const { protect: adminProtect, authorize } = require('../middleware/authMiddleware');
const { protect: collectorProtect } = require('../middleware/collectorAuthMiddleware');
const { protect: customerProtect } = require('../middleware/customerAuthMiddleware');

// Customer routes
router.get('/customer/my-statements', customerProtect, getMyStatements);

// Collector routes
router.get('/collector', collectorProtect, getStatements);
router.get('/collector/generate', collectorProtect, generateStatement);
router.get('/collector/stats', collectorProtect, getStatementStats);

// Admin routes
router.get('/', adminProtect, authorize(['admin']), getStatements);
router.get('/:id', adminProtect, authorize(['admin', 'collector']), getStatementById);
router.post('/generate', adminProtect, authorize(['admin']), generateStatement);

module.exports = router;