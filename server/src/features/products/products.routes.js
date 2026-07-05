const express = require('express');
const router = express.Router();
const productsController = require('./products.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/rbac.middleware');
const upload = require('../../middleware/upload.middleware');

// Protect all routes - only SUPERADMIN, ADMIN, and EDITOR can CRUD, SALESMAN has default access (let's allow SALESMAN as well per menu permission)
router.use(authMiddleware);
router.use(checkRole(['SUPERADMIN', 'ADMIN', 'EDITOR', 'SALESMAN']));

router.route('/')
  .get(productsController.getAll)
  .post(
    upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'gallery', maxCount: 10 }
    ]),
    productsController.create
  );

router.route('/:id')
  .put(
    upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'gallery', maxCount: 10 }
    ]),
    productsController.update
  )
  .delete(productsController.delete);

module.exports = router;
