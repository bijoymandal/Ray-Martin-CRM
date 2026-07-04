const express = require('express');
const router = express.Router();
const academyController = require('../controllers/academy.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/rbac.middleware');
const upload = require('../middleware/upload.middleware');

// Protect all routes - only SUPERADMIN, ADMIN, and EDITOR can access Academy management
router.use(authMiddleware);
router.use(checkRole(['SUPERADMIN', 'ADMIN', 'EDITOR']));

// 1. Board Routes (No image upload required)
router.route('/boards')
  .get(academyController.board.getAll)
  .post(academyController.board.create);

router.route('/boards/:id')
  .put(academyController.board.update)
  .delete(academyController.board.delete);

// 2. Class Routes (Includes Logo Upload)
router.route('/classes')
  .get(academyController.class.getAll)
  .post(upload.single('logo'), academyController.class.create);

router.route('/classes/:id')
  .put(upload.single('logo'), academyController.class.update)
  .delete(academyController.class.delete);

// 3. Subject Routes (Includes Logo Upload)
router.route('/subjects')
  .get(academyController.subject.getAll)
  .post(upload.single('logo'), academyController.subject.create);

router.route('/subjects/:id')
  .put(upload.single('logo'), academyController.subject.update)
  .delete(academyController.subject.delete);

// 4. Category Routes (Includes Logo Upload)
router.route('/categories')
  .get(academyController.category.getAll)
  .post(upload.single('logo'), academyController.category.create);

router.route('/categories/:id')
  .put(upload.single('logo'), academyController.category.update)
  .delete(academyController.category.delete);

module.exports = router;
