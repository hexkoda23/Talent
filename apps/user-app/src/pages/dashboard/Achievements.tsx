import { Trophy, Lock, Star, Flame, Crown, Zap, Code2, Target, Users, BookOpen, Rocket, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

type Rarity = "common" | "rare" | "epic" | "legendary";

const badges = [
  { name: "First Commit", desc: "Pushed your first commit.", icon: Code2, rarity: "common" as Rarity, earned: true, date: "Apr 2" },
  { name: "Vector Initiate", desc: "Completed embeddings checkpoint.", icon: Brain, rarity: "rare" as Rarity, earned: true, date: "Apr 14" },
  { name: "7-Day Streak", desc: "Logged in 7 days running.", icon: Flame, rarity: "common" as Rarity, earned: true, date: "Apr 22" },
  { name: "Quest Hunter", desc: "Completed 10 quests.", icon: Target, rarity: "rare" as Rarity, earned: true, date: "Apr 25" },
  { name: "Logbook Loyalist", desc: "30 SIWES entries submitted.", icon: BookOpen, rarity: "rare" as Rarity, earned: false, progress: 60 },
  { name: "Raid Captain", desc: "Led a raid to completion.", icon: Crown, rarity: "epic" as Rarity, earned: false, progress: 30 },
  { name: "RAG Master", desc: "Ship a production RAG pipeline.", icon: Rocket, rarity: "epic" as Rarity, earned: false, progress: 10 },
  { name: "Top 10", desc: "Reach top 10 on the leaderboard.", icon: Star, rarity: "epic" as Rarity, earned: false, progress: 0 },
  { name: "Mentor", desc: "Help 25 peers in the community.", icon: Users, rarity: "epic" as Rarity, earned: false, progress: 12 },
  { name: "Phoenix", desc: "30-day uninterrupted streak.", icon: Flame, rarity: "legendary" as Rarity, earned: false, progress: 23 },
  { name: "Grandmaster", desc: "Reach AI Engineer Level 5.", icon: Trophy, rarity: "legendary" as Rarity, earned: false, progress: 0 },
  { name: "Singularity", desc: "Win the cohort championship.", icon: Zap, rarity: "legendary" as Rarity, earned: false, progress: 0 },
];

const rarityStyles: Record<Rarity, { ring: string; chip: string; glow: string; label: string }> = {
  common: { ring: "ring-muted-foreground/30", chip: "bg-muted text-muted-foreground border-border", glow: "", label: "Common" },
  rare: { ring: "ring-primary/40", chip: "bg-primary/15 text-primary border-primary/30", glow: "shadow-[0_0_30px_-8px_hsl(var(--primary)/0.5)]", label: "Rare" },
  epic: { ring: "ring-secondary/50", chip: "bg-secondary/15 text-secondary border-secondary/30", glow: "shadow-[0_0_40px_-8px_hsl(var(--secondary)/0.6)]", label: "Epic" },
  legendary: { ring: "ring-warning/60", chip: "bg-warning/15 text-warning border-warning/40", glow: "shadow-[0_0_50px_-8px_hsl(var(--warning)/0.6)]", label: "Legendary" },
};

const Achievements = () => {
  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-2">// trophy hall</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold">Achievements</h1>
          <p className="text-muted-foreground mt-2">Proof of every battle won.</p>
        </div>
        <div className="glass-panel rounded-xl px-4 py-3 flex items-center gap-3">
          <Trophy className="h-5 w-5 text-warning" />
          <div>
            <p className="text-xs text-muted-foreground">Unlocked</p>
            <p className="font-display font-bold">{earned} / {badges.length}</p>
          </div>
        </div>
      </div>

      {/* Rarity legend */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(rarityStyles) as Rarity[]).map((r) => (
          <span key={r} className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold border", rarityStyles[r].chip)}>
            {rarityStyles[r].label}
          </span>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {badges.map((b) => {
          const r = rarityStyles[b.rarity];
          const Icon = b.icon;
          return (
            <div
              key={b.name}
              className={cn(
                "glass-panel rounded-2xl p-5 text-center transition-all hover:-translate-y-1",
                b.earned && r.glow,
                !b.earned && "opacity-80"
              )}
            >
              <div className={cn(
                "mx-auto h-20 w-20 rounded-2xl grid place-items-center mb-3 ring-2 ring-offset-2 ring-offset-background",
                r.ring,
                b.earned ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {b.earned ? <Icon className="h-10 w-10" /> : <Lock className="h-7 w-7" />}
              </div>
              <span className={cn("inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border mb-2", r.chip)}>
                {r.label}
              </span>
              <h3 className="font-display font-semibold">{b.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-3">{b.desc}</p>
              {b.earned ? (
                <p className="text-[11px] text-accent font-medium">Earned · {b.date}</p>
              ) : (
                <>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary" style={{ width: `${b.progress}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 font-mono">{b.progress}%</p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements;
