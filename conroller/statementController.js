const Statement = require('../models/Statement');
const Payment = require('../models/Payment');
const Account = require('../models/Account');

// @desc    Generate statement
// @route   POST /api/statements/generate
// @access  Private (Admin/Collector)
const generateStatement = async (req, res) => {
  try {
    const { accountId, startDate, endDate, type } = req.body;
    
    // Find account and verify ownership/access
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // Build query for transactions
    const query = {
      accountId,
      paymentDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    const transactions = await Payment.find(query)
      .sort({ paymentDate: 1 })
      .populate('collectedBy', 'name collectorId');

    // Calculate totals
    const totalDeposits = transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawals = transactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);

    // Create statement record
    const statement = await Statement.create({
      accountId,
      customerId: account.customerId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type,
      transactions: transactions.map(t => t._id),
      openingBalance: account.openingBalance, // You might need to calculate this
      closingBalance: account.currentBalance,
      totalDeposits,
      totalWithdrawals,
      generatedBy: req.collector ? req.collector._id : req.admin._id,
    });

    // Populate the statement with transaction details
    const populatedStatement = await Statement.findById(statement._id)
      .populate('accountId', 'accountNumber accountType')
      .populate('customerId', 'name phone address')
      .populate('transactions')
      .populate('generatedBy', 'name collectorId');

    res.status(201).json({
      success: true,
      message: 'Statement generated successfully',
      data: populatedStatement,
    });
  } catch (error) {
    console.error('Generate statement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get statements
// @route   GET /api/statements
// @access  Private (Admin/Collector)
const getStatements = async (req, res) => {
  try {
    const { accountId, type, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (accountId) query.accountId = accountId;
    if (type) query.type = type;

    const statements = await Statement.find(query)
      .populate('accountId', 'accountNumber accountType')
      .populate('customerId', 'name phone')
      .populate('generatedBy', 'name collectorId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Statement.countDocuments(query);

    res.json({
      success: true,
      data: statements,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Get statements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get my statements
// @route   GET /api/statements/customer/my-statements
// @access  Private (Customer)
const getMyStatements = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Find all accounts belonging to customer
    const customerAccounts = await Account.find({ customerId: req.customer._id });
    const accountIds = customerAccounts.map(account => account._id);

    const statements = await Statement.find({ accountId: { $in: accountIds } })
      .populate('accountId', 'accountNumber accountType')
      .populate('generatedBy', 'name collectorId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Statement.countDocuments({ accountId: { $in: accountIds } });

    res.json({
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

// @desc    Get statement by ID
// @route   GET /api/statements/:id
// @access  Private (Admin/Collector)
const getStatementById = async (req, res) => {
  try {
    const statement = await Statement.findById(req.params.id)
      .populate('accountId', 'accountNumber accountType currentBalance')
      .populate('customerId', 'name phone address')
      .populate('transactions')
      .populate('generatedBy', 'name collectorId');

    if (!statement) {
      return res.status(404).json({
        success: false,
        message: 'Statement not found',
      });
    }

    res.json({
      success: true,
      data: statement,
    });
  } catch (error) {
    console.error('Get statement by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get statement stats
// @route   GET /api/statements/collector/stats
// @access  Private (Collector)
const getStatementStats = async (req, res) => {
  try {
    const total = await Statement.countDocuments();
    
    // Today's statements
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStatements = await Statement.countDocuments({
      createdAt: { $gte: today },
    });

    // This month's statements
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyStatements = await Statement.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    res.json({
      success: true,
      data: {
        total,
        today: todayStatements,
        thisMonth: monthlyStatements,
      },
    });
  } catch (error) {
    console.error('Get statement stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  generateStatement,
  getStatements,
  getStatementById,
  getMyStatements,
  getStatementStats,
};