const express = require('express');
const router = express.Router();
const academyController = require('./academy.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkDynamicPermission } = require('../../middleware/rbac.middleware');
const upload = require('../../middleware/upload.middleware');

// Protect all routes
router.use(authMiddleware);

// 1. Board Routes (No image upload required)
router.route('/boards')
  .get(checkDynamicPermission('/academy', 'canView'), academyController.board.getAll)
  .post(checkDynamicPermission('/academy', 'canCreate'), academyController.board.create);

router.route('/boards/:id')
  .put(checkDynamicPermission('/academy', 'canEdit'), academyController.board.update)
  .delete(checkDynamicPermission('/academy', 'canDelete'), academyController.board.delete);

// 2. Class Routes (Includes Logo Upload)
router.route('/classes')
  .get(checkDynamicPermission('/academy', 'canView'), academyController.class.getAll)
  .post(checkDynamicPermission('/academy', 'canCreate'), upload.single('logo'), academyController.class.create);

router.route('/classes/:id')
  .put(checkDynamicPermission('/academy', 'canEdit'), upload.single('logo'), academyController.class.update)
  .delete(checkDynamicPermission('/academy', 'canDelete'), academyController.class.delete);

// 3. Subject Routes (Includes Logo Upload)
router.route('/subjects')
  .get(checkDynamicPermission('/academy', 'canView'), academyController.subject.getAll)
  .post(checkDynamicPermission('/academy', 'canCreate'), upload.single('logo'), academyController.subject.create);

router.route('/subjects/:id')
  .put(checkDynamicPermission('/academy', 'canEdit'), upload.single('logo'), academyController.subject.update)
  .delete(checkDynamicPermission('/academy', 'canDelete'), academyController.subject.delete);

// 4. Category Routes (Includes Logo Upload)
router.route('/categories')
  .get(checkDynamicPermission('/academy', 'canView'), academyController.category.getAll)
  .post(checkDynamicPermission('/academy', 'canCreate'), upload.single('logo'), academyController.category.create);

router.route('/categories/:id')
  .put(checkDynamicPermission('/academy', 'canEdit'), upload.single('logo'), academyController.category.update)
  .delete(checkDynamicPermission('/academy', 'canDelete'), academyController.category.delete);

module.exports = router;
