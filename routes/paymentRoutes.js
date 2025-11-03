const express = require('express');
const router = express.Router();
const { protect: adminProtect, authorize } = require('../middleware/authMiddleware');
const { protect: customerProtect } = require('../middleware/customerAuthMiddleware');
const { protect: collectorProtect } = require("../middleware/collectorAuthMiddleware");

console.log('=== DEBUGGING PAYMENT CONTROLLER ===');

// Debug the controller import
let paymentController;
try {
  paymentController = require('../conroller/paymentController');
  console.log('✓ Payment controller imported successfully');
  
  // Add withdrawal functions check
  const withdrawalFunctions = [
    'processWithdrawal', 'getWithdrawalHistory', 'approveWithdrawal', 
    'rejectWithdrawal', 'getPendingWithdrawals'
  ];
  
  withdrawalFunctions.forEach(func => {
    if (typeof paymentController[func] !== 'function') {
      console.warn(`⚠️ Missing withdrawal function: ${func}`);
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
  paymentController = {};
}

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Payment routes test - working!' });
});

console.log('=== SETTING UP ROUTES ===');

// 🔒 PAYMENT ROUTES WITH PROPER AUTHENTICATION

// In your payment routes
router.get('/account/:accountId', adminProtect, authorize(['admin', 'collector']), paymentController.getPaymentsByAccount);
// Collector routes
router.get('/payments', collectorProtect, paymentController.getCollectorPayment);
router.patch('/:id/status', collectorProtect, paymentController.handleUpdateStatus);

// Customer routes
router.post('/process', customerProtect, paymentController.processPayment);
router.get('/customer/my-payments', customerProtect, paymentController.getMyPayments);
router.get('/account/:accountId/history', customerProtect, paymentController.getPaymentHistory);
router.get('/acc/:accountId', adminProtect, paymentController.getPaymentHistory);

// 🔥 ADD WITHDRAWAL ROUTES - Customer
router.post('/withdraw', customerProtect, paymentController.processWithdrawal);
router.get('/account/:accountId/withdrawals', customerProtect, paymentController.getWithdrawalHistory);
router.get('/getuserpayments/:userid', customerProtect, paymentController.getAllPaymentsByUserId);

// Admin/Collector routes
router.get('/getallpayments/:userid', adminProtect, authorize(['admin', 'collector']), paymentController.getAllPaymentsByUserId);

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

// 🔥 ADD WITHDRAWAL ROUTES - Admin/Collector
router.get('/withdrawals/pending', collectorProtect, paymentController.getPendingWithdrawals);
router.put('/withdrawals/:id/approve', collectorProtect, paymentController.approveWithdrawal);
router.put('/withdrawals/:id/reject', collectorProtect, paymentController.rejectWithdrawal);

console.log('=== ROUTES SETUP COMPLETE ===');

module.exports = router;