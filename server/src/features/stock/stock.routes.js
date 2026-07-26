const express = require('express');
const router = express.Router();
const stockController = require('./stock.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkDynamicPermission } = require('../../middleware/rbac.middleware');

router.use(authMiddleware);

router.get('/summary', checkDynamicPermission('/stock', 'canView'), stockController.getStockSummary);
router.get('/products', checkDynamicPermission('/stock', 'canView'), stockController.getProductsStock);
router.post('/adjust', checkDynamicPermission('/stock', 'canEdit'), stockController.adjustStock);
router.get('/movements', checkDynamicPermission('/stock', 'canView'), stockController.getStockMovements);
router.get('/alerts', checkDynamicPermission('/stock', 'canView'), stockController.getStockAlerts);

module.exports = router;
