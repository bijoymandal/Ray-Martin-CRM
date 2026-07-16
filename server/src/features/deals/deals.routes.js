const express = require('express');
const router = express.Router();
const dealsController = require('./deals.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkDynamicPermission } = require('../../middleware/rbac.middleware');

// Protect all routes
router.use(authMiddleware);

router.route('/')
  .get(checkDynamicPermission('/deals', 'canView'), dealsController.getAll)
  .post(checkDynamicPermission('/deals', 'canCreate'), dealsController.create);

router.route('/:id')
  .get(checkDynamicPermission('/deals', 'canView'), dealsController.getById)
  .put(checkDynamicPermission('/deals', 'canEdit'), dealsController.update)
  .delete(checkDynamicPermission('/deals', 'canDelete'), dealsController.delete);

module.exports = router;
