const express = require('express');
const router = express.Router();
const {
    getAllAccounts,
    getAccountById,
    createAccount,
    getAccountsByCustomer,
    addTransaction,
    getAccountTransactions,
    updateAccountStatus,
    updateAccount,
    getAccountStats,
    deleteAccount
} = require('../conroller/accountController');

const { protect, authorize } = require('../middleware/authMiddleware'); // Admin middleware
const { protect: customerProtect } = require('../middleware/customerAuthMiddleware'); // Customer middleware

// ✅ CUSTOMER ROUTES - Use customer middleware
router.route('/customer/:customerId')
    .get(customerProtect, getAccountsByCustomer); // Use customerProtect instead of protect

// ✅ ADMIN-ONLY ROUTES - Use admin middleware
router.use(protect); // Apply admin protection
router.use(authorize(['admin'])); // Restrict to admin only

router.route('/')
    .get(getAllAccounts)
    .post(createAccount);

router.route('/stats/overview')
    .get(getAccountStats);

router.route('/:id')
    .get(getAccountById)
    .put(updateAccount)
    .delete(deleteAccount);

router.route('/:id/transaction')
    .post(addTransaction);

router.route('/:id/transactions')
    .get(getAccountTransactions);

router.route('/:id/status')
    .patch(updateAccountStatus);

module.exports = router;