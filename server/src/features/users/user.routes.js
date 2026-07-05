const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/rbac.middleware');

// Protect all routes - requires authenticated user session
router.use(authMiddleware);

// SUPERADMIN only permissions controls
router.get('/permissions', checkRole(['SUPERADMIN']), userController.getAllPermissions);
router.put('/permissions/:id', checkRole(['SUPERADMIN']), userController.updatePermission);

// SUPERADMIN & ADMIN general user/role controls
router.get('/', checkRole(['SUPERADMIN', 'ADMIN']), userController.getAllUsers);
router.put('/:id/role', checkRole(['SUPERADMIN', 'ADMIN']), userController.updateUserRole);

// Current user profile endpoints (accessible by any logged-in user)
router.put('/profile', userController.updateProfile);
router.delete('/profile', userController.deleteAccount);

module.exports = router;
