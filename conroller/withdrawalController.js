const Withdrawal = require('../models/Withdrawal');
const Account = require('../models/Account');
const Customer = require('../models/Customer');

// @desc    Create withdrawal request
// @route   POST /api/withdrawals
// @access  Private (Customer)
const createWithdrawalRequest = async (req, res) => {
  try {
    const { accountId, amount, reason } = req.body;
    
    // Check if account exists and belongs to customer
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // Check if customer owns the account
    if (account.customerId.toString() !== req.customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this account',
      });
    }

    // Check if sufficient balance
    if (account.currentBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
      });
    }

    const withdrawal = await Withdrawal.create({
      accountId,
      customerId: req.customer._id,
      amount,
      reason,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: withdrawal,
    });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get withdrawal requests
// @route   GET /api/withdrawals
// @access  Private (Admin/Collector)
const getWithdrawalRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status) query.status = status;

    // For collectors, only show withdrawals from their area
    if (req.collector) {
      const collectorArea = req.collector.area;
      // You might need to populate customer and check area
      query = {
        ...query,
        // Add logic to filter by collector's area
      };
    }

    const withdrawals = await Withdrawal.find(query)
      .populate('accountId', 'accountNumber accountType')
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Withdrawal.countDocuments(query);

    res.json({
      success: true,
      data: withdrawals,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get my withdrawal requests
// @route   GET /api/withdrawals/customer/my-requests
// @access  Private (Customer)
const getMyWithdrawalRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const withdrawals = await Withdrawal.find({ customerId: req.customer._id })
      .populate('accountId', 'accountNumber accountType')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Withdrawal.countDocuments({ customerId: req.customer._id });

    res.json({
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

// @desc    Update withdrawal status
// @route   PATCH /api/withdrawals/:id/status
// @access  Private (Collector/Admin)
const updateWithdrawalStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const { id } = req.params;

    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found',
      });
    }

    withdrawal.status = status;
    if (remarks) withdrawal.remarks = remarks;
    withdrawal.processedBy = req.collector ? req.collector._id : req.admin._id;
    withdrawal.processedAt = new Date();

    // If approved, deduct amount from account
    if (status === 'approved') {
      const account = await Account.findById(withdrawal.accountId);
      account.currentBalance -= withdrawal.amount;
      await account.save();
    }

    await withdrawal.save();

    res.json({
      success: true,
      message: `Withdrawal request ${status} successfully`,
      data: withdrawal,
    });
  } catch (error) {
    console.error('Update withdrawal status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get withdrawal stats
// @route   GET /api/withdrawals/collector/stats
// @access  Private (Collector)
const getWithdrawalStats = async (req, res) => {
  try {
    const total = await Withdrawal.countDocuments();
    const pending = await Withdrawal.countDocuments({ status: 'pending' });
    const approved = await Withdrawal.countDocuments({ status: 'approved' });
    const rejected = await Withdrawal.countDocuments({ status: 'rejected' });

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWithdrawals = await Withdrawal.countDocuments({
      createdAt: { $gte: today },
    });

    res.json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        today: todayWithdrawals,
      },
    });
  } catch (error) {
    console.error('Get withdrawal stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get withdrawal by ID
// @route   GET /api/withdrawals/:id
// @access  Private (Admin/Collector)
const getWithdrawalById = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate('accountId', 'accountNumber accountType currentBalance')
      .populate('customerId', 'name phone address')
      .populate('processedBy', 'name collectorId');

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found',
      });
    }

    res.json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    console.error('Get withdrawal by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  createWithdrawalRequest,
  getWithdrawalRequests,
  getWithdrawalById,
  updateWithdrawalStatus,
  getMyWithdrawalRequests,
  getWithdrawalStats,
};