const Account = require('../models/Account');
const Customer = require('../models/Customer');
const Collector = require('../models/Collector');

// @desc    Get all accounts
// @route   GET /api/accounts
// @access  Public
const getAllAccounts = async (req, res) => {
    try {
        const { customer, collector, status, page = 1, limit = 10 } = req.query;

        let query = {};

        // Filter by customer
        if (customer) {
            query.customerId = customer;
        }

        // Filter by collector
        if (collector) {
            query.collectorId = collector;
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        const accounts = await Account.find(query)
            .populate('customerId', 'name customerId phone')
            .populate('collectorId', 'name collectorId area')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Account.countDocuments(query);

        res.status(200).json({
            success: true,
            count: accounts.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: accounts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get single account
// @route   GET /api/accounts/:id
// @access  Public
const getAccountById = async (req, res) => {
    try {
        const account = await Account.findById(req.params.id)
            .populate('customerId', 'name customerId phone address')
            .populate('collectorId', 'name collectorId area phone');

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        res.status(200).json({
            success: true,
            data: account
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Create new account
// @route   POST /api/accounts
// @access  Public
const createAccount = async (req, res) => {
    try {
        const { accountNumber, customerId, collectorId } = req.body;

        // Check if account number already exists
        const existingAccount = await Account.findOne({ accountNumber });
        if (existingAccount) {
            return res.status(400).json({
                success: false,
                message: 'Account number already exists'
            });
        }

        // Verify customer exists
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(400).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Verify collector exists
        const collector = await Collector.findById(collectorId);
        if (!collector) {
            return res.status(400).json({
                success: false,
                message: 'Collector not found'
            });
        }

        // Check if customer already has an active account
        const existingCustomerAccount = await Account.findOne({
            customerId,
            status: 'active'
        });
        if (existingCustomerAccount) {
            return res.status(400).json({
                success: false,
                message: 'Customer already has an active account'
            });
        }

        const account = new Account(req.body);
        const newAccount = await account.save();

        // Populate customer and collector details
        await newAccount.populate('customerId', 'name customerId phone');
        await newAccount.populate('collectorId', 'name collectorId area');

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: newAccount
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Add transaction to account
// @route   POST /api/accounts/:id/transaction
// @access  Public
const addTransaction = async (req, res) => {
    try {
        const { amount, type, collectedBy } = req.body;

        const account = await Account.findById(req.params.id);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        if (account.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Cannot add transaction to inactive account'
            });
        }

        // Verify collector exists
        const collector = await Collector.findById(collectedBy);
        if (!collector) {
            return res.status(400).json({
                success: false,
                message: 'Collector not found'
            });
        }

        const transaction = {
            amount: parseFloat(amount),
            type,
            collectedBy
        };

        // Update account balance
        if (type === 'deposit') {
            account.totalBalance += transaction.amount;
        } else if (type === 'withdrawal') {
            if (account.totalBalance < transaction.amount) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient account balance'
                });
            }
            account.totalBalance -= transaction.amount;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction type'
            });
        }

        account.transactions.push(transaction);
        account.lastTransaction = new Date();

        await account.save();

        // Update customer's total savings
        const customer = await Customer.findById(account.customerId);
        if (customer) {
            if (type === 'deposit') {
                customer.totalSavings += transaction.amount;
            } else {
                customer.totalSavings -= transaction.amount;
            }
            customer.lastCollectionDate = new Date();
            await customer.save();
        }

        // Update collector's total collections
        await Collector.findByIdAndUpdate(collectedBy, {
            $inc: { totalCollections: 1 }
        });

        const updatedAccount = await Account.findById(req.params.id)
            .populate('customerId', 'name customerId phone')
            .populate('collectorId', 'name collectorId area');

        res.status(200).json({
            success: true,
            message: `Transaction ${type} successfully`,
            data: {
                account: updatedAccount,
                transaction: transaction
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get account transactions
// @route   GET /api/accounts/:id/transactions
// @access  Public
const getAccountTransactions = async (req, res) => {
    try {
        const account = await Account.findById(req.params.id)
            .select('transactions accountNumber')
            .populate('transactions.collectedBy', 'name collectorId');

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                accountNumber: account.accountNumber,
                transactions: account.transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Update account status
// @route   PATCH /api/accounts/:id/status
// @access  Public
const updateAccountStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ['active', 'closed', 'suspended'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const account = await Account.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        )
            .populate('customerId', 'name customerId phone')
            .populate('collectorId', 'name collectorId area');

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        // If closing account, set closing date
        if (status === 'closed') {
            account.closingDate = new Date();
            await account.save();
        }

        res.status(200).json({
            success: true,
            message: `Account status updated to ${status}`,
            data: account
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get account statistics
// @route   GET /api/accounts/stats/overview
// @access  Public
const getAccountStats = async (req, res) => {
    try {
        const totalAccounts = await Account.countDocuments();
        const activeAccounts = await Account.countDocuments({ status: 'active' });
        const closedAccounts = await Account.countDocuments({ status: 'closed' });

        const totalBalance = await Account.aggregate([
            { $group: { _id: null, total: { $sum: '$totalBalance' } } }
        ]);

        const recentTransactions = await Account.aggregate([
            { $unwind: '$transactions' },
            { $sort: { 'transactions.date': -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'customers',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            {
                $lookup: {
                    from: 'collectors',
                    localField: 'transactions.collectedBy',
                    foreignField: '_id',
                    as: 'collector'
                }
            },
            {
                $project: {
                    accountNumber: 1,
                    'customer.name': 1,
                    'collector.name': 1,
                    'transactions.amount': 1,
                    'transactions.type': 1,
                    'transactions.date': 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalAccounts,
                activeAccounts,
                closedAccounts,
                totalBalance: totalBalance[0]?.total || 0,
                recentTransactions
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

module.exports = {
    getAllAccounts,
    getAccountById,
    createAccount,
    addTransaction,
    getAccountTransactions,
    updateAccountStatus,
    getAccountStats
};  