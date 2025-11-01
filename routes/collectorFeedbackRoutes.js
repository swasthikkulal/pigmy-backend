// routes/collectorFeedbackRoutes.js
const express = require('express');
const router = express.Router();
const collectorFeedbackController = require("../conroller/collectorFeedbackController")
const { protect: adminProtect, authorize } = require('../middleware/authMiddleware');

const { protect: collectorProtect } = require('../middleware/collectorAuthMiddleware');

// Collector routes
router.post('/submit', collectorProtect, collectorFeedbackController.submitFeedback);
router.get('/my-feedback', collectorProtect, collectorFeedbackController.getMyFeedback);


// Admin routes
router.get('/admin/all', adminProtect, collectorFeedbackController.getAllCollectorFeedback);
router.get('/admin/:id', adminProtect, collectorFeedbackController.getCollectorFeedbackById);
router.put('/admin/:id/status', adminProtect, collectorFeedbackController.updateFeedbackStatus);
router.put('/admin/:id/notes', adminProtect, collectorFeedbackController.addAdminNotes);
router.delete('/admin/:id', adminProtect, collectorFeedbackController.deleteFeedback);

module.exports = router;