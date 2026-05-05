import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Application,
  ApplicationStatus,
  GameAttempt,
  Prisma,
  ProgressionDashboardState,
  SelectionGame,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/dto/auth-user.type';
import { CompleteAttemptDto } from './dto/complete-attempt.dto';

const MAX_ATTEMPTS = 3;
const DEFAULT_CUTOFF = 70;

type ApplicationWithCohort = Application & {
  cohort: { gameCutoffScore: number; selectionGame: SelectionGame | null };
};

@Injectable()
export class SelectionGameService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(user: AuthUser) {
    const application = await this.requireApplication(user.sub);
    const game = application.cohort.selectionGame;
    if (!game) {
      throw new NotFoundException({
        error: { code: 'no_selection_game', message: 'No selection game scheduled for this cohort' },
      });
    }

    const latestAttempt = await this.prisma.gameAttempt.findFirst({
      where: { userId: user.sub, applicationId: application.id },
      orderBy: { startedAt: 'desc' },
    });

    return {
      selection_game: this.serializeGame(game),
      latest_attempt: latestAttempt ? this.serializeAttempt(latestAttempt) : null,
    };
  }

  async startAttempt(user: AuthUser) {
    const application = await this.requireApplication(user.sub);
    const game = application.cohort.selectionGame;
    if (!game) {
      throw new NotFoundException({
        error: { code: 'no_selection_game', message: 'No selection game scheduled for this cohort' },
      });
    }

    if (application.passedGame === true) {
      throw new ConflictException({
        error: { code: 'game_already_passed', message: 'Selection game already passed' },
      });
    }

    const attemptCount = await this.prisma.gameAttempt.count({
      where: { userId: user.sub, applicationId: application.id },
    });
    if (attemptCount >= MAX_ATTEMPTS) {
      throw new ConflictException({
        error: { code: 'max_attempts_reached', message: 'No attempts left for selection game' },
      });
    }

    const inFlight = await this.prisma.gameAttempt.findFirst({
      where: { userId: user.sub, applicationId: application.id, completedAt: null },
      orderBy: { startedAt: 'desc' },
    });
    if (inFlight && inFlight.deadlineAt > new Date()) {
      return this.serializeAttempt(inFlight);
    }

    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + game.durationMinutes * 60 * 1000);

    const attempt = await this.prisma.$transaction(async (tx) => {
      const created = await tx.gameAttempt.create({
        data: {
          gameId: game.id,
          userId: user.sub,
          applicationId: application.id,
          startedAt,
          deadlineAt,
        },
      });

      if (application.status === ApplicationStatus.registered) {
        await tx.application.update({
          where: { id: application.id },
          data: {
            status: ApplicationStatus.game_pending,
            dashboardState: ProgressionDashboardState.game_access,
          },
        });
      }

      return created;
    });

    return this.serializeAttempt(attempt);
  }

  async completeAttempt(user: AuthUser, attemptId: string, dto: CompleteAttemptDto) {
    const attempt = await this.prisma.gameAttempt.findUnique({
      where: { id: attemptId },
      include: { application: { include: { cohort: { include: { selectionGame: true } } } } },
    });

    if (!attempt) {
      throw new NotFoundException({
        error: { code: 'attempt_not_found', message: 'Game attempt not found' },
      });
    }
    if (attempt.userId !== user.sub) {
      throw new ForbiddenException({
        error: { code: 'forbidden', message: 'Attempt does not belong to current user' },
      });
    }
    if (attempt.completedAt) {
      throw new ConflictException({
        error: { code: 'attempt_already_completed', message: 'Attempt already completed' },
      });
    }

    const cutoff = attempt.application.cohort.gameCutoffScore || DEFAULT_CUTOFF;
    const passed = dto.score >= cutoff;
    const completedAt = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const completedAttempt = await tx.gameAttempt.update({
        where: { id: attempt.id },
        data: {
          score: dto.score,
          breakdown: dto.breakdown as unknown as Prisma.InputJsonValue,
          attemptData: (dto.attempt_data ?? {}) as unknown as Prisma.InputJsonValue,
          timeElapsedSeconds: dto.timeElapsed ?? null,
          passed,
          completedAt,
        },
      });

      const previousBest = attempt.application.gameScore ?? 0;
      const bestScore = Math.max(previousBest, dto.score);
      const everPassed = (attempt.application.passedGame ?? false) || passed;
      const nextStatus = this.deriveApplicationStatus(attempt.application.status, everPassed);
      const nextDashboard = this.deriveDashboardState(attempt.application.dashboardState, everPassed);

      const updatedApp = await tx.application.update({
        where: { id: attempt.application.id },
        data: {
          gameScore: bestScore,
          passedGame: everPassed,
          status: nextStatus,
          dashboardState: nextDashboard,
        },
      });

      return { attempt: completedAttempt, application: updatedApp };
    });

    return {
      attempt: this.serializeAttempt(updated.attempt),
      application: this.serializeApplication(updated.application),
      next_route_hint: this.deriveNextRouteHint(updated.application),
    };
  }

  async getLatestAttempt(user: AuthUser) {
    const application = await this.requireApplication(user.sub);
    const attempt = await this.prisma.gameAttempt.findFirst({
      where: { userId: user.sub, applicationId: application.id },
      orderBy: { startedAt: 'desc' },
    });

    if (!attempt) {
      throw new NotFoundException({
        error: { code: 'no_attempt', message: 'No game attempt found for current applicant' },
      });
    }

    return {
      attempt: this.serializeAttempt(attempt),
      application: this.serializeApplication(application),
    };
  }

  private async requireApplication(userId: string): Promise<ApplicationWithCohort> {
    const application = await this.prisma.application.findFirst({
      where: { userId },
      orderBy: { registeredAt: 'desc' },
      include: { cohort: { include: { selectionGame: true } } },
    });

    if (!application) {
      throw new NotFoundException({
        error: { code: 'no_application', message: 'No application found for current user' },
      });
    }

    return application as ApplicationWithCohort;
  }

  private deriveApplicationStatus(current: ApplicationStatus, passed: boolean): ApplicationStatus {
    if (passed) {
      if (
        current === ApplicationStatus.registered ||
        current === ApplicationStatus.game_pending ||
        current === ApplicationStatus.game_completed
      ) {
        return ApplicationStatus.review;
      }
      return current;
    }
    return ApplicationStatus.game_completed;
  }

  private deriveDashboardState(
    current: ProgressionDashboardState,
    passed: boolean,
  ): ProgressionDashboardState {
    if (passed) return ProgressionDashboardState.countdown;
    return current === ProgressionDashboardState.full_learning ? current : ProgressionDashboardState.status_only;
  }

  private deriveNextRouteHint(application: Application): 'review' | 'onboarding' | 'dashboard' {
    if (
      application.status === ApplicationStatus.onboarding ||
      application.dashboardState === ProgressionDashboardState.onboarding_form
    ) {
      return 'onboarding';
    }
    if (
      application.status === ApplicationStatus.accepted ||
      application.dashboardState === ProgressionDashboardState.full_learning
    ) {
      return 'dashboard';
    }
    return 'review';
  }

  private serializeGame(game: SelectionGame) {
    return {
      id: game.id,
      name: game.name,
      description: game.description,
      scheduled_at: game.scheduledAt,
      duration_minutes: game.durationMinutes,
      access_method: game.accessMethod,
      status: game.status,
      configuration: game.configuration ?? null,
    };
  }

  private serializeAttempt(attempt: GameAttempt) {
    return {
      id: attempt.id,
      game_id: attempt.gameId,
      user_id: attempt.userId,
      application_id: attempt.applicationId,
      started_at: attempt.startedAt,
      deadline_at: attempt.deadlineAt,
      completed_at: attempt.completedAt,
      score: attempt.score,
      passed: attempt.passed,
      breakdown: attempt.breakdown ?? null,
      time_elapsed_seconds: attempt.timeElapsedSeconds ?? null,
    };
  }

  private serializeApplication(application: Application) {
    return {
      id: application.id,
      cohort_id: application.cohortId,
      campus_id: application.campusId,
      status: application.status,
      dashboard_state: application.dashboardState,
      passed_game: application.passedGame,
      game_score: application.gameScore,
      registered_at: application.registeredAt,
    };
  }
}
