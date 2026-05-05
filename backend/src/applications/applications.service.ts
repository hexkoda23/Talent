import { Injectable, NotFoundException } from '@nestjs/common';
import { Application, ApplicationStatus, ProgressionDashboardState } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  findLatestByUser(userId: string) {
    return this.prisma.application.findFirst({
      where: { userId },
      orderBy: { registeredAt: 'desc' },
    });
  }

  async getCurrentForUser(userId: string) {
    const application = await this.findLatestByUser(userId);
    if (!application) {
      throw new NotFoundException({
        error: { code: 'no_application', message: 'No application found for current user' },
      });
    }

    const metadata = (application.metadata ?? {}) as Record<string, unknown>;
    const rejectionEmailSent = Boolean(metadata.rejection_email_sent);

    return {
      application: {
        id: application.id,
        status: application.status,
        passed_game: application.passedGame,
        game_score: application.gameScore,
        rejection_email_sent: rejectionEmailSent,
        registered_at: application.registeredAt,
        dashboard_state: application.dashboardState,
      },
      verification_request: null,
      next_action: this.deriveNextAction(application),
    };
  }

  private deriveNextAction(application: Application) {
    switch (application.status) {
      case ApplicationStatus.onboarding:
      case ApplicationStatus.verified:
        return { label: 'Continue onboarding', route: '/onboarding' };
      case ApplicationStatus.accepted:
        return { label: 'Open dashboard', route: '/dashboard' };
      case ApplicationStatus.registered:
      case ApplicationStatus.game_pending:
        return { label: 'Play selection game', route: '/assessment' };
      case ApplicationStatus.rejected:
        return { label: 'Back to home', route: '/' };
      default:
        if (application.dashboardState === ProgressionDashboardState.full_learning) {
          return { label: 'Open dashboard', route: '/dashboard' };
        }
        return { label: 'Back to home', route: '/' };
    }
  }
}
