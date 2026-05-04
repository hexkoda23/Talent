import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  CheckCircle2,
  BookOpen,
  Lock,
  ArrowRight,
  Clock,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Status = "done" | "current" | "locked";

const videos: { title: string; duration: string; status: Status }[] = [
  { title: "What are vector embeddings?", duration: "08:24", status: "done" },
  { title: "Cosine similarity explained visually", duration: "06:11", status: "done" },
  { title: "Building your first vector index with pgvector", duration: "12:47", status: "current" },
  { title: "Hybrid search: BM25 + vectors", duration: "09:33", status: "locked" },
];

const reading: { title: string; minutes: number; status: Status }[] = [
  { title: "Embeddings 101 — Talent Nation handbook", minutes: 7, status: "done" },
  { title: "When to chunk vs. when to summarize", minutes: 5, status: "current" },
  { title: "Failure modes of dense retrieval", minutes: 6, status: "locked" },
];

const exercises: { title: string; desc: string; status: Status }[] = [
  { title: "Embed 10 sentences with sentence-transformers", desc: "Practice brief tied to the current quest", status: "done" },
  { title: "Build a top-k semantic search function", desc: "Continue from this module into the quest task", status: "current" },
  { title: "Add a re-ranker on top of your retriever", desc: "Optional extension when the admin opens it", status: "locked" },
];

const Learn = () => {
  const [activeVideo, setActiveVideo] = useState(2);

  // Simple completion math (mock)
  const items = [...videos, ...reading, ...exercises];
  const done = items.filter((i) => i.status === "done").length;
  const total = items.length;
  const pct = Math.round((done / total) * 100);
  const learnComplete = pct === 100;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-5 lg:p-7">
        <div className="absolute inset-0 bg-gradient-aurora opacity-40" />
        <div className="relative">
          <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-2">
            // day 14 · learn phase
          </p>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">
            Embeddings & Vector Search
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm lg:text-base">
            Finish the module content to{" "}
            <span className="text-primary font-semibold">continue to your quest</span>.
          </p>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Learn progress</span>
              <span className="font-mono text-sm">{pct}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-gradient-primary relative transition-all"
                style={{ width: `${pct}%` }}
              >
                <div className="absolute inset-0 animate-shimmer" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> ~38 min remaining
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-secondary" /> +60 XP on completion
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quest gate banner */}
      <div
        className={cn(
          "glass-panel rounded-xl p-4 flex items-start gap-3",
          learnComplete ? "border-accent/40" : "border-warning/30"
        )}
      >
        {learnComplete ? (
          <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
        ) : (
          <Lock className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 text-sm">
          <p className="font-semibold">
            {learnComplete
              ? "Module complete — quest available."
              : "Quest is locked."}
          </p>
          <p className="text-muted-foreground mt-0.5">
            {learnComplete
              ? "Open the current admin-set quest when you are ready."
              : "Finish the required videos and readings on this page first."}
          </p>
        </div>
        <Link to="/dashboard/quests">
          <Button
            size="sm"
            variant={learnComplete ? "hero" : "soft"}
            disabled={!learnComplete}
            className="gap-1"
          >
            Go to quest <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Player */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5">
          <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-3">
            // now playing
          </p>
          <div className="aspect-video rounded-xl bg-muted border border-border grid place-items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-aurora opacity-30" />
            <div className="relative h-16 w-16 rounded-full bg-primary/90 grid place-items-center text-primary-foreground shadow-[0_0_40px_hsl(var(--primary)/0.6)] animate-pulse-glow">
              <Play className="h-7 w-7 ml-1" />
            </div>
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono">04:12 / {videos[activeVideo].duration}</span>
              <span className="px-2 py-0.5 rounded-full bg-background/70 border border-border">
                HD · 1080p
              </span>
            </div>
          </div>
          <h2 className="font-display text-lg font-semibold mt-4">
            {videos[activeVideo].title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Build intuition for similarity search before you write the code. We'll diagram
            it, then implement it in the lab.
          </p>
        </div>

        {/* Lesson list */}
        <div className="space-y-5">
          <Section title="Videos" icon={PlayCircle}>
            {videos.map((v, i) => (
              <Row
                key={v.title}
                title={v.title}
                meta={`${v.duration}`}
                status={v.status}
                onClick={() => v.status !== "locked" && setActiveVideo(i)}
                active={i === activeVideo}
              />
            ))}
          </Section>

          <Section title="Reading" icon={BookOpen}>
            {reading.map((r) => (
              <Row
                key={r.title}
                title={r.title}
                meta={`${r.minutes} min read`}
                status={r.status}
              />
            ))}
          </Section>
        </div>
      </div>

      {/* Quest handoff */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-1">
              // quest bridge
            </p>
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              Continue into the quest
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gitea is used for private code submission repos. The quest page carries the actual challenge brief and submission rules.
            </p>
          </div>
          <Link to="/dashboard/quests">
            <Button variant="soft" size="sm" className="gap-2">
              Go to quest <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {exercises.map((e) => (
            <div
              key={e.title}
              className={cn(
                "rounded-xl border border-border p-4 bg-muted/30 transition-all",
                e.status === "current" && "border-primary/50",
                e.status === "locked" && "opacity-60"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg bg-background border border-border grid place-items-center">
                  {e.status === "locked" ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : e.status === "done" ? (
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-primary" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-mono uppercase",
                    e.status === "done" && "text-accent",
                    e.status === "current" && "text-primary",
                    e.status === "locked" && "text-muted-foreground"
                  )}
                >
                  {e.status}
                </span>
              </div>
              <p className="text-sm font-semibold">{e.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Section = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) => (
  <div className="glass-panel rounded-2xl p-4">
    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5" />
      {title}
    </p>
    <div className="space-y-1.5">{children}</div>
  </div>
);

const Row = ({
  title,
  meta,
  status,
  onClick,
  active,
}: {
  title: string;
  meta: string;
  status: Status;
  onClick?: () => void;
  active?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={status === "locked"}
    className={cn(
      "w-full text-left flex items-center gap-3 p-2.5 rounded-lg transition-colors",
      status !== "locked" && "hover:bg-muted/50",
      active && "bg-muted/60",
      status === "locked" && "opacity-60 cursor-not-allowed"
    )}
  >
    {status === "done" && <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />}
    {status === "current" && (
      <div className="h-4 w-4 rounded-full border-2 border-primary grid place-items-center flex-shrink-0">
        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
      </div>
    )}
    {status === "locked" && (
      <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    )}
    <div className="flex-1 min-w-0">
      <p
        className={cn(
          "text-sm truncate",
          status === "locked" ? "text-muted-foreground" : "font-medium"
        )}
      >
        {title}
      </p>
      <p className="text-[11px] text-muted-foreground font-mono">{meta}</p>
    </div>
  </button>
);

export default Learn;
