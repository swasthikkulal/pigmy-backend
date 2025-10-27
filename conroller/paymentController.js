const Payment = require('../models/Payment');
const Account = require('../models/Account');
const Customer = require('../models/Customer');

// Process payment - ACTUALLY SAVES TO DATABASE
exports.processPayment = async (req, res) => {
    try {
        console.log('🔔 Process payment called by user:', req.customer?.id || req.user?.id);
        console.log('📦 Request body:', req.body);

        const { 
            accountId, 
            amount, 
            currency = 'INR', 
            paymentMethod, 
            transactionId,
            referenceNumber,
            description,
            status = 'pending',
            type = 'deposit'
        } = req.body;

        // Validate required fields
        if (!accountId || !amount || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: accountId, amount, paymentMethod'
            });
        }

        // Check if account exists
        const account = await Account.findById(accountId);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        // For customers, verify they own the account
        if (req.customer && account.customerId.toString() !== req.customer.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - account does not belong to you'
            });
        }

        // Generate reference number if not provided
        const finalReferenceNumber = referenceNumber || `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Determine status based on payment method
        const paymentStatus = paymentMethod === 'online' ? 'completed' : status;

        // Determine user type and ID
        const createdBy = req.customer?.id || req.user?.id;
        const createdByModel = req.customer ? 'Customer' : 'User';

        console.log('👤 Payment created by:', createdBy, 'Type:', createdByModel);

        // ✅ ACTUALLY CREATE PAYMENT IN DATABASE
        const payment = new Payment({
            accountId,
            customerId: account.customerId,
            amount: parseFloat(amount),
            currency,
            paymentMethod,
            transactionId,
            referenceNumber: finalReferenceNumber,
            description: description || `Payment for account ${account.accountNumber}`,
            status: paymentStatus,
            type,
            createdBy: createdBy,
            createdByModel: createdByModel,
            processedAt: new Date()
        });

        // ✅ ACTUALLY SAVE TO DATABASE
        const savedPayment = await payment.save();
        console.log('✅ Payment saved to DB with ID:', savedPayment._id);

        // ✅ UPDATE ACCOUNT BALANCE IF PAYMENT IS COMPLETED
        if (savedPayment.status === 'completed') {
            const updatedAccount = await Account.findByIdAndUpdate(
                accountId, 
                { 
                    $inc: { totalBalance: parseFloat(amount) }
                },
                { new: true }
            );
            console.log('💰 Account balance updated:', updatedAccount.totalBalance);
        }

        // ✅ ADD TRANSACTION TO ACCOUNT
        await Account.findByIdAndUpdate(
            accountId,
            {
                $push: {
                    transactions: {
                        date: new Date(),
                        amount: parseFloat(amount),
                        type: 'deposit',
                        paymentMethod: paymentMethod,
                        status: savedPayment.status,
                        referenceNumber: finalReferenceNumber,
                        description: description || (savedPayment.status === 'completed' ? 'Payment received' : 'Pending payment')
                    }
                }
            }
        );

        res.json({
            success: true,
            message: 'Payment processed successfully',
            paymentId: savedPayment._id,
            referenceNumber: finalReferenceNumber,
            status: savedPayment.status,
            data: savedPayment
        });

    } catch (error) {
        console.error('❌ Payment processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing payment',
            error: error.message
        });
    }
};

// Get payment history - ACTUALLY FETCHES FROM DATABASE
exports.getPaymentHistory = async (req, res) => {
    try {
        const { accountId } = req.params;
        console.log('📖 Fetching payment history for account:', accountId);
        
        // Verify account exists
        const account = await Account.findById(accountId);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        // For customers, verify they own the account
        if (req.customer && account.customerId.toString() !== req.customer.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // ✅ ACTUALLY FETCH PAYMENTS FROM DATABASE
        const payments = await Payment.find({ accountId })
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name email');
        
        console.log('✅ Found', payments.length, 'payments for account');

        res.json({
            success: true,
            message: 'Payment history fetched successfully',
            data: payments,
            count: payments.length
        });
    } catch (error) {
        console.error('❌ Error fetching payment history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment history',
            error: error.message
        });
    }
};

// Get my payments - ACTUALLY FETCHES FROM DATABASE
exports.getMyPayments = async (req, res) => {
    try {
        const customerId = req.customer.id;
        console.log('👤 Fetching payments for customer:', customerId);
        
        // ✅ ACTUALLY FETCH CUSTOMER PAYMENTS FROM DATABASE
        const payments = await Payment.find({ customerId })
            .sort({ createdAt: -1 })
            .populate('accountId', 'accountNumber type')
            .populate('createdBy', 'name email');
        
        console.log('✅ Found', payments.length, 'payments for customer');

        res.json({
            success: true,
            message: 'My payments fetched successfully',
            data: payments,
            count: payments.length
        });
    } catch (error) {
        console.error('❌ Error fetching my payments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching my payments',
            error: error.message
        });
    }
};

// Get all payments - ACTUALLY FETCHES FROM DATABASE
exports.getAllPayments = async (req, res) => {
    try {
        console.log('📋 Fetching all payments');
        
        // ✅ ACTUALLY FETCH ALL PAYMENTS FROM DATABASE
        const payments = await Payment.find()
            .sort({ createdAt: -1 })
            .populate('accountId', 'accountNumber type')
            .populate('customerId', 'name customerId')
            .populate('createdBy', 'name email');
        
        console.log('✅ Found', payments.length, 'total payments');

        res.json({
            success: true,
            message: 'All payments fetched successfully',
            data: payments,
            count: payments.length
        });
    } catch (error) {
        console.error('❌ Error fetching all payments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching all payments',
            error: error.message
        });
    }
};

// Get pending payments - ACTUALLY FETCHES FROM DATABASE
exports.getPendingPayments = async (req, res) => {
    try {
        console.log('⏳ Fetching pending payments');
        
        // ✅ ACTUALLY FETCH PENDING PAYMENTS FROM DATABASE
        const payments = await Payment.find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .populate('accountId', 'accountNumber type')
            .populate('customerId', 'name customerId')
            .populate('createdBy', 'name email');
        
        console.log('✅ Found', payments.length, 'pending payments');

        res.json({
            success: true,
            message: 'Pending payments fetched successfully',
            data: payments,
            count: payments.length
        });
    } catch (error) {
        console.error('❌ Error fetching pending payments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending payments',
            error: error.message
        });
    }
};

// Get payment stats - ACTUALLY CALCULATES FROM DATABASE
exports.getPaymentStats = async (req, res) => {
    try {
        console.log('📊 Fetching payment stats');
        
        // ✅ ACTUALLY CALCULATE STATS FROM DATABASE
        const totalPayments = await Payment.countDocuments();
        const completedPayments = await Payment.countDocuments({ status: 'completed' });
        const pendingPayments = await Payment.countDocuments({ status: 'pending' });
        const failedPayments = await Payment.countDocuments({ status: 'failed' });
        
        const totalAmount = await Payment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const cashPayments = await Payment.countDocuments({ 
            status: 'completed', 
            paymentMethod: 'cash',
             
        });
        const onlinePayments = await Payment.countDocuments({ 
            status: 'completed', 
            paymentMethod: 'online' 
        });

        const stats = {
            totalPayments,
            completedPayments,
            pendingPayments,
            failedPayments,
            totalAmount: totalAmount[0]?.total || 0,
            cashPayments,
            onlinePayments
        };

        console.log('✅ Payment stats:', stats);

        res.json({
            success: true,
            message: 'Payment stats fetched successfully',
            data: stats
        });
    } catch (error) {
        console.error('❌ Error fetching payment stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment stats',
            error: error.message
        });
    }
};

// Get payment by ID - ACTUALLY FETCHES FROM DATABASE
exports.getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 Fetching payment by ID:', id);
        
        // ✅ ACTUALLY FIND PAYMENT IN DATABASE
        const payment = await Payment.findById(id)
            .populate('accountId', 'accountNumber type')
            .populate('customerId', 'name customerId')
            .populate('createdBy', 'name email');
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        console.log('✅ Payment found:', payment._id);

        res.json({
            success: true,
            message: 'Payment fetched successfully',
            data: payment
        });
    } catch (error) {
        console.error('❌ Error fetching payment by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment by ID',
            error: error.message
        });
    }
};

// Update payment status - ACTUALLY UPDATES DATABASE
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        
        console.log('🔄 Updating payment status:', id, 'to', status);

        // ✅ ACTUALLY FIND AND UPDATE PAYMENT IN DATABASE
        const payment = await Payment.findById(id);
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        const oldStatus = payment.status;
        payment.status = status;
        
        if (notes) {
            payment.notes = notes;
        }

        // If status changed to completed and verified by admin
        if (status === 'completed' && req.user) {
            payment.verifiedBy = req.user.id;
            payment.verifiedAt = new Date();
        }

        const updatedPayment = await payment.save();
        console.log('✅ Payment status updated from', oldStatus, 'to', updatedPayment.status);

        // Update account balance if status changed to completed
        if (status === 'completed' && oldStatus !== 'completed') {
            await Account.findByIdAndUpdate(payment.accountId, {
                $inc: { totalBalance: payment.amount }
            });
            console.log('💰 Account balance updated for payment completion');
        }

        res.json({
            success: true,
            message: 'Payment status updated successfully',
            data: updatedPayment
        });
    } catch (error) {
        console.error('❌ Error updating payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating payment status',
            error: error.message
        });
    }
};

// Verify payment - ACTUALLY UPDATES DATABASE
exports.verifyPayment = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('✅ Verifying payment:', id);

        // ✅ ACTUALLY FIND AND VERIFY PAYMENT IN DATABASE
        const payment = await Payment.findById(id);
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (payment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Payment is already verified'
            });
        }

        payment.status = 'completed';
        payment.verifiedBy = req.user.id;
        payment.verifiedAt = new Date();

        const verifiedPayment = await payment.save();
        console.log('✅ Payment verified:', verifiedPayment._id);

        // Update account balance
        await Account.findByIdAndUpdate(payment.accountId, {
            $inc: { totalBalance: payment.amount }
        });
        console.log('💰 Account balance updated after verification');

        res.json({
            success: true,
            message: 'Payment verified successfully',
            data: verifiedPayment
        });
    } catch (error) {
        console.error('❌ Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message
        });
    }
};

// Delete payment - ACTUALLY DELETES FROM DATABASE
exports.deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting payment:', id);

        // ✅ ACTUALLY DELETE PAYMENT FROM DATABASE
        const payment = await Payment.findById(id);
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        await Payment.findByIdAndDelete(id);
        console.log('✅ Payment deleted:', id);

        res.json({
            success: true,
            message: 'Payment deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting payment',
            error: error.message
        });
    }
};

// Bulk verify payments - ACTUALLY UPDATES DATABASE
exports.bulkVerifyPayments = async (req, res) => {
    try {
        const { paymentIds } = req.body;
        console.log('✅ Bulk verifying payments:', paymentIds);

        const result = await Payment.updateMany(
            { _id: { $in: paymentIds } },
            { 
                status: 'completed',
                verifiedBy: req.user.id,
                verifiedAt: new Date()
            }
        );

        console.log('✅ Bulk verification result:', result.modifiedCount, 'payments updated');

        res.json({
            success: true,
            message: `${result.modifiedCount} payments verified successfully`,
            data: { modifiedCount: result.modifiedCount }
        });
    } catch (error) {
        console.error('❌ Error bulk verifying payments:', error);
        res.status(500).json({
            success: false,
            message: 'Error bulk verifying payments',
            error: error.message
        });
    }
};

// Bulk create payments - ADD THIS MISSING FUNCTION
exports.bulkCreatePayments = async (req, res) => {
    try {
        const { payments } = req.body;
        console.log('📦 Bulk creating payments:', payments?.length);

        if (!payments || !Array.isArray(payments)) {
            return res.status(400).json({
                success: false,
                message: 'Payments array is required'
            });
        }

        const createdPayments = await Payment.insertMany(payments);
        console.log('✅ Bulk creation successful:', createdPayments.length, 'payments created');

        res.json({
            success: true,
            message: `${createdPayments.length} payments created successfully`,
            data: createdPayments
        });
    } catch (error) {
        console.error('❌ Error bulk creating payments:', error);
        res.status(500).json({
            success: false,
            message: 'Error bulk creating payments',
            error: error.message
        });
    }
};

// Get daily collections - ACTUALLY FETCHES FROM DATABASE
exports.getDailyCollections = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        console.log('📅 Fetching daily collections for:', today);

        const dailyCollections = await Payment.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: today, $lt: tomorrow }
                }
            },
            {
                $group: {
                    _id: '$paymentMethod',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('✅ Daily collections:', dailyCollections);

        res.json({
            success: true,
            message: 'Daily collections fetched successfully',
            data: dailyCollections
        });
    } catch (error) {
        console.error('❌ Error fetching daily collections:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching daily collections',
            error: error.message
        });
    }
};

// Get monthly summary - ADD THIS MISSING FUNCTION
exports.getMonthlySummary = async (req, res) => {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        console.log('📊 Fetching monthly summary for:', currentMonth + 1, '/', currentYear);

        const monthlySummary = await Payment.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: {
                        $gte: new Date(currentYear, currentMonth, 1),
                        $lt: new Date(currentYear, currentMonth + 1, 1)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        day: { $dayOfMonth: '$createdAt' },
                        paymentMethod: '$paymentMethod'
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.day': 1 }
            }
        ]);

        console.log('✅ Monthly summary entries:', monthlySummary.length);

        res.json({
            success: true,
            message: 'Monthly summary fetched successfully',
            data: monthlySummary
        });
    } catch (error) {
        console.error('❌ Error fetching monthly summary:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching monthly summary',
            error: error.message
        });
    }
};