const express = require('express');
const router = express.Router();
const {
    getAllCollectors,
    getCollectorById,
    createCollector,
    updateCollector,
    deleteCollector,
    getCollectorStats
} = require('../conroller/collectorController');

router.route('/')
    .get(getAllCollectors)
    .post(createCollector);

router.route('/:id')
    .get(getCollectorById)
    .put(updateCollector)
    .delete(deleteCollector);

router.route('/:id/stats')
    .get(getCollectorStats);

module.exports = router;