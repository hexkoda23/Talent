import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampusesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCampusesForActiveCohort() {
    const campuses = await this.prisma.campus.findMany({
      orderBy: { name: 'asc' },
    });

    const data = await Promise.all(
      campuses.map(async (campus) => {
        const registeredCount = await this.prisma.application.count({
          where: { campusId: campus.id },
        });
        const seatsRemaining = Math.max(campus.capacity - registeredCount, 0);
        const ratio = campus.capacity === 0 ? 1 : seatsRemaining / campus.capacity;
        const demandLabel = ratio < 0.2 ? 'High demand' : ratio < 0.6 ? 'Recommended' : 'Open';

        return {
          id: campus.id,
          name: campus.name,
          location: {
            city: campus.locationCity,
            state: campus.locationState,
            address: campus.locationAddress,
          },
          capacity: campus.capacity,
          seats_remaining: seatsRemaining,
          demand_label: demandLabel,
        };
      }),
    );

    return { data };
  }
}
