import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return { status: 'ok' };
  }

  async getActiveCohort() {
    const cohort = await this.prisma.applicationCohort.findFirst({
      where: { status: 'open' },
      orderBy: { opensAt: 'asc' },
      include: { selectionGame: true },
    });

    if (!cohort) {
      throw new NotFoundException({
        error: { code: 'no_active_cohort', message: 'No active cohort available' },
      });
    }

    return {
      application_cohort: {
        id: cohort.id,
        name: cohort.name,
        status: cohort.status,
        opens_at: cohort.opensAt.toISOString(),
        closes_at: cohort.closesAt.toISOString(),
        game_cutoff_score: cohort.gameCutoffScore,
      },
      selection_game: cohort.selectionGame
        ? {
            id: cohort.selectionGame.id,
            name: cohort.selectionGame.name,
            scheduled_at: cohort.selectionGame.scheduledAt.toISOString(),
            duration_minutes: cohort.selectionGame.durationMinutes,
            status: cohort.selectionGame.status,
          }
        : null,
    };
  }
}
