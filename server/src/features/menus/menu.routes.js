const express = require('express');
const router = express.Router();
const menuController = require('./menu.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/rbac.middleware');

const adminOnly = checkRole(['SUPERADMIN', 'ADMIN']);

// All routes require user authentication
router.use(authMiddleware);

// Visible menu listing for current user
router.get('/', menuController.getVisibleMenus);
router.get('/my-permissions', menuController.getMyPermissions);

// Admin-only management endpoints
router.get('/all', adminOnly, menuController.getAllMenus);
router.post('/', adminOnly, menuController.createMenu);
router.post('/transfer', adminOnly, menuController.transferMenuPermissions);

router.route('/:id')
  .put(adminOnly, menuController.updateMenu)
  .delete(adminOnly, menuController.deleteMenu);

module.exports = router;
