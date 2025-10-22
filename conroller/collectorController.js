const Collector = require('../models/Collector');
const Customer = require('../models/Customer');

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

        const collector = new Collector(req.body);
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

        const collector = await Collector.findByIdAndUpdate(
            req.params.id,
            req.body,
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

module.exports = {
    getAllCollectors,
    getCollectorById,
    createCollector,
    updateCollector,
    deleteCollector,
    getCollectorStats
};