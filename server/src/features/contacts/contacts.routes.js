const express = require('express');
const router = express.Router();
const contactsController = require('./contacts.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkDynamicPermission } = require('../../middleware/rbac.middleware');

// Protect all routes
router.use(authMiddleware);

router.route('/')
  .get(checkDynamicPermission('/contacts', 'canView'), contactsController.getAll)
  .post(checkDynamicPermission('/contacts', 'canCreate'), contactsController.create);

router.route('/:id')
  .get(checkDynamicPermission('/contacts', 'canView'), contactsController.getById)
  .put(checkDynamicPermission('/contacts', 'canEdit'), contactsController.update)
  .delete(checkDynamicPermission('/contacts', 'canDelete'), contactsController.delete);

module.exports = router;
