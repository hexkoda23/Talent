import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModuleStatus = "done" | "current" | "locked";

type ModuleItem = {
  id: string;
  title: string;
  status: ModuleStatus;
};

const currentTopic = {
  id: "topic-embeddings",
  title: "Embeddings & Vector Search",
  description:
    "Build the intuition and the working code for similarity search before tackling the next quest.",
  modules: [
    { id: "mod-emb-101",        title: "What are vector embeddings?",        status: "done"    },
    { id: "mod-emb-cosine",     title: "Cosine similarity, visually",        status: "done"    },
    { id: "mod-emb-pgvector",   title: "Indexing with pgvector",             status: "done"    },
    { id: "mod-embeddings-101", title: "Building a top-k retriever",         status: "current" },
    { id: "mod-emb-hybrid",     title: "Hybrid search: BM25 + vectors",      status: "locked"  },
    { id: "mod-emb-rerank",     title: "Re-rankers and failure modes",       status: "locked"  },
  ] satisfies ModuleItem[],
};

const Learn = () => {
  const total = currentTopic.modules.length;
  const completed = currentTopic.modules.filter((m) => m.status === "done").length;
  const pct = Math.round((completed / total) * 100);
  const nextModule =
    currentTopic.modules.find((m) => m.status === "current") ??
    currentTopic.modules.find((m) => m.status === "locked");

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      {/* Current topic + progress */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-5 lg:p-7">
        <div className="absolute inset-0 bg-gradient-aurora opacity-30" />
        <div className="relative">
          <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-2">
            // current topic
          </p>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">
            {currentTopic.title}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm lg:text-base">
            {currentTopic.description}
          </p>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Topic progress</span>
              <span className="font-mono text-muted-foreground">
                {completed} / {total} modules · {pct}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-gradient-primary relative transition-all"
                style={{ width: `${pct}%` }}
              >
                <div className="absolute inset-0 animate-shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next module — primary focus */}
      {nextModule && (
        <div className="glass-panel rounded-2xl p-5 lg:p-7 border-primary/40">
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">
            // next module
          </p>
          <h2 className="font-display text-xl lg:text-2xl font-semibold mb-2">
            {nextModule.title}
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Open this module to read it. The quest unlocks once you have spent enough time on the page.
          </p>

          <Link to={`/dashboard/learn/module/${nextModule.id}`}>
            <Button variant="hero" size="lg" className="gap-2" disabled={nextModule.status === "locked"}>
              <PlayCircle className="h-4 w-4" />
              {nextModule.status === "locked" ? "Locked" : "Open module"}
              {nextModule.status !== "locked" && <ArrowRight className="h-4 w-4" />}
            </Button>
          </Link>
        </div>
      )}

      {/* Module list */}
      <div className="glass-panel rounded-2xl p-4">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2 px-1">
          <BookOpen className="h-3.5 w-3.5" />
          All modules in this topic
        </p>
        <ol className="space-y-1.5">
          {currentTopic.modules.map((m, i) => (
            <ModuleRow key={m.id} index={i + 1} module={m} />
          ))}
        </ol>
      </div>
    </div>
  );
};

const ModuleRow = ({ index, module: m }: { index: number; module: ModuleItem }) => {
  const disabled = m.status === "locked";
  const inner = (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors",
        !disabled && "hover:bg-muted/50",
        m.status === "current" && "bg-muted/40 border border-primary/30",
        disabled && "opacity-60",
      )}
    >
      <span className="text-xs font-mono text-muted-foreground w-5">{String(index).padStart(2, "0")}</span>
      {m.status === "done" && <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />}
      {m.status === "current" && (
        <div className="h-4 w-4 rounded-full border-2 border-primary grid place-items-center flex-shrink-0">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        </div>
      )}
      {m.status === "locked" && <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      <span className={cn("text-sm flex-1", disabled ? "text-muted-foreground" : "font-medium")}>
        {m.title}
      </span>
      {!disabled && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
    </div>
  );

  if (disabled) {
    return <li>{inner}</li>;
  }
  return (
    <li>
      <Link to={`/dashboard/learn/module/${m.id}`}>{inner}</Link>
    </li>
  );
};

export default Learn;
