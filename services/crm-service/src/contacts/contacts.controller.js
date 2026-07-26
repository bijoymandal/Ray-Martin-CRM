const prisma = require('../../lib/prisma');
const { logActivity } = require('../../lib/activity-logger');

// Get all contacts for the authenticated user (Paginated)
exports.getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await prisma.contact.count({
      where: { userId: req.user.id },
    });

    const contacts = await prisma.contact.findMany({
      where: { userId: req.user.id },
      include: {
        _count: {
          select: { deals: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    res.json({
      success: true,
      count: contacts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: contacts,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single contact by id
exports.getById = async (req, res, next) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: {
        deals: true,
      },
    });

    if (!contact) {
      res.status(404);
      throw new Error('Contact not found');
    }

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new contact
exports.create = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, company, status, notes } = req.body;

    if (!firstName || !lastName || !email) {
      res.status(400);
      throw new Error('First name, last name, and email are required');
    }

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        company,
        status: status || 'LEAD',
        notes,
        userId: req.user.id,
      },
    });

    await logActivity(
      req,
      'CREATE',
      'CONTACT',
      `Created contact: ${contact.firstName} ${contact.lastName}`,
      null,
      contact
    );

    res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

// Update an existing contact
exports.update = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, company, status, notes } = req.body;

    // Check if contact exists and belongs to user
    const contactExists = await prisma.contact.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!contactExists) {
      res.status(404);
      throw new Error('Contact not found');
    }

    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: {
        firstName: firstName !== undefined ? firstName : contactExists.firstName,
        lastName: lastName !== undefined ? lastName : contactExists.lastName,
        email: email !== undefined ? email : contactExists.email,
        phone: phone !== undefined ? phone : contactExists.phone,
        company: company !== undefined ? company : contactExists.company,
        status: status !== undefined ? status : contactExists.status,
        notes: notes !== undefined ? notes : contactExists.notes,
      },
    });

    await logActivity(
      req,
      'UPDATE',
      'CONTACT',
      `Updated contact: ${contact.firstName} ${contact.lastName}`,
      contactExists,
      contact
    );

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a contact
exports.delete = async (req, res, next) => {
  try {
    // Check if contact exists and belongs to user
    const contactExists = await prisma.contact.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!contactExists) {
      res.status(404);
      throw new Error('Contact not found or unauthorized');
    }

    await prisma.contact.delete({
      where: { id: req.params.id },
    });

    await logActivity(
      req,
      'DELETE',
      'CONTACT',
      `Deleted contact: ${contactExists.firstName} ${contactExists.lastName}`,
      contactExists,
      null
    );

    res.json({
      success: true,
      message: 'Contact removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
