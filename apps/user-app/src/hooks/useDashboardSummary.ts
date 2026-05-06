import { useMemo } from "react";
import { rankFromXp } from "@/lib/rank";

export type DashboardSummary = {
  firstName: string;
  initials: string;
  xp: number;
  streakDays: number;
  unreadNotifications: number;
  programProgressPct: number;
  modulesCompleted: number;
  modulesTotal: number;
};

const MOCK_SUMMARY: DashboardSummary = {
  firstName: "Adaeze",
  initials: "AO",
  xp: 2480,
  streakDays: 7,
  unreadNotifications: 3,
  programProgressPct: 72,
  modulesCompleted: 18,
  modulesTotal: 25,
};

export const useDashboardSummary = (): DashboardSummary & {
  rankLevel: number;
  rankName: string;
} => {
  return useMemo(() => {
    const tier = rankFromXp(MOCK_SUMMARY.xp);
    return {
      ...MOCK_SUMMARY,
      rankLevel: tier.level,
      rankName: tier.name,
    };
  }, []);
};
