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

    // Ensure Prisma client has SchoolVisit model
    try {
      if (!prisma.schoolVisit) {
        console.log('[Prisma] Regenerating Prisma client for SchoolVisit model...');
        const { execSync } = require('child_process');
        execSync('npx prisma generate', { stdio: 'inherit' });
        console.log('[Prisma] Client generated successfully.');
      }
    } catch (genErr) {
      console.log('[Prisma Auto-Gen Notice]:', genErr.message);
    }

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

    // Ensure all core system menus are registered and accessible
    try {
      const coreMenus = [
        {
          name: 'Dashboard',
          path: '/',
          iconName: 'LayoutDashboard',
          roles: ['SUPERADMIN', 'ADMIN', 'EDITOR', 'ACCOUNT', 'SALESMAN'],
          order: 1,
        },
        {
          name: 'Contacts',
          path: '/contacts',
          iconName: 'Users',
          roles: ['SUPERADMIN', 'ADMIN', 'EDITOR'],
          order: 2,
        },
        {
          name: 'Deals',
          path: '/deals',
          iconName: 'CircleDollarSign',
          roles: ['SUPERADMIN', 'ADMIN', 'EDITOR', 'ACCOUNT', 'SALESMAN'],
          order: 3,
        },
        {
          name: 'Admin Center',
          path: '/admin',
          iconName: 'Settings',
          roles: ['SUPERADMIN', 'ADMIN'],
          order: 4,
        },
        {
          name: 'Academy',
          path: '/academy',
          iconName: 'GraduationCap',
          roles: ['SUPERADMIN', 'ADMIN', 'EDITOR'],
          order: 5,
        },
        {
          name: 'Tasks',
          path: '/tasks',
          iconName: 'CheckSquare',
          roles: ['SUPERADMIN', 'ADMIN', 'EDITOR', 'SALESMAN'],
          order: 6,
        },
        {
          name: 'Districts',
          path: '/districts',
          iconName: 'MapPin',
          roles: ['SUPERADMIN', 'ADMIN'],
          order: 7,
        },
        {
          name: 'Master Data',
          path: '/master-data',
          iconName: 'Database',
          roles: ['SUPERADMIN', 'ADMIN'],
          order: 8,
        },
        {
          name: 'Products',
          path: '/products',
          iconName: 'BookOpen',
          roles: ['SUPERADMIN', 'ADMIN', 'EDITOR'],
          order: 9,
        },
        {
          name: 'Stock Management',
          path: '/stock',
          iconName: 'Package',
          roles: ['SUPERADMIN', 'ADMIN', 'EDITOR', 'ACCOUNT', 'BOOKSELLER'],
          order: 10,
        },
        {
          name: 'Visits',
          path: '/visits',
          iconName: 'Footprints',
          roles: ['SUPERADMIN', 'ADMIN', 'EDITOR', 'SALESMAN'],
          order: 11,
        },
        {
          name: 'Specimen',
          path: '/specimen',
          iconName: 'BookMarked',
          roles: ['SUPERADMIN', 'ADMIN', 'EDITOR', 'SALESMAN'],
          order: 12,
        },
        {
          name: 'Marketing',
          path: '/marketing',
          iconName: 'Megaphone',
          roles: ['SUPERADMIN', 'ADMIN', 'EDITOR'],
          order: 13,
        },
      ];

      for (const m of coreMenus) {
        let menuDoc = await prisma.menu.findFirst({
          where: { path: m.path },
        });
        if (!menuDoc) {
          menuDoc = await prisma.menu.create({
            data: {
              name: m.name,
              path: m.path,
              iconName: m.iconName,
              roles: m.roles,
              order: m.order,
            },
          });
          console.log(`[Menu] Created missing menu "${m.name}" (${m.path}).`);
        } else {
          // Ensure roles array includes SUPERADMIN and configured roles
          const combinedRoles = Array.from(new Set([...(menuDoc.roles || []), ...m.roles]));
          if (combinedRoles.length !== (menuDoc.roles || []).length) {
            await prisma.menu.update({
              where: { id: menuDoc.id },
              data: { roles: combinedRoles },
            });
          }
        }

        // Ensure permissions for roles
        for (const role of m.roles) {
          const existingPerm = await prisma.permission.findFirst({
            where: { role, menuId: menuDoc.id },
          });
          if (!existingPerm) {
            await prisma.permission.create({
              data: {
                role,
                menuId: menuDoc.id,
                actions: role === 'SUPERADMIN' || role === 'ADMIN'
                  ? ['canView', 'canCreate', 'canEdit', 'canDelete']
                  : ['canView', 'canCreate', 'canEdit'],
              },
            });
          }
        }
      }
    } catch (menuErr) {
      console.error('[Menu] Error ensuring core menus:', menuErr.message);
    }

    // Ensure benchmark starter tasks exist
    try {
      const taskCount = await prisma.task.count();
      if (taskCount === 0) {
        const superadminUser = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });
        const salesmanUser = await prisma.user.findFirst({ where: { role: 'SALESMAN' } }) || superadminUser;
        const schools = await prisma.school.findMany({ take: 3, include: { zone: { include: { district: true } } } });

        if (superadminUser && schools.length > 0) {
          const sampleTasks = [
            {
              title: `Specimen Book Distribution & Teacher Meet - ${schools[0].name}`,
              description: 'Deliver Class 9 & 10 Mathematics specimen copies, meet head of department, and collect feedback.',
              priority: 'HIGH',
              status: 'IN_PROGRESS',
              category: 'SPECIMEN_DISTRIBUTION',
              dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
              createdById: superadminUser.id,
              assignedToId: salesmanUser.id,
              schoolId: schools[0].id,
            },
            {
              title: `Principal Consultation & Curriculum Review - ${schools[1] ? schools[1].name : schools[0].name}`,
              description: 'Follow up on newly released CBSE syllabus supplements and present Ray & Martin academy catalogs.',
              priority: 'URGENT',
              status: 'TODO',
              category: 'SCHOOL_VISIT',
              dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
              createdById: superadminUser.id,
              assignedToId: salesmanUser.id,
              schoolId: schools[1] ? schools[1].id : schools[0].id,
            },
            {
              title: `Annual Order Closing & Delivery Follow-up - ${schools[2] ? schools[2].name : schools[0].name}`,
              description: 'Confirm wholesale bookseller stock alignment and complete school bulk order confirmation.',
              priority: 'MEDIUM',
              status: 'COMPLETED',
              category: 'DEAL_CLOSING',
              dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              completedAt: new Date(),
              createdById: superadminUser.id,
              assignedToId: superadminUser.id,
              schoolId: schools[2] ? schools[2].id : schools[0].id,
            },
          ];

          for (const st of sampleTasks) {
            await prisma.task.create({ data: st });
          }
          console.log('[Tasks] Created benchmark starter tasks.');
        }
      }
    } catch (taskErr) {
      console.error('[Tasks] Error seeding starter tasks:', taskErr.message);
    }

    // Ensure starter benchmark visits exist
    try {
      const visitModel = prisma.schoolVisit;
      if (visitModel) {
        const visitCount = await visitModel.count();
        if (visitCount === 0) {
          const superadminUser = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });
          const salesmanUser = await prisma.user.findFirst({ where: { role: 'SALESMAN' } }) || superadminUser;
          const schools = await prisma.school.findMany({ take: 3, include: { zone: { include: { district: true } } } });

          const sampleVisits = [
            {
              schoolId: schools[0] ? schools[0].id : undefined,
              schoolName: schools[0] ? schools[0].name : "St. Xavier's Collegiate School",
              contactPerson: "Fr. Sebastian Martin (Principal)",
              contactPhone: "+91 98301 12345",
              contactEmail: "principal@sxcs.edu.in",
              location: "Park Street, Kolkata, West Bengal",
              visitDate: new Date(),
              purpose: "SPECIMEN_DISTRIBUTION",
              notes: "Showcased new 2026 Academic Catalog and English Question Banks. Met with Head of English Department who expressed strong interest in adopting our ICSE grammar workbooks.",
              status: "COMPLETED",
              outcome: "POSITIVE",
              specimensGiven: "Class 9 & 10 ICSE English Grammar and Question Bank (4 copies)",
              visitorId: salesmanUser ? salesmanUser.id : undefined,
            },
            {
              schoolId: schools[1] ? schools[1].id : undefined,
              schoolName: schools[1] ? schools[1].name : "Scottish Church Collegiate School",
              contactPerson: "Dr. Anirban Sengupta (Vice Principal)",
              contactPhone: "+91 98302 98765",
              contactEmail: "admin@scottishchurch.edu.in",
              location: "North Kolkata, West Bengal",
              visitDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
              purpose: "CURRICULUM_REVIEW",
              notes: "Scheduled appointment to present the newly updated WBBSE Board Mathematics series. Need to follow up with sample copies for senior secondary faculty.",
              status: "SCHEDULED",
              outcome: "ORDER_EXPECTED",
              specimensGiven: "Madhyamik Mathematics Booster (2 copies)",
              visitorId: superadminUser ? superadminUser.id : undefined,
            },
            {
              schoolId: schools[2] ? schools[2].id : undefined,
              schoolName: schools[2] ? schools[2].name : "Hindu School",
              contactPerson: "Sri Tarak Nath Bhattacharya (Academic Coordinator)",
              contactPhone: "+91 98311 55443",
              contactEmail: "contact@hinduschool.edu.in",
              location: "College Street, Kolkata, West Bengal",
              visitDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              purpose: "ANNUAL_ADOPTION",
              notes: "Follow-up visit regarding textbook adoption list for upcoming session. Discussion went well. Follow-up meeting required next week.",
              status: "COMPLETED",
              outcome: "FOLLOW_UP_REQUIRED",
              specimensGiven: "Physical Science and Life Science specimen set (Class 10)",
              visitorId: salesmanUser ? salesmanUser.id : undefined,
            },
          ];

          for (const sv of sampleVisits) {
            await visitModel.create({ data: sv });
          }
          console.log('[Visits] Created benchmark starter school visits.');
        }
      }
    } catch (visitErr) {
      console.error('[Visits] Error seeding starter visits:', visitErr.message);
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
