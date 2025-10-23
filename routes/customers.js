const express = require('express');
const router = express.Router();
const {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    updateCustomerSavings
} = require('../conroller/customerController');

router.route('/')
    .get(getAllCustomers)
    .post(createCustomer);

router.route('/:id')
    .get(getCustomerById)
    .put(updateCustomer);

router.route('/:id/savings')
    .patch(updateCustomerSavings);

module.exports = router;