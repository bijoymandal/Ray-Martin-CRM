const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper activity logger
const logActivity = async (req, action, resource, details, oldVal = null, newVal = null) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || null,
        userEmail: req.user?.email || null,
        userName: req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : null,
        action,
        resource,
        details,
        oldValues: oldVal,
        newValues: newVal,
      },
    });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

// ─── GET TASK OVERVIEW SUMMARY METRICS ──────────────────────────────────────
exports.getTaskSummary = async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      select: {
        id: true,
        status: true,
        priority: true,
        dueDate: true,
        assignedToId: true,
      },
    });

    const now = new Date();
    let totalTasks = tasks.length;
    let todoCount = 0;
    let inProgressCount = 0;
    let underReviewCount = 0;
    let completedCount = 0;
    let overdueCount = 0;

    let urgentCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    for (const t of tasks) {
      if (t.status === 'TODO') todoCount++;
      else if (t.status === 'IN_PROGRESS') inProgressCount++;
      else if (t.status === 'UNDER_REVIEW') underReviewCount++;
      else if (t.status === 'COMPLETED') completedCount++;

      if (t.priority === 'URGENT') urgentCount++;
      else if (t.priority === 'HIGH') highCount++;
      else if (t.priority === 'MEDIUM') mediumCount++;
      else if (t.priority === 'LOW') lowCount++;

      if (t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED' && t.status !== 'CANCELLED') {
        overdueCount++;
      }
    }

    res.json({
      success: true,
      data: {
        totalTasks,
        pendingCount: todoCount + inProgressCount + underReviewCount,
        todoCount,
        inProgressCount,
        underReviewCount,
        completedCount,
        overdueCount,
        urgentCount,
        highCount,
        mediumCount,
        lowCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET TASKS LIST (FILTERABLE & SEARCHABLE) ──────────────────────────────
exports.getTasks = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      category,
      assignedToId,
      myTasksOnly,
      search,
      districtId,
      zoneId,
      schoolId,
    } = req.query;

    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (priority && priority !== 'ALL') where.priority = priority;
    if (category && category !== 'ALL') where.category = category;

    if (myTasksOnly === 'true' && req.user) {
      where.OR = [
        { assignedToId: req.user.id },
        { createdById: req.user.id },
      ];
    } else if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (schoolId) {
      where.schoolId = schoolId;
    } else if (zoneId) {
      const zoneSchools = await prisma.school.findMany({
        where: { zoneId },
        select: { id: true },
      });
      where.schoolId = { in: zoneSchools.map((s) => s.id) };
    } else if (districtId) {
      const districtZones = await prisma.zone.findMany({
        where: { districtId },
        select: { id: true },
      });
      const districtSchools = await prisma.school.findMany({
        where: { zoneId: { in: districtZones.map((z) => z.id) } },
        select: { id: true },
      });
      where.schoolId = { in: districtSchools.map((s) => s.id) };
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true, email: true } },
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
                    state: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
        deal: { select: { id: true, title: true, value: true } },
        contact: { select: { id: true, firstName: true, lastName: true, company: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const formatted = tasks.map((t) => ({
      ...t,
      isOverdue: Boolean(t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED' && t.status !== 'CANCELLED'),
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    next(err);
  }
};

// ─── CREATE NEW TASK (SINGLE OR BATCH SCHOOL-WISE) ──────────────────────────
exports.createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      priority,
      status,
      category,
      dueDate,
      assignedToId,
      schoolId,
      schoolIds,
      dealId,
      contactId,
    } = req.body;

    if (!title) {
      res.status(400);
      throw new Error('Task title is required');
    }

    // Support batch school-wise task creation
    if (Array.isArray(schoolIds) && schoolIds.length > 0) {
      const schools = await prisma.school.findMany({
        where: { id: { in: schoolIds } },
        include: {
          zone: {
            include: {
              district: true,
            },
          },
        },
      });

      const createdTasks = [];
      for (const s of schools) {
        const t = await prisma.task.create({
          data: {
            title: `${title.trim()} - ${s.name}`,
            description: description ? description.trim() : null,
            priority: priority || 'MEDIUM',
            status: status || 'TODO',
            category: category || 'GENERAL',
            dueDate: dueDate ? new Date(dueDate) : null,
            assignedToId: assignedToId || req.user.id,
            createdById: req.user.id,
            schoolId: s.id,
            dealId: dealId || null,
            contactId: contactId || null,
          },
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true, email: true } },
            school: {
              select: {
                id: true,
                name: true,
                type: true,
                zone: {
                  select: {
                    id: true,
                    name: true,
                    district: { select: { id: true, name: true } },
                  },
                },
              },
            },
            deal: { select: { id: true, title: true } },
            contact: { select: { id: true, firstName: true, lastName: true } },
          },
        });
        createdTasks.push(t);
      }

      await logActivity(
        req,
        'CREATE',
        'TASK',
        `Created ${createdTasks.length} school-wise tasks for "${title}"`,
        null,
        { count: createdTasks.length }
      );

      return res.status(201).json({
        success: true,
        message: `Successfully created ${createdTasks.length} school-wise tasks`,
        count: createdTasks.length,
        data: createdTasks[0],
        allTasks: createdTasks,
      });
    }

    // Standard single task creation
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        category: category || 'GENERAL',
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId: assignedToId || req.user.id,
        createdById: req.user.id,
        schoolId: schoolId || null,
        dealId: dealId || null,
        contactId: contactId || null,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        school: {
          select: {
            id: true,
            name: true,
            type: true,
            zone: {
              select: {
                id: true,
                name: true,
                district: { select: { id: true, name: true } },
              },
            },
          },
        },
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      req,
      'CREATE',
      'TASK',
      `Created task: "${task.title}" assigned to ${task.assignedTo?.name || 'Unassigned'}`,
      null,
      task
    );

    res.status(201).json({ success: true, message: 'Task created successfully', data: task });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE TASK DETAILS ───────────────────────────────────────────────────
exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      priority,
      status,
      category,
      dueDate,
      assignedToId,
      schoolId,
      dealId,
      contactId,
    } = req.body;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      res.status(404);
      throw new Error('Task not found');
    }

    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description ? description.trim() : null;
    if (priority !== undefined) data.priority = priority;
    if (category !== undefined) data.category = category;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
    if (schoolId !== undefined) data.schoolId = schoolId || null;
    if (dealId !== undefined) data.dealId = dealId || null;
    if (contactId !== undefined) data.contactId = contactId || null;

    if (status !== undefined) {
      data.status = status;
      if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
        data.completedAt = new Date();
      } else if (status !== 'COMPLETED') {
        data.completedAt = null;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        school: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(req, 'UPDATE', 'TASK', `Updated task: "${updatedTask.title}" (${updatedTask.status})`, existing, updatedTask);

    res.json({ success: true, message: 'Task updated successfully', data: updatedTask });
  } catch (err) {
    next(err);
  }
};

// ─── QUICK STATUS TOGGLE ────────────────────────────────────────────────────
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400);
      throw new Error('Status is required');
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });

    res.json({ success: true, message: `Task status set to ${status}`, data: task });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE TASK ────────────────────────────────────────────────────────────
exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id } });
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── ADD TASK COMMENT ───────────────────────────────────────────────────────
exports.addTaskComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400);
      throw new Error('Comment text is required');
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        userId: req.user.id,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

// ─── GET UNREAD TASK NOTIFICATIONS FOR ASSIGNEE ─────────────────────────────
exports.getMyTaskNotifications = async (req, res, next) => {
  try {
    const unreadTasks = await prisma.task.findMany({
      where: {
        assignedToId: req.user.id,
        isReadByAssignee: false,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        school: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: unreadTasks.length, data: unreadTasks });
  } catch (err) {
    next(err);
  }
};

// ─── MARK TASK NOTIFICATION AS READ ──────────────────────────────────────────
exports.markTaskAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.update({
      where: { id },
      data: { isReadByAssignee: true },
    });

    res.json({ success: true, message: 'Notification acknowledged', data: task });
  } catch (err) {
    next(err);
  }
};

// ─── SUBMIT SCHOOL-WISE TASK REPORT ─────────────────────────────────────────
exports.submitTaskReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      status = 'COMPLETED',
      teacherMet,
      teacherPhone,
      specimenDetails,
      visitOutcome,
      notes,
      followUpDate,
    } = req.body;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        school: {
          include: {
            zone: { include: { district: true } },
          },
        },
        assignedTo: true,
      },
    });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const schoolDisplay = task.school
      ? `${task.school.name} (${task.school.zone?.name || ''}, ${task.school.zone?.district?.name || ''})`
      : 'General / No School Linked';

    const reportContent = [
      `[SCHOOL SUBMISSION REPORT]`,
      `School: ${schoolDisplay}`,
      teacherMet ? `Teacher / Contact Met: ${teacherMet}${teacherPhone ? ` (Ph: ${teacherPhone})` : ''}` : null,
      visitOutcome ? `Visit Outcome: ${visitOutcome}` : null,
      specimenDetails ? `Specimen Distributed / Details: ${specimenDetails}` : null,
      notes ? `Notes / Observations: ${notes}` : null,
      followUpDate ? `Next Follow-up Date: ${followUpDate}` : null,
      `Submitted By: ${req.user?.name || req.user?.email || 'User'} on ${new Date().toLocaleString()}`,
    ]
      .filter(Boolean)
      .join('\n');

    // Add structured comment entry
    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        userId: req.user.id,
        content: reportContent,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Update status to COMPLETED (or specified) and set completedAt
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        school: {
          select: {
            id: true,
            name: true,
            type: true,
            zone: {
              select: {
                id: true,
                name: true,
                district: { select: { id: true, name: true } },
              },
            },
          },
        },
        deal: { select: { id: true, title: true, value: true } },
        contact: { select: { id: true, firstName: true, lastName: true, company: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    await logActivity(
      req,
      'SUBMIT',
      'TASK',
      `Submitted school report for task "${updatedTask.title}" (${task.school?.name || 'General'})`,
      task,
      updatedTask
    );

    res.json({
      success: true,
      message: 'School task report submitted successfully',
      data: updatedTask,
      submissionComment: comment,
    });
  } catch (err) {
    next(err);
  }
};

