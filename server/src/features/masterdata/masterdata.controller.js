const prisma = require('../../lib/prisma');
const { logActivity } = require('../../lib/activity-logger');

// ─── STATES ─────────────────────────────────────────────────────────────────
exports.getStates = async (req, res, next) => {
  try {
    const states = await prisma.state.findMany({
      include: {
        districts: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, count: states.length, data: states });
  } catch (err) {
    next(err);
  }
};

exports.createState = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name) {
      res.status(400);
      throw new Error('State name is required');
    }
    const state = await prisma.state.create({
      data: { name: name.trim(), code: code ? code.trim().toUpperCase() : null },
    });
    await logActivity(req, 'CREATE', 'MASTER_DATA', `Created State: ${state.name}`, null, state);
    res.status(201).json({ success: true, data: state });
  } catch (err) {
    next(err);
  }
};

exports.updateState = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, status } = req.body;
    const state = await prisma.state.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        code: code !== undefined ? code.trim().toUpperCase() : undefined,
        status: status !== undefined ? Boolean(status) : undefined,
      },
    });
    res.json({ success: true, data: state });
  } catch (err) {
    next(err);
  }
};

exports.deleteState = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.state.delete({ where: { id } });
    res.json({ success: true, message: 'State deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── DISTRICTS ──────────────────────────────────────────────────────────────
exports.getDistricts = async (req, res, next) => {
  try {
    const { stateId } = req.query;
    const where = stateId ? { stateId } : {};
    const districts = await prisma.district.findMany({
      where,
      include: {
        state: { select: { id: true, name: true } },
        zones: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, count: districts.length, data: districts });
  } catch (err) {
    next(err);
  }
};

exports.createDistrict = async (req, res, next) => {
  try {
    const { name, stateId } = req.body;
    if (!name || !stateId) {
      res.status(400);
      throw new Error('District name and stateId are required');
    }
    const district = await prisma.district.create({
      data: { name: name.trim(), stateId },
      include: { state: true },
    });
    await logActivity(req, 'CREATE', 'MASTER_DATA', `Created District: ${district.name} in ${district.state?.name}`, null, district);
    res.status(201).json({ success: true, data: district });
  } catch (err) {
    next(err);
  }
};

exports.updateDistrict = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, stateId } = req.body;
    const district = await prisma.district.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        stateId: stateId || undefined,
      },
      include: { state: true },
    });
    res.json({ success: true, data: district });
  } catch (err) {
    next(err);
  }
};

exports.deleteDistrict = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.district.delete({ where: { id } });
    res.json({ success: true, message: 'District deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── ZONES ──────────────────────────────────────────────────────────────────
exports.getZones = async (req, res, next) => {
  try {
    const { districtId } = req.query;
    const where = districtId ? { districtId } : {};
    const zones = await prisma.zone.findMany({
      where,
      include: {
        district: {
          select: {
            id: true,
            name: true,
            state: { select: { id: true, name: true } },
          },
        },
        schools: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, count: zones.length, data: zones });
  } catch (err) {
    next(err);
  }
};

exports.createZone = async (req, res, next) => {
  try {
    const { name, districtId } = req.body;
    if (!name || !districtId) {
      res.status(400);
      throw new Error('Zone name and districtId are required');
    }
    const zone = await prisma.zone.create({
      data: { name: name.trim(), districtId },
      include: { district: { include: { state: true } } },
    });
    await logActivity(req, 'CREATE', 'MASTER_DATA', `Created Zone: ${zone.name}`, null, zone);
    res.status(201).json({ success: true, data: zone });
  } catch (err) {
    next(err);
  }
};

exports.updateZone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, districtId } = req.body;
    const zone = await prisma.zone.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        districtId: districtId || undefined,
      },
      include: { district: true },
    });
    res.json({ success: true, data: zone });
  } catch (err) {
    next(err);
  }
};

exports.deleteZone = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.zone.delete({ where: { id } });
    res.json({ success: true, message: 'Zone deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── SCHOOL BOARDS (Using Academy Manager Boards) ───────────────────────────
exports.getSchoolBoards = async (req, res, next) => {
  try {
    const boards = await prisma.board.findMany({
      include: {
        schools: { select: { id: true, name: true } },
        classes: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, count: boards.length, data: boards });
  } catch (err) {
    next(err);
  }
};

exports.createSchoolBoard = async (req, res, next) => {
  try {
    const { name, shortName } = req.body;
    if (!name) {
      res.status(400);
      throw new Error('Board name is required');
    }
    const board = await prisma.board.create({
      data: {
        name: name.trim(),
        shortName: shortName ? shortName.trim().toUpperCase() : name.trim().slice(0, 5).toUpperCase(),
      },
    });
    await logActivity(req, 'CREATE', 'MASTER_DATA', `Created School Board: ${board.name}`, null, board);
    res.status(201).json({ success: true, data: board });
  } catch (err) {
    next(err);
  }
};

exports.updateSchoolBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, shortName, status } = req.body;
    const board = await prisma.board.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        shortName: shortName !== undefined ? shortName.trim().toUpperCase() : undefined,
        status: status !== undefined ? Boolean(status) : undefined,
      },
    });
    res.json({ success: true, data: board });
  } catch (err) {
    next(err);
  }
};

exports.deleteSchoolBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.board.delete({ where: { id } });
    res.json({ success: true, message: 'School Board deleted successfully' });
  } catch (err) {
    next(err);
  }
};


// ─── SCHOOLS ────────────────────────────────────────────────────────────────
exports.getSchools = async (req, res, next) => {
  try {
    const { zoneId, boardId, type, search } = req.query;
    const where = {};
    if (zoneId) where.zoneId = zoneId;
    if (boardId) where.boardId = boardId;
    if (type) where.type = type;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const schools = await prisma.school.findMany({
      where,
      include: {
        zone: {
          include: {
            district: {
              include: { state: true },
            },
          },
        },
        board: true,
        teachers: { select: { id: true, name: true, phone: true, subject: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, count: schools.length, data: schools });
  } catch (err) {
    next(err);
  }
};

exports.createSchool = async (req, res, next) => {
  try {
    const { name, type, address, zoneId, boardId } = req.body;
    if (!name || !zoneId || !boardId) {
      res.status(400);
      throw new Error('School name, zoneId, and boardId are required');
    }
    const school = await prisma.school.create({
      data: {
        name: name.trim(),
        type: type === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE',
        address: address ? address.trim() : null,
        zoneId,
        boardId,
      },
      include: {
        zone: { include: { district: { include: { state: true } } } },
        board: true,
      },
    });
    await logActivity(req, 'CREATE', 'MASTER_DATA', `Created School: ${school.name} (${school.type})`, null, school);
    res.status(201).json({ success: true, data: school });
  } catch (err) {
    next(err);
  }
};

exports.updateSchool = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, address, zoneId, boardId } = req.body;
    const school = await prisma.school.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        type: type !== undefined ? type : undefined,
        address: address !== undefined ? address.trim() : undefined,
        zoneId: zoneId || undefined,
        boardId: boardId || undefined,
      },
      include: { zone: true, board: true },
    });
    res.json({ success: true, data: school });
  } catch (err) {
    next(err);
  }
};

exports.deleteSchool = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.school.delete({ where: { id } });
    res.json({ success: true, message: 'School deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── TEACHERS ───────────────────────────────────────────────────────────────
exports.getTeachers = async (req, res, next) => {
  try {
    const { schoolId, search } = req.query;
    const where = {};
    if (schoolId) where.schoolId = schoolId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { school: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const teachers = await prisma.teacher.findMany({
      where,
      include: {
        school: {
          include: {
            board: true,
            zone: {
              include: {
                district: {
                  include: { state: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, count: teachers.length, data: teachers });
  } catch (err) {
    next(err);
  }
};

exports.createTeacher = async (req, res, next) => {
  try {
    const { name, phone, email, subject, designation, schoolId } = req.body;
    if (!name || !phone || !schoolId) {
      res.status(400);
      throw new Error('Teacher name, phone number, and schoolId are required');
    }

    const cleanPhone = phone.replace(/[\s-]/g, '').trim();

    // Check duplicate phone for same school
    const existing = await prisma.teacher.findFirst({
      where: { schoolId, phone: cleanPhone },
    });
    if (existing) {
      res.status(409);
      throw new Error(`Teacher with phone ${cleanPhone} already exists in this school.`);
    }

    const teacher = await prisma.teacher.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.trim() : null,
        subject: subject ? subject.trim() : null,
        designation: designation ? designation.trim() : null,
        schoolId,
      },
      include: { school: { include: { board: true, zone: true } } },
    });

    await logActivity(req, 'CREATE', 'MASTER_DATA', `Created Teacher: ${teacher.name} (${teacher.phone})`, null, teacher);
    res.status(201).json({ success: true, data: teacher });
  } catch (err) {
    next(err);
  }
};

exports.updateTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, email, subject, designation, schoolId } = req.body;

    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        phone: phone !== undefined ? phone.replace(/[\s-]/g, '').trim() : undefined,
        email: email !== undefined ? email.trim() : undefined,
        subject: subject !== undefined ? subject.trim() : undefined,
        designation: designation !== undefined ? designation.trim() : undefined,
        schoolId: schoolId || undefined,
      },
      include: { school: true },
    });
    res.json({ success: true, data: teacher });
  } catch (err) {
    next(err);
  }
};

exports.deleteTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.teacher.delete({ where: { id } });
    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── MASTER DATA OVERVIEW & HIERARCHICAL TREE SUMMARY ───────────────────────
exports.getMasterDataSummary = async (req, res, next) => {
  try {
    const [statesCount, districtsCount, zonesCount, boardsCount, schoolsCount, teachersCount] = await Promise.all([
      prisma.state.count(),
      prisma.district.count(),
      prisma.zone.count(),
      prisma.board.count(),
      prisma.school.count(),
      prisma.teacher.count(),
    ]);

    res.json({
      success: true,
      data: {
        statesCount,
        districtsCount,
        zonesCount,
        boardsCount,
        schoolsCount,
        teachersCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

