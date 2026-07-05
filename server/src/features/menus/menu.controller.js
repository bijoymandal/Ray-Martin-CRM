const prisma = require('../../lib/prisma');
const { logActivity } = require('../../lib/activity-logger');

// Get only menus visible to current user's role (Dynamic permission lookup)
exports.getVisibleMenus = async (req, res, next) => {
  try {
    const menusAll = await prisma.menu.findMany();
    const role = req.user.role;

    for (const menu of menusAll) {
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

    const permissions = await prisma.permission.findMany({
      where: {
        role: req.user.role,
        actions: {
          has: 'canView',
        },
      },
      include: {
        menu: true,
      },
    });

    const menus = permissions
      .map((p) => p.menu)
      .filter(Boolean)
      .sort((a, b) => a.order - b.order);

    res.json({
      success: true,
      count: menus.length,
      data: menus,
    });
  } catch (error) {
    next(error);
  }
};

// Get all permission flags for the caller's role (All roles)
exports.getMyPermissions = async (req, res, next) => {
  try {
    const menus = await prisma.menu.findMany();
    const role = req.user.role;

    for (const menu of menus) {
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

    const permissions = await prisma.permission.findMany({
      where: {
        role: req.user.role,
      },
      include: {
        menu: true,
      },
    });

    res.json({
      success: true,
      data: permissions,
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

    // Automatically create permission matrices for all roles in the system
    const dbRoles = await prisma.role.findMany();
    const rolesList = dbRoles.map((r) => r.name);
    await Promise.all(
      rolesList.map((r) => {
        const isSuper = r === 'SUPERADMIN';
        const defaultActions = isSuper ? ['canView', 'canCreate', 'canEdit', 'canDelete'] : [];
        if (!isSuper && roles && roles.includes(r)) {
          defaultActions.push('canView');
        }
        return prisma.permission.create({
          data: {
            role: r,
            menuId: newMenu.id,
            actions: defaultActions,
          },
        });
      })
    );

    await logActivity(
      req,
      'CREATE',
      'MENU',
      `Created menu: ${newMenu.name} (${newMenu.path})`,
      null,
      newMenu
    );

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

    // If roles array was updated, sync individual permission rules for all roles
    if (roles !== undefined) {
      const dbRoles = await prisma.role.findMany();
      const rolesList = dbRoles.map((r) => r.name);
      await Promise.all(
        rolesList.map(async (r) => {
          const isSuper = r === 'SUPERADMIN';
          const hasView = isSuper || roles.includes(r);
          
          const existingPerm = await prisma.permission.findFirst({
            where: { menuId: id, role: r },
          });

          if (existingPerm) {
            let updatedActions = [...existingPerm.actions];
            if (hasView) {
              if (!updatedActions.includes('canView')) {
                updatedActions.push('canView');
              }
            } else {
              updatedActions = updatedActions.filter(a => a !== 'canView');
            }
            await prisma.permission.update({
              where: { id: existingPerm.id },
              data: {
                actions: updatedActions,
              },
            });
          } else {
            const defaultActions = isSuper ? ['canView', 'canCreate', 'canEdit', 'canDelete'] : [];
            if (!isSuper && hasView) {
              defaultActions.push('canView');
            }
            await prisma.permission.create({
              data: {
                role: r,
                menuId: id,
                actions: defaultActions,
              },
            });
          }
        })
      );
    }

    await logActivity(
      req,
      'UPDATE',
      'MENU',
      `Updated menu: ${updatedMenu.name}`,
      menu,
      updatedMenu
    );

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

    await logActivity(
      req,
      'DELETE',
      'MENU',
      `Deleted menu: ${menu.name}`,
      menu,
      null
    );

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
      // Find or create permission for fromRole
      let fromPerm = await prisma.permission.findFirst({
        where: { menuId: menu.id, role: fromRole },
      });
      if (!fromPerm) {
        const defaultActions = [];
        if (menu.roles.includes(fromRole)) defaultActions.push('canView');
        fromPerm = await prisma.permission.create({
          data: {
            role: fromRole,
            menuId: menu.id,
            actions: defaultActions,
          },
        });
      }

      // Find or create permission for toRole
      let toPerm = await prisma.permission.findFirst({
        where: { menuId: menu.id, role: toRole },
      });
      if (!toPerm) {
        const defaultActions = [];
        if (menu.roles.includes(toRole)) defaultActions.push('canView');
        toPerm = await prisma.permission.create({
          data: {
            role: toRole,
            menuId: menu.id,
            actions: defaultActions,
          },
        });
      }

      if (actionType === 'copy') {
        // toRole gains all actions that fromRole has (union)
        const mergedActions = Array.from(new Set([...toPerm.actions, ...fromPerm.actions]));
        await prisma.permission.update({
          where: { id: toPerm.id },
          data: {
            actions: mergedActions,
          },
        });
      } else if (actionType === 'move') {
        // toRole gets fromRole's actions, fromRole gets reset
        await prisma.permission.update({
          where: { id: toPerm.id },
          data: {
            actions: fromPerm.actions,
          },
        });
        await prisma.permission.update({
          where: { id: fromPerm.id },
          data: {
            actions: [],
          },
        });
      }

      // Sync menu roles based on the updated canView permissions for all roles
      const allPerms = await prisma.permission.findMany({
        where: { menuId: menu.id },
      });
      const updatedRoles = allPerms
        .filter((p) => p.actions.includes('canView'))
        .map((p) => p.role);

      await prisma.menu.update({
        where: { id: menu.id },
        data: { roles: updatedRoles },
      });
    }

    await logActivity(
      req,
      'UPDATE',
      'PERMISSION',
      `Transferred permissions from ${fromRole} to ${toRole} (Action: ${actionType})`,
      { fromRole, toRole, action: actionType },
      null
    );

    res.json({
      success: true,
      message: `Successfully ${actionType === 'move' ? 'moved' : 'copied'} permissions from ${fromRole} to ${toRole}`,
    });
  } catch (error) {
    next(error);
  }
};
