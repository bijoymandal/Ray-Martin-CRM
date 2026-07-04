const prisma = require('../../lib/prisma');

// Get only menus visible to current user's role (All authenticated users)
exports.getVisibleMenus = async (req, res, next) => {
  try {
    const menus = await prisma.menu.findMany({
      where: {
        roles: {
          has: req.user.role,
        },
      },
      orderBy: { order: 'asc' },
    });

    res.json({
      success: true,
      count: menus.length,
      data: menus,
    });
  } catch (error) {
    next(error);
  }
};

// Get all menus in system (Admin/Superadmin only)
exports.getAllMenus = async (req, res, next) => {
  try {
    const menus = await prisma.menu.findMany({
      orderBy: { order: 'asc' },
    });

    res.json({
      success: true,
      count: menus.length,
      data: menus,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new menu (Admin/Superadmin only)
exports.createMenu = async (req, res, next) => {
  try {
    const { name, path, iconName, roles, order } = req.body;

    if (!name || !path || !iconName) {
      res.status(400);
      throw new Error('Name, Path, and IconName are required');
    }

    const orderValue = order ? parseInt(order, 10) : 0;

    const newMenu = await prisma.menu.create({
      data: {
        name,
        path,
        iconName,
        roles: roles || [],
        order: orderValue,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Menu created successfully',
      data: newMenu,
    });
  } catch (error) {
    next(error);
  }
};

// Update a menu (Admin/Superadmin only)
exports.updateMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, path, iconName, roles, order } = req.body;

    const menu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!menu) {
      res.status(404);
      throw new Error('Menu not found');
    }

    const updatedMenu = await prisma.menu.update({
      where: { id },
      data: {
        name: name !== undefined ? name : menu.name,
        path: path !== undefined ? path : menu.path,
        iconName: iconName !== undefined ? iconName : menu.iconName,
        roles: roles !== undefined ? roles : menu.roles,
        order: order !== undefined ? parseInt(order, 10) : menu.order,
      },
    });

    res.json({
      success: true,
      message: 'Menu updated successfully',
      data: updatedMenu,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a menu (Admin/Superadmin only)
exports.deleteMenu = async (req, res, next) => {
  try {
    const { id } = req.params;

    const menu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!menu) {
      res.status(404);
      throw new Error('Menu not found');
    }

    await prisma.menu.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Menu deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Transfer role permissions across menus (Admin/Superadmin only)
exports.transferMenuPermissions = async (req, res, next) => {
  try {
    const { fromRole, toRole, action } = req.body; // action: 'copy' or 'move'

    if (!fromRole || !toRole) {
      res.status(400);
      throw new Error('fromRole and toRole are required');
    }

    const actionType = action || 'copy';

    const menus = await prisma.menu.findMany();

    for (const menu of menus) {
      let updatedRoles = [...menu.roles];
      if (updatedRoles.includes(fromRole)) {
        if (!updatedRoles.includes(toRole)) {
          updatedRoles.push(toRole);
        }
        if (actionType === 'move') {
          updatedRoles = updatedRoles.filter((r) => r !== fromRole);
        }

        await prisma.menu.update({
          where: { id: menu.id },
          data: { roles: updatedRoles },
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully ${actionType === 'move' ? 'moved' : 'copied'} permissions from ${fromRole} to ${toRole}`,
    });
  } catch (error) {
    next(error);
  }
};
