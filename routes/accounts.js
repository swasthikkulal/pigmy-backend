const express = require('express');
const router = express.Router();
const {
    getAllAccounts,
    getAccountById,
    createAccount,
    addTransaction,
    getAccountTransactions,
    updateAccountStatus,
    getAccountStats
} = require('../conroller/accountController');

router.route('/')
    .get(getAllAccounts)
    .post(createAccount);

router.route('/stats/overview')
    .get(getAccountStats);

router.route('/:id')
    .get(getAccountById);

router.route('/:id/transaction')
    .post(addTransaction);

router.route('/:id/transactions')
    .get(getAccountTransactions);

router.route('/:id/status')
    .patch(updateAccountStatus);

module.exports = router;