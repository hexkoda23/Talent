import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ExternalLink, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Category = "requirement" | "functional" | "compliance" | "bonus" | "social";

type Question = {
  id: string;
  category: Category;
  text: string;
  type: "rating" | "text";
};

type AuditDetail = {
  id: string;
  title: string;
  submissionId: string;
  giteaUrl: string;
  questions: Question[];
};

const FIXTURES: Record<string, AuditDetail> = {
  "audit-001": {
    id: "audit-001",
    submissionId: "sub-7c1d",
    title: "Tunde's RAG pipeline",
    giteaUrl: "https://gitea.example/_review/sub-7c1d",
    questions: [
      { id: "q1", category: "requirement", text: "Does the submission satisfy the documented requirement?", type: "rating" },
      { id: "q2", category: "functional",  text: "Does the code run end-to-end without intervention?",      type: "rating" },
      { id: "q3", category: "compliance",  text: "Is the README and license setup compliant?",              type: "rating" },
      { id: "q4", category: "bonus",       text: "Anything they did above and beyond?",                     type: "text"   },
      { id: "q5", category: "social",      text: "Was their commit history readable and respectful?",       type: "rating" },
    ],
  },
};

const categoryColors: Record<Category, string> = {
  requirement: "text-primary border-primary/30 bg-primary/10",
  functional: "text-accent border-accent/30 bg-accent/10",
  compliance: "text-secondary border-secondary/30 bg-secondary/10",
  bonus: "text-warning border-warning/30 bg-warning/10",
  social: "text-muted-foreground border-border bg-muted/40",
};

const AuditSubmit = () => {
  const { auditId = "" } = useParams<{ auditId: string }>();
  const navigate = useNavigate();
  const audit = FIXTURES[auditId] ?? FIXTURES["audit-001"];

  const [responses, setResponses] = useState<Record<string, number | string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const allAnswered = useMemo(
    () =>
      audit.questions.every((q) => {
        const r = responses[q.id];
        return q.type === "rating" ? typeof r === "number" : Boolean(r);
      }),
    [audit.questions, responses],
  );

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      // dashboardApi.submitAudit(audit.id, { responses })
      await new Promise((r) => setTimeout(r, 600));
      setDone(true);
      window.setTimeout(() => navigate("/dashboard/audits"), 1200);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <div>
        <Link
          to="/dashboard/audits"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to audit queue
        </Link>
        <p className="text-xs font-mono uppercase tracking-widest text-accent mt-3 mb-1">
          // submit audit · {audit.submissionId}
        </p>
        <h1 className="font-display text-2xl lg:text-3xl font-bold">{audit.title}</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Score each rubric category. You should have already inspected the code in Gitea.
        </p>
        <Button variant="soft" size="sm" className="gap-1.5 mt-3" asChild>
          <a href={audit.giteaUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" /> Re-open code in Gitea
          </a>
        </Button>
      </div>

      <div className="space-y-3">
        {audit.questions.map((q, i) => (
          <div key={q.id} className="glass-panel rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Q{i + 1}
                </p>
                <p className="text-sm font-medium">{q.text}</p>
              </div>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] uppercase font-mono border",
                  categoryColors[q.category],
                )}
              >
                {q.category}
              </span>
            </div>

            {q.type === "rating" ? (
              <RatingInput
                value={responses[q.id] as number | undefined}
                onChange={(v) => setResponses((prev) => ({ ...prev, [q.id]: v }))}
              />
            ) : (
              <textarea
                rows={3}
                value={(responses[q.id] as string) ?? ""}
                onChange={(e) =>
                  setResponses((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
                placeholder="Free-form response"
                className="w-full rounded-lg bg-muted border border-border p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3">
        {done && (
          <span className="text-sm text-accent flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Submitted
          </span>
        )}
        <Button
          variant="hero"
          size="lg"
          className="gap-2"
          disabled={!allAnswered || submitting || done}
          onClick={onSubmit}
        >
          <Send className="h-4 w-4" />
          {submitting ? "Submitting..." : "Submit audit"}
        </Button>
      </div>
    </div>
  );
};

const RatingInput = ({
  value,
  onChange,
}: {
  value?: number;
  onChange: (v: number) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className={cn(
          "h-9 w-9 rounded-md border text-sm font-mono transition-colors",
          value === n
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-muted border-border hover:border-primary/40",
        )}
        aria-pressed={value === n}
      >
        {n}
      </button>
    ))}
  </div>
);

export default AuditSubmit;
