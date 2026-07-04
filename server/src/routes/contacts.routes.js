const express = require('express');
const router = express.Router();
const contactsController = require('../controllers/contacts.controller');
const authMiddleware = require('../middleware/auth.middleware');

const { checkRole } = require('../middleware/rbac.middleware');

// Protect all routes
router.use(authMiddleware);
router.use(checkRole(['SUPERADMIN', 'ADMIN', 'EDITOR']));

router.route('/')
  .get(contactsController.getAll)
  .post(contactsController.create);

router.route('/:id')
  .get(contactsController.getById)
  .put(contactsController.update)
  .delete(contactsController.delete);

module.exports = router;
