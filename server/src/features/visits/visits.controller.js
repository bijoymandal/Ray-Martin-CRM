const prisma = require('../../lib/prisma');
const { logActivity } = require('../../lib/activity-logger');
const fs = require('fs');
const path = require('path');

// ─── GET VISITS (SEARCH, FILTER & PAGINATION) ────────────────────────────────
exports.getVisits = async (req, res, next) => {
  try {
    const {
      search,
      status,
      purpose,
      schoolId,
      districtId,
      visitorId,
      myVisitsOnly,
    } = req.query;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (purpose && purpose !== 'ALL') {
      where.purpose = purpose;
    }

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (myVisitsOnly === 'true' && req.user?.id) {
      where.visitorId = req.user.id;
    } else if (visitorId && visitorId !== 'ALL') {
      where.visitorId = visitorId;
    }

    if (districtId && districtId !== 'ALL') {
      // Filter by schools within district
      const districtZones = await prisma.zone.findMany({
        where: { districtId },
        select: { id: true },
      });
      const zoneIds = districtZones.map((z) => z.id);
      const districtSchools = await prisma.school.findMany({
        where: { zoneId: { in: zoneIds } },
        select: { id: true },
      });
      const schoolIds = districtSchools.map((s) => s.id);

      where.OR = [
        { schoolId: { in: schoolIds } },
        { location: { contains: districtId, mode: 'insensitive' } },
      ];
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { schoolName: { contains: q, mode: 'insensitive' } },
            { contactPerson: { contains: q, mode: 'insensitive' } },
            { contactPhone: { contains: q, mode: 'insensitive' } },
            { location: { contains: q, mode: 'insensitive' } },
            { notes: { contains: q, mode: 'insensitive' } },
            { specimensGiven: { contains: q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [total, visits] = await Promise.all([
      prisma.schoolVisit.count({ where }),
      prisma.schoolVisit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { visitDate: 'desc' },
        include: {
          school: {
            select: {
              id: true,
              name: true,
              type: true,
              address: true,
              zone: {
                select: {
                  id: true,
                  name: true,
                  district: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          visitor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: visits,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET VISIT SUMMARY STATS ────────────────────────────────────────────────
exports.getVisitSummary = async (req, res, next) => {
  try {
    const visits = await prisma.schoolVisit.findMany({
      select: {
        id: true,
        status: true,
        outcome: true,
        visitDate: true,
        schoolName: true,
      },
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let totalVisits = visits.length;
    let scheduledCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let todayCount = 0;
    let positiveOutcomeCount = 0;
    const uniqueSchools = new Set();

    for (const v of visits) {
      if (v.status === 'SCHEDULED') scheduledCount++;
      else if (v.status === 'IN_PROGRESS') inProgressCount++;
      else if (v.status === 'COMPLETED') completedCount++;
      else if (v.status === 'CANCELLED') cancelledCount++;

      if (v.visitDate) {
        const vDate = new Date(v.visitDate);
        if (vDate >= startOfToday && vDate <= endOfToday) {
          todayCount++;
        }
      }

      if (v.outcome === 'POSITIVE' || v.outcome === 'ORDER_EXPECTED' || v.outcome === 'SPECIMEN_DELIVERED') {
        positiveOutcomeCount++;
      }

      if (v.schoolName) {
        uniqueSchools.add(v.schoolName.trim().toLowerCase());
      }
    }

    res.json({
      success: true,
      data: {
        totalVisits,
        scheduledCount,
        inProgressCount,
        completedCount,
        cancelledCount,
        todayCount,
        positiveOutcomeCount,
        uniqueSchoolsCount: uniqueSchools.size,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET SINGLE VISIT ────────────────────────────────────────────────────────
exports.getVisitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const visit = await prisma.schoolVisit.findUnique({
      where: { id },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
            zone: {
              select: {
                id: true,
                name: true,
                district: { select: { id: true, name: true } },
              },
            },
          },
        },
        visitor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit record not found' });
    }

    res.json({ success: true, data: visit });
  } catch (err) {
    next(err);
  }
};

// ─── CREATE VISIT ────────────────────────────────────────────────────────────
exports.createVisit = async (req, res, next) => {
  try {
    const {
      schoolName,
      schoolId,
      contactPerson,
      contactPhone,
      contactEmail,
      location,
      visitDate,
      purpose,
      notes,
      status,
      outcome,
      specimensGiven,
      followUpDate,
      visitorId,
    } = req.body;

    if (!schoolName || !visitDate || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'School name, visit date, and purpose are required fields.',
      });
    }

    // Determine photo URL from uploaded file
    let photoUrl = null;
    const file = req.file || (req.files && (req.files.photo?.[0] || req.files.proofImage?.[0]));
    if (file) {
      photoUrl = `/uploads/${file.filename}`;
    }

    // If schoolId is provided, enrich schoolName / location if not explicitly provided
    let finalSchoolName = schoolName;
    let finalLocation = location;
    if (schoolId) {
      const schoolDoc = await prisma.school.findUnique({
        where: { id: schoolId },
        include: {
          zone: { include: { district: true } },
        },
      });
      if (schoolDoc) {
        finalSchoolName = schoolDoc.name;
        if (!finalLocation) {
          finalLocation = `${schoolDoc.zone?.name || ''}, ${schoolDoc.zone?.district?.name || 'West Bengal'}`.trim();
        }
      }
    }

    const newVisit = await prisma.schoolVisit.create({
      data: {
        schoolId: schoolId || undefined,
        schoolName: finalSchoolName.trim(),
        contactPerson: contactPerson ? contactPerson.trim() : null,
        contactPhone: contactPhone ? contactPhone.trim() : null,
        contactEmail: contactEmail ? contactEmail.trim() : null,
        location: finalLocation ? finalLocation.trim() : null,
        visitDate: new Date(visitDate),
        purpose: purpose.trim(),
        notes: notes ? notes.trim() : null,
        status: status || 'SCHEDULED',
        outcome: outcome || null,
        specimensGiven: specimensGiven ? specimensGiven.trim() : null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        photoUrl,
        visitorId: visitorId || req.user?.id || undefined,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            zone: { select: { name: true, district: { select: { name: true } } } },
          },
        },
        visitor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    await logActivity(
      req,
      'CREATE',
      'VISIT',
      `Logged school visit for "${newVisit.schoolName}"`,
      null,
      newVisit
    );

    res.status(201).json({
      success: true,
      message: 'School visit logged successfully',
      data: newVisit,
    });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE VISIT ────────────────────────────────────────────────────────────
exports.updateVisit = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.schoolVisit.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Visit record not found' });
    }

    const {
      schoolName,
      schoolId,
      contactPerson,
      contactPhone,
      contactEmail,
      location,
      visitDate,
      purpose,
      notes,
      status,
      outcome,
      specimensGiven,
      followUpDate,
      visitorId,
    } = req.body;

    const updateData = {};
    if (schoolName !== undefined) updateData.schoolName = schoolName;
    if (schoolId !== undefined) updateData.schoolId = schoolId || null;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (location !== undefined) updateData.location = location;
    if (visitDate !== undefined) updateData.visitDate = new Date(visitDate);
    if (purpose !== undefined) updateData.purpose = purpose;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (outcome !== undefined) updateData.outcome = outcome;
    if (specimensGiven !== undefined) updateData.specimensGiven = specimensGiven;
    if (followUpDate !== undefined) updateData.followUpDate = followUpDate ? new Date(followUpDate) : null;
    if (visitorId !== undefined) updateData.visitorId = visitorId || null;

    // Handle new photo if uploaded
    const file = req.file || (req.files && (req.files.photo?.[0] || req.files.proofImage?.[0]));
    if (file) {
      updateData.photoUrl = `/uploads/${file.filename}`;
      // Clean up old photo if it exists locally
      if (existing.photoUrl && existing.photoUrl.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '../../..', existing.photoUrl);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (_) {}
        }
      }
    }

    const updated = await prisma.schoolVisit.update({
      where: { id },
      data: updateData,
      include: {
        school: {
          select: {
            id: true,
            name: true,
            zone: { select: { name: true, district: { select: { name: true } } } },
          },
        },
        visitor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    await logActivity(
      req,
      'UPDATE',
      'VISIT',
      `Updated school visit for "${updated.schoolName}"`,
      existing,
      updated
    );

    res.json({
      success: true,
      message: 'Visit updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// ─── QUICK STATUS UPDATE ─────────────────────────────────────────────────────
exports.updateVisitStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid visit status' });
    }

    const existing = await prisma.schoolVisit.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Visit record not found' });
    }

    const updated = await prisma.schoolVisit.update({
      where: { id },
      data: { status },
    });

    await logActivity(
      req,
      'UPDATE',
      'VISIT',
      `Changed visit status to ${status} for "${updated.schoolName}"`,
      { status: existing.status },
      { status: updated.status }
    );

    res.json({
      success: true,
      message: `Visit status changed to ${status}`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE VISIT ────────────────────────────────────────────────────────────
exports.deleteVisit = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.schoolVisit.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Visit record not found' });
    }

    // Remove photo if stored locally
    if (existing.photoUrl && existing.photoUrl.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '../../..', existing.photoUrl);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (_) {}
      }
    }

    await prisma.schoolVisit.delete({ where: { id } });

    await logActivity(
      req,
      'DELETE',
      'VISIT',
      `Deleted school visit record for "${existing.schoolName}"`,
      existing,
      null
    );

    res.json({
      success: true,
      message: 'Visit record deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
