const prisma = require('./prisma');

/**
 * Log user activity in the database.
 * @param {Object} req Express request object
 * @param {string} action Activity type (e.g. VISIT, CREATE, UPDATE, DELETE)
 * @param {string} resource Resource identifier (e.g. CONTACT, DEAL, PRODUCT, MENU, ROLE)
 * @param {string} details Description of what happened
 * @param {Object} [oldValues] Previous state of the resource (for update/delete)
 * @param {Object} [newValues] New state of the resource (for create/update)
 */
const logActivity = async (req, action, resource, details, oldValues = null, newValues = null) => {
  try {
    // If request contains logged-in user, populate user details
    const userId = req?.user?.id || null;
    const userEmail = req?.user?.email || null;
    const userName = req?.user?.name || null;

    // Clean up sensitive fields before storing (like passwords)
    const sanitize = (val) => {
      if (!val) return null;
      const copy = JSON.parse(JSON.stringify(val));
      delete copy.password;
      return copy;
    };

    await prisma.activityLog.create({
      data: {
        userId,
        userEmail,
        userName,
        action,
        resource,
        details,
        oldValues: oldValues ? sanitize(oldValues) : null,
        newValues: newValues ? sanitize(newValues) : null,
      },
    });
  } catch (error) {
    console.error('Activity Log Error:', error);
  }
};

module.exports = { logActivity };
