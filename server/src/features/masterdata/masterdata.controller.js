const prisma = require('../../lib/prisma');
const { logActivity } = require('../../lib/activity-logger');

// ─── STATES ─────────────────────────────────────────────────────────────────
exports.getStates = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const where = {};
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (page) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const skip = (pageNum - 1) * limitNum;

      const [total, states] = await Promise.all([
        prisma.state.count({ where }),
        prisma.state.findMany({
          where,
          include: {
            districts: {
              select: { id: true, name: true },
            },
            _count: { select: { districts: true } },
          },
          orderBy: { name: 'asc' },
          skip,
          take: limitNum,
        }),
      ]);

      return res.json({
        success: true,
        count: states.length,
        total,
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        data: states,
      });
    }

    const states = await prisma.state.findMany({
      where,
      include: {
        districts: {
          select: { id: true, name: true },
        },
        _count: { select: { districts: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, count: states.length, total: states.length, data: states });
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
    const { stateId, search, page, limit } = req.query;
    const where = {};
    if (stateId) where.stateId = stateId;
    if (search && search.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    if (page) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const skip = (pageNum - 1) * limitNum;

      const [total, districts] = await Promise.all([
        prisma.district.count({ where }),
        prisma.district.findMany({
          where,
          include: {
            state: { select: { id: true, name: true } },
            zones: { select: { id: true, name: true } },
            _count: { select: { zones: true } },
          },
          orderBy: { name: 'asc' },
          skip,
          take: limitNum,
        }),
      ]);

      return res.json({
        success: true,
        count: districts.length,
        total,
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        data: districts,
      });
    }

    const districts = await prisma.district.findMany({
      where,
      include: {
        state: { select: { id: true, name: true } },
        zones: { select: { id: true, name: true } },
        _count: { select: { zones: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, count: districts.length, total: districts.length, data: districts });
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
    const { districtId, stateId, search, page, limit } = req.query;
    const where = {};
    if (districtId) {
      where.districtId = districtId;
    } else if (stateId) {
      const stateDistricts = await prisma.district.findMany({
        where: { stateId },
        select: { id: true },
      });
      where.districtId = { in: stateDistricts.map((d) => d.id) };
    }

    if (search && search.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    if (page) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const skip = (pageNum - 1) * limitNum;

      const [total, zones] = await Promise.all([
        prisma.zone.count({ where }),
        prisma.zone.findMany({
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
            _count: { select: { schools: true } },
          },
          orderBy: { name: 'asc' },
          skip,
          take: limitNum,
        }),
      ]);

      return res.json({
        success: true,
        count: zones.length,
        total,
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        data: zones,
      });
    }

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
        _count: { select: { schools: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, count: zones.length, total: zones.length, data: zones });
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
    const { search, page, limit } = req.query;
    const where = {};
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { shortName: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (page) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const skip = (pageNum - 1) * limitNum;

      const [total, boards] = await Promise.all([
        prisma.board.count({ where }),
        prisma.board.findMany({
          where,
          include: {
            schools: { select: { id: true, name: true } },
            classes: { select: { id: true, name: true } },
            _count: { select: { schools: true, classes: true } },
          },
          orderBy: { name: 'asc' },
          skip,
          take: limitNum,
        }),
      ]);

      return res.json({
        success: true,
        count: boards.length,
        total,
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        data: boards,
      });
    }

    const boards = await prisma.board.findMany({
      where,
      include: {
        schools: { select: { id: true, name: true } },
        classes: { select: { id: true, name: true } },
        _count: { select: { schools: true, classes: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, count: boards.length, total: boards.length, data: boards });
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
    const { zoneId, districtId, stateId, boardId, type, search, page, limit } = req.query;
    const where = {};

    if (zoneId) {
      where.zoneId = zoneId;
    } else if (districtId) {
      const districtZones = await prisma.zone.findMany({
        where: { districtId },
        select: { id: true },
      });
      where.zoneId = { in: districtZones.map((z) => z.id) };
    } else if (stateId) {
      const stateDistricts = await prisma.district.findMany({
        where: { stateId },
        select: { id: true },
      });
      const stateZones = await prisma.zone.findMany({
        where: { districtId: { in: stateDistricts.map((d) => d.id) } },
        select: { id: true },
      });
      where.zoneId = { in: stateZones.map((z) => z.id) };
    }

    if (boardId) where.boardId = boardId;
    if (type) where.type = type;
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (page) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const skip = (pageNum - 1) * limitNum;

      const [total, schools] = await Promise.all([
        prisma.school.count({ where }),
        prisma.school.findMany({
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
            _count: { select: { teachers: true } },
          },
          orderBy: { name: 'asc' },
          skip,
          take: limitNum,
        }),
      ]);

      return res.json({
        success: true,
        count: schools.length,
        total,
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        data: schools,
      });
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
        _count: { select: { teachers: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, count: schools.length, total: schools.length, data: schools });
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
    const {
      schoolId,
      districtId,
      district,
      zoneId,
      zone,
      boardId,
      categoryType, // 'School' | 'Private Tutor' | 'ALL'
      schoolType,
      class: classFilter, // '5', '6', '7', '8', '9', '10', '11', '12'
      subject,
      search,
      page,
      limit,
    } = req.query;

    const where = {};

    // Category Type filter (School Teacher vs Private Teacher)
    if (categoryType && categoryType !== 'ALL' && categoryType !== 'all') {
      if (categoryType === 'PRIVATE_TEACHER' || categoryType.toLowerCase().includes('private')) {
        where.categoryType = 'Private Tutor';
      } else if (categoryType === 'SCHOOL_TEACHER' || categoryType.toLowerCase().includes('school')) {
        where.categoryType = 'School';
      } else {
        where.categoryType = categoryType;
      }
    }

    // Class-wise filter (belongs to class)
    if (classFilter && classFilter !== 'ALL' && classFilter !== 'all') {
      where.classes = { has: String(classFilter).trim() };
    }

    // School Type filter
    if (schoolType && schoolType !== 'ALL' && schoolType !== 'all') {
      where.schoolType = { equals: schoolType, mode: 'insensitive' };
    }

    // District filter (handles both string district name and districtId)
    let effectiveDistrict = district && district !== 'ALL' && district !== 'all' ? district : null;
    if (!effectiveDistrict && districtId) {
      const dRec = await prisma.district.findUnique({ where: { id: districtId }, select: { name: true } });
      if (dRec) effectiveDistrict = dRec.name;
    }

    if (effectiveDistrict) {
      if (districtId) {
        const districtCondition = [
          { district: { equals: effectiveDistrict, mode: 'insensitive' } },
          { school: { zone: { districtId } } },
        ];
        if (where.OR) {
          where.AND = [{ OR: where.OR }, { OR: districtCondition }];
          delete where.OR;
        } else {
          where.OR = districtCondition;
        }
      } else {
        where.district = { equals: effectiveDistrict, mode: 'insensitive' };
      }
    }

    // Zone filter (handles both string zone name and zoneId)
    let effectiveZone = zone && zone !== 'ALL' && zone !== 'all' ? zone : null;
    if (!effectiveZone && zoneId) {
      const zRec = await prisma.zone.findUnique({ where: { id: zoneId }, select: { name: true } });
      if (zRec) effectiveZone = zRec.name;
    }

    if (effectiveZone) {
      if (zoneId) {
        const zoneCondition = [
          { zone: { equals: effectiveZone, mode: 'insensitive' } },
          { school: { zoneId } },
        ];
        if (where.OR) {
          where.AND = [{ OR: where.OR }, { OR: zoneCondition }];
          delete where.OR;
        } else {
          where.OR = zoneCondition;
        }
      } else {
        where.zone = { equals: effectiveZone, mode: 'insensitive' };
      }
    }

    // Subject filter
    if (subject && subject !== 'ALL' && subject !== 'all') {
      const subjectCondition = [
        { subject: { contains: subject, mode: 'insensitive' } },
        { subjects: { has: subject } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: subjectCondition }];
        delete where.OR;
      } else {
        where.OR = subjectCondition;
      }
    }

    // Relational school & board filters
    if (schoolId) {
      where.schoolId = schoolId;
    } else if (boardId) {
      where.school = { ...(where.school || {}), boardId };
    }

    if (search && search.trim()) {
      const q = search.trim();
      const searchConditions = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { designation: { contains: q, mode: 'insensitive' } },
        { schoolName: { contains: q, mode: 'insensitive' } },
        { district: { contains: q, mode: 'insensitive' } },
        { zone: { contains: q, mode: 'insensitive' } },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const [total, teachers, schoolCount, privateCount] = await Promise.all([
      prisma.teacher.count({ where }),
      prisma.teacher.findMany({
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
        skip,
        take: limitNum,
      }),
      prisma.teacher.count({ where: { ...where, categoryType: 'School' } }),
      prisma.teacher.count({ where: { ...where, categoryType: 'Private Tutor' } }),
    ]);

    return res.json({
      success: true,
      count: teachers.length,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      summary: {
        totalMatching: total,
        schoolTeachersCount: schoolCount,
        privateTeachersCount: privateCount,
      },
      data: teachers,
    });
  } catch (err) {
    next(err);
  }
};

exports.getTeacherFilters = async (req, res, next) => {
  try {
    const [totalCount, schoolCount, privateCount, districtsRaw] = await Promise.all([
      prisma.teacher.count(),
      prisma.teacher.count({ where: { categoryType: 'School' } }),
      prisma.teacher.count({ where: { categoryType: 'Private Tutor' } }),
      prisma.district.findMany({
        select: { name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const allClasses = ['5', '6', '7', '8', '9', '10', '11', '12'];
    const schoolTypes = ['HS School', 'Primary School', 'Kg/Nursery School', 'CBSE SCHOOL', 'Private Coaching'];
    const categoryTypes = [
      { id: 'ALL', name: 'All Teachers', count: totalCount },
      { id: 'School', name: 'School Teachers', count: schoolCount },
      { id: 'Private Tutor', name: 'Private Teachers / Tutors', count: privateCount },
    ];

    res.json({
      success: true,
      data: {
        totalCount,
        schoolCount,
        privateCount,
        categoryTypes,
        classes: allClasses,
        schoolTypes,
        districts: districtsRaw.map((d) => d.name),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.createTeacher = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      subject,
      subjects,
      classes,
      categoryType,
      schoolType,
      schoolName,
      district,
      zone,
      board,
      designation,
      schoolId,
    } = req.body;

    if (!name || !phone) {
      res.status(400);
      throw new Error('Teacher name and phone number are required');
    }

    const cleanPhone = phone.replace(/[\s-]/g, '').trim();

    // Check duplicate phone for same schoolName / institution
    const existing = await prisma.teacher.findFirst({
      where: {
        phone: cleanPhone,
        ...(schoolId ? { schoolId } : { schoolName: schoolName || undefined }),
      },
    });
    if (existing) {
      res.status(409);
      throw new Error(`A teacher with phone ${cleanPhone} already exists in ${schoolName || 'this institution'}.`);
    }

    let resolvedSchoolId = schoolId || null;
    let resolvedDistrict = district || null;
    let resolvedZone = zone || null;
    let resolvedBoard = board || null;

    if (schoolId) {
      const sch = await prisma.school.findUnique({
        where: { id: schoolId },
        include: { zone: { include: { district: true } }, board: true },
      });
      if (sch) {
        resolvedDistrict = resolvedDistrict || sch.zone?.district?.name;
        resolvedZone = resolvedZone || sch.zone?.name;
        resolvedBoard = resolvedBoard || sch.board?.name;
      }
    } else if (schoolName && schoolName.trim()) {
      const sch = await prisma.school.findFirst({
        where: { name: { equals: schoolName.trim(), mode: 'insensitive' } },
        include: { zone: { include: { district: true } }, board: true },
      });
      if (sch) {
        resolvedSchoolId = sch.id;
        resolvedDistrict = resolvedDistrict || sch.zone?.district?.name;
        resolvedZone = resolvedZone || sch.zone?.name;
        resolvedBoard = resolvedBoard || sch.board?.name;
      }
    }

    const teacher = await prisma.teacher.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.trim() : null,
        subject: subject ? subject.trim() : (Array.isArray(subjects) && subjects[0] ? subjects[0] : null),
        subjects: Array.isArray(subjects) ? subjects : (subject ? [subject.trim()] : []),
        classes: Array.isArray(classes) ? classes : [],
        categoryType: categoryType || 'School',
        schoolType: schoolType || null,
        schoolName: schoolName ? schoolName.trim() : null,
        district: resolvedDistrict,
        zone: resolvedZone,
        board: resolvedBoard,
        designation: designation ? designation.trim() : (categoryType === 'Private Tutor' ? 'Private Tutor' : 'Subject Teacher'),
        schoolId: resolvedSchoolId,
      },
      include: {
        school: {
          include: {
            board: true,
            zone: { include: { district: { include: { state: true } } } },
          },
        },
      },
    });

    await logActivity(req, 'CREATE', 'MASTER_DATA', `Created Teacher: ${teacher.name} (${teacher.categoryType})`, null, teacher);
    res.status(201).json({ success: true, data: teacher });
  } catch (err) {
    next(err);
  }
};

exports.updateTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      subject,
      subjects,
      classes,
      categoryType,
      schoolType,
      schoolName,
      district,
      zone,
      board,
      designation,
      schoolId,
    } = req.body;

    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        phone: phone !== undefined ? phone.replace(/[\s-]/g, '').trim() : undefined,
        email: email !== undefined ? (email ? email.trim() : null) : undefined,
        subject: subject !== undefined ? (subject ? subject.trim() : null) : undefined,
        subjects: subjects !== undefined ? (Array.isArray(subjects) ? subjects : [subjects]) : undefined,
        classes: classes !== undefined ? (Array.isArray(classes) ? classes : [classes]) : undefined,
        categoryType: categoryType !== undefined ? categoryType : undefined,
        schoolType: schoolType !== undefined ? schoolType : undefined,
        schoolName: schoolName !== undefined ? schoolName.trim() : undefined,
        district: district !== undefined ? district : undefined,
        zone: zone !== undefined ? zone : undefined,
        board: board !== undefined ? board : undefined,
        designation: designation !== undefined ? designation.trim() : undefined,
        schoolId: schoolId !== undefined ? schoolId : undefined,
      },
      include: {
        school: {
          include: {
            board: true,
            zone: { include: { district: { include: { state: true } } } },
          },
        },
      },
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

// ─── INITIALIZE WEST BENGAL MASTER DATA ─────────────────────────────────────
const { seedWestBengalMasterData } = require('./west-bengal-seed.data');

exports.initWestBengalMasterData = async (req, res, next) => {
  try {
    const result = await seedWestBengalMasterData(prisma);
    await logActivity(
      req,
      'CREATE',
      'MASTER_DATA',
      `Synchronized West Bengal master locations: ${result.districtsCreated} districts, ${result.zonesCreated} zones, ${result.schoolsCreated} schools.`,
      null,
      result
    );
    res.json({
      success: true,
      message: 'West Bengal master districts, zones, and benchmark schools loaded successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// ─── USER DISTRICT ACCESS MANAGEMENT ────────────────────────────────────────
exports.getUserDistrictAccess = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });

    let accessDocs = [];
    try {
      const rawRes = await prisma.$runCommandRaw({
        find: 'UserDistrictAccess',
        filter: {},
      });
      if (rawRes?.cursor?.firstBatch) {
        accessDocs = rawRes.cursor.firstBatch;
      }
    } catch (e) {
      // Collection may not exist yet, that's fine
    }

    const accessMap = {};
    for (const doc of accessDocs) {
      accessMap[doc.userId] = doc.districtIds || [];
    }

    const data = users.map((u) => ({
      ...u,
      districtIds: accessMap[u.id] || [],
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

exports.updateUserDistrictAccess = async (req, res, next) => {
  try {
    const { userId, districtIds } = req.body;
    if (!userId || !Array.isArray(districtIds)) {
      res.status(400);
      throw new Error('userId and districtIds array are required');
    }

    await prisma.$runCommandRaw({
      update: 'UserDistrictAccess',
      updates: [
        {
          q: { userId },
          u: { $set: { userId, districtIds, updatedAt: new Date() } },
          upsert: true,
        },
      ],
    });

    await logActivity(
      req,
      'UPDATE',
      'USER_ACCESS',
      `Updated district access for user ${userId} (${districtIds.length} districts)`
    );

    res.json({
      success: true,
      message: 'District access updated successfully',
      userId,
      districtIds,
    });
  } catch (err) {
    next(err);
  }
};


