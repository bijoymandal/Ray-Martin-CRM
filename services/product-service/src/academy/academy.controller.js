const prisma = require('../../lib/prisma');
const path = require('path');
const fs = require('fs');

// Helper to format uploads URL path
const getLogoUrlPath = (req) => {
  if (!req.file) return null;
  // Save as relative URL path e.g. "/uploads/logo-12345.png"
  return `/uploads/${req.file.filename}`;
};

// ==========================================
// 1. BOARD CONTROLLERS
// ==========================================
exports.board = {
  getAll: async (req, res, next) => {
    try {
      const items = await prisma.board.findMany({
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, count: items.length, data: items });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, shortName, status } = req.body;
      if (!name || !shortName) {
        res.status(400);
        throw new Error('Name and Short Name are required');
      }

      const statusVal = status === undefined ? true : String(status) === 'true';

      const item = await prisma.board.create({
        data: {
          name,
          shortName,
          status: statusVal,
        },
      });

      res.status(201).json({ success: true, message: 'Board created successfully', data: item });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, shortName, status } = req.body;

      const board = await prisma.board.findUnique({ where: { id } });
      if (!board) {
        res.status(404);
        throw new Error('Board not found');
      }

      const statusVal = status === undefined ? board.status : String(status) === 'true';

      const item = await prisma.board.update({
        where: { id },
        data: {
          name: name !== undefined ? name : board.name,
          shortName: shortName !== undefined ? shortName : board.shortName,
          status: statusVal,
        },
      });

      res.json({ success: true, message: 'Board updated successfully', data: item });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      await prisma.board.delete({ where: { id } });
      res.json({ success: true, message: 'Board deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};

// ==========================================
// 2. CLASS CONTROLLERS
// ==========================================
exports.class = {
  getAll: async (req, res, next) => {
    try {
      const { boardId } = req.query;
      const filter = boardId ? { boardId } : {};

      const items = await prisma.class.findMany({
        where: filter,
        include: { board: true },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, count: items.length, data: items });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, boardId, status } = req.body;
      if (!name || !boardId) {
        res.status(400);
        throw new Error('Class Name and Board are required');
      }

      const statusVal = status === undefined ? true : String(status) === 'true';
      const logoUrl = getLogoUrlPath(req);

      // Verify board exists
      const board = await prisma.board.findUnique({ where: { id: boardId } });
      if (!board) {
        res.status(404);
        throw new Error('Selected Board not found');
      }

      const item = await prisma.class.create({
        data: {
          name,
          boardId,
          status: statusVal,
          logo: logoUrl,
        },
        include: { board: true },
      });

      res.status(201).json({ success: true, message: 'Class created successfully', data: item });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, boardId, status } = req.body;

      const classItem = await prisma.class.findUnique({ where: { id } });
      if (!classItem) {
        res.status(404);
        throw new Error('Class not found');
      }

      const statusVal = status === undefined ? classItem.status : String(status) === 'true';
      let logoUrl = classItem.logo;

      // Handle logo upload update
      if (req.file) {
        logoUrl = getLogoUrlPath(req);
      }

      if (boardId) {
        const board = await prisma.board.findUnique({ where: { id: boardId } });
        if (!board) {
          res.status(404);
          throw new Error('Selected Board not found');
        }
      }

      const item = await prisma.class.update({
        where: { id },
        data: {
          name: name !== undefined ? name : classItem.name,
          boardId: boardId !== undefined ? boardId : classItem.boardId,
          status: statusVal,
          logo: logoUrl,
        },
        include: { board: true },
      });

      res.json({ success: true, message: 'Class updated successfully', data: item });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      await prisma.class.delete({ where: { id } });
      res.json({ success: true, message: 'Class deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};

// ==========================================
// 3. SUBJECT CONTROLLERS
// ==========================================
exports.subject = {
  getAll: async (req, res, next) => {
    try {
      const { classId } = req.query;
      const filter = classId ? { classId } : {};

      const items = await prisma.subject.findMany({
        where: filter,
        include: {
          class: {
            include: { board: true },
          },
        },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, count: items.length, data: items });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, classId, status } = req.body;
      if (!name || !classId) {
        res.status(400);
        throw new Error('Subject Name and Class are required');
      }

      const statusVal = status === undefined ? true : String(status) === 'true';
      const logoUrl = getLogoUrlPath(req);

      const classItem = await prisma.class.findUnique({ where: { id: classId } });
      if (!classItem) {
        res.status(404);
        throw new Error('Selected Class not found');
      }

      const item = await prisma.subject.create({
        data: {
          name,
          classId,
          status: statusVal,
          logo: logoUrl,
        },
        include: {
          class: {
            include: { board: true },
          },
        },
      });

      res.status(201).json({ success: true, message: 'Subject created successfully', data: item });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, classId, status } = req.body;

      const subject = await prisma.subject.findUnique({ where: { id } });
      if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
      }

      const statusVal = status === undefined ? subject.status : String(status) === 'true';
      let logoUrl = subject.logo;

      if (req.file) {
        logoUrl = getLogoUrlPath(req);
      }

      if (classId) {
        const classItem = await prisma.class.findUnique({ where: { id: classId } });
        if (!classItem) {
          res.status(404);
          throw new Error('Selected Class not found');
        }
      }

      const item = await prisma.subject.update({
        where: { id },
        data: {
          name: name !== undefined ? name : subject.name,
          classId: classId !== undefined ? classId : subject.classId,
          status: statusVal,
          logo: logoUrl,
        },
        include: {
          class: {
            include: { board: true },
          },
        },
      });

      res.json({ success: true, message: 'Subject updated successfully', data: item });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      await prisma.subject.delete({ where: { id } });
      res.json({ success: true, message: 'Subject deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};

// ==========================================
// 4. CATEGORY CONTROLLERS
// ==========================================
exports.category = {
  getAll: async (req, res, next) => {
    try {
      const { subjectId } = req.query;
      const filter = subjectId ? { subjectId } : {};

      const items = await prisma.category.findMany({
        where: filter,
        include: {
          subject: {
            include: {
              class: {
                include: { board: true },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, count: items.length, data: items });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, subjectId, status } = req.body;
      if (!name || !subjectId) {
        res.status(400);
        throw new Error('Category Name and Subject are required');
      }

      const statusVal = status === undefined ? true : String(status) === 'true';
      const logoUrl = getLogoUrlPath(req);

      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) {
        res.status(404);
        throw new Error('Selected Subject not found');
      }

      const item = await prisma.category.create({
        data: {
          name,
          subjectId,
          status: statusVal,
          logo: logoUrl,
        },
        include: {
          subject: {
            include: {
              class: {
                include: { board: true },
              },
            },
          },
        },
      });

      res.status(201).json({ success: true, message: 'Category created successfully', data: item });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, subjectId, status } = req.body;

      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) {
        res.status(404);
        throw new Error('Category not found');
      }

      const statusVal = status === undefined ? category.status : String(status) === 'true';
      let logoUrl = category.logo;

      if (req.file) {
        logoUrl = getLogoUrlPath(req);
      }

      if (subjectId) {
        const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) {
          res.status(404);
          throw new Error('Selected Subject not found');
        }
      }

      const item = await prisma.category.update({
        where: { id },
        data: {
          name: name !== undefined ? name : category.name,
          subjectId: subjectId !== undefined ? subjectId : category.subjectId,
          status: statusVal,
          logo: logoUrl,
        },
        include: {
          subject: {
            include: {
              class: {
                include: { board: true },
              },
            },
          },
        },
      });

      res.json({ success: true, message: 'Category updated successfully', data: item });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      await prisma.category.delete({ where: { id } });
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
