export type RankTier = {
  level: number;
  name: string;
  minXp: number;
  maxXp: number | null;
};

export const RANK_TIERS: RankTier[] = [
  { level: 1, name: "Initiate",    minXp: 0,     maxXp: 1000 },
  { level: 2, name: "Apprentice",  minXp: 1001,  maxXp: 2500 },
  { level: 3, name: "Practitioner",minXp: 2501,  maxXp: 5000 },
  { level: 4, name: "Engineer",    minXp: 5001,  maxXp: 8500 },
  { level: 5, name: "Specialist",  minXp: 8501,  maxXp: 13000 },
  { level: 6, name: "Architect",   minXp: 13001, maxXp: 18000 },
  { level: 7, name: "Master",      minXp: 18001, maxXp: 25000 },
  { level: 8, name: "Grandmaster", minXp: 25001, maxXp: null  },
];

export const rankFromXp = (xp: number): RankTier => {
  const safe = Math.max(0, Math.floor(xp || 0));
  return (
    RANK_TIERS.find((t) => safe >= t.minXp && (t.maxXp === null || safe <= t.maxXp)) ??
    RANK_TIERS[0]
  );
};

export const progressWithinTier = (xp: number) => {
  const tier = rankFromXp(xp);
  if (tier.maxXp === null) return { pct: 100, current: xp - tier.minXp, span: 0 };
  const span = tier.maxXp - tier.minXp;
  const current = Math.max(0, Math.min(span, xp - tier.minXp));
  return { pct: Math.round((current / span) * 100), current, span };
};

export const xpToNextLevel = (xp: number) => {
  const tier = rankFromXp(xp);
  if (tier.maxXp === null) return 0;
  return Math.max(0, tier.maxXp + 1 - xp);
};
