const express = require('express');
const router = express.Router();
const {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  updatePlanStatus,
  getPlanStats,
  getPlansByType,
  calculateMaturity
} = require('../conroller/planController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected and admin-only
router.use(protect);
router.use(authorize(['admin']));

router.route('/')
  .get(getAllPlans)
  .post(createPlan);

router.route('/stats/overview')
  .get(getPlanStats);

router.route('/type/:type')
  .get(getPlansByType);

router.route('/:id')
  .get(getPlanById)
  .put(updatePlan)
  .delete(deletePlan);

router.route('/:id/status')
  .patch(updatePlanStatus);

router.route('/:id/calculate-maturity')
  .post(calculateMaturity);

module.exports = router;