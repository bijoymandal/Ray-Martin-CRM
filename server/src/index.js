require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const prisma = require('./lib/prisma');

// Health Check
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error: ' + err.message;
  }

  const isHealthy = dbStatus === 'connected';
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'ok' : 'degraded',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// Mounting API routes
app.use('/api', apiRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Global Error Handler
app.use(errorHandler);

// Database initialization
async function initializeDatabase() {
  try {
    await prisma.$connect();
    await prisma.$runCommandRaw({ ping: 1 });
    console.log('Successfully connected to MongoDB replica set rs0');

    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('Database is empty. Automatically initializing default seed data...');
      const { seedDatabase } = require('../prisma/seed');
      await seedDatabase(prisma, { clean: false });
      console.log('Database auto-seed completed successfully.');
    }

    // Ensure West Bengal master locations (districts & zones from canvee dump) are seeded
    try {
      const districtCount = await prisma.district.count();
      if (districtCount === 0) {
        console.log('[WB-MasterData] No districts found. Automatically initializing West Bengal master districts and zones...');
        const { seedWestBengalMasterData } = require('./features/masterdata/west-bengal-seed.data');
        await seedWestBengalMasterData(prisma);
      }
    } catch (wbErr) {
      console.error('[WB-MasterData] Auto-init error:', wbErr.message);
    }

    // Ensure "Districts" menu is registered and accessible by SUPERADMIN & ADMIN
    try {
      let mDistricts = await prisma.menu.findFirst({
        where: { path: '/districts' },
      });
      if (!mDistricts) {
        mDistricts = await prisma.menu.create({
          data: {
            name: 'Districts',
            path: '/districts',
            iconName: 'MapPin',
            roles: ['SUPERADMIN', 'ADMIN'],
            order: 9,
          },
        });
        console.log('[Menu] Created "Districts" menu for SUPERADMIN and ADMIN.');
      }

      const rolesToEnsure = ['SUPERADMIN', 'ADMIN'];
      for (const role of rolesToEnsure) {
        const existingPerm = await prisma.permission.findFirst({
          where: { role, menuId: mDistricts.id },
        });
        if (!existingPerm) {
          await prisma.permission.create({
            data: {
              role,
              menuId: mDistricts.id,
              actions: ['canView', 'canCreate', 'canEdit', 'canDelete'],
            },
          });
        }
      }
    } catch (menuErr) {
      console.error('[Menu] Error ensuring Districts menu:', menuErr.message);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
  }
}

// Start server
async function startServer() {
  await initializeDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

startServer();
