import { ArrowRight, ClipboardCheck, Clock, FileSearch, ListChecks, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const audits = [
  { title: "Tunde's RAG pipeline", desc: "Score code quality, correctness, and clarity with runnable evidence.", status: "current", reward: 40, due: "Today 6:00 PM", risk: "normal" },
  { title: "Kemi's sentiment endpoint", desc: "Run the repo, test 5 inputs, and leave structured feedback.", status: "open", reward: 40, due: "Tomorrow 12:00 PM", risk: "normal" },
  { title: "Ifeanyi's prompt-defense write-up", desc: "Check plagiarism signals and technical accuracy.", status: "open", reward: 35, due: "Tomorrow 12:00 PM", risk: "ai-check" },
];

const rubrics = ["Requirement", "Functional", "Compliance", "Bonus", "Social"];

const Audits = () => (
  <div className="space-y-6 animate-fade-up">
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">// peer audit desk</p>
      <h1 className="font-display text-2xl lg:text-4xl font-bold">Audit Queue</h1>
      <p className="text-muted-foreground mt-2 max-w-2xl">
        Review other students' submissions for XP. Every score can be checked by AI grading and campus_admin spot checks.
      </p>
    </div>

    <div className="grid sm:grid-cols-3 gap-4">
      <Metric icon={ClipboardCheck} label="Assigned audits" value="3" tone="text-accent" />
      <Metric icon={ListChecks} label="Question categories" value="5" tone="text-primary" />
      <Metric icon={ClipboardCheck} label="Completed audits" value="18" tone="text-warning" />
    </div>

    <div className="grid lg:grid-cols-[2fr,1fr] gap-5">
      <section className="grid md:grid-cols-2 gap-4">
        {audits.map((a) => (
          <div key={a.title} className="glass-panel rounded-2xl p-5 hover:border-primary/40 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-muted border border-border grid place-items-center">
                <FileSearch className="h-5 w-5 text-accent" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-accent/15 text-accent border-accent/30">
                Audit
              </span>
            </div>
            <h2 className="font-display text-lg font-semibold mb-1">{a.title}</h2>
            <p className="text-sm text-muted-foreground mb-4">{a.desc}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-secondary" /> +{a.reward} XP</span>
              <span className="flex items-center gap-1 font-mono"><Clock className="h-3.5 w-3.5" /> {a.due}</span>
              {a.risk === "ai-check" && <span className="text-warning">AI check required</span>}
            </div>
            <Button variant={a.status === "current" ? "hero" : "soft"} size="sm" className="gap-1">
              {a.status === "current" ? "Continue" : "Start audit"} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </section>

      <aside className="glass-panel rounded-2xl p-5 h-fit">
        <h2 className="font-display font-semibold text-lg mb-3">Scoring rubric</h2>
        <div className="space-y-2">
          {rubrics.map((r) => (
            <div key={r} className="rounded-lg bg-muted/40 border border-border p-3 flex items-center justify-between">
              <span className="text-sm">{r}</span>
              <div className="flex gap-0.5 text-warning">
                {[1, 2, 3, 4, 5].map((n) => <Star key={n} className="h-3.5 w-3.5" />)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
        Audit questions are grouped by requirement, functional, compliance, bonus, and social categories.
        </div>
      </aside>
    </div>
  </div>
);

const Metric = ({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) => (
  <div className="glass-panel rounded-2xl p-5">
    <Icon className={`h-5 w-5 ${tone} mb-3`} />
    <div className="font-display text-2xl font-bold">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

export default Audits;
