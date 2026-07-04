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

module.exports = { checkRole };
