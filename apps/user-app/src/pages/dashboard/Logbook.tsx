import { useState } from "react";
import { BookOpen, Sparkles, Calendar, Plus, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const week = [
  { day: "Mon", date: "Apr 21", entry: "Built RAG ingest script. Solved chunking edge cases.", status: "done" },
  { day: "Tue", date: "Apr 22", entry: "Set up Pinecone index. Loaded 4k docs.", status: "done" },
  { day: "Wed", date: "Apr 23", entry: "Wrote query layer + small eval set.", status: "done" },
  { day: "Thu", date: "Apr 24", entry: "Pair session on hybrid retrieval.", status: "done" },
  { day: "Fri", date: "Apr 25", entry: "", status: "current" },
];

const Logbook = () => {
  const [entry, setEntry] = useState("");
  const [summary, setSummary] = useState("");

  const generate = () => {
    setSummary("This week the student built and deployed a complete retrieval-augmented generation pipeline using Pinecone. They handled chunking edge cases, ingested 4,000 documents, implemented a query layer with a small evaluation harness, and explored hybrid retrieval. Strong week overall — clear progress on Quest #03.");
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-2">// siwes logbook</p>
        <h1 className="font-display text-3xl lg:text-4xl font-bold">Daily logbook</h1>
        <p className="text-muted-foreground mt-2">Log what you did. We'll auto-generate your weekly report.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr,1fr] gap-5">
        {/* Today's entry */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary grid place-items-center">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Today's entry</h2>
              <p className="text-xs text-muted-foreground">Friday · April 25</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">What did you do today?</Label>
              <textarea
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="e.g. Implemented hybrid BM25 + vector reranker. Ran eval — recall@5 jumped from 0.62 → 0.78."
                className="w-full min-h-[140px] rounded-lg bg-input border border-border px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Hours worked</Label>
                <Input type="number" defaultValue={6} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Supervisor</Label>
                <Input defaultValue="Mr. Chukwu" />
              </div>
            </div>
            <Button variant="hero" className="w-full">Save entry</Button>
          </div>
        </div>

        {/* Week view + AI summary */}
        <div className="space-y-5">
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> This week
              </h2>
              <span className="text-xs font-mono text-muted-foreground">Week 4 / 24</span>
            </div>
            <div className="space-y-2">
              {week.map((d) => (
                <div key={d.day} className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border",
                  d.status === "current" ? "border-primary/40 bg-primary/5" : "border-border bg-muted/40"
                )}>
                  <div className="text-center w-12 flex-shrink-0">
                    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{d.day}</p>
                    <p className="font-display font-semibold text-sm">{d.date.split(" ")[1]}</p>
                  </div>
                  <p className={cn("text-sm flex-1 pt-0.5", !d.entry && "text-muted-foreground italic")}>
                    {d.entry || "No entry yet"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-secondary" /> Auto weekly report
              </h2>
              <Button variant="violet" size="sm" onClick={generate}>Generate</Button>
            </div>
            {summary ? (
              <div className="rounded-xl bg-muted/40 border border-border p-4">
                <div className="flex items-center gap-2 mb-2 text-xs font-mono uppercase tracking-widest text-secondary">
                  <FileText className="h-3.5 w-3.5" /> Weekly Report — Apr 21–25
                </div>
                <p className="text-sm leading-relaxed">{summary}</p>
                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button variant="soft" size="sm">Edit</Button>
                  <Button variant="hero" size="sm" className="gap-1">Submit <ChevronRight className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">
                <BookOpen className="h-6 w-6 mx-auto mb-2 opacity-50" />
                Click <span className="font-medium text-foreground">Generate</span> to create your weekly summary from this week's entries.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logbook;
