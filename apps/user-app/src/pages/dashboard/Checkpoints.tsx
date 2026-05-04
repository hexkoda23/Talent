import { useState } from "react";
import { ArrowRight, Brain, CheckCircle2, Clock, Lock, Play, Settings2, Sparkles, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const completionPct = 72;
const isReady = completionPct >= 80;

const path = [
  { id: 1, title: "Python Foundations", xp: 200, status: "done", score: 92 },
  { id: 2, title: "Data and Linear Algebra", xp: 220, status: "done", score: 88 },
  { id: 3, title: "Embeddings and Vector Search", xp: 250, status: "current" },
  { id: 4, title: "Prompt Engineering", xp: 270, status: "locked" },
  { id: 5, title: "RAG Pipelines", xp: 320, status: "locked" },
  { id: 6, title: "Fine-tuning Basics", xp: 360, status: "locked" },
];

const Checkpoints = () => {
  const [reflection, setReflection] = useState("");

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-2">// checkpoint</p>
          <h1 className="font-display text-2xl lg:text-4xl font-bold">Checkpoint Gate</h1>
          <p className="text-muted-foreground mt-2 text-sm lg:text-base">
            Curriculum boundary assessment. Admins decide when it opens, what it covers, and what readiness rule applies.
          </p>
        </div>
        <div className="glass-panel rounded-xl px-4 py-3 flex items-center gap-3">
          <Settings2 className="h-5 w-5 text-warning" />
          <div>
            <p className="text-xs text-muted-foreground">Schedule</p>
            <p className="font-display font-bold text-sm">Admin controlled</p>
          </div>
        </div>
      </div>

      <div className={cn("glass-panel rounded-2xl p-5 lg:p-6", isReady ? "border-accent/40" : "border-warning/40")}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-1">// readiness</p>
            <h2 className="font-display text-xl font-semibold">{isReady ? "Eligible for checkpoint" : "Not eligible yet"}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Demo readiness target is 80%, but the full system lets admins set checkpoint rules by course, subject, or program.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Completion</p>
            <p className={cn("font-display text-3xl font-bold", isReady ? "text-accent" : "text-warning")}>{completionPct}%</p>
          </div>
        </div>
        <div className="relative h-3 bg-muted rounded-full overflow-hidden border border-border mb-2">
          <div className={cn("h-full transition-all relative", isReady ? "bg-gradient-primary" : "bg-warning")} style={{ width: `${completionPct}%` }}>
            <div className="absolute inset-0 animate-shimmer" />
          </div>
          <div className="absolute top-0 bottom-0 w-0.5 bg-foreground/70" style={{ left: "80%" }} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="glass-panel rounded-2xl p-5">
          <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-3">// checkpoint prep</p>
          <div className="aspect-video rounded-xl bg-muted border border-border grid place-items-center relative overflow-hidden mb-3">
            <div className="absolute inset-0 bg-gradient-aurora opacity-30" />
            <div className="relative h-14 w-14 rounded-full bg-primary/90 grid place-items-center text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.6)] animate-pulse-glow">
              <Play className="h-6 w-6 ml-1" />
            </div>
          </div>
          <h3 className="font-display font-semibold">Subject recap: Embeddings and retrieval</h3>
          <p className="text-sm text-muted-foreground mt-1">Optional prep before the admin opens the checkpoint.</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex flex-col">
          <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-3">// reflection</p>
          <h3 className="font-display font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-secondary" /> What did you learn in this subject?
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-3">Be specific. List concepts, blockers, and what you built.</p>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="I learned how vector similarity works, built a pgvector index, and struggled with chunking strategy..."
            className="flex-1 min-h-[140px] w-full rounded-lg bg-muted border border-border p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-1">// assessment gate</p>
              <h3 className="font-display text-lg font-semibold">Current checkpoint</h3>
              <p className="text-sm text-muted-foreground">Question count, duration, attempts, and opening date are admin-set.</p>
            </div>
          </div>
          <Button variant={isReady ? "hero" : "soft"} disabled={!isReady} className="gap-2">
            {isReady ? "Start checkpoint" : "Locked by readiness rule"} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-3">// curriculum path</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {path.map((p) => (
            <div key={p.id} className={cn("glass-panel rounded-xl p-4 transition-all", p.status === "current" && "border-primary/50", p.status === "locked" && "opacity-60")}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Subject {p.id}</span>
                {p.status === "done" && <CheckCircle2 className="h-4 w-4 text-accent" />}
                {p.status === "current" && <Sparkles className="h-4 w-4 text-primary animate-pulse" />}
                {p.status === "locked" && <Lock className="h-4 w-4 text-muted-foreground" />}
              </div>
              <p className="font-display font-semibold text-sm">{p.title}</p>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="flex items-center gap-1 text-secondary font-mono"><Zap className="h-3 w-3" /> +{p.xp}</span>
                {p.status === "done" && <span className="text-accent font-mono">{p.score}%</span>}
                {p.status === "current" && <span className="text-primary font-mono">in progress</span>}
                {p.status === "locked" && <span className="text-muted-foreground font-mono flex items-center gap-1"><Clock className="h-3 w-3" /> locked</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Checkpoints;
