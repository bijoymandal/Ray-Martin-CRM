const express = require('express');
const router = express.Router();
const specimenController = require('./specimen.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkDynamicPermission } = require('../../middleware/rbac.middleware');
const upload = require('../../middleware/upload.middleware');

router.use(authMiddleware);

// Check duplicate endpoint
router.get('/check', specimenController.checkDuplicate);

// Superadmin Audit summary endpoint
router.get('/audit', specimenController.getAuditSummary);

// List all records
router.get('/', checkDynamicPermission('/specimen', 'canView'), specimenController.getAll);

// Create record with optional proof image upload
router.post(
  '/',
  checkDynamicPermission('/specimen', 'canCreate'),
  upload.fields([
    { name: 'proofImage', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'teacherPhoto', maxCount: 1 },
  ]),
  specimenController.create
);

// Superadmin verification (Approve / Reject)
router.put('/:id/verify', checkDynamicPermission('/specimen', 'canEdit'), specimenController.verifyRecord);

// Update status
router.put('/:id/status', checkDynamicPermission('/specimen', 'canEdit'), specimenController.updateStatus);

// Delete record
router.delete('/:id', checkDynamicPermission('/specimen', 'canDelete'), specimenController.delete);

module.exports = router;
