const Feedback = require('../models/Feedback');

// @desc    Create feedback
// @route   POST /api/feedback
// @access  Private (Customer)
const createFeedback = async (req, res) => {
  try {
    const { type, subject, message, rating } = req.body;

    const feedback = await Feedback.create({
      customerId: req.customer._id,
      type,
      subject,
      message,
      rating,
      status: 'open',
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback,
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get feedback
// @route   GET /api/feedback
// @access  Private (Admin/Collector)
const getFeedback = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const feedback = await Feedback.find(query)
      .populate('customerId', 'name phone email')
      .populate('assignedTo', 'name collectorId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments(query);

    res.json({
      success: true,
      data: feedback,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get my feedback
// @route   GET /api/feedback/customer/my-feedback
// @access  Private (Customer)
const getMyFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const feedback = await Feedback.find({ customerId: req.customer._id })
      .populate('assignedTo', 'name collectorId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments({ customerId: req.customer._id });

    res.json({
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

// @desc    Update feedback status
// @route   PATCH /api/feedback/:id/status
// @access  Private (Admin/Collector)
const updateFeedbackStatus = async (req, res) => {
  try {
    const { status, response, assignedTo } = req.body;
    const { id } = req.params;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    feedback.status = status;
    if (response) feedback.response = response;
    if (assignedTo) feedback.assignedTo = assignedTo;
    feedback.respondedAt = new Date();

    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: feedback,
    });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get feedback stats
// @route   GET /api/feedback/collector/stats
// @access  Private (Collector)
const getFeedbackStats = async (req, res) => {
  try {
    const total = await Feedback.countDocuments();
    const open = await Feedback.countDocuments({ status: 'open' });
    const inProgress = await Feedback.countDocuments({ status: 'in_progress' });
    const resolved = await Feedback.countDocuments({ status: 'resolved' });
    const closed = await Feedback.countDocuments({ status: 'closed' });

    // Feedback by type
    const complaint = await Feedback.countDocuments({ type: 'complaint' });
    const suggestion = await Feedback.countDocuments({ type: 'suggestion' });
    const inquiry = await Feedback.countDocuments({ type: 'inquiry' });

    res.json({
      success: true,
      data: {
        total,
        byStatus: { open, inProgress, resolved, closed },
        byType: { complaint, suggestion, inquiry },
      },
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get feedback by ID
// @route   GET /api/feedback/:id
// @access  Private (Admin/Collector)
const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('customerId', 'name phone email address')
      .populate('assignedTo', 'name collectorId phone');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error('Get feedback by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  createFeedback,
  getFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  getMyFeedback,
  getFeedbackStats,
};