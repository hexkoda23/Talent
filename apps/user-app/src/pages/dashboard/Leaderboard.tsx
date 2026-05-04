import { useState } from "react";
import { Trophy, Crown, Medal, TrendingUp, ArrowUp, ArrowDown, Minus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Scope = "global" | "campus" | "course" | "program";

const ME = "Adaeze Okafor";

const players = [
  { name: "Ibrahim Musa", level: 4, xp: 9820, quests: 28, raids: 6, change: 0, badge: "Architect" },
  { name: "Chinwe Eze", level: 4, xp: 9540, quests: 27, raids: 6, change: 1, badge: "Vector Sage" },
  { name: "Tunde Adeyemi", level: 4, xp: 9210, quests: 25, raids: 5, change: -1, badge: "Prompt Smith" },
  { name: "Fatima Bello", level: 3, xp: 8740, quests: 24, raids: 5, change: 2, badge: "Data Hunter" },
  { name: "Emeka Okonkwo", level: 3, xp: 8390, quests: 23, raids: 5, change: 0, badge: "Pipeline Pro" },
  { name: "Aisha Lawal", level: 3, xp: 7980, quests: 22, raids: 4, change: 3, badge: "RAG Crafter" },
  { name: "Segun Olatunji", level: 3, xp: 7620, quests: 20, raids: 4, change: -2, badge: "Fine-Tuner" },
  { name: "Ngozi Ugo", level: 3, xp: 7340, quests: 19, raids: 4, change: 1, badge: "Eval Master" },
  { name: "Yusuf Garba", level: 2, xp: 6980, quests: 18, raids: 3, change: 0, badge: "Deployer" },
  { name: "Blessing John", level: 2, xp: 6720, quests: 17, raids: 3, change: 4, badge: "Notebook Ninja" },
  { name: "Kelvin Ade", level: 2, xp: 6510, quests: 16, raids: 3, change: -1, badge: "API Forger" },
  { name: "Halima Sani", level: 2, xp: 6280, quests: 15, raids: 2, change: 0, badge: "Embed Sensei" },
  { name: ME, level: 2, xp: 2480, quests: 12, raids: 2, change: 6, badge: "Vector Initiate" },
];

const Leaderboard = () => {
  const [scope, setScope] = useState<Scope>("global");
  const sorted = [...players].sort((a, b) => b.xp - a.xp);
  const myIndex = sorted.findIndex((p) => p.name === ME);
  const me = sorted[myIndex];
  const next = sorted[myIndex - 1];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-2">// hall of legends</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground mt-2">Rank by XP, quests completed, raids passed, or custom admin metrics.</p>
        </div>
        <div className="flex gap-2 p-1 rounded-xl bg-muted border border-border">
          {(["global", "campus", "course", "program"] as Scope[]).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={cn(
                "px-4 h-9 rounded-lg text-sm font-medium capitalize transition-all",
                scope === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Personal rank widget */}
      <div className="relative overflow-hidden glass-panel rounded-2xl p-5 lg:p-6">
        <div className="absolute inset-0 bg-gradient-aurora opacity-40" />
        <div className="relative grid md:grid-cols-3 gap-5 items-center">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-1">// your rank</p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-5xl font-bold text-gradient">#{myIndex + 1}</span>
              <span className="text-muted-foreground text-sm">of {sorted.length}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-accent" /> +6 places this week
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Your XP</p>
            <p className="font-display text-2xl font-bold">{me.xp.toLocaleString()}</p>
            {next && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-warning font-mono">{(next.xp - me.xp).toLocaleString()} XP</span> behind {next.name}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Catch-up bar</p>
            <div className="h-3 bg-muted rounded-full overflow-hidden border border-border">
              <div className="h-full bg-gradient-primary relative" style={{ width: `${Math.min(100, (me.xp / (next?.xp || me.xp)) * 100)}%` }}>
                <div className="absolute inset-0 animate-shimmer" />
              </div>
            </div>
            <Button variant="hero" size="sm" className="mt-3 gap-1">Take a quest <Sparkles className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-3 md:gap-5">
        {[1, 0, 2].map((i) => {
          const p = sorted[i];
          const heights = ["h-32", "h-40", "h-28"];
          const icons = [<Medal className="h-5 w-5" />, <Crown className="h-6 w-6" />, <Medal className="h-5 w-5" />];
          const tones = ["bg-muted/60", "bg-gradient-primary text-primary-foreground", "bg-muted/60"];
          return (
            <div key={p.name} className="flex flex-col items-center">
              <div className="h-14 w-14 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground font-bold text-lg mb-2 ring-4 ring-background">
                {p.name.split(" ").map((s) => s[0]).join("")}
              </div>
              <p className="text-xs md:text-sm font-semibold text-center truncate max-w-full px-1">{p.name}</p>
              <p className="text-[11px] text-muted-foreground mb-2">{p.xp.toLocaleString()} XP</p>
              <div className={cn("w-full rounded-t-xl grid place-items-center border border-border border-b-0", heights[[1,0,2].indexOf(i)], tones[[1,0,2].indexOf(i)])}>
                <div className="text-center">
                  <div className="grid place-items-center">{icons[[1,0,2].indexOf(i)]}</div>
                  <p className="font-display text-2xl font-bold mt-1">#{i + 1}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground border-b border-border">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Engineer</div>
          <div className="col-span-2">Level</div>
          <div className="col-span-2 text-right">XP</div>
          <div className="col-span-1 text-right">Quests</div>
          <div className="col-span-1 text-right">Δ</div>
        </div>
        {sorted.map((p, i) => {
          const isMe = p.name === ME;
          return (
            <div
              key={p.name}
              className={cn(
                "grid grid-cols-12 px-5 py-3 items-center text-sm border-b border-border last:border-0 transition-colors",
                isMe ? "bg-primary/10 ring-1 ring-inset ring-primary/40" : "hover:bg-muted/30"
              )}
            >
              <div className="col-span-1 font-display font-bold">
                {i < 3 ? <Trophy className={cn("h-4 w-4", i === 0 ? "text-warning" : i === 1 ? "text-muted-foreground" : "text-secondary")} /> : `#${i + 1}`}
              </div>
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-gradient-primary grid place-items-center text-xs font-semibold text-primary-foreground flex-shrink-0">
                  {p.name.split(" ").map((s) => s[0]).join("")}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.name} {isMe && <span className="text-[10px] text-primary ml-1">(YOU)</span>}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{p.badge}</p>
                </div>
              </div>
              <div className="col-span-2">
                <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-mono">L{p.level}</span>
              </div>
              <div className="col-span-2 text-right font-mono">{p.xp.toLocaleString()}</div>
              <div className="col-span-1 text-right font-mono text-secondary">{p.quests}</div>
              <div className="col-span-1 text-right">
                {p.change > 0 ? (
                  <span className="inline-flex items-center text-accent text-xs"><ArrowUp className="h-3 w-3" />{p.change}</span>
                ) : p.change < 0 ? (
                  <span className="inline-flex items-center text-destructive text-xs"><ArrowDown className="h-3 w-3" />{Math.abs(p.change)}</span>
                ) : (
                  <Minus className="h-3 w-3 inline text-muted-foreground" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
