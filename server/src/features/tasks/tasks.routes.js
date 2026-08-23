const express = require('express');
const router = express.Router();
const tasksController = require('./tasks.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkDynamicPermission } = require('../../middleware/rbac.middleware');

router.use(authMiddleware);

router.get('/summary', checkDynamicPermission('/tasks', 'canView'), tasksController.getTaskSummary);
router.get('/my-notifications', tasksController.getMyTaskNotifications);
router.get('/', checkDynamicPermission('/tasks', 'canView'), tasksController.getTasks);
router.post('/', checkDynamicPermission('/tasks', 'canCreate'), tasksController.createTask);
router.put('/:id', checkDynamicPermission('/tasks', 'canEdit'), tasksController.updateTask);
router.patch('/:id/status', checkDynamicPermission('/tasks', 'canEdit'), tasksController.updateTaskStatus);
router.patch('/:id/read', tasksController.markTaskAsRead);
router.delete('/:id', checkDynamicPermission('/tasks', 'canDelete'), tasksController.deleteTask);
router.post('/:id/comments', checkDynamicPermission('/tasks', 'canView'), tasksController.addTaskComment);

module.exports = router;
