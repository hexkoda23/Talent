import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, RegistrationDocumentType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../prisma/redis.service';
import { RegisterApplicantDto } from './dto/register-applicant.dto';
import { LoginDto } from './dto/login.dto';
import { AuthUser } from '../common/dto/auth-user.type';
import { LocalStorageService } from '../storage/local-storage.service';

type RegisterInputFiles = {
  schoolId: Express.Multer.File;
  profilePicture: Express.Multer.File;
  governmentId: Express.Multer.File;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly storageService: LocalStorageService,
  ) {}

  async registerApplicant(dto: RegisterApplicantDto, files: RegisterInputFiles) {
    const existingByNin = await this.prisma.user.findUnique({ where: { nin: dto.nin } });
    if (existingByNin) {
      throw new ConflictException({ error: { code: 'duplicate_nin', message: 'NIN already exists' } });
    }

    const existingByEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingByEmail) {
      throw new ConflictException({ error: { code: 'duplicate_email', message: 'Email already exists' } });
    }

    const existingMatric = await this.prisma.studentProfile.findUnique({ where: { matricNumber: dto.matric_number } });
    if (existingMatric) {
      throw new ConflictException({ error: { code: 'duplicate_matric', message: 'Matric number already exists' } });
    }

    const activeCohort = await this.prisma.applicationCohort.findFirst({
      where: { status: 'open' },
      orderBy: { opensAt: 'asc' },
      include: { selectionGame: true },
    });

    if (!activeCohort) {
      throw new NotFoundException({ error: { code: 'no_active_cohort', message: 'No active cohort available' } });
    }

    const candidateRole = await this.prisma.role.upsert({
      where: { name: 'candidate' },
      update: {},
      create: { name: 'candidate', description: 'Applicant awaiting acceptance' },
    });

    const campus = await this.prisma.campus.findUnique({ where: { id: dto.campus_id } });
    if (!campus) {
      throw new NotFoundException({ error: { code: 'campus_not_found', message: 'Campus not found' } });
    }

    const passwordHash = await bcrypt.hash(dto.password ?? dto.nin, 10);

    const created = await this.prisma.$transaction(async (tx) => {
      const existingOrg = await tx.organization.findFirst({ orderBy: { createdAt: 'asc' } });
      const org =
        existingOrg ??
        (await tx.organization.create({
          data: {
            name: 'TalentNation',
            slug: 'talent-nation',
          },
        }));
      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          firstName: dto.first_name,
          lastName: dto.last_name,
          email: dto.email,
          phone: dto.phone,
          nin: dto.nin,
          passwordHash,
        },
      });

      await tx.userRole.create({ data: { userId: user.id, roleId: candidateRole.id } });

      await tx.studentProfile.create({
        data: {
          userId: user.id,
          institutionName: dto.institution_name,
          institutionEmail: dto.email,
          matricNumber: dto.matric_number,
          department: dto.department ?? '',
          level: dto.level,
          campusId: dto.campus_id,
        },
      });

      const application = await tx.application.create({
        data: {
          userId: user.id,
          cohortId: activeCohort.id,
          campusId: dto.campus_id,
          status: 'registered',
          dashboardState: 'status_only',
          metadata: {
            siwes_duration_months: dto.siwes_duration_months,
            consents: dto.consents,
            address: dto.address,
            date_of_birth: dto.date_of_birth ?? null,
          } as unknown as Prisma.JsonObject,
        },
      });

      const uploadedFiles = await Promise.all([
        this.storageService.saveRegistrationDocument(application.id, files.schoolId),
        this.storageService.saveRegistrationDocument(application.id, files.profilePicture),
        this.storageService.saveRegistrationDocument(application.id, files.governmentId),
      ]);

      const docRows: Array<{ type: RegistrationDocumentType; upload: { fileUrl: string; originalFilename: string } }> = [
        { type: 'school_id_card', upload: uploadedFiles[0] },
        { type: 'profile_picture', upload: uploadedFiles[1] },
        { type: 'government_id', upload: uploadedFiles[2] },
      ];

      await tx.registrationDocument.createMany({
        data: docRows.map((row) => ({
          applicationId: application.id,
          documentType: row.type,
          fileUrl: row.upload.fileUrl,
          originalFilename: row.upload.originalFilename,
        })),
      });

      return { user, application };
    });

    const roles = ['candidate'];
    const tokens = await this.issueTokens({
      sub: created.user.id,
      email: created.user.email,
      organizationId: created.user.organizationId,
      roles,
    });

    return {
      token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: created.user.id,
        first_name: created.user.firstName,
        last_name: created.user.lastName,
        email: created.user.email,
      },
      application: {
        id: created.application.id,
        cohort_id: created.application.cohortId,
        campus_id: created.application.campusId,
        status: created.application.status,
        dashboard_state: created.application.dashboardState,
        registered_at: created.application.registeredAt,
      },
      selection_game: activeCohort.selectionGame
        ? {
            id: activeCohort.selectionGame.id,
            scheduled_at: activeCohort.selectionGame.scheduledAt,
            duration_minutes: activeCohort.selectionGame.durationMinutes,
            status: activeCohort.selectionGame.status,
          }
        : null,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      throw new UnauthorizedException({ error: { code: 'invalid_credentials', message: 'Invalid credentials' } });
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException({ error: { code: 'invalid_credentials', message: 'Invalid credentials' } });
    }

    const latestApplication = await this.prisma.application.findFirst({
      where: { userId: user.id },
      orderBy: { registeredAt: 'desc' },
    });

    const selectionGame = latestApplication
      ? await this.prisma.selectionGame.findUnique({ where: { cohortId: latestApplication.cohortId } })
      : null;

    const roles = user.userRoles.map((item) => item.role.name);
    const tokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles,
    });

    return {
      token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
      },
      application: latestApplication
        ? {
            id: latestApplication.id,
            cohort_id: latestApplication.cohortId,
            campus_id: latestApplication.campusId,
            status: latestApplication.status,
            dashboard_state: latestApplication.dashboardState,
            registered_at: latestApplication.registeredAt,
          }
        : null,
      selection_game: selectionGame
        ? {
            id: selectionGame.id,
            scheduled_at: selectionGame.scheduledAt,
            duration_minutes: selectionGame.durationMinutes,
            status: selectionGame.status,
          }
        : null,
    };
  }

  async logout(user: AuthUser, refreshToken: string, accessToken?: string) {
    const hashed = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: {
        userId: user.sub,
        tokenHash: hashed,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    if (accessToken) {
      const decoded = this.jwtService.decode(accessToken) as { exp?: number } | null;
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        await this.redisService.blacklistToken(accessToken, ttl);
      }
    }

    return { success: true };
  }

  async getSession(user: AuthUser) {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.sub } });
    if (!dbUser) {
      throw new UnauthorizedException({ error: { code: 'unauthorized', message: 'User not found' } });
    }

    const application = await this.prisma.application.findFirst({
      where: { userId: dbUser.id },
      orderBy: { registeredAt: 'desc' },
    });

    return {
      user: {
        id: dbUser.id,
        first_name: dbUser.firstName,
        last_name: dbUser.lastName,
        email: dbUser.email,
        avatar_url: dbUser.avatarUrl,
      },
      application: application
        ? {
            id: application.id,
            status: application.status,
            campus_id: application.campusId,
            passed_game: application.passedGame,
            game_score: application.gameScore,
          }
        : null,
      enrollment: null,
      progression_stage: {
        name: 'Application',
        dashboard_state: application?.dashboardState ?? 'status_only',
      },
    };
  }

  private async issueTokens(user: AuthUser) {
    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET', 'change-this-refresh-secret');

    const accessToken = await this.jwtService.signAsync(user, { expiresIn: accessExpiresIn });
    const refreshToken = await this.jwtService.signAsync(user, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
      jwtid: randomUUID(),
    });

    const refreshDecoded = this.jwtService.decode(refreshToken) as { exp?: number } | null;
    const refreshExp = refreshDecoded?.exp ? new Date(refreshDecoded.exp * 1000) : new Date(Date.now() + 7 * 86400000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.sub,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: refreshExp,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
