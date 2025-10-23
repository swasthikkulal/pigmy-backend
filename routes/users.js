const express = require('express');
const router = express.Router();
const {
  createUser,
  getUsers,
  updateUser,
  deleteUser
} = require('../conroller/userController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected and only for admins
router.post('/', protect, authorize('super_admin', 'admin'), createUser);
router.get('/', protect, authorize('super_admin', 'admin'), getUsers);
router.put('/:id', protect, authorize('super_admin', 'admin'), updateUser);
router.delete('/:id', protect, authorize('super_admin', 'admin'), deleteUser);

module.exports = router;