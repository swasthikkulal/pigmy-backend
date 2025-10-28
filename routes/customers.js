const express = require('express');
const router = express.Router();
const {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    updateCustomerSavings
} = require('../conroller/customerController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected and admin-only
router.use(protect);
router.use(authorize(['admin']));

router.route('/')
    .get(getAllCustomers)
    .post(createCustomer);

router.route('/:id')
    .get(getCustomerById)
    .put(updateCustomer);

router.route('/:id/savings')
    .patch(updateCustomerSavings);

module.exports = router;