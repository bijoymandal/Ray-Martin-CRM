const prisma = require('../../lib/prisma');
const { logActivity } = require('../../lib/activity-logger');

// Get all activity logs (Superadmin only)
exports.getAllActivityLogs = async (req, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 200, // retrieve latest 200 activity logs
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// Log a client-side page/menu visit (any authenticated user)
exports.logVisit = async (req, res, next) => {
  try {
    const { path, name } = req.body;
    if (!path || !name) {
      res.status(400);
      throw new Error('Path and Name are required');
    }

    await logActivity(req, 'VISIT', 'MENU', `Visited menu: ${name} (${path})`);

    res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};
