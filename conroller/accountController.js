const Account = require('../models/Account');
const Customer = require('../models/Customer');
const Collector = require('../models/Collector');
const Plan = require('../models/Plan');

// @desc    Get all accounts
// @route   GET /api/accounts
// @access  Public
// const getAllAccounts = async (req, res) => {
//     try {
//         const { customer, collector, status, page = 1, limit = 10 } = req.query;

//         let query = {};

//         // Filter by customer
//         if (customer) {
//             query.customerId = customer;
//         }

//         // Filter by collector
//         if (collector) {
//             query.collectorId = collector;
//         }

//         // Filter by status
//         if (status) {
//             query.status = status;
//         }

//         const accounts = await Account.find(query)
//             .populate('customerId', 'name customerId phone email address nomineeName')
//             .populate('collectorId', 'name collectorId area phone')
//             .populate('planId', 'name amount interestRate duration')
//             .sort({ createdAt: -1 })
//             .limit(limit * 1)
//             .skip((page - 1) * limit);

//         const total = await Account.countDocuments(query);

//         res.status(200).json({
//             success: true,
//             count: accounts.length,
//             total,
//             pages: Math.ceil(total / limit),
//             currentPage: parseInt(page),
//             data: accounts
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Server Error',
//             error: error.message
//         });
//     }
// };
// Update getAllAccounts to exclude deleted accounts by default
const getAllAccounts = async (req, res) => {
    try {
        const { customer, collector, status, page = 1, limit = 10, includeDeleted = false } = req.query;

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

        // Exclude deleted accounts by default
        if (!includeDeleted) {
            query.status = { $ne: 'deleted' };
        }

        const accounts = await Account.find(query)
            .populate('customerId', 'name customerId phone email address nomineeName')
            .populate('collectorId', 'name collectorId area phone')
            .populate('planId', 'name amount interestRate duration')
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
            .populate('customerId', 'name customerId phone email address nomineeName')
            .populate('collectorId', 'name collectorId area phone')
            .populate('planId', 'name amount interestRate duration');

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
// const createAccount = async (req, res) => {
//     try {
//         const { accountNumber, accountId, customerId, collectorId, planId } = req.body;
// console.log(req.body)
// console.log("hello")
//         // Check if account number already exists
//         const existingAccountByNumber = await Account.findOne({ accountNumber });
//         if (existingAccountByNumber) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Account number already exists'
//             });
//         }

//         // Check if account ID already exists
//         const existingAccountById = await Account.findOne({ accountId });
//         if (existingAccountById) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Account ID already exists'
//             });
//         }

//         // Verify customer exists
//         const customer = await Customer.findById(customerId);
//         if (!customer) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Customer not found'
//             });
//         }

//         // Verify collector exists
//         const collector = await Collector.findById(collectorId);
//         if (!collector) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Collector not found'
//             });
//         }

//         // Verify plan exists if provided
//         if (planId) {
//             const plan = await Plan.findById(planId);
//             if (!plan) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Plan not found'
//                 });
//             }
//         }

//         // REMOVED: Check if customer already has an active account
//         // This allows same customer to have multiple accounts

//         // Set default values for pigmy account fields
//         const accountData = {
//             ...req.body,
//             totalBalance: 0, // Initialize with zero balance
//             transactions: [], // Initialize empty transactions array
//             openingDate: req.body.startDate || new Date(), // Use startDate as openingDate
//             status: req.body.status || 'active'
//         };

//         const account = new Account(accountData);
//         const newAccount = await account.save();

//         // Populate all details
//         await newAccount.populate('customerId', 'name customerId phone email address nomineeName');
//         await newAccount.populate('collectorId', 'name collectorId area phone');
//         await newAccount.populate('planId', 'name amount interestRate duration');

//         res.status(201).json({
//             success: true,
//             message: 'Account created successfully',
//             data: newAccount
//         });
//     } catch (error) {
//         if (error.name === 'ValidationError') {
//             const messages = Object.values(error.errors).map(val => val.message);
//             return res.status(400).json({
//                 success: false,
//                 message: 'Validation Error',
//                 errors: messages
//             });
//         }

//         res.status(500).json({
//             success: false,
//             message: 'Server Error',
//             error: error.message
//         });
//     }
// };
// @desc    Create new account
// @route   POST /api/accounts
// @access  Public
// const createAccount = async (req, res) => {
//     try {
//         console.log("Received account creation request:", req.body);

//         const { accountNumber, customerId, collectorId, planId } = req.body;

//         // ✅ ONLY check accountNumber - REMOVE ALL accountId CHECKS
//         const existingAccount = await Account.findOne({ accountNumber });
//         if (existingAccount) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Account number already exists'
//             });
//         }

//         // Verify customer exists
//         const customer = await Customer.findById(customerId);
//         if (!customer) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Customer not found'
//             });
//         }

//         // Verify collector exists
//         const collector = await Collector.findById(collectorId);
//         if (!collector) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Collector not found'
//             });
//         }

//         // Verify plan exists if provided
//         if (planId) {
//             const plan = await Plan.findById(planId);
//             if (!plan) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Plan not found'
//                 });
//             }
//         }

//         // Prepare account data
//         const accountData = {
//             accountNumber: req.body.accountNumber,
//             customerId: req.body.customerId,
//             collectorId: req.body.collectorId,
//             planId: req.body.planId,
//             accountType: req.body.accountType,
//             dailyAmount: req.body.dailyAmount,
//             startDate: req.body.startDate,
//             duration: req.body.duration,
//             status: req.body.status || 'active',
//             remarks: req.body.remarks,
//             interestRate: req.body.interestRate,
//             totalDays: req.body.totalDays,
//             maturityDate: req.body.maturityDate,
//             customerName: req.body.customerName,
//             planName: req.body.planName,
//             collectorName: req.body.collectorName,
//             maturityStatus: req.body.maturityStatus || 'Pending',
//             openingDate: req.body.startDate || new Date(),
//             totalBalance: 0,
//             totalDeposits: 0,
//             transactions: []
//         };

//         console.log("Creating account with data:", accountData);

//         const account = new Account(accountData);
//         const newAccount = await account.save();

//         // Populate all details
//         await newAccount.populate('customerId', 'name customerId phone email address nomineeName');
//         await newAccount.populate('collectorId', 'name collectorId area phone');
//         await newAccount.populate('planId', 'name amount interestRate duration');

//         console.log("Account created successfully:", newAccount.accountNumber);

//         res.status(201).json({
//             success: true,
//             message: 'Account created successfully',
//             data: newAccount
//         });
//     } catch (error) {
//         console.error("Account creation error:", error);

//         if (error.name === 'ValidationError') {
//             const messages = Object.values(error.errors).map(val => val.message);
//             return res.status(400).json({
//                 success: false,
//                 message: 'Validation Error',
//                 errors: messages
//             });
//         }

//         res.status(500).json({
//             success: false,
//             message: 'Server Error',
//             error: error.message
//         });
//     }
// };
// @desc    Create new account
// @route   POST /api/accounts
// @access  Public
// @desc    Create new account
// @route   POST /api/accounts
// @access  Public
const createAccount = async (req, res) => {
    try {
        console.log("Received account creation request:", req.body);

        const { accountNumber, customerId, collectorId, planId, accountType, dailyAmount, startDate, duration } = req.body;

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

        // Verify plan exists if provided and get plan details
        let plan = null;
        if (planId) {
            plan = await Plan.findById(planId);
            if (!plan) {
                return res.status(400).json({
                    success: false,
                    message: 'Plan not found'
                });
            }
        }

        // ✅ Calculate necessary fields on the backend
        const calculateTotalDays = (duration, accountType) => {
            const durationValue = parseInt(duration);
            switch (accountType?.toLowerCase()) {
                case 'daily':
                    return durationValue;
                case 'weekly':
                    return durationValue * 7;
                case 'monthly':
                    return durationValue * 30;
                default:
                    return durationValue * 30;
            }
        };

        const calculateMaturityDate = (startDate, duration, accountType) => {
            const start = new Date(startDate);
            const maturity = new Date(start);
            const durationValue = parseInt(duration);

            switch (accountType?.toLowerCase()) {
                case 'daily':
                    maturity.setDate(maturity.getDate() + durationValue);
                    break;
                case 'weekly':
                    maturity.setDate(maturity.getDate() + durationValue * 7);
                    break;
                case 'monthly':
                    maturity.setMonth(maturity.getMonth() + durationValue);
                    break;
                default:
                    maturity.setMonth(maturity.getMonth() + durationValue);
            }
            return maturity;
        };

        // Prepare account data with only essential fields + calculated fields
        const accountData = {
            // Essential form data
            accountNumber: accountNumber,
            customerId: customerId,
            collectorId: collectorId,
            planId: planId,
            accountType: accountType,
            dailyAmount: dailyAmount,
            startDate: startDate,
            duration: duration,
            status: req.body.status || 'active',
            remarks: req.body.remarks || '',

            // Calculated fields
            interestRate: plan?.interestRate || 6.5,
            totalDays: calculateTotalDays(duration, accountType),
            maturityDate: calculateMaturityDate(startDate, duration, accountType),

            // Default values
            totalBalance: 0,
            totalDeposits: 0,
            transactions: [],
            openingDate: startDate || new Date(),
            maturityStatus: 'Pending',
            customerName: customer?.name,
            planName: plan?.name,
            collectorName: collector?.name
        };

        console.log("Creating account with processed data:", accountData);

        const account = new Account(accountData);
        const newAccount = await account.save();

        // Populate all details for response
        await newAccount.populate('customerId', 'name customerId phone email address nomineeName');
        await newAccount.populate('collectorId', 'name collectorId area phone');
        await newAccount.populate('planId', 'name amount interestRate duration');

        console.log("Account created successfully:", newAccount.accountNumber);

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: newAccount
        });
    } catch (error) {
        console.error("Account creation error:", error);

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
// @desc    Get accounts by customer
// @route   GET /api/accounts/customer/:customerId
// @access  Public
const getAccountsByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { status } = req.query;

        let query = { customerId };

        // Filter by status if provided
        if (status) {
            query.status = status;
        }

        const accounts = await Account.find(query)
            .populate('customerId', 'name customerId phone email address nomineeName')
            .populate('collectorId', 'name collectorId area phone')
            .populate('planId', 'name amount interestRate duration')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: accounts.length,
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

        // Update customer's total savings (across all accounts)
        const customer = await Customer.findById(account.customerId);
        if (customer) {
            // Calculate total savings from all active accounts
            const activeAccounts = await Account.find({
                customerId: account.customerId,
                status: 'active'
            });

            const totalSavings = activeAccounts.reduce((total, acc) => total + (acc.totalBalance || 0), 0);
            customer.totalSavings = totalSavings;
            customer.lastCollectionDate = new Date();
            await customer.save();
        }

        // Update collector's total collections
        await Collector.findByIdAndUpdate(collectedBy, {
            $inc: { totalCollections: 1 },
            lastCollectionDate: new Date()
        });

        const updatedAccount = await Account.findById(req.params.id)
            .populate('customerId', 'name customerId phone email address nomineeName')
            .populate('collectorId', 'name collectorId area phone')
            .populate('planId', 'name amount interestRate duration');

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
// const getAccountTransactions = async (req, res) => {
//     try {
//         const account = await Account.findById(req.params.id)
//             .select('transactions accountNumber accountId')
//             .populate('transactions.collectedBy', 'name collectorId');

//         if (!account) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Account not found'
//             });
//         }

//         res.status(200).json({
//             success: true,
//             data: {
//                 accountNumber: account.accountNumber,
//                 accountId: account.accountId,
//                 transactions: account.transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Server Error',
//             error: error.message
//         });
//     }
// };
const getAccountTransactions = async (req, res) => {
    try {
        const account = await Account.findById(req.params.id)
            .select('transactions accountNumber accountId collectorId')
            .populate('collectorId', 'name collectorId') // Populate account-level collector
            .populate('transactions.verifiedBy', 'name collectorId'); // Populate transaction verifier

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        // Format transactions with collector information
        const formattedTransactions = account.transactions.map(transaction => {
            // Use verifiedBy if available, otherwise use account-level collector
            const collectedBy = transaction.verifiedBy || account.collectorId;
            
            return {
                ...transaction.toObject(),
                collectedBy: collectedBy ? {
                    name: collectedBy.name,
                    collectorId: collectedBy.collectorId
                } : null
            };
        });

        // Sort transactions by date (newest first)
        const sortedTransactions = formattedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({
            success: true,
            data: {
                accountNumber: account.accountNumber,
                accountId: account.accountId,
                collector: account.collectorId ? {
                    name: account.collectorId.name,
                    collectorId: account.collectorId.collectorId
                } : null,
                transactions: sortedTransactions
            }
        });
    } catch (error) {
        console.error('Error fetching account transactions:', error);
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

        const validStatuses = ['active', 'closed', 'suspended', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const updateData = { status };

        // If closing account, set closing date
        if (status === 'closed' || status === 'completed') {
            updateData.closingDate = new Date();

            // If completed, also set maturity status to Paid
            if (status === 'completed') {
                updateData.maturityStatus = 'Paid';
                updateData.withdrawalDate = new Date();
            }
        }

        const account = await Account.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        )
            .populate('customerId', 'name customerId phone email address nomineeName')
            .populate('collectorId', 'name collectorId area phone')
            .populate('planId', 'name amount interestRate duration');

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        // Update customer's total savings when account status changes
        if (status === 'closed' || status === 'completed' || status === 'active') {
            const customer = await Customer.findById(account.customerId);
            if (customer) {
                const activeAccounts = await Account.find({
                    customerId: account.customerId,
                    status: 'active'
                });

                const totalSavings = activeAccounts.reduce((total, acc) => total + (acc.totalBalance || 0), 0);
                customer.totalSavings = totalSavings;
                await customer.save();
            }
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

// @desc    Update account details
// @route   PUT /api/accounts/:id
// @access  Public
const updateAccount = async (req, res) => {
    try {
        const account = await Account.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('customerId', 'name customerId phone email address nomineeName')
            .populate('collectorId', 'name collectorId area phone')
            .populate('planId', 'name amount interestRate duration');

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Account updated successfully',
            data: account
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

// @desc    Get account statistics
// @route   GET /api/accounts/stats/overview
// @access  Public
const getAccountStats = async (req, res) => {
    try {
        const totalAccounts = await Account.countDocuments();
        const activeAccounts = await Account.countDocuments({ status: 'active' });
        const closedAccounts = await Account.countDocuments({ status: 'closed' });
        const completedAccounts = await Account.countDocuments({ status: 'completed' });

        // Get unique customers with accounts
        const uniqueCustomers = await Account.distinct('customerId');

        const totalBalance = await Account.aggregate([
            { $group: { _id: null, total: { $sum: '$totalBalance' } } }
        ]);

        const totalDailyAmount = await Account.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: null, total: { $sum: '$dailyAmount' } } }
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
                    accountId: 1,
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
                completedAccounts,
                uniqueCustomers: uniqueCustomers.length,
                totalBalance: totalBalance[0]?.total || 0,
                totalDailyAmount: totalDailyAmount[0]?.total || 0,
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
// @desc    Soft delete an account (recommended)
// @route   DELETE /api/accounts/:id
// @access  Private/Admin
// @desc    Force delete account (with transaction handling)
// @route   DELETE /api/accounts/:id
// @access  Private/Admin
const deleteAccount = async (req, res) => {
  try {
    const { force } = req.query; // Add force parameter
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Check if account has transactions or balance
    const hasTransactions = account.transactions && account.transactions.length > 0;
    const hasBalance = account.totalBalance > 0;

    if ((hasTransactions || hasBalance) && !force) {
      return res.status(400).json({
        success: false,
        message: 'Account has transaction history or balance',
        data: {
          transactionsCount: account.transactions?.length || 0,
          currentBalance: account.totalBalance,
          suggestion: 'Use ?force=true to delete anyway, or close the account instead'
        }
      });
    }

    // If force delete, log the action for audit
    if (force) {
      console.log(`FORCE DELETING account ${account.accountNumber} with ${account.transactions?.length} transactions and balance ${account.totalBalance}`);
      
      // Optional: Create audit log before deletion
      // await createAuditLog({
      //   action: 'FORCE_DELETE_ACCOUNT',
      //   accountId: account._id,
      //   details: {
      //     transactionsCount: account.transactions?.length,
      //     balance: account.totalBalance,
      //     deletedBy: req.user.id
      //   }
      // });
    }

    await Account.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: force ? 'Account force deleted successfully' : 'Account deleted successfully',
      data: {
        deletedAccount: {
          id: account._id,
          accountNumber: account.accountNumber,
          hadTransactions: hasTransactions,
          hadBalance: hasBalance
        }
      }
    });

  } catch (error) {
    console.error("Account deletion error:", error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account',
      error: error.message
    });
  }
};

module.exports = {
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
};