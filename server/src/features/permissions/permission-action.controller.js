const prisma = require('../../lib/prisma');

// Get all permission actions
exports.getAllPermissionActions = async (req, res, next) => {
  try {
    const actions = await prisma.permissionAction.findMany({
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      count: actions.length,
      data: actions,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new permission action dynamically
exports.createPermissionAction = async (req, res, next) => {
  try {
    const { name, label, description } = req.body;

    if (!name || !label) {
      res.status(400);
      throw new Error('Name and Label are required');
    }

    // Standardize naming: must be camelCase and start with "can" (e.g. canApprove)
    let formattedName = name.trim();
    if (!formattedName.startsWith('can')) {
      formattedName = 'can' + formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
    }

    // Check if name already exists
    const existing = await prisma.permissionAction.findUnique({
      where: { name: formattedName },
    });

    if (existing) {
      res.status(400);
      throw new Error(`Permission action '${formattedName}' already exists`);
    }

    // Create action
    const newAction = await prisma.permissionAction.create({
      data: {
        name: formattedName,
        label: label.trim(),
        description: description || `${label.trim()} Action`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Permission action created successfully',
      data: newAction,
    });
  } catch (error) {
    next(error);
  }
};

// Update permission action label / description
exports.updatePermissionAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, description } = req.body;

    const action = await prisma.permissionAction.findUnique({
      where: { id },
    });

    if (!action) {
      res.status(404);
      throw new Error('Permission action not found');
    }

    const updated = await prisma.permissionAction.update({
      where: { id },
      data: {
        label: label !== undefined ? label.trim() : action.label,
        description: description !== undefined ? description.trim() : action.description,
      },
    });

    res.json({
      success: true,
      message: 'Permission action updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a permission action
exports.deletePermissionAction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const action = await prisma.permissionAction.findUnique({
      where: { id },
    });

    if (!action) {
      res.status(404);
      throw new Error('Permission action not found');
    }

    // Protect system actions
    const isSystemAction = ['canView', 'canCreate', 'canEdit', 'canDelete'].includes(action.name);
    if (isSystemAction) {
      res.status(400);
      throw new Error(`System core action '${action.name}' cannot be deleted`);
    }

    // Delete dynamic action
    await prisma.permissionAction.delete({
      where: { id },
    });

    // Cascade delete: Pull the action name from all Role-Menu Permission actions array
    const permissions = await prisma.permission.findMany({
      where: {
        actions: {
          has: action.name,
        },
      },
    });

    for (const perm of permissions) {
      const updatedActions = perm.actions.filter((a) => a !== action.name);
      await prisma.permission.update({
        where: { id: perm.id },
        data: { actions: updatedActions },
      });
    }

    res.json({
      success: true,
      message: `Permission action '${action.name}' deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};
