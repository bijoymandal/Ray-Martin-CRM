const express = require('express');
const router = express.Router();

const authRoutes = require('../features/auth/auth.routes');
const contactRoutes = require('../features/contacts/contacts.routes');
const dealRoutes = require('../features/deals/deals.routes');
const userRoutes = require('../features/users/user.routes');
const menuRoutes = require('../features/menus/menu.routes');
const academyRoutes = require('../features/academy/academy.routes');
const productRoutes = require('../features/products/products.routes');
const roleRoutes = require('../features/roles/role.routes');
const permissionActionRoutes = require('../features/permissions/permission-action.routes');
const activityRoutes = require('../features/activity/activity.routes');
const specimenRoutes = require('../features/specimen/specimen.routes');
const masterDataRoutes = require('../features/masterdata/masterdata.routes');
const stockRoutes = require('../features/stock/stock.routes');
const taskRoutes = require('../features/tasks/tasks.routes');

router.use('/auth', authRoutes);
router.use('/contacts', contactRoutes);
router.use('/deals', dealRoutes);
router.use('/users', userRoutes);
router.use('/menus', menuRoutes);
router.use('/academy', academyRoutes);
router.use('/products', productRoutes);
router.use('/roles', roleRoutes);
router.use('/permission-actions', permissionActionRoutes);
router.use('/activity', activityRoutes);
router.use('/specimen', specimenRoutes);
router.use('/masterdata', masterDataRoutes);
router.use('/stock', stockRoutes);
router.use('/tasks', taskRoutes);



module.exports = router;
