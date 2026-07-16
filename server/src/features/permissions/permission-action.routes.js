const express = require('express');
const router = express.Router();
const permissionActionController = require('./permission-action.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkDynamicPermission } = require('../../middleware/rbac.middleware');

// Protect all routes
router.use(authMiddleware);

// Only SUPERADMIN/ADMIN can manage dynamic permission actions (Dynamic check based on Admin Center)
router.get('/', checkDynamicPermission('/admin', 'canView'), permissionActionController.getAllPermissionActions);
router.post('/', checkDynamicPermission('/admin', 'canCreate'), permissionActionController.createPermissionAction);
router.put('/:id', checkDynamicPermission('/admin', 'canEdit'), permissionActionController.updatePermissionAction);
router.delete('/:id', checkDynamicPermission('/admin', 'canDelete'), permissionActionController.deletePermissionAction);

module.exports = router;
