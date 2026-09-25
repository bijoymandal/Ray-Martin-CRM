const express = require('express');
const router = express.Router();
const visitsController = require('./visits.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkDynamicPermission } = require('../../middleware/rbac.middleware');
const upload = require('../../middleware/upload.middleware');

// Protect all visit routes with authentication
router.use(authMiddleware);

// Overview summary stats
router.get('/summary', visitsController.getVisitSummary);

// List all visits (paginated, searchable, filterable)
router.get('/', checkDynamicPermission('/visits', 'canView'), visitsController.getVisits);

// Get single visit
router.get('/:id', checkDynamicPermission('/visits', 'canView'), visitsController.getVisitById);

// Create school visit with optional photo upload
router.post(
  '/',
  checkDynamicPermission('/visits', 'canCreate'),
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'proofImage', maxCount: 1 },
  ]),
  visitsController.createVisit
);

// Quick status updater (support both PUT and PATCH)
router.put('/:id/status', checkDynamicPermission('/visits', 'canEdit'), visitsController.updateVisitStatus);
router.patch('/:id/status', checkDynamicPermission('/visits', 'canEdit'), visitsController.updateVisitStatus);

// Update visit details
router.put(
  '/:id',
  checkDynamicPermission('/visits', 'canEdit'),
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'proofImage', maxCount: 1 },
  ]),
  visitsController.updateVisit
);

// Delete visit
router.delete('/:id', checkDynamicPermission('/visits', 'canDelete'), visitsController.deleteVisit);

module.exports = router;
