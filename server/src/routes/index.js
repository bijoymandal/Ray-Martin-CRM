const express = require('express');
const router = express.Router();

const authRoutes = require('../features/auth/auth.routes');
const contactRoutes = require('../features/contacts/contacts.routes');
const dealRoutes = require('../features/deals/deals.routes');
const userRoutes = require('../features/users/user.routes');
const menuRoutes = require('../features/menus/menu.routes');
const academyRoutes = require('../features/academy/academy.routes');
const productRoutes = require('../features/products/products.routes');

router.use('/auth', authRoutes);
router.use('/contacts', contactRoutes);
router.use('/deals', dealRoutes);
router.use('/users', userRoutes);
router.use('/menus', menuRoutes);
router.use('/academy', academyRoutes);
router.use('/products', productRoutes);

module.exports = router;
