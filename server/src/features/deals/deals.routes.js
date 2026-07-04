const express = require('express');
const router = express.Router();
const dealsController = require('./deals.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/rbac.middleware');
const writeAccess = checkRole(['SUPERADMIN', 'ADMIN', 'SALESMAN']);

// Protect all routes
router.use(authMiddleware);

router.route('/')
  .get(dealsController.getAll)
  .post(writeAccess, dealsController.create);

router.route('/:id')
  .get(dealsController.getById)
  .put(writeAccess, dealsController.update)
  .delete(writeAccess, dealsController.delete);

module.exports = router;
