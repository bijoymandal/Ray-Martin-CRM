const express = require('express');
const router = express.Router();
const masterDataController = require('./masterdata.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkDynamicPermission } = require('../../middleware/rbac.middleware');

router.use(authMiddleware);

// Master Data Summary Overview
router.get('/summary', masterDataController.getMasterDataSummary);

// States
router.get('/states', masterDataController.getStates);
router.post('/states', checkDynamicPermission('/master-data', 'canCreate'), masterDataController.createState);
router.put('/states/:id', checkDynamicPermission('/master-data', 'canEdit'), masterDataController.updateState);
router.delete('/states/:id', checkDynamicPermission('/master-data', 'canDelete'), masterDataController.deleteState);

// Districts
router.get('/districts', masterDataController.getDistricts);
router.post('/districts', checkDynamicPermission('/master-data', 'canCreate'), masterDataController.createDistrict);
router.put('/districts/:id', checkDynamicPermission('/master-data', 'canEdit'), masterDataController.updateDistrict);
router.delete('/districts/:id', checkDynamicPermission('/master-data', 'canDelete'), masterDataController.deleteDistrict);

// Zones
router.get('/zones', masterDataController.getZones);
router.post('/zones', checkDynamicPermission('/master-data', 'canCreate'), masterDataController.createZone);
router.put('/zones/:id', checkDynamicPermission('/master-data', 'canEdit'), masterDataController.updateZone);
router.delete('/zones/:id', checkDynamicPermission('/master-data', 'canDelete'), masterDataController.deleteZone);

// School Boards (CBSE, State Board, etc.)
router.get('/boards', masterDataController.getSchoolBoards);
router.post('/boards', checkDynamicPermission('/master-data', 'canCreate'), masterDataController.createSchoolBoard);
router.put('/boards/:id', checkDynamicPermission('/master-data', 'canEdit'), masterDataController.updateSchoolBoard);
router.delete('/boards/:id', checkDynamicPermission('/master-data', 'canDelete'), masterDataController.deleteSchoolBoard);

// Schools (Public & Private)
router.get('/schools', masterDataController.getSchools);
router.post('/schools', checkDynamicPermission('/master-data', 'canCreate'), masterDataController.createSchool);
router.put('/schools/:id', checkDynamicPermission('/master-data', 'canEdit'), masterDataController.updateSchool);
router.delete('/schools/:id', checkDynamicPermission('/master-data', 'canDelete'), masterDataController.deleteSchool);

// Teachers
router.get('/teachers', masterDataController.getTeachers);
router.post('/teachers', checkDynamicPermission('/master-data', 'canCreate'), masterDataController.createTeacher);
router.put('/teachers/:id', checkDynamicPermission('/master-data', 'canEdit'), masterDataController.updateTeacher);
router.delete('/teachers/:id', checkDynamicPermission('/master-data', 'canDelete'), masterDataController.deleteTeacher);

module.exports = router;
