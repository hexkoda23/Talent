import { PrismaClient, CohortStatus, SelectionGameStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: 'talent-nation' },
    update: {},
    create: {
      name: 'TalentNation',
      slug: 'talent-nation',
    },
  });

  const campuses = await Promise.all([
    prisma.campus.upsert({
      where: { id: '2f21f03a-0af8-4f35-9b78-6ea5f595f5a1' },
      update: {},
      create: {
        id: '2f21f03a-0af8-4f35-9b78-6ea5f595f5a1',
        organizationId: organization.id,
        name: 'Lagos (Ikeja)',
        locationCity: 'Ikeja',
        locationState: 'Lagos',
        locationAddress: '12 Allen Avenue, Ikeja',
        capacity: 60,
      },
    }),
    prisma.campus.upsert({
      where: { id: 'f1934d31-57d9-4abc-9c32-cdb1d18431d0' },
      update: {},
      create: {
        id: 'f1934d31-57d9-4abc-9c32-cdb1d18431d0',
        organizationId: organization.id,
        name: 'Abuja (Wuse)',
        locationCity: 'Wuse',
        locationState: 'FCT',
        locationAddress: '10 Adetokunbo Ademola Crescent, Wuse II',
        capacity: 50,
      },
    }),
  ]);

  const cohort = await prisma.applicationCohort.upsert({
    where: { id: 'e71ea667-30c9-4ad3-8f7d-f0c2f7ab6e12' },
    update: {},
    create: {
      id: 'e71ea667-30c9-4ad3-8f7d-f0c2f7ab6e12',
      name: 'October 2026 Intake',
      status: CohortStatus.open,
      opensAt: new Date('2026-05-01T00:00:00.000Z'),
      closesAt: new Date('2026-06-15T23:59:59.000Z'),
      gameCutoffScore: 70,
      maxApplicants: 1500,
    },
  });

  const existingGame = await prisma.selectionGame.findUnique({
    where: { cohortId: cohort.id },
  });

  if (!existingGame) {
    await prisma.selectionGame.create({
      data: {
        cohortId: cohort.id,
        name: 'Cohort 03 Selection',
        scheduledAt: new Date('2026-06-20T09:00:00.000Z'),
        durationMinutes: 30,
        status: SelectionGameStatus.upcoming,
      },
    });
  }

  const candidateRole = await prisma.role.upsert({
    where: { name: 'candidate' },
    update: {},
    create: { name: 'candidate', description: 'Applicant awaiting acceptance' },
  });
  const studentRole = await prisma.role.upsert({
    where: { name: 'student' },
    update: {},
    create: { name: 'student', description: 'Accepted learner in the platform' },
  });
  const codingMentorRole = await prisma.role.upsert({
    where: { name: 'coding_mentor' },
    update: {},
    create: { name: 'coding_mentor', description: 'Mentor who can audit submissions and support raid reviews' },
  });
  const campusAdminRole = await prisma.role.upsert({
    where: { name: 'campus_admin' },
    update: {},
    create: { name: 'campus_admin', description: 'Admin for campus operations, candidate review, and document handling' },
  });
  const superadminRole = await prisma.role.upsert({
    where: { name: 'superadmin' },
    update: {},
    create: { name: 'superadmin', description: 'Top-level administrator seeded by the platform' },
  });
  await prisma.role.deleteMany({ where: { name: ['super', 'visor'].join('') } });

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'candidate@example.com' },
    update: {},
    create: {
      organizationId: organization.id,
      firstName: 'Demo',
      lastName: 'Candidate',
      email: 'candidate@example.com',
      phone: '+2348011111111',
      nin: '11111111111',
      passwordHash,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: demoUser.id,
        roleId: candidateRole.id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      roleId: candidateRole.id,
    },
  });

  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
  const superadmin = await prisma.user.upsert({
    where: { email: 'admin@talentnation.test' },
    update: {
      passwordHash: adminPasswordHash,
      isActive: true,
    },
    create: {
      organizationId: organization.id,
      firstName: 'Seeded',
      lastName: 'Superadmin',
      email: 'admin@talentnation.test',
      phone: '+2348000000000',
      nin: '99999999999',
      passwordHash: adminPasswordHash,
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superadmin.id,
        roleId: superadminRole.id,
      },
    },
    update: {},
    create: {
      userId: superadmin.id,
      roleId: superadminRole.id,
    },
  });

  void campuses;
  void studentRole;
  void codingMentorRole;
  void campusAdminRole;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
