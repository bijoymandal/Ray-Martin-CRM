const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.deal.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.menu.deleteMany({});
  await prisma.board.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.permissionAction.deleteMany({});

  console.log('Seeding roles...');
  const rolesList = ['SUPERADMIN', 'ADMIN', 'EDITOR', 'ACCOUNT', 'SALESMAN'];
  const roleDescriptions = {
    SUPERADMIN: 'Super Administrator with full bypass rights',
    ADMIN: 'Administrator with full system privileges',
    EDITOR: 'Editor with read and write access to resources',
    ACCOUNT: 'Accountant with limited view and financial access',
    SALESMAN: 'Sales representative with lead and deal access',
  };

  for (const roleName of rolesList) {
    await prisma.role.create({
      data: {
        name: roleName,
        description: roleDescriptions[roleName] || `${roleName} Role`,
      },
    });
  }

  console.log('Seeding permission actions...');
  const defaultActions = [
    { name: 'canView', label: 'View', description: 'Access and view menu' },
    { name: 'canCreate', label: 'Create', description: 'Create new records' },
    { name: 'canEdit', label: 'Edit', description: 'Edit existing records' },
    { name: 'canDelete', label: 'Delete', description: 'Delete records' }
  ];

  for (const action of defaultActions) {
    await prisma.permissionAction.create({
      data: action
    });
  }

  // Helper to seed permissions for a menu
  const seedPermissions = async (menu, rules) => {
    const roles = ['SUPERADMIN', 'ADMIN', 'EDITOR', 'ACCOUNT', 'SALESMAN'];
    for (const role of roles) {
      const r = rules[role] || { canView: false, canCreate: false, canEdit: false, canDelete: false };
      const actions = [];
      if (r.canView) actions.push('canView');
      if (r.canCreate) actions.push('canCreate');
      if (r.canEdit) actions.push('canEdit');
      if (r.canDelete) actions.push('canDelete');

      await prisma.permission.create({
        data: {
          role,
          menuId: menu.id,
          actions
        }
      });
    }
  };

  // 1. Dashboard Menu
  const mDashboard = await prisma.menu.create({
    data: {
      name: 'Dashboard',
      path: '/',
      iconName: 'LayoutDashboard',
      roles: ['SUPERADMIN', 'ADMIN', 'EDITOR', 'ACCOUNT', 'SALESMAN'],
      order: 1,
    },
  });
  await seedPermissions(mDashboard, {
    SUPERADMIN: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    ADMIN: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    EDITOR: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    ACCOUNT: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    SALESMAN: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  });

  // 2. Contacts Menu
  const mContacts = await prisma.menu.create({
    data: {
      name: 'Contacts',
      path: '/contacts',
      iconName: 'Users',
      roles: ['SUPERADMIN', 'ADMIN', 'EDITOR'],
      order: 2,
    },
  });
  await seedPermissions(mContacts, {
    SUPERADMIN: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    ADMIN: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    EDITOR: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  });

  // 3. Deals Menu
  const mDeals = await prisma.menu.create({
    data: {
      name: 'Deals',
      path: '/deals',
      iconName: 'CircleDollarSign',
      roles: ['SUPERADMIN', 'ADMIN', 'EDITOR', 'ACCOUNT', 'SALESMAN'],
      order: 3,
    },
  });
  await seedPermissions(mDeals, {
    SUPERADMIN: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    ADMIN: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    EDITOR: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    ACCOUNT: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    SALESMAN: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  });

  // 4. Admin Center Menu
  const mAdmin = await prisma.menu.create({
    data: {
      name: 'Admin Center',
      path: '/admin',
      iconName: 'Settings',
      roles: ['SUPERADMIN', 'ADMIN'],
      order: 4,
    },
  });
  await seedPermissions(mAdmin, {
    SUPERADMIN: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    ADMIN: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  });

  // 5. Academy Menu
  const mAcademy = await prisma.menu.create({
    data: {
      name: 'Academy',
      path: '/academy',
      iconName: 'Briefcase',
      roles: ['SUPERADMIN', 'ADMIN', 'EDITOR'],
      order: 5,
    },
  });
  await seedPermissions(mAcademy, {
    SUPERADMIN: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    ADMIN: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    EDITOR: { canView: true, canCreate: true, canEdit: true, canDelete: false },
  });

  // 6. Products Menu
  const mProducts = await prisma.menu.create({
    data: {
      name: 'Products',
      path: '/products',
      iconName: 'ShoppingBag',
      roles: ['SUPERADMIN', 'ADMIN', 'EDITOR', 'SALESMAN'],
      order: 6,
    },
  });
  await seedPermissions(mProducts, {
    SUPERADMIN: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    ADMIN: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    EDITOR: { canView: true, canCreate: true, canEdit: true, canDelete: false },
    SALESMAN: { canView: true, canCreate: false, canEdit: false, canDelete: false },
  });

  console.log('Created default menus and their permission matrices.');

  const hashedPassword = await bcrypt.hash('admin123', 12);

  // 1. Create Superadmin
  const superadmin = await prisma.user.create({
    data: {
      email: 'superadmin@crm.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPERADMIN',
    },
  });

  // 2. Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@crm.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // 3. Create Editor
  const editor = await prisma.user.create({
    data: {
      email: 'editor@crm.com',
      name: 'Editor User',
      password: hashedPassword,
      role: 'EDITOR',
    },
  });

  // 4. Create Account
  const account = await prisma.user.create({
    data: {
      email: 'account@crm.com',
      name: 'Account User',
      password: hashedPassword,
      role: 'ACCOUNT',
    },
  });

  // 5. Create Salesman
  const salesman = await prisma.user.create({
    data: {
      email: 'salesman@crm.com',
      name: 'Salesman User',
      password: hashedPassword,
      role: 'SALESMAN',
    },
  });

  console.log('Created users for all roles.');

  // Create sample contacts (owned by Admin)
  const contact1 = await prisma.contact.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@acme.com',
      phone: '+1555123456',
      company: 'Acme Corp',
      status: 'CUSTOMER',
      notes: 'Initial key account contact, extremely positive feedback.',
      userId: admin.id,
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sarah.c@cyberdyne.com',
      phone: '+1555987654',
      company: 'Cyberdyne Systems',
      status: 'PROSPECT',
      notes: 'Interested in AI security updates. Follow up next week.',
      userId: admin.id,
    },
  });

  const contact3 = await prisma.contact.create({
    data: {
      firstName: 'Bruce',
      lastName: 'Wayne',
      email: 'bruce@waynecorp.com',
      phone: '+1555444888',
      company: 'Wayne Enterprises',
      status: 'LEAD',
      notes: 'Cold outreach from network. Extremely high net worth.',
      userId: admin.id,
    },
  });

  console.log('Created 3 sample contacts.');

  // Create sample deals linked to contacts
  await prisma.deal.create({
    data: {
      title: 'Enterprise CRM License Deployment',
      value: 75000.0,
      stage: 'CLOSED_WON',
      contactId: contact1.id,
      userId: admin.id,
    },
  });

  await prisma.deal.create({
    data: {
      title: 'Cloud Security Systems Contract',
      value: 120000.0,
      stage: 'NEGOTIATION',
      contactId: contact2.id,
      userId: admin.id,
    },
  });

  await prisma.deal.create({
    data: {
      title: 'Hardware Upgrade Package',
      value: 45000.0,
      stage: 'PROPOSAL',
      contactId: contact3.id,
      userId: admin.id,
    },
  });

  console.log('Created 3 sample deals.');

  // Seed Boards
  const cbse = await prisma.board.create({
    data: { name: 'CBSE', shortName: 'CBSE', status: true },
  });
  const icse = await prisma.board.create({
    data: { name: 'ICSE', shortName: 'ICSE', status: true },
  });
  const stateBoard = await prisma.board.create({
    data: { name: 'State Board', shortName: 'State', status: true },
  });

  // Seed Classes
  const class10 = await prisma.class.create({
    data: { name: 'Class 10', status: true, boardId: cbse.id },
  });
  const class12 = await prisma.class.create({
    data: { name: 'Class 12', status: true, boardId: cbse.id },
  });
  const class9 = await prisma.class.create({
    data: { name: 'Class 9', status: true, boardId: icse.id },
  });

  // Seed Subjects
  const maths = await prisma.subject.create({
    data: { name: 'Mathematics', status: true, classId: class10.id },
  });
  const physics = await prisma.subject.create({
    data: { name: 'Physics', status: true, classId: class10.id },
  });
  const chemistry = await prisma.subject.create({
    data: { name: 'Chemistry', status: true, classId: class12.id },
  });

  // Seed Categories
  await prisma.category.create({
    data: { name: 'Calculus', status: true, subjectId: maths.id },
  });
  await prisma.category.create({
    data: { name: 'Algebra', status: true, subjectId: maths.id },
  });
  await prisma.category.create({
    data: { name: 'Mechanics', status: true, subjectId: physics.id },
  });

  console.log('Created default educational taxonomies.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
