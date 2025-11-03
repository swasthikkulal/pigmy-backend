const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Account = require('../models/Account');
const Customer = require('../models/Customer');
const Withdrawal = require('../models/Withdrawal'); 


// In your paymentController.js
// @desc    Get payments by account ID
// @route   GET /api/payments/account/:accountId
// @access  Private
exports.getPaymentsByAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const payments = await Payment.find({ accountId })
      .populate('collectedBy', 'name collectorId')
      .sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
// Add this to your paymentController.js

// Process withdrawal request
// Process withdrawal request - FIXED VERSION
// exports.processWithdrawal = async (req, res) => {
//     try {
//         console.log('💰 Process withdrawal called by user:', req.customer?.id || req.user?.id);
//         console.log('📦 Withdrawal request body:', req.body);

//         const {
//             accountId, // This might be accountNumber, not MongoDB _id
//             accountNumber, // Add support for accountNumber
//             amount,
//             reason,
//             type = 'withdrawal',
//             status = 'pending'
//         } = req.body;

//         // Validate required fields
//         if ((!accountId && !accountNumber) || !amount || !reason) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Missing required fields: accountId/accountNumber, amount, reason'
//             });
//         }

//         let account;

//         // Try to find account by MongoDB _id first, then by accountNumber
//         if (accountId && mongoose.Types.ObjectId.isValid(accountId)) {
//             // If it's a valid MongoDB ObjectId
//             account = await Account.findById(accountId);
//         } else if (accountNumber) {
//             // If accountNumber is provided, find by accountNumber
//             account = await Account.findOne({ accountNumber: accountNumber || accountId });
//         } else {
//             // If accountId is provided but not a valid ObjectId, try as accountNumber
//             account = await Account.findOne({ accountNumber: accountId });
//         }

//         if (!account) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Account not found. Please check the account number.'
//             });
//         }

//         console.log('✅ Account found:', account.accountNumber, 'Balance:', account.totalBalance);

//         // For customers, verify they own the account
//         if (req.customer && account.customerId.toString() !== req.customer.id) {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Access denied - account does not belong to you'
//             });
//         }

//         // Check if sufficient balance exists
//         const withdrawalAmount = parseFloat(amount);
//         if (account.totalBalance < withdrawalAmount) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Insufficient balance. Available: ₹${account.totalBalance}, Requested: ₹${withdrawalAmount}`
//             });
//         }

//         // Validate minimum withdrawal amount
//         if (withdrawalAmount <= 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Withdrawal amount must be greater than 0'
//             });
//         }

//         // Generate reference number
//         const referenceNumber = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

//         // Determine user type and ID
//         const createdBy = req.customer?.id || req.user?.id;
//         const createdByModel = req.customer ? 'Customer' : 'User';

//         console.log('👤 Withdrawal created by:', createdBy, 'Type:', createdByModel);

//         // ✅ CREATE WITHDRAWAL TRANSACTION IN DATABASE
//         const withdrawal = new Payment({
//             accountId: account._id, // Use the actual MongoDB _id
//             customerId: account.customerId,
//             amount: withdrawalAmount,
//             paymentMethod: 'withdrawal',
//             referenceNumber: referenceNumber,
//             description: `Withdrawal: ${reason}`,
//             status: status,
//             type: 'withdrawal',
//             remarks: reason,
//             createdBy: createdBy,
//             createdByModel: createdByModel,
//             processedAt: new Date()
//         });

//         // ✅ SAVE TO DATABASE
//         const savedWithdrawal = await withdrawal.save();
//         console.log('✅ Withdrawal saved to DB with ID:', savedWithdrawal._id);

//         // ✅ ADD TRANSACTION TO ACCOUNT (as pending)
//         await Account.findByIdAndUpdate(
//             account._id,
//             {
//                 $push: {
//                     transactions: {
//                         date: new Date(),
//                         amount: -withdrawalAmount, // Negative amount for withdrawal
//                         type: 'withdrawal',
//                         paymentMethod: 'withdrawal',
//                         status: 'pending', // Initially pending
//                         referenceNumber: referenceNumber,
//                         description: `Withdrawal: ${reason}`,
//                         notes: `Withdrawal request - pending approval`
//                     }
//                 }
//             }
//         );

//         res.json({
//             success: true,
//             message: 'Withdrawal request submitted successfully and pending approval',
//             withdrawalId: savedWithdrawal._id,
//             referenceNumber: referenceNumber,
//             status: savedWithdrawal.status,
//             currentBalance: account.totalBalance,
//             requestedAmount: withdrawalAmount,
//             data: {
//                 ...savedWithdrawal.toObject(),
//                 accountNumber: account.accountNumber // Include account number in response
//             }
//         });

//     } catch (error) {
//         console.error('❌ Withdrawal processing error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error processing withdrawal request',
//             error: error.message
//         });
//     }
// };
// Process withdrawal request - FIXED VERSION
exports.processWithdrawal = async (req, res) => {
    try {
        console.log('💰 Process withdrawal called by user:', req.customer?.id || req.user?.id);
        console.log('📦 Withdrawal request body:', req.body);

        const {
            accountId, // This might be accountNumber, not MongoDB _id
            accountNumber, // Add support for accountNumber
            amount,
            reason,
            type = 'withdrawal',
            status = 'pending',
            collectorId, // ⭐ ADD THIS - COLLECTOR ID FROM REQUEST
            customerId   // ⭐ ADD THIS - CUSTOMER ID FROM REQUEST
        } = req.body;

        // Validate required fields
        if ((!accountId && !accountNumber) || !amount || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: accountId/accountNumber, amount, reason'
            });
        }

        let account;

        // Try to find account by MongoDB _id first, then by accountNumber
        if (accountId && mongoose.Types.ObjectId.isValid(accountId)) {
            // If it's a valid MongoDB ObjectId
            account = await Account.findById(accountId);
        } else if (accountNumber) {
            // If accountNumber is provided, find by accountNumber
            account = await Account.findOne({ accountNumber: accountNumber || accountId });
        } else {
            // If accountId is provided but not a valid ObjectId, try as accountNumber
            account = await Account.findOne({ accountNumber: accountId });
        }

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found. Please check the account number.'
            });
        }

        console.log('✅ Account found:', account.accountNumber, 'Balance:', account.totalBalance);
        console.log('👥 Collector ID from request:', collectorId); // ⭐ ADD THIS LOG

        // For customers, verify they own the account
        if (req.customer && account.customerId.toString() !== req.customer.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - account does not belong to you'
            });
        }

        // Check if sufficient balance exists
        const withdrawalAmount = parseFloat(amount);
        if (account.totalBalance < withdrawalAmount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Available: ₹${account.totalBalance}, Requested: ₹${withdrawalAmount}`
            });
        }

        // Validate minimum withdrawal amount
        if (withdrawalAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Withdrawal amount must be greater than 0'
            });
        }

        // Generate reference number
        const referenceNumber = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Determine user type and ID
        const createdBy = req.customer?.id || req.user?.id;
        const createdByModel = req.customer ? 'Customer' : 'User';

        console.log('👤 Withdrawal created by:', createdBy, 'Type:', createdByModel);

        // ✅ CREATE WITHDRAWAL TRANSACTION IN DATABASE WITH COLLECTOR ID
        const withdrawal = new Payment({
            accountId: account._id, // Use the actual MongoDB _id
            customerId: account.customerId,
            collectorId: collectorId, // ⭐ ADD THIS LINE - SAVE COLLECTOR ID!
            amount: withdrawalAmount,
            paymentMethod: 'withdrawal',
            referenceNumber: referenceNumber,
            description: `Withdrawal: ${reason}`,
            status: status,
            type: 'withdrawal',
            remarks: reason,
            createdBy: createdBy,
            createdByModel: createdByModel,
            processedAt: new Date()
        });

        // ✅ SAVE TO DATABASE
        const savedWithdrawal = await withdrawal.save();
        console.log('✅ Withdrawal saved to DB with ID:', savedWithdrawal._id);
        console.log('💰 Collector ID saved with withdrawal:', savedWithdrawal.collectorId); // ⭐ ADD THIS LOG

        // ✅ ADD TRANSACTION TO ACCOUNT (as pending)
        await Account.findByIdAndUpdate(
            account._id,
            {
                $push: {
                    transactions: {
                        date: new Date(),
                        amount: -withdrawalAmount, // Negative amount for withdrawal
                        type: 'withdrawal',
                        paymentMethod: 'withdrawal',
                        status: 'pending', // Initially pending
                        referenceNumber: referenceNumber,
                        description: `Withdrawal: ${reason}`,
                        notes: `Withdrawal request - pending approval`,
                        collectorId: collectorId // ⭐ ADD COLLECTOR ID TO TRANSACTION TOO
                    }
                }
            }
        );

        res.json({
            success: true,
            message: 'Withdrawal request submitted successfully and pending approval',
            withdrawalId: savedWithdrawal._id,
            referenceNumber: referenceNumber,
            status: savedWithdrawal.status,
            currentBalance: account.totalBalance,
            requestedAmount: withdrawalAmount,
            data: {
                ...savedWithdrawal.toObject(),
                accountNumber: account.accountNumber // Include account number in response
            }
        });

    } catch (error) {
        console.error('❌ Withdrawal processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing withdrawal request',
            error: error.message
        });
    }
};

// Get withdrawal history
exports.getWithdrawalHistory = async (req, res) => {
    try {
        const { accountId } = req.params;
        console.log('📖 Fetching withdrawal history for account:', accountId);

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

        // ✅ FETCH WITHDRAWALS FROM DATABASE
        const withdrawals = await Payment.find({
            accountId,
            type: 'withdrawal'
        })
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name email')
            .populate('verifiedBy', 'name email');

        console.log('✅ Found', withdrawals.length, 'withdrawals for account');

        res.json({
            success: true,
            message: 'Withdrawal history fetched successfully',
            data: withdrawals,
            count: withdrawals.length
        });
    } catch (error) {
        console.error('❌ Error fetching withdrawal history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching withdrawal history',
            error: error.message
        });
    }
};

// Approve withdrawal (Admin/Collector only)
exports.approveWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('✅ Approving withdrawal:', id);

        // ✅ FIND WITHDRAWAL IN DATABASE
        const withdrawal = await Payment.findById(id);

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found'
            });
        }

        if (withdrawal.type !== 'withdrawal') {
            return res.status(400).json({
                success: false,
                message: 'This is not a withdrawal request'
            });
        }

        if (withdrawal.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Withdrawal is already approved'
            });
        }

        // Check account balance
        const account = await Account.findById(withdrawal.accountId);
        if (account.totalBalance < withdrawal.amount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Available: ₹${account.totalBalance}, Requested: ₹${withdrawal.amount}`
            });
        }

        // Update withdrawal status
        withdrawal.status = 'completed';
        withdrawal.verifiedBy = req.user?.id || req.collector?.id;
        withdrawal.verifiedAt = new Date();

        const approvedWithdrawal = await withdrawal.save();
        console.log('✅ Withdrawal approved:', approvedWithdrawal._id);

        // Update account balance
        await Account.findByIdAndUpdate(
            withdrawal.accountId,
            {
                $inc: { totalBalance: -withdrawal.amount }
            }
        );
        console.log('💰 Account balance updated after withdrawal approval');

        // Update account transaction status
        await Account.updateOne(
            {
                _id: withdrawal.accountId,
                'transactions.referenceNumber': withdrawal.referenceNumber
            },
            {
                $set: {
                    'transactions.$.status': 'completed',
                    'transactions.$.verifiedBy': req.user?.id || req.collector?.id,
                    'transactions.$.verifiedAt': new Date()
                }
            }
        );

        res.json({
            success: true,
            message: 'Withdrawal approved successfully',
            data: approvedWithdrawal
        });

    } catch (error) {
        console.error('❌ Error approving withdrawal:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving withdrawal',
            error: error.message
        });
    }
};

// Reject withdrawal (Admin/Collector only)
exports.rejectWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        console.log('❌ Rejecting withdrawal:', id);

        const withdrawal = await Payment.findById(id);

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found'
            });
        }

        if (withdrawal.type !== 'withdrawal') {
            return res.status(400).json({
                success: false,
                message: 'This is not a withdrawal request'
            });
        }

        if (withdrawal.status === 'failed') {
            return res.status(400).json({
                success: false,
                message: 'Withdrawal is already rejected'
            });
        }

        // Update withdrawal status
        withdrawal.status = 'failed';
        withdrawal.remarks = `Rejected: ${reason || 'No reason provided'}`;
        withdrawal.verifiedBy = req.user?.id || req.collector?.id;
        withdrawal.verifiedAt = new Date();

        const rejectedWithdrawal = await withdrawal.save();
        console.log('✅ Withdrawal rejected:', rejectedWithdrawal._id);

        // Update account transaction status
        await Account.updateOne(
            {
                _id: withdrawal.accountId,
                'transactions.referenceNumber': withdrawal.referenceNumber
            },
            {
                $set: {
                    'transactions.$.status': 'failed',
                    'transactions.$.notes': `Rejected: ${reason || 'No reason provided'}`
                }
            }
        );

        res.json({
            success: true,
            message: 'Withdrawal rejected successfully',
            data: rejectedWithdrawal
        });

    } catch (error) {
        console.error('❌ Error rejecting withdrawal:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting withdrawal',
            error: error.message
        });
    }
};

// Get pending withdrawals (Admin/Collector only)
exports.getPendingWithdrawals = async (req, res) => {
    try {
        console.log('⏳ Fetching pending withdrawals');

        const pendingWithdrawals = await Payment.find({
            type: 'withdrawal',
            status: 'pending'
        })
            .sort({ createdAt: -1 })
            .populate('accountId', 'accountNumber type totalBalance')
            .populate('customerId', 'name customerId phone')
            .populate('createdBy', 'name email');

        console.log('✅ Found', pendingWithdrawals.length, 'pending withdrawals');

        res.json({
            success: true,
            message: 'Pending withdrawals fetched successfully',
            data: pendingWithdrawals,
            count: pendingWithdrawals.length
        });
    } catch (error) {
        console.error('❌ Error fetching pending withdrawals:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending withdrawals',
            error: error.message
        });
    }
};

// exports.getCollectorPayment = async (req, res) => {
//     try {
//         console.log("collector found", req.collector.id)
//         const findPaymentsByCollector = await Payment.find({collectorId: req.collector.id})
//         if (!findPaymentsByCollector) {
//             return res.json({success:false, message:"No payments found for this collector"})
//         }
//         return res.json({ success: true, data: findPaymentsByCollector })
//     } catch (error) {
//        return res.json({success:false, message:error.message})
//     }
// }

// Process payment - ACTUALLY SAVES TO DATABASE
// exports.processPayment = async (req, res) => {
//     try {
//         console.log('🔔 Process payment called by user:', req.customer?.id || req.user?.id);
//         console.log('📦 Request body:', req.body);

//         const { 
//             accountId, 
//             amount, 
//             currency = 'INR', 
//             paymentMethod, 
//             transactionId,
//             referenceNumber,
//             description,
//             status = 'pending',
//             type = 'deposit'
//         } = req.body;

//         // Validate required fields
//         if (!accountId || !amount || !paymentMethod) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Missing required fields: accountId, amount, paymentMethod'
//             });
//         }

//         // Check if account exists
//         const account = await Account.findById(accountId);
//         if (!account) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Account not found'
//             });
//         }

//         // For customers, verify they own the account
//         if (req.customer && account.customerId.toString() !== req.customer.id) {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Access denied - account does not belong to you'
//             });
//         }

//         // Generate reference number if not provided
//         const finalReferenceNumber = referenceNumber || `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

//         // Determine status based on payment method
//         const paymentStatus = paymentMethod === 'online' ? 'completed' : status;

//         // Determine user type and ID
//         const createdBy = req.customer?.id || req.user?.id;
//         const createdByModel = req.customer ? 'Customer' : 'User';

//         console.log('👤 Payment created by:', createdBy, 'Type:', createdByModel);

//         // ✅ ACTUALLY CREATE PAYMENT IN DATABASE
//         const payment = new Payment({
//             accountId,
//             customerId: account.customerId,
//             amount: parseFloat(amount),
//             currency,
//             paymentMethod,
//             transactionId,
//             referenceNumber: finalReferenceNumber,
//             description: description || `Payment for account ${account.accountNumber}`,
//             status: paymentStatus,
//             type,
//             createdBy: createdBy,
//             createdByModel: createdByModel,
//             processedAt: new Date()
//         });

//         // ✅ ACTUALLY SAVE TO DATABASE
//         const savedPayment = await payment.save();
//         console.log('✅ Payment saved to DB with ID:', savedPayment._id);

//         // ✅ UPDATE ACCOUNT BALANCE IF PAYMENT IS COMPLETED
//         if (savedPayment.status === 'completed') {
//             const updatedAccount = await Account.findByIdAndUpdate(
//                 accountId, 
//                 { 
//                     $inc: { totalBalance: parseFloat(amount) }
//                 },
//                 { new: true }
//             );
//             console.log('💰 Account balance updated:', updatedAccount.totalBalance);
//         }

//         // ✅ ADD TRANSACTION TO ACCOUNT
//         await Account.findByIdAndUpdate(
//             accountId,
//             {
//                 $push: {
//                     transactions: {
//                         date: new Date(),
//                         amount: parseFloat(amount),
//                         type: 'deposit',
//                         paymentMethod: paymentMethod,
//                         status: savedPayment.status,
//                         referenceNumber: finalReferenceNumber,
//                         description: description || (savedPayment.status === 'completed' ? 'Payment received' : 'Pending payment')
//                     }
//                 }
//             }
//         );

//         res.json({
//             success: true,
//             message: 'Payment processed successfully',
//             paymentId: savedPayment._id,
//             referenceNumber: finalReferenceNumber,
//             status: savedPayment.status,
//             data: savedPayment
//         });

//     } catch (error) {
//         console.error('❌ Payment processing error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error processing payment',
//             error: error.message
//         });
//     }
// };
// Process payment - ACTUALLY SAVES TO DATABASE
exports.getCollectorPayment = async (req, res) => {
    try {
        console.log("🔄 Fetching payments for collector:", req.collector.id);

        const findPaymentsByCollector = await Payment.find({ collectorId: req.collector.id })
            .populate('customerId', 'name phone customerId address email') // Populate customer details
            .populate('accountId', 'accountNumber accountType dailyAmount totalBalance openingDate status') // Populate account details
            .populate('collectorId', 'name collectorId phone area') // Populate collector details
            // .populate('verifiedBy', 'name email') // Populate verified by admin
            .sort({ createdAt: -1 }); // Sort by latest first

        if (!findPaymentsByCollector || findPaymentsByCollector.length === 0) {
            return res.json({
                success: false,
                message: "No payments found for this collector"
            });
        }

        console.log(`✅ Found ${findPaymentsByCollector.length} payments for collector`);

        // Calculate stats
        const stats = {
            total: findPaymentsByCollector.length,
            pending: findPaymentsByCollector.filter(p => p.status === 'pending').length,
            completed: findPaymentsByCollector.filter(p => p.status === 'completed').length,
            verified: findPaymentsByCollector.filter(p => p.status === 'verified').length,
            totalAmount: findPaymentsByCollector.reduce((sum, payment) => sum + (payment.amount || 0), 0),
            cashPayments: findPaymentsByCollector.filter(p => p.paymentMethod === 'cash').length,
            onlinePayments: findPaymentsByCollector.filter(p => p.paymentMethod === 'online').length
        };

        return res.json({
            success: true,
            data: findPaymentsByCollector,
            stats: stats,
            count: findPaymentsByCollector.length
        });

    } catch (error) {
        console.error("❌ Error fetching collector payments:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

// In paymentController.js
// exports.handleUpdateStatus = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { status } = req.body;

//         console.log('🔄 Updating payment status:', { paymentId: id, newStatus: status });

//         // Validate required fields
//         if (!status) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Status is required"
//             });
//         }

//         // Validate status value
//         const validStatuses = ['pending', 'completed', 'verified', 'failed'];
//         if (!validStatuses.includes(status)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid status. Must be one of: pending, completed, verified, failed"
//             });
//         }

//         // Find the payment
//         const payment = await Payment.findById(id);

//         if (!payment) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Payment not found"
//             });
//         }

//         // Check if collector owns this payment
//         if (payment.collectorId.toString() !== req.collector.id) {
//             return res.status(403).json({
//                 success: false,
//                 message: "Access denied. You can only update your own payments"
//             });
//         }

//         const oldStatus = payment.status;

//         // Update payment status
//         payment.status = status;

//         // If status changed to completed and it's a collector updating
//         if (status === 'completed' && oldStatus !== 'completed') {
//             payment.verifiedBy = req.collector.id;
//             payment.verifiedAt = new Date();

//             // Update account balance
//             await Account.findByIdAndUpdate(
//                 payment.accountId, 
//                 { $inc: { totalBalance: payment.amount } }
//             );
//             console.log('💰 Account balance updated');
//         }

//         const updatedPayment = await payment.save();

//         console.log(`✅ Payment status updated from ${oldStatus} to ${updatedPayment.status}`);

//         res.json({
//             success: true,
//             message: `Payment status updated to ${status}`,
//             data: {
//                 _id: updatedPayment._id,
//                 status: updatedPayment.status,
//                 previousStatus: oldStatus,
//                 verifiedBy: updatedPayment.verifiedBy,
//                 verifiedAt: updatedPayment.verifiedAt
//             }
//         });

//     } catch (error) {
//         console.error('❌ Error updating payment status:', error);

//         if (error.name === 'CastError') {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid payment ID format"
//             });
//         }

//         res.status(500).json({
//             success: false,
//             message: "Internal server error while updating payment status",
//             error: error.message
//         });
//     }
// };
// exports.handleUpdateStatus = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { status } = req.body;

//         console.log('🔄 Updating payment status:', { paymentId: id, newStatus: status });

//         // Validate required fields
//         if (!status) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Status is required"
//             });
//         }

//         // Find the payment with account details
//         const payment = await Payment.findById(id)
//             .populate('accountId');

//         if (!payment) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Payment not found"
//             });
//         }

//         const oldStatus = payment.status;

//         // Update payment status
//         payment.status = status;

//         // If status changed to completed from pending
//         if (status === 'completed' && oldStatus === 'pending') {
//             payment.verifiedBy = req.collector.id;
//             payment.verifiedAt = new Date();

//             // Update account balance
//             await Account.findByIdAndUpdate(
//                 payment.accountId,
//                 {
//                     $inc: { totalBalance: payment.amount },
//                     $push: {
//                         transactions: {
//                             date: new Date(),
//                             amount: payment.amount,
//                             type: 'deposit',
//                             paymentMethod: payment.paymentMethod,
//                             status: 'completed',
//                             referenceNumber: payment.referenceNumber,
//                             description: `Payment verified by collector - ${payment.referenceNumber}`,
//                             verifiedBy: req.collector.id
//                         }
//                     }
//                 }
//             );
//             console.log('💰 Account balance updated and transaction added');
//         }

//         // If reverting from completed to pending, remove the transaction and adjust balance
//         if (status === 'pending' && oldStatus === 'completed') {
//             await Account.findByIdAndUpdate(
//                 payment.accountId,
//                 {
//                     $inc: { totalBalance: -payment.amount },
//                     $pull: {
//                         transactions: {
//                             referenceNumber: payment.referenceNumber,
//                             status: 'completed'
//                         }
//                     }
//                 }
//             );
//             console.log('💰 Account balance adjusted and transaction removed');
//         }

//         const updatedPayment = await payment.save();

//         console.log(`✅ Payment status updated from ${oldStatus} to ${updatedPayment.status}`);

//         res.json({
//             success: true,
//             message: `Payment status updated to ${status}`,
//             data: {
//                 _id: updatedPayment._id,
//                 status: updatedPayment.status,
//                 previousStatus: oldStatus,
//                 amount: updatedPayment.amount,
//                 accountId: updatedPayment.accountId
//             }
//         });

//     } catch (error) {
//         console.error('❌ Error updating payment status:', error);
//         res.status(500).json({
//             success: false,
//             message: "Internal server error while updating payment status",
//             error: error.message
//         });
//     }
// };
exports.handleUpdateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body; // Add remarks here

        console.log('🔄 Updating payment status:', { 
            paymentId: id, 
            newStatus: status,
            remarks: remarks 
        });

        // Validate required fields
        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        // Find the payment with account details
        const payment = await Payment.findById(id)
            .populate('accountId');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        const oldStatus = payment.status;

        // Update payment status AND remarks
        payment.status = status;
        
        // Only update remarks if provided (for rejections)
        if (remarks) {
            payment.remarks = remarks;
            console.log('📝 Remarks added to payment:', remarks);
        }

        // If status changed to completed from pending
        if (status === 'completed' && oldStatus === 'pending') {
            payment.verifiedBy = req.collector.id;
            payment.verifiedAt = new Date();

            // Update account balance
            await Account.findByIdAndUpdate(
                payment.accountId,
                {
                    $inc: { totalBalance: payment.amount },
                    $push: {
                        transactions: {
                            date: new Date(),
                            amount: payment.amount,
                            type: 'deposit',
                            paymentMethod: payment.paymentMethod,
                            status: 'completed',
                            referenceNumber: payment.referenceNumber,
                            description: `Payment verified by collector - ${payment.referenceNumber}`,
                            verifiedBy: req.collector.id
                        }
                    }
                }
            );
            console.log('💰 Account balance updated and transaction added');
        }

        // If reverting from completed to pending, remove the transaction and adjust balance
        if (status === 'pending' && oldStatus === 'completed') {
            await Account.findByIdAndUpdate(
                payment.accountId,
                {
                    $inc: { totalBalance: -payment.amount },
                    $pull: {
                        transactions: {
                            referenceNumber: payment.referenceNumber,
                            status: 'completed'
                        }
                    }
                }
            );
            console.log('💰 Account balance adjusted and transaction removed');
        }

        const updatedPayment = await payment.save();

        console.log(`✅ Payment status updated from ${oldStatus} to ${updatedPayment.status}`);
        if (remarks) {
            console.log(`📝 Remarks saved: ${updatedPayment.remarks}`);
        }

        res.json({
            success: true,
            message: `Payment status updated to ${status}`,
            data: {
                _id: updatedPayment._id,
                status: updatedPayment.status,
                previousStatus: oldStatus,
                amount: updatedPayment.amount,
                accountId: updatedPayment.accountId,
                remarks: updatedPayment.remarks // Include remarks in response
            }
        });

    } catch (error) {
        console.error('❌ Error updating payment status:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error while updating payment status",
            error: error.message
        });
    }
};

exports.processPayment = async (req, res) => {
    try {
        console.log('🔔 Process payment called by user:', req.customer?.id || req.user?.id);
        console.log('📦 Request body:', req.body);

        const {
            accountId,
            customerId, // Add this
            collectorId, // ⭐ ADD THIS LINE - CRITICAL!
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
        console.log('👥 Collector ID from request:', collectorId); // ⭐ ADD THIS LOG

        // ✅ ACTUALLY CREATE PAYMENT IN DATABASE
        const payment = new Payment({
            accountId,
            customerId: account.customerId, // Use account's customerId for consistency
            collectorId, // ⭐ ADD THIS LINE - SAVE COLLECTOR ID!
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
        console.log('💰 Collector ID saved with payment:', savedPayment.collectorId); // ⭐ ADD THIS LOG

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
            .populate('collectorId', 'name collectorId')
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

// Add this to your paymentController.js
exports.getAllPaymentsByUserId = async (req, res) => {
    try {
        const { userid } = req.params;
        
        console.log('Fetching all transactions for user:', userid);

        // Get all transactions for this user
        const transactions = await Payment.find({ customerId: userid })
            .populate('customerId', 'name customerId phone email')
            .populate('collectorId', 'name email phone')
            .sort({ paymentDate: -1, createdAt: -1 });

        console.log(`Found ${transactions.length} transactions for user ${userid}`);

        // Properly separate deposits and withdrawals based on the 'type' field
        const deposits = transactions.filter(transaction => 
            transaction.type === 'deposit' || !transaction.type
        );

        const withdrawals = transactions.filter(transaction => 
            transaction.type === 'withdrawal'
        );

        console.log(`Deposits: ${deposits.length}, Withdrawals: ${withdrawals.length}`);

        // Format transactions for frontend - CORRECTLY identify withdrawals
        const allTransactions = transactions.map(transaction => {
            const isWithdrawal = transaction.type === 'withdrawal';
            
            return {
                _id: transaction._id,
                type: isWithdrawal ? 'withdrawal' : 'payment',
                amount: transaction.amount,
                date: transaction.paymentDate || transaction.createdAt,
                status: transaction.status,
                description: isWithdrawal ? 'Withdrawal' : 'Daily Collection',
                collector: transaction.collectorId?.name,
                transactionType: isWithdrawal ? 'debit' : 'credit',
                reason: transaction.remarks || (isWithdrawal ? 'Customer withdrawal' : ''),
                paymentMethod: transaction.paymentMethod,
                originalType: transaction.type // Keep original for debugging
            };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate summary
        const totalDeposits = deposits.reduce((sum, p) => sum + p.amount, 0);
        const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);
        const currentBalance = totalDeposits - totalWithdrawals;

        const pendingWithdrawals = withdrawals
            .filter(w => w.status === 'pending')
            .reduce((sum, w) => sum + w.amount, 0);

        console.log(`Summary - Deposits: ₹${totalDeposits}, Withdrawals: ₹${totalWithdrawals}, Balance: ₹${currentBalance}`);

        res.status(200).json({
            success: true,
            data: {
                payments: deposits,
                withdrawals: withdrawals, // This should now contain withdrawal transactions
                allTransactions,
                summary: {
                    totalDeposits,
                    totalWithdrawals,
                    currentBalance,
                    pendingWithdrawals,
                    totalTransactions: transactions.length,
                    totalPayments: deposits.length,
                    totalWithdrawalCount: withdrawals.length,
                    verifiedPayments: deposits.filter(p => p.status === 'verified' || p.status === 'completed').length,
                    approvedWithdrawals: withdrawals.filter(w => w.status === 'approved' || w.status === 'completed').length,
                    pendingWithdrawalCount: withdrawals.filter(w => w.status === 'pending').length
                }
            }
        });

    } catch (error) {
        console.error('Error fetching user payments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment data',
            error: error.message
        });
    }
};