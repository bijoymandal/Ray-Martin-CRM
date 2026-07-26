const express = require('express');
const router = express.Router();
const productsController = require('./products.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkDynamicPermission } = require('../../middleware/rbac.middleware');
const upload = require('../../middleware/upload.middleware');

router.use(authMiddleware);

// Dynamic check based on DB configuration
router.get('/', checkDynamicPermission('/products', 'canView'), productsController.getAll);

router.post(
  '/',
  checkDynamicPermission('/products', 'canCreate'),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
  ]),
  productsController.create
);

router.put(
  '/:id',
  checkDynamicPermission('/products', 'canEdit'),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
  ]),
  productsController.update
);

router.delete('/:id', checkDynamicPermission('/products', 'canDelete'), productsController.delete);

module.exports = router;
