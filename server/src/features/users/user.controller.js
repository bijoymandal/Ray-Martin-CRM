const prisma = require('../../lib/prisma');

// Get all users in the system (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// Update a user's role (Admin/Superadmin only)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!role) {
      res.status(400);
      throw new Error('Role is required');
    }

    // Verify role value is valid
    const validRoles = ['SUPERADMIN', 'ADMIN', 'EDITOR', 'ACCOUNT', 'SALESMAN'];
    if (!validRoles.includes(role)) {
      res.status(400);
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Find the user
    const userExists = await prisma.user.findUnique({
      where: { id },
    });

    if (!userExists) {
      res.status(404);
      throw new Error('User not found');
    }

    // Update role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
