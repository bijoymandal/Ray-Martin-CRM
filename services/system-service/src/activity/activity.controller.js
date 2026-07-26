const prisma = require('../../lib/prisma');
const { logActivity } = require('../../lib/activity-logger');

// Get all activity logs (Superadmin only) (Paginated)
exports.getAllActivityLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await prisma.activityLog.count();

    const logs = await prisma.activityLog.findMany({
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
    });

    res.json({
      success: true,
      count: logs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
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
