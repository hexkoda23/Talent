import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Flame,
  Zap,
  ArrowRight,
  Lock,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  BookOpen,
  Code2,
  PlayCircle,
  Bell,
  Users,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Mock curriculum state ---
const learnPct = 65;            // < 100 means quest is locked
const questAttemptsLeft = 3;    // mock
const weekCompletionPct = 72;   // checkpoint readiness
const streak = 7;
const xp = 2480;
const learnDone = learnPct >= 100;
const checkpointReady = weekCompletionPct >= 80;

const useCountdown = (target: Date) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const h = Math.floor(diff / 3.6e6);
  const m = Math.floor((diff % 3.6e6) / 6e4);
  const s = Math.floor((diff % 6e4) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const endOfDay = () => {
  const d = new Date();
  d.setHours(23, 59, 0, 0);
  return d;
};

const DashboardHome = () => {
  const countdown = useCountdown(endOfDay());

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Welcome + day status */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-5 lg:p-8">
        <div className="absolute inset-0 bg-gradient-aurora opacity-50" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-2">
                // day 14 · friday
              </p>
              <h1 className="font-display text-2xl lg:text-4xl font-bold">
                Adaeze, lock in 🔒
              </h1>
              <p className="text-muted-foreground mt-2 max-w-lg text-sm lg:text-base">
                Continue your current subject, complete the active quest, and prepare for the next curriculum checkpoint.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 border border-border">
                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs lg:text-sm font-medium">AI Engineer · Level 4</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/15 border border-warning/30 text-warning">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs font-mono font-bold">{countdown}</span>
              </div>
            </div>
          </div>

          {/* Curriculum progress */}
          <div className="mt-6 grid grid-cols-3 gap-2 lg:gap-3">
            <DayStep
              n={1}
              label="Current subject"
              status={learnDone ? "done" : "current"}
              pct={learnPct}
            />
            <DayStep
              n={2}
              label="Quest"
              status={learnDone ? "current" : "locked"}
            />
            <DayStep
              n={3}
              label="Checkpoint"
              status={checkpointReady ? "current" : "locked"}
              hint={`Sat · ${weekCompletionPct}%`}
            />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard icon={Sparkles} label="XP" value={xp.toLocaleString()} trend="+340 this week" tone="primary" />
        <StatCard icon={Flame} label="Streak" value={`${streak} days`} trend="Don't break it" tone="warning" />
        <StatCard icon={TrendingUp} label="Completion" value={`${weekCompletionPct}%`} trend="Admin checkpoint gate" tone="violet" />
        <StatCard icon={Trophy} label="Rank" value="#24" trend="↑ 6 this week" tone="accent" />
      </div>

      {/* Current curriculum work */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Learn card (today) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 lg:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono uppercase tracking-widest text-secondary">
              // current subject
            </p>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-semibold border border-primary/30">
              Learn Phase
            </span>
          </div>
          <h2 className="font-display text-xl font-semibold">
            Embeddings & Vector Search
          </h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            4 videos and 3 readings. Continue into the quest when the required content is done.
          </p>

          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Learn progress</span>
              <span className="font-mono">{learnPct}%</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border">
              <div className="h-full bg-gradient-primary relative" style={{ width: `${learnPct}%` }}>
                <div className="absolute inset-0 animate-shimmer" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard/learn" className="flex-1 min-w-[160px]">
              <Button variant="hero" className="w-full gap-2">
                <PlayCircle className="h-4 w-4" /> Continue learning
              </Button>
            </Link>
            <Link to="/dashboard/workspace">
              <Button variant="soft" className="gap-2">
                <Code2 className="h-4 w-4" /> Open GTEA
              </Button>
            </Link>
          </div>
        </div>

        {/* Quest card (locked) */}
        <div
          className={cn(
            "glass-panel rounded-2xl p-5 lg:p-6 relative overflow-hidden",
            !learnDone && "border-muted"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono uppercase tracking-widest text-secondary">
              // active quest
            </p>
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                learnDone
                  ? "bg-secondary/15 text-secondary border-secondary/30"
                  : "bg-muted text-muted-foreground border-border"
              )}
            >
              Quest
            </span>
          </div>

          {!learnDone && (
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] grid place-items-center pointer-events-none">
              <div className="flex flex-col items-center gap-2 text-center px-4">
                <div className="h-12 w-12 rounded-full bg-muted border border-border grid place-items-center">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold">Locked</p>
                <p className="text-xs text-muted-foreground">
                  Finish the required module first
                </p>
              </div>
            </div>
          )}

          <h2 className="font-display text-lg font-semibold">
            Build a top-k semantic search API
          </h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            FastAPI + pgvector. Return top 5 matches for a query.
          </p>

          <div className="space-y-2 text-xs text-muted-foreground">
            <Row icon={Zap} text="+180 XP · +60 early-bird bonus" />
            <Row icon={Clock} text={`Admin-set deadline · ${countdown} left`} />
            <Row icon={AlertTriangle} text={`${questAttemptsLeft} of 3 attempts left`} />
          </div>

          <Link to="/dashboard/quests">
            <Button
              variant={learnDone ? "hero" : "soft"}
              className="w-full mt-4 gap-2"
              disabled={!learnDone}
            >
              {learnDone ? "Start quest" : "Locked"} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Checkpoint readiness + Raid */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="glass-panel rounded-2xl p-5 lg:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono uppercase tracking-widest text-secondary">
              // checkpoint
            </p>
            <span className="text-xs font-mono text-muted-foreground">admin scheduled</span>
          </div>
          <h3 className="font-display text-lg font-semibold mb-1">Checkpoint Readiness</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Checkpoints are curriculum boundary gates. Admins decide the readiness rule and schedule.
          </p>

          <div className="relative h-3 bg-muted rounded-full overflow-hidden border border-border mb-2">
            <div
              className={cn(
                "h-full transition-all relative",
                checkpointReady ? "bg-gradient-primary" : "bg-warning"
              )}
              style={{ width: `${weekCompletionPct}%` }}
            >
              <div className="absolute inset-0 animate-shimmer" />
            </div>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-foreground/60"
              style={{ left: "80%" }}
              aria-label="80% threshold"
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-foreground">{weekCompletionPct}%</span>
            <span className="text-muted-foreground">target 80%</span>
          </div>

          <Link to="/dashboard/checkpoints">
            <Button
              variant={checkpointReady ? "hero" : "soft"}
              size="sm"
              className="mt-4 gap-2 w-full sm:w-auto"
            >
              View checkpoint <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="glass-panel rounded-2xl p-5 lg:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono uppercase tracking-widest text-secondary">
              // raid
            </p>
            <span className="px-2.5 py-0.5 rounded-full bg-destructive/15 text-destructive text-[11px] font-semibold border border-destructive/30">
              Live
            </span>
          </div>
          <h3 className="font-display text-lg font-semibold mb-1">
            Raid: Multi-agent support bot
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Auto-grouped with 2 teammates. Each member must explain the code they authored during validation.
          </p>

          <div className="flex -space-x-2 mb-4">
            {["AO", "TK", "KE"].map((i, idx) => (
              <div
                key={i}
                className={cn(
                  "h-9 w-9 rounded-full grid place-items-center text-xs font-semibold border-2 border-background",
                  idx === 0 ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-foreground"
                )}
              >
                {i}
              </div>
            ))}
            <div className="h-9 px-3 rounded-full bg-muted border-2 border-background grid place-items-center text-xs font-mono text-muted-foreground">
              Team #07
            </div>
          </div>

          <Link to="/dashboard/raid">
            <Button variant="soft" size="sm" className="gap-2 w-full sm:w-auto">
              <Users className="h-4 w-4" /> Open raid
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <QuickLink to="/dashboard/workspace" icon={Code2} title="GTEA Workspace" desc="Push commits" />
        <QuickLink to="/dashboard/logbook" icon={BookOpen} title="Logbook" desc="Log today" />
        <QuickLink to="/dashboard/leaderboard" icon={Trophy} title="Leaderboard" desc="#24 · climb" />
        <QuickLink to="/dashboard/notifications" icon={Bell} title="Alerts" desc="3 new" />
      </div>
    </div>
  );
};

const DayStep = ({
  n,
  label,
  status,
  pct,
  hint,
}: {
  n: number;
  label: string;
  status: "done" | "current" | "locked";
  pct?: number;
  hint?: string;
}) => (
  <div
    className={cn(
      "rounded-xl p-3 border bg-background/40",
      status === "done" && "border-accent/40",
      status === "current" && "border-primary/50",
      status === "locked" && "border-border opacity-70"
    )}
  >
    <div className="flex items-center justify-between mb-1.5">
      <span
        className={cn(
          "font-mono text-[10px] uppercase",
          status === "done" && "text-accent",
          status === "current" && "text-primary",
          status === "locked" && "text-muted-foreground"
        )}
      >
        Step {n}
      </span>
      {status === "done" && <CheckCircle2 className="h-4 w-4 text-accent" />}
      {status === "locked" && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
      {status === "current" && (
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
      )}
    </div>
    <p className="text-sm font-semibold leading-tight">{label}</p>
    {pct !== undefined && status !== "done" && (
      <div className="h-1 mt-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
      </div>
    )}
    {hint && <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">{hint}</p>}
  </div>
);

const Row = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="flex items-center gap-2">
    <Icon className="h-3.5 w-3.5 text-secondary" />
    <span>{text}</span>
  </div>
);

const StatCard = ({
  icon: Icon,
  label,
  value,
  trend,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  trend: string;
  tone: "primary" | "violet" | "accent" | "warning";
}) => {
  const tones: Record<string, string> = {
    primary: "bg-primary/15 text-primary",
    violet: "bg-secondary/15 text-secondary",
    accent: "bg-accent/15 text-accent",
    warning: "bg-warning/15 text-warning",
  };
  return (
    <div className="glass-panel rounded-xl p-3 lg:p-4">
      <div className={`h-8 w-8 lg:h-9 lg:w-9 rounded-lg grid place-items-center mb-2 lg:mb-3 ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-display text-lg lg:text-2xl font-bold mt-0.5">{value}</p>
      <p className="text-[10px] lg:text-[11px] text-muted-foreground mt-0.5 lg:mt-1 truncate">
        {trend}
      </p>
    </div>
  );
};

const QuickLink = ({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: any;
  title: string;
  desc: string;
}) => (
  <Link
    to={to}
    className="glass-panel rounded-xl p-4 group hover:border-primary/40 hover:-translate-y-0.5 transition-all"
  >
    <div className="flex items-center justify-between mb-2.5">
      <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
    </div>
    <p className="font-display font-semibold text-sm">{title}</p>
    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
  </Link>
);

export default DashboardHome;
