const Plan = require('../models/Plan');
const Account = require('../models/Account');

// @desc    Get all plans
// @route   GET /api/plans
// @access  Public
const getAllPlans = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 10, search } = req.query;
    
    let query = {};
    
    // Filter by type
    if (type) {
      query.type = type;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const plans = await Plan.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Plan.countDocuments(query);

    // Calculate total subscribers for each plan
    const plansWithSubscribers = await Promise.all(
      plans.map(async (plan) => {
        const subscriberCount = await Account.countDocuments({ 
          accountType: plan.type,
          status: 'active'
        });
        
        return {
          ...plan._doc,
          totalSubscribers: subscriberCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: plans.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: plansWithSubscribers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single plan
// @route   GET /api/plans/:id
// @access  Public
const getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Get subscriber count
    const subscriberCount = await Account.countDocuments({ 
      accountType: plan.type,
      status: 'active'
    });

    const planWithSubscribers = {
      ...plan._doc,
      totalSubscribers: subscriberCount
    };

    res.status(200).json({
      success: true,
      data: planWithSubscribers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new plan
// @route   POST /api/plans
// @access  Private/Admin
const createPlan = async (req, res) => {
  try {
    const { planId, name, type } = req.body;

    // Check if plan ID already exists
    const existingPlanId = await Plan.findOne({ planId });
    if (existingPlanId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID already exists'
      });
    }

    // Check if plan name already exists for the same type
    const existingPlanName = await Plan.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      type 
    });
    if (existingPlanName) {
      return res.status(400).json({
        success: false,
        message: `Plan with name "${name}" already exists for ${type} type`
      });
    }

    // Validate amount based on type
    const { amount } = req.body;
    if (type === 'daily' && amount > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Daily plan amount cannot exceed ₹1000'
      });
    }

    if (type === 'weekly' && amount > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Weekly plan amount cannot exceed ₹5000'
      });
    }

    if (type === 'monthly' && amount > 20000) {
      return res.status(400).json({
        success: false,
        message: 'Monthly plan amount cannot exceed ₹20000'
      });
    }

    const plan = new Plan(req.body);
    const newPlan = await plan.save();

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: newPlan
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

// @desc    Update plan
// @route   PUT /api/plans/:id
// @access  Private/Admin
const updatePlan = async (req, res) => {
  try {
    const { planId, name, type } = req.body;

    // Check for duplicate plan ID (excluding current plan)
    if (planId) {
      const existingPlanId = await Plan.findOne({ 
        planId, 
        _id: { $ne: req.params.id } 
      });
      if (existingPlanId) {
        return res.status(400).json({
          success: false,
          message: 'Plan ID already exists'
        });
      }
    }

    // Check for duplicate plan name (excluding current plan)
    if (name && type) {
      const existingPlanName = await Plan.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        type,
        _id: { $ne: req.params.id } 
      });
      if (existingPlanName) {
        return res.status(400).json({
          success: false,
          message: `Plan with name "${name}" already exists for ${type} type`
        });
      }
    }

    // Validate amount if being updated
    if (req.body.amount && req.body.type) {
      const { amount, type } = req.body;
      if (type === 'daily' && amount > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Daily plan amount cannot exceed ₹1000'
        });
      }

      if (type === 'weekly' && amount > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Weekly plan amount cannot exceed ₹5000'
        });
      }

      if (type === 'monthly' && amount > 20000) {
        return res.status(400).json({
          success: false,
          message: 'Monthly plan amount cannot exceed ₹20000'
        });
      }
    }

    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: plan
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

// @desc    Delete plan
// @route   DELETE /api/plans/:id
// @access  Private/Admin
const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if plan has active subscribers
    const activeSubscribers = await Account.countDocuments({ 
      accountType: plan.type,
      status: 'active'
    });

    if (activeSubscribers > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete plan with active subscribers. Please deactivate the plan instead.'
      });
    }

    await Plan.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Plan deleted successfully',
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

// @desc    Update plan status
// @route   PATCH /api/plans/:id/status
// @access  Private/Admin
const updatePlanStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['active', 'inactive', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Plan status updated to ${status}`,
      data: plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get plan statistics
// @route   GET /api/plans/stats/overview
// @access  Public
const getPlanStats = async (req, res) => {
  try {
    const totalPlans = await Plan.countDocuments();
    const activePlans = await Plan.countDocuments({ status: 'active' });
    const inactivePlans = await Plan.countDocuments({ status: 'inactive' });

    // Get subscriber counts by plan type
    const dailySubscribers = await Account.countDocuments({ 
      accountType: 'daily',
      status: 'active'
    });
    
    const weeklySubscribers = await Account.countDocuments({ 
      accountType: 'weekly',
      status: 'active'
    });
    
    const monthlySubscribers = await Account.countDocuments({ 
      accountType: 'monthly',
      status: 'active'
    });

    // Get total collections by plan type
    const dailyCollections = await Account.aggregate([
      { $match: { accountType: 'daily', status: 'active' } },
      { $group: { _id: null, total: { $sum: '$totalBalance' } } }
    ]);

    const weeklyCollections = await Account.aggregate([
      { $match: { accountType: 'weekly', status: 'active' } },
      { $group: { _id: null, total: { $sum: '$totalBalance' } } }
    ]);

    const monthlyCollections = await Account.aggregate([
      { $match: { accountType: 'monthly', status: 'active' } },
      { $group: { _id: null, total: { $sum: '$totalBalance' } } }
    ]);

    // Most popular plans
    const popularPlans = await Plan.aggregate([
      { $match: { status: 'active' } },
      { $sort: { totalSubscribers: -1 } },
      { $limit: 5 },
      {
        $project: {
          name: 1,
          type: 1,
          amount: 1,
          interestRate: 1,
          totalSubscribers: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPlans,
        activePlans,
        inactivePlans,
        subscribers: {
          daily: dailySubscribers,
          weekly: weeklySubscribers,
          monthly: monthlySubscribers,
          total: dailySubscribers + weeklySubscribers + monthlySubscribers
        },
        collections: {
          daily: dailyCollections[0]?.total || 0,
          weekly: weeklyCollections[0]?.total || 0,
          monthly: monthlyCollections[0]?.total || 0,
          total: (dailyCollections[0]?.total || 0) + 
                 (weeklyCollections[0]?.total || 0) + 
                 (monthlyCollections[0]?.total || 0)
        },
        popularPlans
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

// @desc    Get plans by type
// @route   GET /api/plans/type/:type
// @access  Public
const getPlansByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { status = 'active' } = req.query;

    const validTypes = ['daily', 'weekly', 'monthly'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan type'
      });
    }

    const plans = await Plan.find({ 
      type,
      status 
    }).sort({ amount: 1 });

    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Calculate maturity amount for a plan
// @route   POST /api/plans/:id/calculate-maturity
// @access  Public
const calculateMaturity = async (req, res) => {
  try {
    const { customAmount, customDuration } = req.body;

    const plan = await Plan.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    const amount = customAmount || plan.amount;
    const duration = customDuration || plan.duration;

    const totalInvestment = amount * duration;
    const interest = (totalInvestment * plan.interestRate) / 100;
    const maturityAmount = totalInvestment + interest;

    res.status(200).json({
      success: true,
      data: {
        plan: plan.name,
        amount,
        duration,
        interestRate: plan.interestRate,
        totalInvestment,
        interest,
        maturityAmount
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
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  updatePlanStatus,
  getPlanStats,
  getPlansByType,
  calculateMaturity
};