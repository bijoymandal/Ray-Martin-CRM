const prisma = require('../lib/prisma');

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized, no user session'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`Forbidden: Role '${req.user.role}' is not authorized to access this resource`));
    }

    next();
  };
};

const checkDynamicPermission = (menuPath, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        res.status(401);
        return next(new Error('Not authorized, no user session'));
      }

      // SUPERADMIN always bypasses all checks
      if (req.user.role === 'SUPERADMIN') {
        return next();
      }

      // Query database for dynamic permission rule mapping path & action flag
      const permission = await prisma.permission.findFirst({
        where: {
          role: req.user.role,
          menu: { path: menuPath },
        },
      });

      if (!permission || !permission.actions.includes(action)) {
        res.status(403);
        return next(new Error(`Forbidden: Role '${req.user.role}' does not have '${action}' permission for this resource`));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { checkRole, checkDynamicPermission };
