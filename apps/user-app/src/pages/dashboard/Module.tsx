import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markModuleAccessed } from "@/lib/moduleAccess";

// In prod this becomes ~5 minutes. Dev/staging gates with a short timer.
const ENGAGEMENT_SECONDS = 5;

type ModuleResponse = {
  id: string;
  title: string;
  topicTitle: string;
  contents: string; // HTML from rich-text editor
  questId?: string;
};

// Stub fixture — replace with a real fetch via dashboardApi.module(moduleId).
const FIXTURES: Record<string, ModuleResponse> = {
  "mod-embeddings-101": {
    id: "mod-embeddings-101",
    title: "Building a top-k retriever",
    topicTitle: "Embeddings & Vector Search",
    questId: "quest-topk-search",
    contents: `
      <h2>Why top-k retrieval matters</h2>
      <p>A retriever's job is to surface the few documents most likely to answer a query. Two design choices shape its behaviour:</p>
      <ul>
        <li><strong>The embedding model</strong> — controls what "similar" means.</li>
        <li><strong>The index</strong> — controls how fast you can find the closest neighbours at scale.</li>
      </ul>
      <h2>Cosine similarity, briefly</h2>
      <p>Cosine similarity scores two vectors by the angle between them. Magnitude is ignored, which is why it works well with normalised text embeddings.</p>
      <pre><code>def cosine(a, b): return dot(a, b) / (norm(a) * norm(b))</code></pre>
      <h2>Reading checklist</h2>
      <ol>
        <li>Read all sections on this page.</li>
        <li>Open the linked diagram in a new tab and walk through each arrow.</li>
        <li>Try to predict, before the next module, what failure modes a pure-vector retriever will have on lexical queries.</li>
      </ol>
    `,
  },
};

const fetchModuleStub = async (id: string): Promise<ModuleResponse> => {
  // Real: const data = await dashboardApi.module(id);
  return FIXTURES[id] ?? {
    id,
    title: "Module",
    topicTitle: "",
    contents: "<p>This module's content has not been authored yet.</p>",
  };
};

const Module = () => {
  const params = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const moduleId = params.moduleId ?? "";
  const [data, setData] = useState<ModuleResponse | null>(null);
  const [openedAt] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!moduleId) return;
    let cancelled = false;
    fetchModuleStub(moduleId).then((res) => {
      if (!cancelled) setData(res);
    });
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const elapsed = Math.floor((now - openedAt) / 1000);
  const remaining = Math.max(0, ENGAGEMENT_SECONDS - elapsed);
  const ready = remaining === 0;
  const pct = useMemo(
    () => Math.min(100, Math.round((elapsed / ENGAGEMENT_SECONDS) * 100)),
    [elapsed],
  );

  // Once the engagement gate is met, mark the module as accessed (unlocks quest).
  useEffect(() => {
    if (ready && data) {
      markModuleAccessed(data.id, data.questId);
    }
  }, [ready, data]);

  const onNext = () => {
    if (!ready || !data) return;
    navigate("/dashboard/learn");
  };

  if (!data) {
    return (
      <div className="space-y-4 animate-fade-up">
        <div className="glass-panel rounded-2xl p-8 text-sm text-muted-foreground">
          Loading module…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <div>
        <Link
          to="/dashboard/learn"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to topic
        </Link>
        <p className="text-xs font-mono uppercase tracking-widest text-secondary mt-3 mb-1">
          // {data.topicTitle || "module"}
        </p>
        <h1 className="font-display text-2xl lg:text-3xl font-bold">{data.title}</h1>
      </div>

      {/* Engagement banner */}
      <div
        className={cn(
          "glass-panel rounded-xl p-4 border flex items-start gap-3",
          ready ? "border-accent/40" : "border-warning/40",
        )}
      >
        {ready ? (
          <ArrowRight className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
        ) : (
          <Clock className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 text-sm">
          <p className="font-semibold">
            {ready
              ? "You can move on now."
              : `Spend at least ${ENGAGEMENT_SECONDS} seconds reading this module.`}
          </p>
          <p className="text-muted-foreground mt-0.5">
            {ready
              ? "The next button is unlocked. The linked quest is now available too."
              : `In production this minimum is around 5 minutes. ${remaining}s remaining.`}
          </p>
          <div className="h-1.5 mt-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                ready ? "bg-accent" : "bg-warning",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Module content (HTML from rich-text editor) */}
      <article
        className="glass-panel rounded-2xl p-5 lg:p-7 module-content"
        dangerouslySetInnerHTML={{ __html: data.contents }}
      />

      {/* Footer: Next */}
      <div className="flex justify-end">
        <Button
          variant={ready ? "hero" : "soft"}
          size="lg"
          className="gap-2"
          disabled={!ready}
          onClick={onNext}
          aria-disabled={!ready}
        >
          {ready ? "Next" : `Next · ${remaining}s`}
          {ready ? <ArrowRight className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default Module;
