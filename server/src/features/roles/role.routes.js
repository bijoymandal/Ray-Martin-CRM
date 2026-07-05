const express = require('express');
const router = express.Router();
const roleController = require('./role.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/rbac.middleware');

// Protect all routes - requires authenticated user session
router.use(authMiddleware);

// Only SUPERADMIN/ADMIN can manage roles
router.get('/', checkRole(['SUPERADMIN', 'ADMIN']), roleController.getAllRoles);
router.post('/', checkRole(['SUPERADMIN', 'ADMIN']), roleController.createRole);
router.put('/:id', checkRole(['SUPERADMIN', 'ADMIN']), roleController.updateRole);
router.delete('/:id', checkRole(['SUPERADMIN', 'ADMIN']), roleController.deleteRole);

module.exports = router;
