const prisma = require('../../lib/prisma');
const { logActivity } = require('../../lib/activity-logger');

// Get all users in the system (Admin only) (Paginated)
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await prisma.user.count();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    res.json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
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
    const dbRoles = await prisma.role.findMany();
    const validRoles = dbRoles.map((r) => r.name);
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

    await logActivity(
      req,
      'UPDATE',
      'USER',
      `Updated user ${updatedUser.name} role to ${updatedUser.role}`,
      userExists,
      updatedUser
    );

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Get all role permission matrices (Superadmin only)
exports.getAllPermissions = async (req, res, next) => {
  try {
    const menus = await prisma.menu.findMany();
    const dbRoles = await prisma.role.findMany();
    const rolesList = dbRoles.map((r) => r.name);

    for (const menu of menus) {
      for (const role of rolesList) {
        const existing = await prisma.permission.findFirst({
          where: { menuId: menu.id, role },
        });
        if (!existing) {
          const isSuper = role === 'SUPERADMIN';
          const defaultActions = isSuper ? ['canView', 'canCreate', 'canEdit', 'canDelete'] : [];
          if (!isSuper && menu.roles.includes(role)) {
            defaultActions.push('canView');
          }
          await prisma.permission.create({
            data: {
              role,
              menuId: menu.id,
              actions: defaultActions,
            },
          });
        }
      }
    }

    const permissions = await prisma.permission.findMany({
      include: {
        menu: true,
      },
      orderBy: { role: 'asc' },
    });

    res.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    next(error);
  }
};

// Update specific role permission settings (Superadmin only)
exports.updatePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actionName, enabled } = req.body; // expect { actionName: "canView", enabled: true }

    if (!actionName) {
      res.status(400);
      throw new Error('actionName is required');
    }

    const existingPerm = await prisma.permission.findUnique({
      where: { id },
    });

    if (!existingPerm) {
      res.status(404);
      throw new Error('Permission record not found');
    }

    let updatedActions = [...existingPerm.actions];
    if (enabled) {
      if (!updatedActions.includes(actionName)) {
        updatedActions.push(actionName);
      }
    } else {
      updatedActions = updatedActions.filter((a) => a !== actionName);
    }

    const updated = await prisma.permission.update({
      where: { id },
      data: {
        actions: updatedActions,
      },
      include: {
        menu: true,
      },
    });

    // Sync menu roles based on the updated canView status of all roles for this menu
    const menuId = updated.menuId;
    const allPerms = await prisma.permission.findMany({
      where: { menuId },
    });
    
    const updatedRoles = allPerms
      .filter((p) => p.actions.includes('canView'))
      .map((p) => p.role);

    await prisma.menu.update({
      where: { id: menuId },
      data: {
        roles: updatedRoles,
      },
    });

    await logActivity(
      req,
      'UPDATE',
      'PERMISSION',
      `Updated permission for role ${updated.role} on menu ${updated.menu.name}: ${actionName} = ${enabled}`,
      existingPerm,
      updated
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Update current user profile (name, email, password)
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userId = req.user.id;
    const bcrypt = require('bcryptjs');

    // Build update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) {
      // Check if email already in use by another user
      const existing = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId },
        },
      });
      if (existing) {
        res.status(400);
        return next(new Error('Email is already in use by another user'));
      }
      updateData.email = email;
    }
    if (password) {
      const salt = await bcrypt.genSalt(12);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Find user before change for logging
    const userBefore = await prisma.user.findUnique({
      where: { id: userId },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await logActivity(
      req,
      'UPDATE',
      'USER',
      `Updated profile credentials`,
      userBefore,
      updatedUser
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Delete current user account
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Prevent deleting the last SUPERADMIN
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (userToDelete && userToDelete.role === 'SUPERADMIN') {
      const superAdminsCount = await prisma.user.count({
        where: { role: 'SUPERADMIN' }
      });
      if (superAdminsCount <= 1) {
        res.status(400);
        return next(new Error('Cannot delete the last Superadmin account.'));
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    await logActivity(
      req,
      'DELETE',
      'USER',
      `Deleted user account: ${userToDelete.name} (${userToDelete.email})`,
      userToDelete,
      null
    );

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
