const Feedback = require('../models/Feedback');


const createFeedback = async (req, res) => {
  try {
    console.log('=== CREATE FEEDBACK REQUEST ===');
    console.log('Request Body:', req.body);

    // Check if it's a customer or collector
    let userId, userType;
    if (req.customer) {
      userId = req.customer._id;
      userType = 'customer';
      console.log('Customer ID:', userId);
    } else if (req.collector) {
      userId = req.collector._id;
      userType = 'collector';
      console.log('Collector ID:', userId);
    } else {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const { type, subject, message, rating, email, category } = req.body;

    // Use category as type if provided, otherwise use type
    const feedbackType = category || type;

    // Validate required fields
    if (!subject || !message || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Subject, message, and rating are required fields'
      });
    }

    const feedback = await Feedback.create({
      customerId: userId, // Using customerId field for both customers and collectors
      type: feedbackType,
      subject,
      message,
      rating: parseInt(rating),
      email: email || undefined,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      status: 'open',
    });

    // Populate user details for response
    await feedback.populate('customerId', 'name phone email');

    console.log(`✅ ${userType} feedback created successfully:`, feedback._id);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback,
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    
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
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get my feedback (works for both customers and collectors)
// @route   GET /api/feedback/customer/my-feedback OR /api/feedback/collector/my-feedback
// @access  Private (Customer/Collector)
const getMyFeedback = async (req, res) => {
  try {
    console.log('=== GET MY FEEDBACK ===');

    // Check if it's a customer or collector
    let userId, userType;
    if (req.customer) {
      userId = req.customer._id;
      userType = 'customer';
    } else if (req.collector) {
      userId = req.collector._id;
      userType = 'collector';
    } else {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    console.log(`${userType} ID:`, userId);

    const { page = 1, limit = 10, status } = req.query;

    let query = { customerId: userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    console.log('Query for user feedback:', query);

    const feedback = await Feedback.find(query)
      .populate('customerId', 'name phone email')
      .populate('assignedTo', 'name collectorId')
      .populate('response.respondedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments(query);

    console.log(`Found ${feedback.length} feedback entries for ${userType}`);

    res.json({
      success: true,
      data: feedback,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Get my feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message,
    });
  }
};

// @desc    Get feedback for admin
// @route   GET /api/feedback/admin/list
// @access  Private (Admin)
const getFeedback = async (req, res) => {
  try {
    console.log('Get feedback request by admin:', req.admin?.id);
    
    const { status, type, priority, rating, page = 1, limit = 10, search } = req.query;
    
    let query = {};
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Type filter
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // Priority filter
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    // Rating filter
    if (rating && !isNaN(rating)) {
      query.rating = parseInt(rating);
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { 'customerId.name': { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Query:', query);

    const feedback = await Feedback.find(query)
      .populate('customerId', 'name phone email')
      .populate('assignedTo', 'name collectorId')
      .populate('response.respondedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments(query);

    res.json({
      success: true,
      data: feedback,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message,
    });
  }
};

// @desc    Update feedback status and response
// @route   PATCH /api/feedback/admin/:id/status
// @access  Private (Admin)
const updateFeedbackStatus = async (req, res) => {
  try {
    console.log('=== UPDATE FEEDBACK STATUS REQUEST ===');
    console.log('Feedback ID:', req.params.id);
    console.log('Request Body:', req.body);
    console.log('Admin ID:', req.admin?.id);

    const { status, response, assignedTo } = req.body;
    const { id } = req.params;

    // Validate feedback ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Feedback ID is required'
      });
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    const updateData = {};

    // Update status if provided
    if (status) {
      if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }
      updateData.status = status;
    }

    // Update response if provided
    if (response && response.trim()) {
      updateData.response = {
        message: response.trim(),
        respondedBy: req.admin.id,
        respondedAt: new Date()
      };
      
      // Auto-update status to resolved if response is provided and no status specified
      if (!status) {
        updateData.status = 'resolved';
      }
    }

    // Update assignedTo if provided
    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }

    console.log('Update data:', updateData);

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('customerId', 'name phone email')
    .populate('assignedTo', 'name collectorId')
    .populate('response.respondedBy', 'name email');

    res.json({
      success: true,
      message: response ? 'Response sent successfully' : 'Feedback updated successfully',
      data: updatedFeedback,
    });
  } catch (error) {
    console.error('Update feedback error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating feedback',
      error: error.message,
    });
  }
};
// @desc    Create feedback
// @route   POST /api/feedback
// @access  Private (Customer)
// const createFeedback = async (req, res) => {
//   try {
//     console.log('Feedback creation request:', req.body);
//     console.log('Customer ID:', req.customer?._id);

//     const { type, subject, message, rating, email, category } = req.body;

//     // Use category as type if provided, otherwise use type
//     const feedbackType = category || type;

//     // Validate required fields
//     if (!subject || !message || !rating) {
//       return res.status(400).json({
//         success: false,
//         message: 'Subject, message, and rating are required fields'
//       });
//     }

//     const feedback = await Feedback.create({
//       customerId: req.customer._id,
//       type: feedbackType,
//       subject,
//       message,
//       rating: parseInt(rating),
//       email: email || undefined,
//       userAgent: req.get('User-Agent'),
//       ipAddress: req.ip || req.connection.remoteAddress,
//       status: 'open',
//     });

//     // Populate customer details for response
//     await feedback.populate('customerId', 'name phone email');

//     res.status(201).json({
//       success: true,
//       message: 'Feedback submitted successfully',
//       data: feedback,
//     });
//   } catch (error) {
//     console.error('Create feedback error:', error);
    
//     if (error.name === 'ValidationError') {
//       const messages = Object.values(error.errors).map(val => val.message);
//       return res.status(400).json({
//         success: false,
//         message: 'Validation Error',
//         errors: messages
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };
// In your feedbackController.js - update createFeedback function
// const createFeedback = async (req, res) => {
//   try {
//     console.log('Feedback creation request:', req.body);
//     console.log('Customer ID:', req.customer?._id);

//     // Validate customer authentication
//     if (!req.customer || !req.customer._id) {
//       return res.status(401).json({
//         success: false,
//         message: 'Customer authentication required'
//       });
//     }

//     const { type, subject, message, rating, email, category } = req.body;

//     // Use category as type if provided, otherwise use type
//     const feedbackType = category || type;

//     // Validate required fields
//     if (!subject || !message || !rating) {
//       return res.status(400).json({
//         success: false,
//         message: 'Subject, message, and rating are required fields'
//       });
//     }

//     const feedback = await Feedback.create({
//       customerId: req.customer._id,
//       type: feedbackType,
//       subject,
//       message,
//       rating: parseInt(rating),
//       email: email || undefined,
//       userAgent: req.get('User-Agent'),
//       ipAddress: req.ip || req.connection.remoteAddress,
//       status: 'open',
//     });

//     // Populate customer details for response
//     await feedback.populate('customerId', 'name phone email');

//     res.status(201).json({
//       success: true,
//       message: 'Feedback submitted successfully',
//       data: feedback,
//     });
//   } catch (error) {
//     console.error('Create feedback error:', error);
    
//     if (error.name === 'ValidationError') {
//       const messages = Object.values(error.errors).map(val => val.message);
//       return res.status(400).json({
//         success: false,
//         message: 'Validation Error',
//         errors: messages
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };
// @desc    Get feedback
// @route   GET /api/feedback
// @access  Private (Admin/Collector)
// const getFeedback = async (req, res) => {
//   try {
//     console.log('Get feedback request by user:', req.user?.id);
    
//     const { status, type, priority, rating, page = 1, limit = 10, search } = req.query;
    
//     let query = {};
    
//     // Status filter
//     if (status && status !== 'all') {
//       query.status = status;
//     }
    
//     // Type filter
//     if (type && type !== 'all') {
//       query.type = type;
//     }
    
//     // Priority filter
//     if (priority && priority !== 'all') {
//       query.priority = priority;
//     }
    
//     // Rating filter
//     if (rating && !isNaN(rating)) {
//       query.rating = parseInt(rating);
//     }
    
//     // Search functionality
//     if (search) {
//       query.$or = [
//         { subject: { $regex: search, $options: 'i' } },
//         { message: { $regex: search, $options: 'i' } },
//         { 'customerId.name': { $regex: search, $options: 'i' } }
//       ];
//     }

//     console.log('Query:', query);

//     const feedback = await Feedback.find(query)
//       .populate('customerId', 'name phone email')
//       .populate('assignedTo', 'name collectorId')
//       .populate('response.respondedBy', 'name email')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Feedback.countDocuments(query);

//     res.json({
//       success: true,
//       data: feedback,
//       pagination: {
//         current: parseInt(page),
//         pages: Math.ceil(total / limit),
//         total,
//       },
//     });
//   } catch (error) {
//     console.error('Get feedback error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching feedback',
//       error: error.message,
//     });
//   }
// };
// @desc    Get feedback
// @route   GET /api/feedback/admin/list
// @access  Private (Admin/Collector)

// @desc    Get my feedback
// @route   GET /api/feedback/customer/my-feedback
// @access  Private (Customer)
// const getMyFeedback = async (req, res) => {
//   try {
//     console.log('Get my feedback request for customer:', req.customer?._id);
    
//     const { page = 1, limit = 10, status } = req.query;

//     let query = { customerId: req.customer._id };
//     if (status && status !== 'all') {
//       query.status = status;
//     }

//     const feedback = await Feedback.find(query)
//       .populate('assignedTo', 'name collectorId')
//       .populate('response.respondedBy', 'name email')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Feedback.countDocuments(query);

//     res.json({
//       success: true,
//       data: feedback,
//       pagination: {
//         current: parseInt(page),
//         pages: Math.ceil(total / limit),
//         total,
//       },
//     });
//   } catch (error) {
//     console.error('Get my feedback error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching feedback',
//       error: error.message,
//     });
//   }
// };

// @desc    Update feedback status and response
// @route   PATCH /api/feedback/:id/status
// @access  Private (Admin/Collector)
// const updateFeedbackStatus = async (req, res) => {
//   try {
//     console.log('Update feedback request:', req.params.id, req.body);
//     console.log('User making request:', req.user?.id);

//     const { status, response, assignedTo } = req.body;
//     const { id } = req.params;

//     // Validate feedback ID
//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: 'Feedback ID is required'
//       });
//     }

//     const feedback = await Feedback.findById(id);
//     if (!feedback) {
//       return res.status(404).json({
//         success: false,
//         message: 'Feedback not found',
//       });
//     }

//     const updateData = {};

//     // Update status if provided
//     if (status) {
//       if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid status value'
//         });
//       }
//       updateData.status = status;
//     }

//     // Update response if provided
//     if (response && response.trim()) {
//       updateData.response = {
//         message: response.trim(),
//         respondedBy: req.user.id,
//         respondedAt: new Date()
//       };
      
//       // Auto-update status to resolved if response is provided and no status specified
//       if (!status) {
//         updateData.status = 'resolved';
//       }
//     }

//     // Update assignedTo if provided
//     if (assignedTo) {
//       updateData.assignedTo = assignedTo;
//     }

//     console.log('Update data:', updateData);

//     const updatedFeedback = await Feedback.findByIdAndUpdate(
//       id,
//       updateData,
//       { new: true, runValidators: true }
//     )
//     .populate('customerId', 'name phone email')
//     .populate('assignedTo', 'name collectorId')
//     .populate('response.respondedBy', 'name email');

//     res.json({
//       success: true,
//       message: response ? 'Response sent successfully' : 'Feedback updated successfully',
//       data: updatedFeedback,
//     });
//   } catch (error) {
//     console.error('Update feedback error:', error);
    
//     if (error.name === 'ValidationError') {
//       const messages = Object.values(error.errors).map(val => val.message);
//       return res.status(400).json({
//         success: false,
//         message: 'Validation Error',
//         errors: messages
//       });
//     }

//     if (error.name === 'CastError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid feedback ID'
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Error updating feedback',
//       error: error.message,
//     });
//   }
// };
// @desc    Update feedback status and response
// @route   PATCH /api/feedback/:id/status
// @access  Private (Admin/Collector)
// const getFeedback = async (req, res) => {
//   try {
//     console.log('Get feedback request by admin:', req.admin?.id);
    
//     // Use req.admin instead of req.user
//     const user = req.admin;
    
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Admin not authenticated'
//       });
//     }
    
//     const { status, type, priority, rating, page = 1, limit = 10, search } = req.query;
    
//     let query = {};
    
//     // Status filter
//     if (status && status !== 'all') {
//       query.status = status;
//     }
    
//     // Type filter
//     if (type && type !== 'all') {
//       query.type = type;
//     }
    
//     // Priority filter
//     if (priority && priority !== 'all') {
//       query.priority = priority;
//     }
    
//     // Rating filter
//     if (rating && !isNaN(rating)) {
//       query.rating = parseInt(rating);
//     }
    
//     // Search functionality
//     if (search) {
//       query.$or = [
//         { subject: { $regex: search, $options: 'i' } },
//         { message: { $regex: search, $options: 'i' } },
//         { 'customerId.name': { $regex: search, $options: 'i' } }
//       ];
//     }

//     console.log('Query:', query);

//     const feedback = await Feedback.find(query)
//       .populate('customerId', 'name phone email')
//       .populate('assignedTo', 'name collectorId')
//       .populate('response.respondedBy', 'name email')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Feedback.countDocuments(query);

//     res.json({
//       success: true,
//       data: feedback,
//       pagination: {
//         current: parseInt(page),
//         pages: Math.ceil(total / limit),
//         total,
//       },
//     });
//   } catch (error) {
//     console.error('Get feedback error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching feedback',
//       error: error.message,
//     });
//   }
// };

// @desc    Update feedback status and response
// @route   PATCH /api/feedback/:id/status
// @access  Private (Admin/Collector)
// const updateFeedbackStatus = async (req, res) => {
//   try {
//     console.log('=== UPDATE FEEDBACK STATUS REQUEST ===');
//     console.log('Feedback ID:', req.params.id);
//     console.log('Request Body:', req.body);
//     console.log('Admin ID:', req.admin?.id); // Changed from req.user to req.admin
//     console.log('Admin Object:', req.admin);

//     const { status, response, assignedTo } = req.body;
//     const { id } = req.params;

//     // Validate feedback ID
//     if (!id) {
//       console.log('Missing feedback ID');
//       return res.status(400).json({
//         success: false,
//         message: 'Feedback ID is required'
//       });
//     }

//     // Check if feedback exists
//     const feedback = await Feedback.findById(id);
//     if (!feedback) {
//       console.log('Feedback not found with ID:', id);
//       return res.status(404).json({
//         success: false,
//         message: 'Feedback not found',
//       });
//     }

//     console.log('Found feedback:', feedback);

//     const updateData = {};

//     // Update status if provided
//     if (status) {
//       if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
//         console.log('Invalid status:', status);
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid status value. Must be: open, in_progress, resolved, or closed'
//         });
//       }
//       updateData.status = status;
//       console.log('Setting status to:', status);
//     }

//     // Update response if provided
//     if (response && response.trim()) {
//       // Check if admin ID exists for response
//       if (!req.admin || !req.admin.id) { // Changed from req.user to req.admin
//         console.log('No admin ID found for response');
//         return res.status(400).json({
//           success: false,
//           message: 'Admin authentication required to send responses'
//         });
//       }

//       updateData.response = {
//         message: response.trim(),
//         respondedBy: req.admin.id, // Changed from req.user.id to req.admin.id
//         respondedAt: new Date()
//       };
      
//       console.log('Setting response with admin:', req.admin.id);
      
//       // Auto-update status to resolved if response is provided and no status specified
//       if (!status) {
//         updateData.status = 'resolved';
//         console.log('Auto-setting status to resolved due to response');
//       }
//     }

//     // Update assignedTo if provided
//     if (assignedTo) {
//       updateData.assignedTo = assignedTo;
//       console.log('Setting assignedTo to:', assignedTo);
//     }

//     // If no updates were provided
//     if (Object.keys(updateData).length === 0) {
//       console.log('No valid update data provided');
//       return res.status(400).json({
//         success: false,
//         message: 'No valid update data provided'
//       });
//     }

//     console.log('Final update data:', updateData);

//     // Perform the update
//     const updatedFeedback = await Feedback.findByIdAndUpdate(
//       id,
//       updateData,
//       { 
//         new: true, 
//         runValidators: true 
//       }
//     )
//     .populate('customerId', 'name phone email')
//     .populate('assignedTo', 'name collectorId')
//     .populate('response.respondedBy', 'name email');

//     console.log('Successfully updated feedback:', updatedFeedback._id);

//     res.json({
//       success: true,
//       message: response ? 'Response sent successfully' : 'Feedback updated successfully',
//       data: updatedFeedback,
//     });

//   } catch (error) {
//     console.error('=== UPDATE FEEDBACK ERROR ===');
//     console.error('Error name:', error.name);
//     console.error('Error message:', error.message);
//     console.error('Error stack:', error.stack);
    
//     if (error.name === 'ValidationError') {
//       const messages = Object.values(error.errors).map(val => val.message);
//       console.error('Validation errors:', messages);
//       return res.status(400).json({
//         success: false,
//         message: 'Validation Error',
//         errors: messages
//       });
//     }

//     if (error.name === 'CastError') {
//       console.error('Cast error - invalid ID format');
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid feedback ID format'
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Internal server error while updating feedback',
//       error: process.env.NODE_ENV === 'production' ? {} : error.message
//     });
//   }
// };
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
    const general = await Feedback.countDocuments({ type: 'general' });

    // Rating statistics
    const avgRating = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    // Priority statistics
    const lowPriority = await Feedback.countDocuments({ priority: 'low' });
    const mediumPriority = await Feedback.countDocuments({ priority: 'medium' });
    const highPriority = await Feedback.countDocuments({ priority: 'high' });
    const criticalPriority = await Feedback.countDocuments({ priority: 'critical' });

    res.json({
      success: true,
      data: {
        total,
        byStatus: { 
          open, 
          in_progress: inProgress, 
          resolved, 
          closed 
        },
        byType: { complaint, suggestion, inquiry, general },
        byPriority: { 
          low: lowPriority, 
          medium: mediumPriority, 
          high: highPriority, 
          critical: criticalPriority 
        },
        averageRating: avgRating[0]?.averageRating ? 
          Math.round(avgRating[0].averageRating * 10) / 10 : 0
      },
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback statistics',
      error: error.message,
    });
  }
};

// @desc    Get feedback by ID
// @route   GET /api/feedback/:id
// @access  Private (Admin/Collector)
const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Feedback ID is required'
      });
    }

    const feedback = await Feedback.findById(id)
      .populate('customerId', 'name phone email address')
      .populate('assignedTo', 'name collectorId phone')
      .populate('response.respondedBy', 'name email');

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
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message,
    });
  }
};

// @desc    Get feedback statistics for dashboard
// @route   GET /api/feedback/stats/overview
// @access  Private (Admin)
const getFeedbackOverview = async (req, res) => {
  try {
    // Recent feedback (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentFeedbacks = await Feedback.find({
      createdAt: { $gte: sevenDaysAgo }
    })
    .populate('customerId', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('subject rating status createdAt customerId');

    // Monthly trend
    const monthlyTrend = await Feedback.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: '$createdAt' },
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        recentFeedbacks,
        monthlyTrend
      },
    });
  } catch (error) {
    console.error('Get feedback overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback overview',
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
  getFeedbackOverview
};