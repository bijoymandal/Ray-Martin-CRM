const prisma = require('../../lib/prisma');
const { logActivity } = require('../../lib/activity-logger');

// Get all roles
exports.getAllRoles = async (req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      count: roles.length,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new role dynamically
exports.createRole = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('Role name is required');
    }

    const formattedName = name.trim().toUpperCase();

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: formattedName },
    });

    if (existingRole) {
      res.status(400);
      throw new Error(`Role '${formattedName}' already exists`);
    }

    // Create role
    const newRole = await prisma.role.create({
      data: {
        name: formattedName,
        description: description || `${formattedName} Role`,
      },
    });

    // Automatically seed permissions for this new role across all menus
    const menus = await prisma.menu.findMany();
    await Promise.all(
      menus.map((menu) => {
        return prisma.permission.create({
          data: {
            role: formattedName,
            menuId: menu.id,
            actions: [], // Default to no access
          },
        });
      })
    );

    await logActivity(
      req,
      'CREATE',
      'ROLE',
      `Created role: ${newRole.name}`,
      null,
      newRole
    );

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: newRole,
    });
  } catch (error) {
    next(error);
  }
};

// Update a role
exports.updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      res.status(404);
      throw new Error('Role not found');
    }

    // Prevent renaming system roles
    const isSystemRole = ['SUPERADMIN', 'ADMIN'].includes(role.name);
    if (isSystemRole && name && name.trim().toUpperCase() !== role.name) {
      res.status(400);
      throw new Error(`System role '${role.name}' cannot be renamed`);
    }

    const updatedData = {};
    if (description !== undefined) {
      updatedData.description = description;
    }

    let oldName = role.name;
    let newName = oldName;

    if (name && name.trim().toUpperCase() !== oldName) {
      newName = name.trim().toUpperCase();
      // Ensure new name is unique
      const existingWithName = await prisma.role.findUnique({
        where: { name: newName },
      });
      if (existingWithName) {
        res.status(400);
        throw new Error(`Role name '${newName}' is already taken`);
      }
      updatedData.name = newName;
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: updatedData,
    });

    // If role was renamed, update all associated entities (Users, Menus, Permissions)
    if (newName !== oldName) {
      // 1. Update users role
      await prisma.user.updateMany({
        where: { role: oldName },
        data: { role: newName },
      });

      // 2. Update permissions
      await prisma.permission.updateMany({
        where: { role: oldName },
        data: { role: newName },
      });

      // 3. Update menus (roles array in MongoDB)
      const menus = await prisma.menu.findMany({
        where: {
          roles: {
            has: oldName,
          },
        },
      });

      for (const menu of menus) {
        const updatedRoles = menu.roles.map((r) => (r === oldName ? newName : r));
        await prisma.menu.update({
          where: { id: menu.id },
          data: { roles: updatedRoles },
        });
      }
    }

    await logActivity(
      req,
      'UPDATE',
      'ROLE',
      `Updated role: ${updatedRole.name} (renamed from ${oldName})`,
      role,
      updatedRole
    );

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: updatedRole,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a role
exports.deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      res.status(404);
      throw new Error('Role not found');
    }

    // Prevent deleting system roles
    const isSystemRole = ['SUPERADMIN', 'ADMIN'].includes(role.name);
    if (isSystemRole) {
      res.status(400);
      throw new Error(`System role '${role.name}' cannot be deleted`);
    }

    // Check if any users are currently assigned to this role
    const assignedUsersCount = await prisma.user.count({
      where: { role: role.name },
    });

    if (assignedUsersCount > 0) {
      res.status(400);
      throw new Error(`Cannot delete role '${role.name}' because it is assigned to ${assignedUsersCount} user(s). Reassign them first.`);
    }

    // Delete role from Role collection
    await prisma.role.delete({
      where: { id },
    });

    // Delete all permissions associated with this role
    await prisma.permission.deleteMany({
      where: { role: role.name },
    });

    // Remove role from all Menu roles array
    const menus = await prisma.menu.findMany({
      where: {
        roles: {
          has: role.name,
        },
      },
    });

    for (const menu of menus) {
      const updatedRoles = menu.roles.filter((r) => r !== role.name);
      await prisma.menu.update({
        where: { id: menu.id },
        data: { roles: updatedRoles },
      });
    }

    await logActivity(
      req,
      'DELETE',
      'ROLE',
      `Deleted role: ${role.name}`,
      role,
      null
    );

    res.json({
      success: true,
      message: `Role '${role.name}' deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};
