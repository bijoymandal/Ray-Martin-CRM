const express = require('express');
const router = express.Router();
const activityController = require('./activity.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkRole } = require('../../middleware/rbac.middleware');

// Protect all routes
router.use(authMiddleware);

// Superadmin only can view logs
router.get('/', checkRole(['SUPERADMIN']), activityController.getAllActivityLogs);

// Any authenticated user can log a visit
router.post('/log-visit', activityController.logVisit);

module.exports = router;
