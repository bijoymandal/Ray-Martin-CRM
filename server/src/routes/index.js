const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const contactRoutes = require('./contacts.routes');
const dealRoutes = require('./deals.routes');
const userRoutes = require('./user.routes');
const menuRoutes = require('./menu.routes');
const academyRoutes = require('./academy.routes');

router.use('/auth', authRoutes);
router.use('/contacts', contactRoutes);
router.use('/deals', dealRoutes);
router.use('/users', userRoutes);
router.use('/menus', menuRoutes);
router.use('/academy', academyRoutes);

module.exports = router;
