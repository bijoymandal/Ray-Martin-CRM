const express = require('express');
const router = express.Router();
const menuController = require('./menu.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkDynamicPermission } = require('../../middleware/rbac.middleware');

// All routes require user authentication
router.use(authMiddleware);

// Visible menu listing for current user
router.get('/', menuController.getVisibleMenus);
router.get('/my-permissions', menuController.getMyPermissions);

// Admin-only management endpoints
router.get('/all', checkDynamicPermission('/admin', 'canView'), menuController.getAllMenus);
router.post('/', checkDynamicPermission('/admin', 'canCreate'), menuController.createMenu);
router.post('/transfer', checkDynamicPermission('/admin', 'canEdit'), menuController.transferMenuPermissions);

router.route('/:id')
  .put(checkDynamicPermission('/admin', 'canEdit'), menuController.updateMenu)
  .delete(checkDynamicPermission('/admin', 'canDelete'), menuController.deleteMenu);

module.exports = router;
