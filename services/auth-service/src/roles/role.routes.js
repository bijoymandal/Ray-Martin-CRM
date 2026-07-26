const express = require('express');
const router = express.Router();
const roleController = require('./role.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkDynamicPermission } = require('../../middleware/rbac.middleware');

// Protect all routes - requires authenticated user session
router.use(authMiddleware);

// Only SUPERADMIN/ADMIN can manage roles (Dynamic check based on Admin Center)
router.get('/', checkDynamicPermission('/admin', 'canView'), roleController.getAllRoles);
router.post('/', checkDynamicPermission('/admin', 'canCreate'), roleController.createRole);
router.put('/:id', checkDynamicPermission('/admin', 'canEdit'), roleController.updateRole);
router.delete('/:id', checkDynamicPermission('/admin', 'canDelete'), roleController.deleteRole);

module.exports = router;
