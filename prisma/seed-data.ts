import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const ALL_PERMS = [
  'customer:create',
  'customer:read',
  'customer:update',
  'customer:delete',
  'contact:create',
  'contact:read',
  'contact:update',
  'contact:delete',
  'deal:create',
  'deal:read',
  'deal:update',
  'deal:delete',
  'task:create',
  'task:read',
  'task:update',
  'task:delete',
  'search:read',
  'communication:create',
  'communication:read',
  'communication:update',
  'communication:send',
  'template:create',
  'template:read',
  'template:update',
  'template:delete',
  'workflow:read',
  'workflow:manage',
];

export async function seedBase(prisma: PrismaClient) {
  for (const key of ALL_PERMS) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, description: key },
    });
  }

  const passwordPlain = 'Pass123!';
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  const acme = await prisma.company.create({
    data: { name: 'Acme Inc', slug: 'acme' },
  });
  const beta = await prisma.company.create({
    data: { name: 'Beta LLC', slug: 'beta' },
  });

  const acmeAdmin = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      fullName: 'Acme Admin',
      passwordHash,
      activeCompanyId: acme.id,
    },
  });
  const acmeMember = await prisma.user.create({
    data: {
      email: 'member@acme.com',
      fullName: 'Acme Member',
      passwordHash,
      activeCompanyId: acme.id,
    },
  });
  const betaAdmin = await prisma.user.create({
    data: {
      email: 'admin@beta.com',
      fullName: 'Beta Admin',
      passwordHash,
      activeCompanyId: beta.id,
    },
  });

  await prisma.userCompany.createMany({
    data: [
      {
        userId: acmeAdmin.id,
        companyId: acme.id,
        role: 'owner',
        isActive: true,
      },
      {
        userId: acmeMember.id,
        companyId: acme.id,
        role: 'member',
        isActive: true,
      },
      {
        userId: betaAdmin.id,
        companyId: beta.id,
        role: 'owner',
        isActive: true,
      },
    ],
  });

  const acmeAdminRole = await prisma.role.create({
    data: { companyId: acme.id, name: 'Admin' },
  });
  const acmeMemberRole = await prisma.role.create({
    data: { companyId: acme.id, name: 'Member' },
  });
  const betaAdminRole = await prisma.role.create({
    data: { companyId: beta.id, name: 'Admin' },
  });

  const perms = await prisma.permission.findMany({
    select: { id: true, key: true },
  });
  const permIdByKey = new Map(perms.map((p) => [p.key, p.id]));

  await prisma.rolePermission.createMany({
    data: perms.map((p) => ({ roleId: acmeAdminRole.id, permissionId: p.id })),
    skipDuplicates: true,
  });
  await prisma.rolePermission.createMany({
    data: perms.map((p) => ({ roleId: betaAdminRole.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  const memberPermKeys = [
    'customer:read',
    'contact:read',
    'deal:read',
    'task:read',
    'task:update',
    'search:read',
  ];
  await prisma.rolePermission.createMany({
    data: memberPermKeys.map((k) => ({
      roleId: acmeMemberRole.id,
      permissionId: permIdByKey.get(k)!,
    })),
    skipDuplicates: true,
  });

  await prisma.userRole.createMany({
    data: [
      { userId: acmeAdmin.id, roleId: acmeAdminRole.id },
      { userId: acmeMember.id, roleId: acmeMemberRole.id },
      { userId: betaAdmin.id, roleId: betaAdminRole.id },
    ],
    skipDuplicates: true,
  });

  const customer = await prisma.customer.create({
    data: {
      companyId: acme.id,
      name: 'John Doe',
      email: 'john@x.com',
      phone: '5551112233',
    },
  });

  const deal = await prisma.deal.create({
    data: {
      companyId: acme.id,
      customerId: customer.id,
      ownerId: acmeAdmin.id,
      title: 'First Deal',
      stage: 'new',
      value: 1000,
      currency: 'USD',
    },
  });

  const task = await prisma.task.create({
    data: {
      companyId: acme.id,
      assigneeId: acmeMember.id,
      customerId: customer.id,
      dealId: deal.id,
      title: 'Call customer',
      status: 'todo',
    },
  });

  const contact = await prisma.contact.create({
    data: {
      companyId: acme.id,
      customerId: customer.id,
      firstName: 'Jane',
      lastName: 'Smith',
      isPrimary: true,
      email: 'jane@x.com',
    },
  });

  return {
    passwordPlain,
    companies: { acme, beta },
    users: { acmeAdmin, acmeMember, betaAdmin },
    entities: { customer, deal, task, contact },
  };
}
