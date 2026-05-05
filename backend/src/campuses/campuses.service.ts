import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampusesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCampusesForActiveCohort() {
    const campuses = await this.prisma.campus.findMany({
      orderBy: { name: 'asc' },
    });
    const data = campuses.map((campus) => ({
      id: campus.id,
      name: campus.name,
      location: {
        city: campus.locationCity,
        state: campus.locationState,
        address: campus.locationAddress,
      },
    }));
    return { data };
  }
}
