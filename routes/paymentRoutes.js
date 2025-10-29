// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { protect: adminProtect, authorize } = require('../middleware/authMiddleware');
const { protect: customerProtect } = require('../middleware/customerAuthMiddleware');
const { protect: collectorProtect } = require("../middleware/collectorAuthMiddleware");

console.log('=== DEBUGGING PAYMENT CONTROLLER ===');

// Debug the controller import
let paymentController;
try {
  paymentController = require('../conroller/paymentController'); // Make sure path is correct
  console.log('✓ Payment controller imported successfully');
  console.log('Controller object keys:', Object.keys(paymentController));

  // Check each function we need
  const requiredFunctions = [
    'processPayment', 'getPaymentHistory', 'getMyPayments', 'getAllPayments',
    'getPendingPayments', 'getPaymentStats', 'getPaymentById', 'updatePaymentStatus',
    'verifyPayment', 'deletePayment', 'bulkVerifyPayments', 'bulkCreatePayments',
    'getDailyCollections', 'getMonthlySummary'
  ];

  requiredFunctions.forEach(func => {
    if (typeof paymentController[func] !== 'function') {
      console.warn(`⚠️ Missing function: ${func}`);
      // Create a dummy function for missing ones
      paymentController[func] = (req, res) => res.status(501).json({
        success: false,
        message: `Function ${func} not implemented`
      });
    } else {
      console.log(`✓ ${func}: function`);
    }
  });

} catch (error) {
  console.log('✗ Error importing payment controller:', error.message);
  // Create dummy controller as fallback
  paymentController = {};
  const requiredFunctions = [
    'processPayment', 'getPaymentHistory', 'getMyPayments', 'getAllPayments',
    'getPendingPayments', 'getPaymentStats', 'getPaymentById', 'updatePaymentStatus',
    'verifyPayment', 'deletePayment', 'bulkVerifyPayments', 'bulkCreatePayments',
    'getDailyCollections', 'getMonthlySummary'
  ];

  requiredFunctions.forEach(func => {
    paymentController[func] = (req, res) => res.status(500).json({
      success: false,
      message: `Controller not loaded: ${func}`
    });
  });
}

// Test route first
router.get('/test', (req, res) => {
  res.json({ message: 'Payment routes test - working!' });
});

console.log('=== SETTING UP ROUTES ===');

// 🔒 PAYMENT ROUTES WITH PROPER AUTHENTICATION

// Collector route - protected by collector
router.get('/payments', collectorProtect, paymentController.getCollectorPayment)
router.patch('/:id/status', collectorProtect, paymentController.handleUpdateStatus)
// router.get('/collector/my-payments', adminProtect, authorize(['collector']), paymentController.getCollectorPayment);

// Customer routes - protected by customer auth
router.post('/process', customerProtect, paymentController.processPayment);
router.get('/customer/my-payments', customerProtect, paymentController.getMyPayments);
router.get('/account/:accountId/history', customerProtect, paymentController.getPaymentHistory);

// Admin/Collector routes - protected by admin auth
router.get('/', adminProtect, authorize(['admin', 'collector']), paymentController.getAllPayments);
router.get('/pending', adminProtect, authorize(['admin', 'collector']), paymentController.getPendingPayments);
router.get('/stats', adminProtect, authorize(['admin', 'collector']), paymentController.getPaymentStats);
router.get('/:id', adminProtect, authorize(['admin', 'collector']), paymentController.getPaymentById);
router.put('/:id/status', adminProtect, authorize(['admin', 'collector']), paymentController.updatePaymentStatus);
router.post('/:id/verify', adminProtect, authorize(['admin', 'collector']), paymentController.verifyPayment);
router.delete('/:id', adminProtect, authorize(['admin']), paymentController.deletePayment);
router.post('/bulk/verify', adminProtect, authorize(['admin', 'collector']), paymentController.bulkVerifyPayments);
router.post('/bulk/create', adminProtect, authorize(['admin', 'collector']), paymentController.bulkCreatePayments);
router.get('/reports/daily-collections', adminProtect, authorize(['admin', 'collector']), paymentController.getDailyCollections);
router.get('/reports/monthly-summary', adminProtect, authorize(['admin']), paymentController.getMonthlySummary);

console.log('=== ROUTES SETUP COMPLETE ===');

module.exports = router;