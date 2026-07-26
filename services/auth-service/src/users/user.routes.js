const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkRole, checkDynamicPermission } = require('../../middleware/rbac.middleware');

// Protect all routes - requires authenticated user session
router.use(authMiddleware);

// SUPERADMIN only permissions controls
router.get('/permissions', checkRole(['SUPERADMIN']), userController.getAllPermissions);
router.put('/permissions/:id', checkRole(['SUPERADMIN']), userController.updatePermission);

// SUPERADMIN & ADMIN general user/role controls (Dynamic check based on Admin Center)
router.get('/', checkDynamicPermission('/admin', 'canView'), userController.getAllUsers);
router.put('/:id/role', checkDynamicPermission('/admin', 'canEdit'), userController.updateUserRole);

// Current user profile endpoints (accessible by any logged-in user)
router.put('/profile', userController.updateProfile);
router.delete('/profile', userController.deleteAccount);

module.exports = router;
