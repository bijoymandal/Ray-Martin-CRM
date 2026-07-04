const prisma = require('../lib/prisma');

// Get all deals for the authenticated user
exports.getAll = async (req, res, next) => {
  try {
    const deals = await prisma.deal.findMany({
      where: { userId: req.user.id },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      count: deals.length,
      data: deals,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single deal by id
exports.getById = async (req, res, next) => {
  try {
    const deal = await prisma.deal.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: {
        contact: true,
      },
    });

    if (!deal) {
      res.status(404);
      throw new Error('Deal not found');
    }

    res.json({
      success: true,
      data: deal,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new deal
exports.create = async (req, res, next) => {
  try {
    const { title, value, stage, contactId } = req.body;

    if (!title || value === undefined || !contactId) {
      res.status(400);
      throw new Error('Title, value, and contactId are required');
    }

    // Verify contact belongs to this user
    const contactExists = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId: req.user.id,
      },
    });

    if (!contactExists) {
      res.status(400);
      throw new Error('Invalid contact selected or unauthorized');
    }

    const deal = await prisma.deal.create({
      data: {
        title,
        value: parseFloat(value),
        stage: stage || 'QUALIFICATION',
        contactId,
        userId: req.user.id,
      },
      include: {
        contact: true,
      },
    });

    res.status(201).json({
      success: true,
      data: deal,
    });
  } catch (error) {
    next(error);
  }
};

// Update an existing deal
exports.update = async (req, res, next) => {
  try {
    const { title, value, stage, contactId } = req.body;

    // Check if deal exists and belongs to user
    const dealExists = await prisma.deal.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!dealExists) {
      res.status(404);
      throw new Error('Deal not found');
    }

    // If changing contact, verify the new contact belongs to this user
    if (contactId && contactId !== dealExists.contactId) {
      const contactExists = await prisma.contact.findFirst({
        where: {
          id: contactId,
          userId: req.user.id,
        },
      });

      if (!contactExists) {
        res.status(400);
        throw new Error('Invalid contact selected or unauthorized');
      }
    }

    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: {
        title: title !== undefined ? title : dealExists.title,
        value: value !== undefined ? parseFloat(value) : dealExists.value,
        stage: stage !== undefined ? stage : dealExists.stage,
        contactId: contactId !== undefined ? contactId : dealExists.contactId,
      },
      include: {
        contact: true,
      },
    });

    res.json({
      success: true,
      data: deal,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a deal
exports.delete = async (req, res, next) => {
  try {
    // Check if deal exists and belongs to user
    const dealExists = await prisma.deal.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!dealExists) {
      res.status(404);
      throw new Error('Deal not found or unauthorized');
    }

    await prisma.deal.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Deal removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
