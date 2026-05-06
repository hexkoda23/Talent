import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  CohortStatus,
  OnboardingDocumentStatus,
  Prisma,
  RegistrationDocumentStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/dto/auth-user.type';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { CreateCampusDto } from './dto/create-campus.dto';
import { CreateApplicationCohortDto } from './dto/create-application-cohort.dto';
import { CreateSelectionGameDto } from './dto/create-selection-game.dto';
import { ASSIGNABLE_ROLE_NAMES, ROLE_RANK, highestRoleRank } from './role-hierarchy';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const [
      candidateCount,
      userCount,
      pendingRegistrationDocuments,
      pendingOnboardingDocuments,
      activeCohorts,
      selectionGames,
      acceptedCandidates,
      verificationPending,
    ] = await Promise.all([
      this.prisma.application.count(),
      this.prisma.user.count(),
      this.prisma.registrationDocument.count({ where: { status: RegistrationDocumentStatus.pending_review } }),
      this.prisma.onboardingDocument.count({ where: { status: OnboardingDocumentStatus.pending_review } }),
      this.prisma.applicationCohort.count({ where: { status: CohortStatus.open } }),
      this.prisma.selectionGame.count(),
      this.prisma.application.count({ where: { status: ApplicationStatus.accepted } }),
      this.prisma.application.count({ where: { status: ApplicationStatus.verification_pending } }),
    ]);

    return {
      metrics: {
        candidates: candidateCount,
        users: userCount,
        accepted_candidates: acceptedCandidates,
        verification_pending: verificationPending,
        pending_documents: pendingRegistrationDocuments + pendingOnboardingDocuments,
        active_cohorts: activeCohorts,
        selection_games: selectionGames,
        active_raids: 0,
        pending_audits: 0,
      },
      alerts: [
        {
          key: 'verification_pending',
          label: 'Verification follow-up',
          count: verificationPending,
          route: '/admin/candidates',
        },
        {
          key: 'pending_documents',
          label: 'Document review queue',
          count: pendingRegistrationDocuments + pendingOnboardingDocuments,
          route: '/admin/documents',
        },
      ],
    };
  }

  async listCandidates() {
    const applications = await this.prisma.application.findMany({
      orderBy: { registeredAt: 'desc' },
      include: {
        campus: true,
        cohort: true,
        registrationDocuments: true,
        onboardingDocuments: true,
        user: {
          include: {
            studentProfile: true,
          },
        },
        gameAttempts: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });

    return {
      data: applications.map((application) => ({
        id: application.id,
        status: application.status,
        dashboard_state: application.dashboardState,
        game_score: application.gameScore,
        passed_game: application.passedGame,
        registered_at: application.registeredAt,
        campus: this.mapCampus(application.campus),
        cohort: {
          id: application.cohort.id,
          name: application.cohort.name,
          status: application.cohort.status,
          game_cutoff_score: application.cohort.gameCutoffScore,
        },
        user: this.mapUser(application.user),
        student_profile: application.user.studentProfile
          ? {
              id: application.user.studentProfile.id,
              institution_name: application.user.studentProfile.institutionName,
              institution_email: application.user.studentProfile.institutionEmail,
              matric_number: application.user.studentProfile.matricNumber,
              department: application.user.studentProfile.department,
              level: application.user.studentProfile.level,
            }
          : null,
        latest_attempt: application.gameAttempts[0]
          ? {
              id: application.gameAttempts[0].id,
              score: application.gameAttempts[0].score,
              passed: application.gameAttempts[0].passed,
              completed_at: application.gameAttempts[0].completedAt,
            }
          : null,
        registration_documents: application.registrationDocuments.map((document) => ({
          id: document.id,
          document_type: document.documentType,
          file_url: document.fileUrl,
          original_filename: document.originalFilename,
          status: document.status,
          uploaded_at: document.uploadedAt,
        })),
        onboarding_documents: application.onboardingDocuments.map((document) => ({
          id: document.id,
          document_type: document.documentType,
          file_url: document.fileUrl,
          original_filename: document.originalFilename,
          status: document.status,
          uploaded_at: document.uploadedAt,
        })),
      })),
    };
  }

  async updateApplicationStatus(applicationId: string, status: ApplicationStatus) {
    const application = await this.prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException({ error: { code: 'application_not_found', message: 'Application not found' } });
    }

    const dashboardState = this.dashboardStateForStatus(status);
    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: { status, dashboardState },
    });

    return {
      application: {
        id: updated.id,
        status: updated.status,
        dashboard_state: updated.dashboardState,
      },
    };
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        userRoles: {
          include: { role: true },
        },
        studentProfile: {
          include: { campus: true },
        },
      },
    });

    return {
      data: users.map((user) => this.mapUser(user)),
    };
  }

  async createUser(actor: AuthUser, dto: CreateAdminUserDto) {
    await this.assertCanAssignRoles(actor, [dto.role_name]);

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException({ error: { code: 'duplicate_email', message: 'Email already exists' } });
    }

    const organization = await this.prisma.organization.findUnique({ where: { id: actor.organizationId } });
    if (!organization) {
      throw new NotFoundException({ error: { code: 'organization_not_found', message: 'Organization not found' } });
    }

    const role = await this.prisma.role.upsert({
      where: { name: dto.role_name },
      update: {},
      create: { name: dto.role_name, description: this.roleDescription(dto.role_name) },
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        organizationId: organization.id,
        firstName: dto.first_name,
        lastName: dto.last_name,
        email: dto.email,
        phone: dto.phone ?? 'pending',
        nin: dto.nin ?? this.generatePlaceholderNin(),
        passwordHash,
        userRoles: {
          create: {
            roleId: role.id,
          },
        },
      },
      include: { userRoles: { include: { role: true } } },
    });

    return { user: this.mapUser(user) };
  }

  async updateUser(actor: AuthUser, userId: string, dto: UpdateAdminUserDto) {
    const target = await this.getUserWithRoles(userId);
    this.assertCanModifyTarget(actor, target.userRoles.map((item) => item.role.name));

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.first_name,
        lastName: dto.last_name,
        email: dto.email,
        phone: dto.phone,
        isActive: dto.is_active,
      },
      include: { userRoles: { include: { role: true } } },
    });

    return { user: this.mapUser(updated) };
  }

  async updateUserRoles(actor: AuthUser, userId: string, dto: UpdateUserRolesDto) {
    await this.assertCanAssignRoles(actor, dto.role_names);

    const target = await this.getUserWithRoles(userId);
    this.assertCanModifyTarget(actor, target.userRoles.map((item) => item.role.name));

    const roles = await Promise.all(
      dto.role_names.map((roleName) =>
        this.prisma.role.upsert({
          where: { name: roleName },
          update: {},
          create: { name: roleName, description: this.roleDescription(roleName) },
        }),
      ),
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId } });
      await tx.userRole.createMany({
        data: roles.map((role) => ({
          userId,
          roleId: role.id,
        })),
        skipDuplicates: true,
      });
      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { userRoles: { include: { role: true } } },
      });
    });

    return { user: this.mapUser(updated) };
  }

  async listRoles(actor: AuthUser) {
    const actorRank = highestRoleRank(actor.roles);
    const data = ASSIGNABLE_ROLE_NAMES.filter((role) => (ROLE_RANK[role] ?? 0) < actorRank).map((name) => ({
      name,
      rank: ROLE_RANK[name],
      description: this.roleDescription(name),
    }));
    return { data };
  }

  async listCampuses() {
    const campuses = await this.prisma.campus.findMany({ orderBy: { name: 'asc' } });
    return { data: campuses.map((campus) => this.mapCampus(campus)) };
  }

  async createCampus(actor: AuthUser, dto: CreateCampusDto) {
    const campus = await this.prisma.campus.create({
      data: {
        organizationId: actor.organizationId,
        name: dto.name,
        locationCity: dto.location_city,
        locationState: dto.location_state,
        locationAddress: dto.location_address,
        capacity: dto.capacity,
      },
    });
    return { campus: this.mapCampus(campus) };
  }

  async listApplicationCohorts() {
    const cohorts = await this.prisma.applicationCohort.findMany({
      orderBy: { opensAt: 'desc' },
      include: {
        _count: { select: { applications: true } },
        selectionGame: true,
      },
    });
    return {
      data: cohorts.map((cohort) => ({
        id: cohort.id,
        name: cohort.name,
        status: cohort.status,
        opens_at: cohort.opensAt,
        closes_at: cohort.closesAt,
        game_cutoff_score: cohort.gameCutoffScore,
        max_applicants: cohort.maxApplicants,
        registered_count: cohort._count.applications,
        selection_game: cohort.selectionGame
          ? {
              id: cohort.selectionGame.id,
              name: cohort.selectionGame.name,
              scheduled_at: cohort.selectionGame.scheduledAt,
              duration_minutes: cohort.selectionGame.durationMinutes,
              status: cohort.selectionGame.status,
            }
          : null,
      })),
    };
  }

  async createApplicationCohort(dto: CreateApplicationCohortDto) {
    const cohort = await this.prisma.applicationCohort.create({
      data: {
        name: dto.name,
        opensAt: new Date(dto.opens_at),
        closesAt: new Date(dto.closes_at),
        gameCutoffScore: dto.game_cutoff_score,
        maxApplicants: dto.max_applicants,
      },
    });
    return {
      application_cohort: {
        id: cohort.id,
        name: cohort.name,
        status: cohort.status,
        opens_at: cohort.opensAt,
        closes_at: cohort.closesAt,
        game_cutoff_score: cohort.gameCutoffScore,
        max_applicants: cohort.maxApplicants,
      },
    };
  }

  async closeApplicationCohort(cohortId: string) {
    const cohort = await this.prisma.applicationCohort.findUnique({ where: { id: cohortId } });
    if (!cohort) {
      throw new NotFoundException({ error: { code: 'cohort_not_found', message: 'Application cohort not found' } });
    }
    const updated = await this.prisma.applicationCohort.update({
      where: { id: cohortId },
      data: { status: CohortStatus.closed },
    });
    await this.prisma.application.updateMany({
      where: {
        cohortId,
        status: { not: ApplicationStatus.accepted },
      },
      data: { status: ApplicationStatus.rejected, dashboardState: 'status_only' },
    });
    return { application_cohort: { id: updated.id, status: updated.status } };
  }

  async createSelectionGame(dto: CreateSelectionGameDto) {
    const cohort = await this.prisma.applicationCohort.findUnique({ where: { id: dto.cohort_id } });
    if (!cohort) {
      throw new NotFoundException({ error: { code: 'cohort_not_found', message: 'Application cohort not found' } });
    }

    const selectionGame = await this.prisma.selectionGame.upsert({
      where: { cohortId: dto.cohort_id },
      update: {
        name: dto.name,
        description: dto.description,
        scheduledAt: new Date(dto.scheduled_at),
        durationMinutes: dto.duration_minutes,
        configuration: dto.configuration as Prisma.JsonObject | undefined,
      },
      create: {
        cohortId: dto.cohort_id,
        name: dto.name,
        description: dto.description,
        scheduledAt: new Date(dto.scheduled_at),
        durationMinutes: dto.duration_minutes,
        configuration: dto.configuration as Prisma.JsonObject | undefined,
      },
    });
    return { selection_game: this.mapSelectionGame(selectionGame) };
  }

  async updateRegistrationDocumentStatus(id: string, status: RegistrationDocumentStatus) {
    const document = await this.prisma.registrationDocument.update({
      where: { id },
      data: { status },
    });
    return {
      document: {
        id: document.id,
        status: document.status,
      },
    };
  }

  async updateOnboardingDocumentStatus(id: string, status: OnboardingDocumentStatus) {
    const document = await this.prisma.onboardingDocument.update({
      where: { id },
      data: { status },
    });
    return {
      document: {
        id: document.id,
        status: document.status,
      },
    };
  }

  private async assertCanAssignRoles(actor: AuthUser, roleNames: string[]) {
    const actorRank = highestRoleRank(actor.roles);
    const invalidRole = roleNames.find((role) => !ASSIGNABLE_ROLE_NAMES.includes(role));
    if (invalidRole) {
      throw new BadRequestException({ error: { code: 'invalid_role', message: `Unknown role: ${invalidRole}` } });
    }
    const forbiddenRole = roleNames.find((role) => (ROLE_RANK[role] ?? 0) >= actorRank);
    if (forbiddenRole) {
      throw new ForbiddenException({
        error: {
          code: 'role_rank_forbidden',
          message: 'Admins can only assign roles lower than their own highest role',
        },
      });
    }
  }

  private assertCanModifyTarget(actor: AuthUser, targetRoles: string[]) {
    const actorRank = highestRoleRank(actor.roles);
    const targetRank = highestRoleRank(targetRoles);
    if (targetRank >= actorRank) {
      throw new ForbiddenException({
        error: {
          code: 'target_rank_forbidden',
          message: 'Admins cannot modify users with an equal or higher role',
        },
      });
    }
  }

  private async getUserWithRoles(userId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!target) {
      throw new NotFoundException({ error: { code: 'user_not_found', message: 'User not found' } });
    }
    return target;
  }

  private roleDescription(roleName: string) {
    const descriptions: Record<string, string> = {
      superadmin: 'Top-level administrator seeded by the platform',
      campus_admin: 'Admin for campus operations, candidate review, and document handling',
      coding_mentor: 'Mentor who can audit submissions and support raid reviews',
      student: 'Accepted learner in the platform',
      candidate: 'Applicant awaiting acceptance',
    };
    return descriptions[roleName] ?? roleName;
  }

  private dashboardStateForStatus(status: ApplicationStatus) {
    switch (status) {
      case ApplicationStatus.game_pending:
        return 'countdown' as const;
      case ApplicationStatus.game_completed:
      case ApplicationStatus.review:
      case ApplicationStatus.verification_pending:
      case ApplicationStatus.verified:
        return 'status_only' as const;
      case ApplicationStatus.onboarding:
        return 'onboarding_form' as const;
      case ApplicationStatus.accepted:
        return 'full_learning' as const;
      default:
        return 'status_only' as const;
    }
  }

  private mapUser(user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nin: string;
    avatarUrl: string | null;
    createdAt: Date;
    isActive: boolean;
    userRoles?: Array<{ role: { name: string } }>;
    studentProfile?: ({ campus?: { id: string; name: string } } & Record<string, unknown>) | null;
  }) {
    return {
      id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      phone: user.phone,
      nin: user.nin,
      avatar_url: user.avatarUrl,
      created_at: user.createdAt,
      is_active: user.isActive,
      roles: user.userRoles?.map((item) => item.role.name) ?? [],
      campus: user.studentProfile?.campus ? { id: user.studentProfile.campus.id, name: user.studentProfile.campus.name } : null,
    };
  }

  private mapCampus(campus: {
    id: string;
    name: string;
    locationCity: string;
    locationState: string;
    locationAddress: string;
    capacity: number;
    createdAt?: Date;
  }) {
    return {
      id: campus.id,
      name: campus.name,
      location: {
        city: campus.locationCity,
        state: campus.locationState,
        address: campus.locationAddress,
      },
      capacity: campus.capacity,
      created_at: campus.createdAt,
    };
  }

  private mapSelectionGame(selectionGame: {
    id: string;
    cohortId: string;
    name: string;
    description: string | null;
    scheduledAt: Date;
    durationMinutes: number;
    accessMethod: string | null;
    configuration: Prisma.JsonValue | null;
    status: string;
  }) {
    return {
      id: selectionGame.id,
      cohort_id: selectionGame.cohortId,
      name: selectionGame.name,
      description: selectionGame.description,
      scheduled_at: selectionGame.scheduledAt,
      duration_minutes: selectionGame.durationMinutes,
      access_method: selectionGame.accessMethod,
      configuration: selectionGame.configuration,
      status: selectionGame.status,
    };
  }

  private generatePlaceholderNin(): string {
    const base = Date.now().toString().slice(-10);
    const suffix = Math.floor(Math.random() * 10).toString();
    return `${base}${suffix}`;
  }
}
