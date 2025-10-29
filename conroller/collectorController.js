const Collector = require('../models/Collector');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Withdrawal = require('../models/Withdrawal');
const Feedback = require('../models/Feedback');
const Statement = require('../models/Statement');
const Account = require("../models/Account")

// @desc    Get all collectors
// @route   GET /api/collectors
// @access  Public
const getAllCollectors = async (req, res) => {
    try {
        const collectors = await Collector.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: collectors.length,
            data: collectors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get single collector
// @route   GET /api/collectors/:id
// @access  Public
const getCollectorById = async (req, res) => {
    try {
        const collector = await Collector.findById(req.params.id);

        if (!collector) {
            return res.status(404).json({
                success: false,
                message: 'Collector not found'
            });
        }

        // Get collector's customers count
        const customerCount = await Customer.countDocuments({
            collectorId: collector._id
        });

        res.status(200).json({
            success: true,
            data: {
                ...collector._doc,
                customerCount
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

// @desc    Create new collector
// @route   POST /api/collectors
// @access  Public
// const createCollector = async (req, res) => {
//     try {
//         const { collectorId, email, phone } = req.body;

//         // Check if collector ID already exists
//         const existingCollectorId = await Collector.findOne({ collectorId });
//         if (existingCollectorId) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Collector ID already exists'
//             });
//         }

//         // Check if email already exists
//         const existingEmail = await Collector.findOne({ email });
//         if (existingEmail) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Email already exists'
//             });
//         }

//         // Check if phone already exists
//         const existingPhone = await Collector.findOne({ phone });
//         if (existingPhone) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Phone number already exists'
//             });
//         }

//         const collector = new Collector(req.body);
//         const newCollector = await collector.save();

//         res.status(201).json({
//             success: true,
//             message: 'Collector created successfully',
//             data: newCollector
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

const createCollector = async (req, res) => {
    try {
        const { collectorId, email, phone } = req.body;

        // Check if collector ID already exists
        const existingCollectorId = await Collector.findOne({ collectorId });
        if (existingCollectorId) {
            return res.status(400).json({
                success: false,
                message: 'Collector ID already exists'
            });
        }

        // Check if email already exists
        const existingEmail = await Collector.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Check if phone already exists
        const existingPhone = await Collector.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number already exists'
            });
        }

        // SIMPLE FIX: Auto-set password to phone number
        const collectorData = {
            ...req.body,
            password: req.body.phone // Set password = phone number
        };

        const collector = new Collector(collectorData);
        const newCollector = await collector.save();

        res.status(201).json({
            success: true,
            message: 'Collector created successfully',
            data: newCollector
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

// @desc    Update collector
// @route   PUT /api/collectors/:id
// @access  Public
// const updateCollector = async (req, res) => {
//     try {
//         const { collectorId, email, phone } = req.body;

//         // Check for duplicate collector ID (excluding current collector)
//         if (collectorId) {
//             const existingCollectorId = await Collector.findOne({
//                 collectorId,
//                 _id: { $ne: req.params.id }
//             });
//             if (existingCollectorId) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Collector ID already exists'
//                 });
//             }
//         }

//         // Check for duplicate email (excluding current collector)
//         if (email) {
//             const existingEmail = await Collector.findOne({
//                 email,
//                 _id: { $ne: req.params.id }
//             });
//             if (existingEmail) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Email already exists'
//                 });
//             }
//         }

//         // Check for duplicate phone (excluding current collector)
//         if (phone) {
//             const existingPhone = await Collector.findOne({
//                 phone,
//                 _id: { $ne: req.params.id }
//             });
//             if (existingPhone) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Phone number already exists'
//                 });
//             }
//         }

//         const collector = await Collector.findByIdAndUpdate(
//             req.params.id,
//             req.body,
//             {
//                 new: true,
//                 runValidators: true
//             }
//         );

//         if (!collector) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Collector not found'
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: 'Collector updated successfully',
//             data: collector
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
const updateCollector = async (req, res) => {
    try {
        const { collectorId, email, phone } = req.body;

        // Check for duplicate collector ID (excluding current collector)
        if (collectorId) {
            const existingCollectorId = await Collector.findOne({
                collectorId,
                _id: { $ne: req.params.id }
            });
            if (existingCollectorId) {
                return res.status(400).json({
                    success: false,
                    message: 'Collector ID already exists'
                });
            }
        }

        // Check for duplicate email (excluding current collector)
        if (email) {
            const existingEmail = await Collector.findOne({
                email,
                _id: { $ne: req.params.id }
            });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        // Check for duplicate phone (excluding current collector)
        if (phone) {
            const existingPhone = await Collector.findOne({
                phone,
                _id: { $ne: req.params.id }
            });
            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number already exists'
                });
            }
        }

        // SIMPLE FIX: If phone is updated, also update password
        const updateData = { ...req.body };
        if (phone) {
            updateData.password = phone; // Keep password in sync with phone
        }

        const collector = await Collector.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!collector) {
            return res.status(404).json({
                success: false,
                message: 'Collector not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Collector updated successfully',
            data: collector
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

// @desc    Delete collector
// @route   DELETE /api/collectors/:id
// @access  Public
const deleteCollector = async (req, res) => {
    try {
        const collector = await Collector.findById(req.params.id);

        if (!collector) {
            return res.status(404).json({
                success: false,
                message: 'Collector not found'
            });
        }

        // Check if collector has customers
        const customerCount = await Customer.countDocuments({
            collectorId: collector._id
        });

        if (customerCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete collector with assigned customers. Please reassign customers first.'
            });
        }

        await Collector.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Collector deleted successfully',
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get collector statistics
// @route   GET /api/collectors/:id/stats
// @access  Public
const getCollectorStats = async (req, res) => {
    try {
        const collector = await Collector.findById(req.params.id);

        if (!collector) {
            return res.status(404).json({
                success: false,
                message: 'Collector not found'
            });
        }

        const customerCount = await Customer.countDocuments({
            collectorId: collector._id
        });

        const activeCustomers = await Customer.countDocuments({
            collectorId: collector._id,
            status: 'active'
        });

        const totalSavings = await Customer.aggregate([
            { $match: { collectorId: collector._id } },
            { $group: { _id: null, total: { $sum: '$totalSavings' } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                collector: collector.name,
                totalCustomers: customerCount,
                activeCustomers,
                totalSavings: totalSavings[0]?.total || 0
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

// ==================== COLLECTOR FUNCTIONALITY METHODS ====================

// @desc    Get my customers
// @route   GET /api/collectors/my/customers
// @access  Private (Collector)
// const getMyCustomers = async (req, res) => {
//     try {
//         const { page = 1, limit = 10, search } = req.query;
        
//         let query = { collectorId: req.collector._id };
        
//         // Add search functionality
//         if (search) {
//             query.$or = [
//                 { name: { $regex: search, $options: 'i' } },
//                 { phone: { $regex: search, $options: 'i' } },
//                 { email: { $regex: search, $options: 'i' } }
//             ];
//         }

//         const customers = await Customer.find(query)
//             .select('name phone email address totalSavings lastPaymentDate status')
//             .sort({ name: 1 })
//             .limit(limit * 1)
//             .skip((page - 1) * limit);

//         const total = await Customer.countDocuments(query);

//         // Get today's collections count
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         const todaysCollections = await Payment.countDocuments({
//             collectedBy: req.collector._id,
//             paymentDate: { $gte: today }
//         });

//         res.status(200).json({
//             success: true,
//             data: customers,
//             stats: {
//                 totalCustomers: total,
//                 todaysCollections
//             },
//             pagination: {
//                 current: page,
//                 pages: Math.ceil(total / limit),
//                 total,
//             },
//         });
//     } catch (error) {
//         console.error('Get my customers error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server error',
//             error: error.message,
//         });
//     }
// };
const getMyCustomers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        
        // Get accounts for this collector and populate customer data
        let accountQuery = { 
            collectorId: req.collector._id, 
            status: 'active' 
        };

        // Build aggregation pipeline for better performance
        const aggregationPipeline = [
            {
                $match: accountQuery
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            {
                $unwind: {
                    path: '$customer',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'plans',
                    localField: 'planId',
                    foreignField: '_id',
                    as: 'plan'
                }
            },
            {
                $unwind: {
                    path: '$plan',
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        // Add search filter if provided
        if (search) {
            aggregationPipeline.push({
                $match: {
                    $or: [
                        { 'customer.name': { $regex: search, $options: 'i' } },
                        { 'customer.phone': { $regex: search, $options: 'i' } },
                        { 'customer.email': { $regex: search, $options: 'i' } },
                        { 'customer.customerId': { $regex: search, $options: 'i' } },
                        { 'accountNumber': { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }

        // Group by customer to get unique customers
        aggregationPipeline.push(
            {
                $group: {
                    _id: '$customer._id',
                    customer: { $first: '$customer' },
                    accounts: { 
                        $push: {
                            accountNumber: '$accountNumber',
                            planName: '$plan.name',
                            dailyAmount: '$dailyAmount',
                            status: '$status',
                            currentBalance: '$currentBalance',
                            maturityDate: '$maturityDate',
                            startDate: '$startDate'
                        }
                    },
                    totalAccounts: { $sum: 1 },
                    activeAccounts: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    totalDailyAmount: { $sum: '$dailyAmount' },
                    totalBalance: { $sum: '$currentBalance' }
                }
            },
            {
                $project: {
                    _id: '$customer._id',
                    name: '$customer.name',
                    phone: '$customer.phone',
                    email: '$customer.email',
                    address: '$customer.address',
                    nomineeName: '$customer.nomineeName',
                    customerId: '$customer.customerId',
                    totalSavings: '$customer.totalSavings',
                    lastPaymentDate: '$customer.lastPaymentDate',
                    status: '$customer.status',
                    createdAt: '$customer.createdAt',
                    totalAccounts: 1,
                    activeAccounts: 1,
                    totalDailyAmount: 1,
                    totalBalance: 1,
                    accounts: 1
                }
            },
            {
                $sort: { name: 1 }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: limit * 1
            }
        );

        const customers = await Account.aggregate(aggregationPipeline);

        // Get total count for pagination
        const countPipeline = [
            {
                $match: accountQuery
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            {
                $unwind: '$customer'
            },
            {
                $group: {
                    _id: '$customer._id'
                }
            },
            {
                $count: 'total'
            }
        ];

        if (search) {
            countPipeline.splice(2, 0, {
                $match: {
                    $or: [
                        { 'customer.name': { $regex: search, $options: 'i' } },
                        { 'customer.phone': { $regex: search, $options: 'i' } },
                        { 'customer.email': { $regex: search, $options: 'i' } },
                        { 'customer.customerId': { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }

        const totalResult = await Account.aggregate(countPipeline);
        const total = totalResult.length > 0 ? totalResult[0].total : 0;

        // Get today's collections count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaysCollections = await Payment.countDocuments({
            collectorId: req.collector._id,
            paymentMethod: 'cash',
            status: { $in: ['completed', 'verified'] },
            date: { $gte: today }
        });

        const pendingCollections = await Payment.countDocuments({
            collectorId: req.collector._id,
            paymentMethod: 'cash',
            status: 'pending'
        });

        // Calculate total daily collection from active accounts
        const totalDailyCollectionResult = await Account.aggregate([
            {
                $match: { 
                    collectorId: req.collector._id, 
                    status: 'active' 
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$dailyAmount' }
                }
            }
        ]);

        const totalDailyCollection = totalDailyCollectionResult.length > 0 ? totalDailyCollectionResult[0].total : 0;

        res.status(200).json({
            success: true,
            data: customers,
            stats: {
                totalCustomers: total,
                totalAccounts: await Account.countDocuments(accountQuery),
                todaysCollections,
                pendingCollections,
                totalDailyCollection
            },
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total,
            },
        });
    } catch (error) {
        console.error('Get my customers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Get my collections
// @route   GET /api/collectors/my/collections
// @access  Private (Collector)
const getMyCollections = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, startDate, endDate } = req.query;
        
        let query = { collectedBy: req.collector._id };
        if (status) query.status = status;

        // Date range filter
        if (startDate || endDate) {
            query.paymentDate = {};
            if (startDate) query.paymentDate.$gte = new Date(startDate);
            if (endDate) query.paymentDate.$lte = new Date(endDate);
        }

        const collections = await Payment.find(query)
            .populate('accountId', 'accountNumber accountType')
            .populate('customerId', 'name phone address')
            .sort({ paymentDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Payment.countDocuments(query);

        // Calculate totals
        const totalAmount = await Payment.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.status(200).json({
            success: true,
            data: collections,
            summary: {
                totalAmount: totalAmount[0]?.total || 0,
                totalCollections: total
            },
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
            },
        });
    } catch (error) {
        console.error('Get my collections error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Get my withdrawal requests
// @route   GET /api/collectors/my/withdrawals
// @access  Private (Collector)
const getMyWithdrawalRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        let query = {};
        if (status) query.status = status;

        // Get customers assigned to this collector
        const myCustomers = await Customer.find({ collectorId: req.collector._id });
        const customerIds = myCustomers.map(customer => customer._id);

        query.customerId = { $in: customerIds };

        const withdrawals = await Withdrawal.find(query)
            .populate('accountId', 'accountNumber accountType')
            .populate('customerId', 'name phone address')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Withdrawal.countDocuments(query);

        res.status(200).json({
            success: true,
            data: withdrawals,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
            },
        });
    } catch (error) {
        console.error('Get my withdrawals error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Get my statements
// @route   GET /api/collectors/my/statements
// @access  Private (Collector)
const getMyStatements = async (req, res) => {
    try {
        const { page = 1, limit = 10, type } = req.query;
        
        let query = { generatedBy: req.collector._id };
        if (type) query.type = type;

        const statements = await Statement.find(query)
            .populate('accountId', 'accountNumber accountType')
            .populate('customerId', 'name phone')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Statement.countDocuments(query);

        res.status(200).json({
            success: true,
            data: statements,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
            },
        });
    } catch (error) {
        console.error('Get my statements error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Get my feedback
// @route   GET /api/collectors/my/feedback
// @access  Private (Collector)
const getMyFeedback = async (req, res) => {
    try {
        const { status, type, page = 1, limit = 10 } = req.query;
        
        let query = { assignedTo: req.collector._id };
        if (status) query.status = status;
        if (type) query.type = type;

        const feedback = await Feedback.find(query)
            .populate('customerId', 'name phone email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Feedback.countDocuments(query);

        res.status(200).json({
            success: true,
            data: feedback,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
            },
        });
    } catch (error) {
        console.error('Get my feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Update collection status
// @route   PATCH /api/collectors/collection/:id/status
// @access  Private (Collector)
const updateCollectionStatus = async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const { id } = req.params;

        const payment = await Payment.findById(id);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found',
            });
        }

        // Verify collector owns this payment
        if (payment.collectedBy.toString() !== req.collector._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this payment',
            });
        }

        payment.status = status;
        if (remarks) payment.remarks = remarks;
        await payment.save();

        res.status(200).json({
            success: true,
            message: 'Payment status updated successfully',
            data: payment,
        });
    } catch (error) {
        console.error('Update collection status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Get collector dashboard stats
// @route   GET /api/collectors/my/dashboard
// @access  Private (Collector)
const getCollectorDashboard = async (req, res) => {
    try {
        const collectorId = req.collector._id;

        // Today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get customer stats
        const totalCustomers = await Customer.countDocuments({ collectorId });
        const activeCustomers = await Customer.countDocuments({ 
            collectorId, 
            status: 'active' 
        });

        // Get collection stats
        const totalCollections = await Payment.countDocuments({ collectedBy: collectorId });
        const todaysCollections = await Payment.countDocuments({
            collectedBy: collectorId,
            paymentDate: { $gte: today, $lt: tomorrow }
        });

        // Get amount stats
        const totalAmount = await Payment.aggregate([
            { $match: { collectedBy: collectorId } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const todaysAmount = await Payment.aggregate([
            { 
                $match: { 
                    collectedBy: collectorId,
                    paymentDate: { $gte: today, $lt: tomorrow }
                } 
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Get pending withdrawals
        const pendingWithdrawals = await Withdrawal.countDocuments({
            status: 'pending',
            customerId: { 
                $in: await Customer.find({ collectorId }).distinct('_id') 
            }
        });

        // Get open feedback
        const openFeedback = await Feedback.countDocuments({
            assignedTo: collectorId,
            status: 'open'
        });

        res.status(200).json({
            success: true,
            data: {
                customerStats: {
                    total: totalCustomers,
                    active: activeCustomers
                },
                collectionStats: {
                    total: totalCollections,
                    today: todaysCollections,
                    totalAmount: totalAmount[0]?.total || 0,
                    todaysAmount: todaysAmount[0]?.total || 0
                },
                pendingTasks: {
                    withdrawals: pendingWithdrawals,
                    feedback: openFeedback
                },
                collector: {
                    name: req.collector.name,
                    area: req.collector.area,
                    collectorId: req.collector.collectorId
                }
            }
        });
    } catch (error) {
        console.error('Get collector dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

module.exports = {
    getAllCollectors,
    getCollectorById,
    createCollector,
    updateCollector,
    deleteCollector,
    getCollectorStats,
    // New collector functionality methods
    getMyCustomers,
    getMyCollections,
    getMyWithdrawalRequests,
    getMyStatements,
    getMyFeedback,
    updateCollectionStatus,
    getCollectorDashboard
};