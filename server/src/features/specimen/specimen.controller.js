const prisma = require('../../lib/prisma');
const { logActivity } = require('../../lib/activity-logger');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Helper to compute MD5 hash of an uploaded file
const getFileHash = (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
  } catch (err) {
    console.error('Error computing file hash:', err);
    return null;
  }
};

// Get all specimen records (Paginated with search/filter)
exports.getAll = async (req, res, next) => {
  try {
    const { search, bookId, status, verificationStatus, flaggedOnly } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const where = {};
    if (bookId) where.bookId = bookId;
    if (status) where.status = status;
    if (verificationStatus) where.verificationStatus = verificationStatus;
    if (flaggedOnly === 'true') {
      where.flagReason = { not: null };
    }

    if (search) {
      where.OR = [
        { teacherName: { contains: search, mode: 'insensitive' } },
        { teacherSchool: { contains: search, mode: 'insensitive' } },
        { teacherPhone: { contains: search, mode: 'insensitive' } },
        { book: { name: { contains: search, mode: 'insensitive' } } },
        { salesPerson: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const total = await prisma.specimenRecord.count({ where });

    const records = await prisma.specimenRecord.findMany({
      where,
      include: {
        book: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            category: {
              select: {
                name: true,
                subject: {
                  select: {
                    name: true,
                    class: {
                      select: {
                        name: true,
                        board: { select: { shortName: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        salesPerson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { handedAt: 'desc' },
      skip,
      take: limit,
    });

    res.json({
      success: true,
      count: records.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

// Superadmin Audit Overview - returns duplicate counts & flagged records
exports.getAuditSummary = async (req, res, next) => {
  try {
    // Ensure caller has ADMIN or SUPERADMIN role
    if (!['SUPERADMIN', 'ADMIN'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Forbidden: Only Superadmin and Admin can access the audit summary');
    }

    const totalRecords = await prisma.specimenRecord.count();
    const pendingCount = await prisma.specimenRecord.count({ where: { verificationStatus: 'PENDING' } });
    const approvedCount = await prisma.specimenRecord.count({ where: { verificationStatus: 'APPROVED' } });
    const rejectedCount = await prisma.specimenRecord.count({ where: { verificationStatus: 'REJECTED' } });
    const flaggedCount = await prisma.specimenRecord.count({ where: { flagReason: { not: null } } });

    // Grouping by imageHash to find duplicate images across different records
    const allRecordsWithHash = await prisma.specimenRecord.findMany({
      where: { imageHash: { not: null } },
      select: { id: true, imageHash: true, teacherName: true, salesPersonId: true },
    });

    const hashMap = {};
    allRecordsWithHash.forEach((r) => {
      hashMap[r.imageHash] = (hashMap[r.imageHash] || 0) + 1;
    });

    const duplicateImageHashes = Object.keys(hashMap).filter((h) => hashMap[h] > 1);

    res.json({
      success: true,
      data: {
        totalRecords,
        pendingCount,
        approvedCount,
        rejectedCount,
        flaggedCount,
        duplicateImageCount: duplicateImageHashes.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Check duplicate before creation: GET /specimen/check?bookId=...&teacherName=...&teacherSchool=...
exports.checkDuplicate = async (req, res, next) => {
  try {
    const { bookId, teacherName, teacherSchool } = req.query;

    if (!bookId || !teacherName || !teacherSchool) {
      return res.json({
        success: true,
        isDuplicate: false,
        message: 'Provide book, teacher name, and school to check duplicates',
      });
    }

    const cleanName = teacherName.trim();
    const cleanSchool = teacherSchool.trim();

    // Query database for existing record of same book to same teacher at same school
    const existing = await prisma.specimenRecord.findFirst({
      where: {
        bookId,
        teacherName: { equals: cleanName, mode: 'insensitive' },
        teacherSchool: { equals: cleanSchool, mode: 'insensitive' },
      },
      include: {
        book: { select: { id: true, name: true } },
        salesPerson: { select: { id: true, name: true } },
      },
    });

    if (existing) {
      return res.json({
        success: true,
        isDuplicate: true,
        message: `DUPLICATE BLOCKED: The book "${existing.book?.name}" was ALREADY given to teacher ${existing.teacherName} at ${existing.teacherSchool} by ${existing.salesPerson?.name} on ${new Date(existing.handedAt).toLocaleDateString()}.`,
        existingRecord: existing,
      });
    }

    res.json({
      success: true,
      isDuplicate: false,
      message: 'No duplicate found. Safe to issue specimen book.',
    });
  } catch (error) {
    next(error);
  }
};

// Create new specimen record (with proofImage & Duplicate Image Check)
exports.create = async (req, res, next) => {
  try {
    const { bookId, teacherName, teacherPhone, teacherSchool, teacherSubject, notes } = req.body;

    if (!bookId || !teacherName || !teacherSchool) {
      res.status(400);
      throw new Error('Book, Teacher Name, and School Name are required');
    }

    const cleanName = teacherName.trim();
    const cleanSchool = teacherSchool.trim();

    // 1. Strict Duplicate Check: Same book + Same teacher + Same school = REJECTED
    const duplicateRecord = await prisma.specimenRecord.findFirst({
      where: {
        bookId,
        teacherName: { equals: cleanName, mode: 'insensitive' },
        teacherSchool: { equals: cleanSchool, mode: 'insensitive' },
      },
      include: {
        book: true,
        salesPerson: true,
      },
    });

    if (duplicateRecord) {
      res.status(409); // Conflict
      throw new Error(
        `DUPLICATE REJECTED: Specimen book "${duplicateRecord.book?.name}" was already given to teacher ${duplicateRecord.teacherName} at ${duplicateRecord.teacherSchool} by ${duplicateRecord.salesPerson?.name}.`
      );
    }

    // 2. Handle Image Upload & Image Hash Computation
    let proofImageUrl = null;
    let computedImageHash = null;
    let isDuplicateImage = false;
    let duplicateImageRecord = null;

    if (req.files) {
      const fileObj = req.files['proofImage']?.[0] || req.files['image']?.[0] || req.files['teacherPhoto']?.[0];
      if (fileObj) {
        proofImageUrl = `/uploads/${fileObj.filename}`;
        const absolutePath = path.join(__dirname, '../../../uploads', fileObj.filename);
        computedImageHash = getFileHash(absolutePath);

        if (computedImageHash) {
          // Check if another record used the EXACT same image (Duplicate Image Detection)
          duplicateImageRecord = await prisma.specimenRecord.findFirst({
            where: { imageHash: computedImageHash },
            include: { salesPerson: { select: { name: true } }, book: { select: { name: true } } },
          });

          if (duplicateImageRecord) {
            isDuplicateImage = true;
          }
        }
      }
    }

    // 3. Determine Flag Reason for Superadmin Review
    let flagReason = null;
    if (isDuplicateImage) {
      flagReason = `DUPLICATE_IMAGE: Same proof photo was previously uploaded for book "${duplicateImageRecord.book?.name}" by ${duplicateImageRecord.salesPerson?.name}.`;
    }

    const record = await prisma.specimenRecord.create({
      data: {
        bookId,
        teacherName: cleanName,
        teacherPhone: teacherPhone ? teacherPhone.trim() : null,
        teacherSchool: cleanSchool,
        teacherSubject: teacherSubject ? teacherSubject.trim() : null,
        proofImage: proofImageUrl,
        imageHash: computedImageHash,
        salesPersonId: req.user.id,
        status: 'GIVEN',
        verificationStatus: isDuplicateImage ? 'REJECTED' : 'PENDING',
        flagReason: flagReason,
        notes: notes ? notes.trim() : null,
      },
      include: {
        book: true,
        salesPerson: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity(
      req,
      'CREATE',
      'SPECIMEN_RECORD',
      `Issued specimen book "${record.book?.name}" to teacher ${record.teacherName} at ${record.teacherSchool}${isDuplicateImage ? ' [FLAGGED: Duplicate Image]' : ''}`,
      null,
      record
    );

    res.status(201).json({
      success: true,
      message: isDuplicateImage
        ? 'Record created but FLAGGED for Superadmin review due to DUPLICATE IMAGE detection.'
        : 'Specimen record created successfully',
      data: record,
      isDuplicateImage,
    });
  } catch (error) {
    next(error);
  }
};

// Superadmin Verification Endpoint: Approve or Reject a specimen record
exports.verifyRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verificationStatus, flagReason, notes } = req.body; // 'APPROVED' | 'REJECTED' | 'PENDING'

    if (!['SUPERADMIN', 'ADMIN'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Forbidden: Only Superadmin or Admin can verify specimen records');
    }

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(verificationStatus)) {
      res.status(400);
      throw new Error('Invalid verificationStatus. Must be APPROVED, REJECTED, or PENDING.');
    }

    const existing = await prisma.specimenRecord.findUnique({ where: { id } });
    if (!existing) {
      res.status(404);
      throw new Error('Specimen record not found');
    }

    const updated = await prisma.specimenRecord.update({
      where: { id },
      data: {
        verificationStatus,
        flagReason: flagReason !== undefined ? flagReason : existing.flagReason,
        verifiedBy: `${req.user.name} (${req.user.role})`,
        verifiedAt: new Date(),
        notes: notes !== undefined ? notes : existing.notes,
      },
      include: {
        book: true,
        salesPerson: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity(
      req,
      'UPDATE',
      'SPECIMEN_VERIFICATION',
      `Superadmin ${req.user.name} set verification status to ${verificationStatus} for teacher ${updated.teacherName}`,
      existing,
      updated
    );

    res.json({
      success: true,
      message: `Specimen record ${verificationStatus.toLowerCase()} successfully`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Update record status (GIVEN, RETURNED, LOST)
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const existing = await prisma.specimenRecord.findUnique({ where: { id } });
    if (!existing) {
      res.status(404);
      throw new Error('Specimen record not found');
    }

    const updated = await prisma.specimenRecord.update({
      where: { id },
      data: {
        status: status || existing.status,
        notes: notes !== undefined ? notes : existing.notes,
      },
      include: {
        book: true,
        salesPerson: { select: { id: true, name: true } },
      },
    });

    await logActivity(
      req,
      'UPDATE',
      'SPECIMEN_RECORD',
      `Updated status to ${updated.status} for ${updated.teacherName}`,
      existing,
      updated
    );

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Delete record
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.specimenRecord.findUnique({ where: { id } });
    if (!existing) {
      res.status(404);
      throw new Error('Specimen record not found');
    }

    await prisma.specimenRecord.delete({ where: { id } });

    await logActivity(
      req,
      'DELETE',
      'SPECIMEN_RECORD',
      `Deleted specimen record for teacher ${existing.teacherName}`,
      existing,
      null
    );

    res.json({
      success: true,
      message: 'Specimen record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
