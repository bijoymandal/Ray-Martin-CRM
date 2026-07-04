const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/rbac.middleware');

// Protect all routes - only SUPERADMIN and ADMIN can access user management
router.use(authMiddleware);
router.use(checkRole(['SUPERADMIN', 'ADMIN']));

router.route('/')
  .get(userController.getAllUsers);

router.route('/:id/role')
  .put(userController.updateUserRole);

module.exports = router;
