import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  HelpCircle,
  Lock,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const learnDone = false;
const learnPct = 65;

const endOfDay = () => {
  const d = new Date();
  d.setHours(23, 59, 0, 0);
  return d;
};

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

const Quests = () => {
  const countdown = useCountdown(endOfDay());

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-2">// quest</p>
          <h1 className="font-display text-2xl lg:text-4xl font-bold">Quest</h1>
          <p className="text-muted-foreground mt-2 text-sm lg:text-base max-w-2xl">
            Curriculum-attached challenges configured by admins. Deadlines, cooldowns, XP, and attempt rules are set per quest.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="soft" size="sm" asChild>
            <Link to="/dashboard/raid">Open raid <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button variant="soft" size="sm" asChild>
            <Link to="/dashboard/audits">Open audits <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>

      {!learnDone ? (
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-aurora opacity-30" />
            <div className="relative flex flex-col items-center text-center max-w-md mx-auto py-6">
              <div className="h-16 w-16 rounded-full bg-muted border border-border grid place-items-center mb-4">
                <Lock className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">Quest is locked</h2>
              <p className="text-muted-foreground mb-5">
                This quest unlocks once you finish the <span className="text-primary font-semibold">required module content</span>.
              </p>
              <div className="w-full max-w-sm mb-5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Learn progress</span>
                  <span className="font-mono">{learnPct}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border">
                  <div className="h-full bg-gradient-primary relative" style={{ width: `${learnPct}%` }}>
                    <div className="absolute inset-0 animate-shimmer" />
                  </div>
                </div>
              </div>
              <Button variant="hero" className="gap-2" asChild>
                <Link to="/dashboard/learn"><PlayCircle className="h-4 w-4" /> Continue Learn phase</Link>
              </Button>
            </div>
          </div>
          <RuleBanner countdown={countdown} />
        </div>
      ) : (
        <div className="space-y-4">
          <RuleBanner countdown={countdown} />
          <div className="glass-panel rounded-2xl p-5 lg:p-6 border-primary/40">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-1">// active quest</p>
                <h2 className="font-display text-xl lg:text-2xl font-semibold">Build a top-k semantic search API</h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-semibold border border-primary/30">
                Admin-set
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Use FastAPI and pgvector. Index 50 short docs. Endpoint <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">POST /search</code> returns top 5 with similarity scores.
            </p>
            <div className="grid sm:grid-cols-3 gap-2 lg:gap-3 mb-4 text-sm">
              <Pill icon={Clock} label="Closes" value={countdown} tone="warning" />
              <Pill icon={Zap} label="Reward" value="+180 XP" tone="primary" />
              <Pill icon={RotateCcw} label="Attempts" value="3 of 3 left" tone="violet" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="hero" className="gap-2"><PlayCircle className="h-4 w-4" /> Start attempt</Button>
              <Button variant="soft" className="gap-2"><HelpCircle className="h-4 w-4" /> Need help?</Button>
            </div>
            <div className="mt-5 rounded-xl border border-accent/30 bg-accent/5 p-3 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <span className="text-accent font-semibold">Early-bird bonus:</span> submit before 6:00 PM for <span className="font-mono text-foreground">+60 XP</span>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RuleBanner = ({ countdown }: { countdown: string }) => (
  <div className="glass-panel rounded-xl p-4 border-warning/40 flex items-start gap-3">
    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
    <div className="text-sm flex-1">
      <p className="font-semibold">Quest closes in <span className="font-mono text-warning">{countdown}</span>.</p>
      <p className="text-muted-foreground mt-0.5">Miss it means 0 XP and your streak resets. Max 3 attempts allowed.</p>
    </div>
  </div>
);

const Pill = ({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: "warning" | "primary" | "violet" }) => {
  const tones: Record<string, string> = {
    warning: "text-warning bg-warning/10 border-warning/30",
    primary: "text-primary bg-primary/10 border-primary/30",
    violet: "text-secondary bg-secondary/10 border-secondary/30",
  };
  return (
    <div className={cn("rounded-lg border p-3 flex items-center gap-2.5", tones[tone])}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase font-mono opacity-80">{label}</p>
        <p className="text-sm font-semibold font-mono truncate">{value}</p>
      </div>
    </div>
  );
};

export default Quests;
