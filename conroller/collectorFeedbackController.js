// controllers/collectorFeedbackController.js
const CollectorFeedback = require('../models/CollectorFeedback');
const Collector = require('../models/Collector');

// Submit feedback by collector
const submitFeedback = async (req, res) => {
    try {
        const { message, rating, about_collector, category } = req.body;

        const feedback = new CollectorFeedback({
            submitted_by: req.collector._id, // Assuming collector is authenticated
            message,
            rating,
            about_collector: about_collector || null,
            category: category || 'general'
        });

        await feedback.save();

        // Populate the submitted_by field for response
        await feedback.populate('submitted_by', 'name email phone');
        if (about_collector) {
            await feedback.populate('about_collector', 'name email');
        }

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: feedback
        });

    } catch (error) {
        console.error('Error submitting collector feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get collector's own feedback
const getMyFeedback = async (req, res) => {
    try {
        const feedback = await CollectorFeedback.find({
            submitted_by: req.collector._id,
        })
            .populate('submitted_by', 'name email')
            .populate('about_collector', 'name email')
            .sort({ created_at: -1 });

        res.json({
            success: true,
            data: feedback
        });

    } catch (error) {
        console.error('Error fetching collector feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Admin: Get all collector feedback
const getAllCollectorFeedback = async (req, res) => {
    try {
        const { status, category, page = 1, limit = 10 } = req.query;

        let filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;

        const feedback = await CollectorFeedback.find(filter)
            .populate('submitted_by', 'name email phone')
            .populate('about_collector', 'name email')
            .sort({ created_at: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await CollectorFeedback.countDocuments(filter);

        res.json({
            success: true,
            data: feedback,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalFeedback: total
            }
        });

    } catch (error) {
        console.error('Error fetching all collector feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Admin: Get specific collector feedback
const getCollectorFeedbackById = async (req, res) => {
    try {
        const feedback = await CollectorFeedback.findById(req.params.id)
            .populate('submitted_by', 'name email phone')
            .populate('about_collector', 'name email');

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.json({
            success: true,
            data: feedback
        });

    } catch (error) {
        console.error('Error fetching collector feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Admin: Update feedback status
const updateFeedbackStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const feedback = await CollectorFeedback.findByIdAndUpdate(
            req.params.id,
            {
                status,
                updated_at: Date.now()
            },
            { new: true }
        ).populate('submitted_by', 'name email')
            .populate('about_collector', 'name email');

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.json({
            success: true,
            message: 'Status updated successfully',
            data: feedback
        });

    } catch (error) {
        console.error('Error updating feedback status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Admin: Add admin notes
const addAdminNotes = async (req, res) => {
    try {
        const { admin_notes } = req.body;

        const feedback = await CollectorFeedback.findByIdAndUpdate(
            req.params.id,
            {
                admin_notes,
                updated_at: Date.now()
            },
            { new: true }
        ).populate('submitted_by', 'name email')
            .populate('about_collector', 'name email');

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.json({
            success: true,
            message: 'Notes added successfully',
            data: feedback
        });

    } catch (error) {
        console.error('Error adding admin notes:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Admin: Delete feedback
const deleteFeedback = async (req, res) => {
    try {
        const feedback = await CollectorFeedback.findByIdAndDelete(req.params.id);

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.json({
            success: true,
            message: 'Feedback deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    submitFeedback,
    getMyFeedback,
    getAllCollectorFeedback,
    getCollectorFeedbackById,
    updateFeedbackStatus,
    addAdminNotes,
    deleteFeedback
};