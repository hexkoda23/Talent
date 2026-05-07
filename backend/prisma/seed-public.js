const { CohortStatus, PrismaClient, SelectionGameStatus } = require('@prisma/client');

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

  await Promise.all([
    prisma.campus.upsert({
      where: { id: '2f21f03a-0af8-4f35-9b78-6ea5f595f5a1' },
      update: {
        organizationId: organization.id,
        name: 'Lagos (Ikeja)',
        locationCity: 'Ikeja',
        locationState: 'Lagos',
        locationAddress: '12 Allen Avenue, Ikeja',
        capacity: 60,
      },
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
      update: {
        organizationId: organization.id,
        name: 'Abuja (Wuse)',
        locationCity: 'Wuse',
        locationState: 'FCT',
        locationAddress: '10 Adetokunbo Ademola Crescent, Wuse II',
        capacity: 50,
      },
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
    update: {
      name: 'October 2026 Intake',
      status: CohortStatus.open,
      opensAt: new Date('2026-05-01T00:00:00.000Z'),
      closesAt: new Date('2026-06-15T23:59:59.000Z'),
      gameCutoffScore: 70,
      maxApplicants: 1500,
    },
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

  await prisma.selectionGame.upsert({
    where: { cohortId: cohort.id },
    update: {
      name: 'Cohort 03 Selection',
      scheduledAt: new Date('2026-06-20T09:00:00.000Z'),
      durationMinutes: 30,
      status: SelectionGameStatus.upcoming,
    },
    create: {
      cohortId: cohort.id,
      name: 'Cohort 03 Selection',
      scheduledAt: new Date('2026-06-20T09:00:00.000Z'),
      durationMinutes: 30,
      status: SelectionGameStatus.upcoming,
    },
  });
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
