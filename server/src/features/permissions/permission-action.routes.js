const express = require('express');
const router = express.Router();
const permissionActionController = require('./permission-action.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/rbac.middleware');

// Protect all routes
router.use(authMiddleware);

// Only SUPERADMIN/ADMIN can manage dynamic permission actions
router.get('/', checkRole(['SUPERADMIN', 'ADMIN']), permissionActionController.getAllPermissionActions);
router.post('/', checkRole(['SUPERADMIN', 'ADMIN']), permissionActionController.createPermissionAction);
router.put('/:id', checkRole(['SUPERADMIN', 'ADMIN']), permissionActionController.updatePermissionAction);
router.delete('/:id', checkRole(['SUPERADMIN', 'ADMIN']), permissionActionController.deletePermissionAction);

module.exports = router;
