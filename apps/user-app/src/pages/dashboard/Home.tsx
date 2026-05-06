import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Zap,
  ArrowRight,
  Lock,
  Clock,
  BookOpen,
  Code2,
  PlayCircle,
  Bell,
  Users,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { useRotatingPhrase } from "@/hooks/useRotatingPhrase";
import { isQuestUnlocked } from "@/lib/moduleAccess";

const CURRENT_MODULE_ID = "mod-embeddings-101";
const ACTIVE_QUEST_ID = "quest-topk-search";

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
  const summary = useDashboardSummary();
  const phrase = useRotatingPhrase(summary.firstName);
  const questUnlocked = isQuestUnlocked(CURRENT_MODULE_ID, ACTIVE_QUEST_ID);
  const checkpointReady = summary.programProgressPct >= 80;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-5 lg:p-8">
        <div className="absolute inset-0 bg-gradient-aurora opacity-50" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-2">
                // day 14 · friday
              </p>
              <h1 className="font-display text-2xl lg:text-4xl font-bold transition-opacity">
                {phrase}
              </h1>
              <p className="text-muted-foreground mt-2 max-w-lg text-sm lg:text-base">
                Continue your current module, complete the active quest, and prepare for the next checkpoint.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/15 border border-warning/30 text-warning">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs font-mono font-bold">{countdown} left for quest submission</span>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Program progress · {summary.modulesCompleted} / {summary.modulesTotal} modules
              </div>
            </div>
          </div>

          {/* Program progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Overall completion</span>
              <span className="font-mono">{summary.programProgressPct}%</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-gradient-primary relative"
                style={{ width: `${summary.programProgressPct}%` }}
              >
                <div className="absolute inset-0 animate-shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current curriculum work */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Learn card (today) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 lg:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono uppercase tracking-widest text-secondary">
              // current module
            </p>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-semibold border border-primary/30">
              Learn Phase
            </span>
          </div>
          <h2 className="font-display text-xl font-semibold">
            Embeddings & Vector Search
          </h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Open the module to start. Quest unlocks once you have read through it.
          </p>

          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard/learn" className="flex-1 min-w-[160px]">
              <Button variant="hero" className="w-full gap-2">
                <PlayCircle className="h-4 w-4" /> Continue learning
              </Button>
            </Link>
            <Link to="/dashboard/workspace">
              <Button variant="soft" className="gap-2">
                <Code2 className="h-4 w-4" /> Open Workspace
              </Button>
            </Link>
          </div>
        </div>

        {/* Quest card */}
        <div
          className={cn(
            "glass-panel rounded-2xl p-5 lg:p-6 relative overflow-hidden",
            !questUnlocked && "border-muted"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono uppercase tracking-widest text-secondary">
              // active quest
            </p>
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                questUnlocked
                  ? "bg-secondary/15 text-secondary border-secondary/30"
                  : "bg-muted text-muted-foreground border-border"
              )}
            >
              Quest
            </span>
          </div>

          {!questUnlocked && (
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] grid place-items-center pointer-events-none">
              <div className="flex flex-col items-center gap-2 text-center px-4">
                <div className="h-12 w-12 rounded-full bg-muted border border-border grid place-items-center">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold">Locked</p>
                <p className="text-xs text-muted-foreground">
                  Open the module first
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
            <Row icon={Zap} text="+180 XP on pass" />
            <Row icon={Clock} text={`Admin-set deadline · ${countdown} left`} />
            <Row icon={AlertTriangle} text="Miss the deadline = 0 XP" />
          </div>

          <Link to="/dashboard/quests">
            <Button
              variant={questUnlocked ? "hero" : "soft"}
              className="w-full mt-4 gap-2"
              disabled={!questUnlocked}
            >
              {questUnlocked ? "Start quest" : "Locked"} <ArrowRight className="h-4 w-4" />
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
              style={{ width: `${summary.programProgressPct}%` }}
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
            <span className="font-mono text-foreground">{summary.programProgressPct}%</span>
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
        <QuickLink to="/dashboard/workspace" icon={Code2} title="Workspace" desc="Push commits" />
        <QuickLink to="/dashboard/logbook" icon={BookOpen} title="Logbook" desc="Log today" />
        <QuickLink to="/dashboard/leaderboard" icon={Trophy} title="Leaderboard" desc="Climb the ranks" />
        <QuickLink to="/dashboard/notifications" icon={Bell} title="Alerts" desc={`${summary.unreadNotifications} new`} />
      </div>
    </div>
  );
};

const Row = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="flex items-center gap-2">
    <Icon className="h-3.5 w-3.5 text-secondary" />
    <span>{text}</span>
  </div>
);

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
