import { useState } from "react";
import {
  ArrowRightLeft,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Eye,
  FileCode2,
  GitPullRequest,
  GraduationCap,
  Plus,
  Save,
  Settings2,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const students = ["Adaeze Okafor", "Tunde Kazeem", "Kemi Eze", "Hauwa Ibrahim", "Chinedu Eze"];

const raidMembers = [
  { name: "Adaeze Okafor", initials: "AO", leader: true, prs: 0, status: "leader repo owner" },
  { name: "Tunde Kazeem", initials: "TK", leader: false, prs: 2, status: "PR merged" },
  { name: "Kemi Eze", initials: "KE", leader: false, prs: 1, status: "PR pending review" },
];

const CurriculumStudio = () => {
  const [moduleHtml, setModuleHtml] = useState(
    "<h2>Embeddings and Vector Search</h2>\n<p>Students will learn how vector similarity powers retrieval systems.</p>\n<ul><li>Watch the intro video</li><li>Read the chunking guide</li><li>Attempt the linked quest</li></ul>"
  );
  const [leader, setLeader] = useState("Adaeze Okafor");

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">// curriculum studio</p>
          <h1 className="text-3xl lg:text-4xl font-display font-bold">Learning, Quest, Checkpoint and Raid Authoring</h1>
          <p className="text-muted-foreground max-w-3xl mt-2">
            Create module content, assign quests and checkpoints to specific students, and manage raid leader repo workflows.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="soft" size="sm"><Eye className="h-4 w-4" /> Preview student view</Button>
          <Button variant="hero" size="sm"><Save className="h-4 w-4" /> Save draft</Button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.25fr,0.75fr] gap-6">
        <Card className="glass-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                <FileCode2 className="h-5 w-5 text-primary" /> Learning Module HTML
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Admin writes module content as HTML. The learner page renders it as formatted lesson content.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-primary/15 text-primary border border-primary/30">content_html</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Module title"><Input defaultValue="Embeddings and Vector Search" /></Field>
                <Field label="Target duration"><Input defaultValue="6 months curriculum" /></Field>
              </div>
              <Field label="HTML content">
                <Textarea value={moduleHtml} onChange={(e) => setModuleHtml(e.target.value)} className="min-h-72 font-mono text-xs" />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button variant="hero" size="sm"><Plus className="h-4 w-4" /> Publish module</Button>
                <Button variant="soft" size="sm">Save as draft</Button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Rendered preview</p>
              <div className="rounded-lg bg-background/50 border border-border p-4 text-sm leading-relaxed space-y-2">
                <h2 className="font-display text-xl font-bold">Embeddings and Vector Search</h2>
                <p className="text-muted-foreground">Students will learn how vector similarity powers retrieval systems.</p>
                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                  <li>Watch the intro video</li>
                  <li>Read the chunking guide</li>
                  <li>Attempt the linked quest</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        <Card className="glass-panel p-5">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-accent" /> Published modules
          </h2>
          <div className="space-y-3">
            {["Python Foundations", "Embeddings and Vector Search", "RAG Pipelines"].map((m, i) => (
              <div key={m} className="rounded-xl bg-muted/40 border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{m}</p>
                    <p className="text-xs text-muted-foreground">{i === 1 ? "Draft updated 4m ago" : "Published"}</p>
                  </div>
                  <span className={cn("text-[10px] font-mono px-2 py-1 rounded border", i === 1 ? "bg-warning/15 text-warning border-warning/30" : "bg-accent/15 text-accent border-accent/30")}>
                    {i === 1 ? "draft" : "live"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <Card className="glass-panel p-5">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-warning" /> Create Quest
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Assign to student">
              <select className="w-full h-10 rounded-md bg-muted border border-border px-3 text-sm">
                {students.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Parent module"><Input defaultValue="Embeddings and Vector Search" /></Field>
            <Field label="XP reward"><Input defaultValue="180" /></Field>
            <Field label="Cooldown minutes"><Input defaultValue="45" /></Field>
            <Field label="Deadline"><Input defaultValue="2026-05-04 23:59" /></Field>
            <Field label="Attempt limit"><Input defaultValue="3" /></Field>
          </div>
          <Field label="Quest brief">
            <Textarea defaultValue="Build a top-k semantic search API. Push code to the assigned private submission repo and submit the repo link." className="min-h-24" />
          </Field>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="hero" size="sm"><Plus className="h-4 w-4" /> Create quest</Button>
            <Button variant="soft" size="sm">Assign to cohort</Button>
          </div>
        </Card>

        <Card className="glass-panel p-5">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-4">
            <ClipboardCheck className="h-5 w-5 text-primary" /> Create Checkpoint
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Assign to student">
              <select className="w-full h-10 rounded-md bg-muted border border-border px-3 text-sm">
                {students.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Parent type">
              <select className="w-full h-10 rounded-md bg-muted border border-border px-3 text-sm">
                <option>course</option>
                <option>subject</option>
                <option>program</option>
              </select>
            </Field>
            <Field label="Pass score"><Input defaultValue="70" /></Field>
            <Field label="Duration minutes"><Input defaultValue="60" /></Field>
            <Field label="Opens at"><Input defaultValue="2026-05-05 10:00" /></Field>
            <Field label="Attempt limit"><Input defaultValue="1" /></Field>
          </div>
          <Field label="Checkpoint instructions">
            <Textarea defaultValue="Timed conceptual and applied assessment for the current curriculum boundary. Proctoring is enabled." className="min-h-24" />
          </Field>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="hero" size="sm"><Plus className="h-4 w-4" /> Create checkpoint</Button>
            <Button variant="soft" size="sm">Assign to cohort</Button>
          </div>
        </Card>
      </div>

      <Card className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary" /> Raid Group Repo Control
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Groups stay at three members. One leader owns the platform repo, submits the project, and other members must contribute by pull request.
            </p>
          </div>
          <Button variant="soft" size="sm"><Settings2 className="h-4 w-4" /> Create raid</Button>
        </div>

        <div className="grid xl:grid-cols-[1fr,1.2fr] gap-5">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Leader assignment</p>
            <div className="space-y-3">
              {raidMembers.map((m) => (
                <button key={m.name} onClick={() => setLeader(m.name)} className={cn("w-full rounded-lg border p-3 text-left transition-all", leader === m.name ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-primary/40")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("h-9 w-9 rounded-full grid place-items-center text-xs font-semibold", leader === m.name ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-foreground border border-border")}>{m.initials}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{leader === m.name ? "Current group leader" : "Can receive leader transfer"}</p>
                    </div>
                    {leader === m.name && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="hero" size="sm"><ArrowRightLeft className="h-4 w-4" /> Transfer leader</Button>
              <Button variant="soft" size="sm">Mark leader forfeited</Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Platform repo and PR evidence</p>
            <div className="rounded-lg bg-background/40 border border-border p-3 mb-3">
              <div className="flex items-center gap-2 text-sm font-mono">
                <Code2 className="h-4 w-4 text-primary" />
                raid-07/{leader.toLowerCase().replace(/\s+/g, "-")}-leader-repo
              </div>
              <p className="text-xs text-muted-foreground mt-1">Only the leader submits final project after member pull requests are reviewed.</p>
            </div>
            <div className="space-y-2">
              {raidMembers.filter((m) => m.name !== leader).map((m) => (
                <div key={m.name} className="rounded-lg bg-background/40 border border-border p-3 flex items-center gap-3">
                  <GitPullRequest className="h-4 w-4 text-accent" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.prs} pull request(s) into leader repo</p>
                  </div>
                  <span className={cn("text-[10px] font-mono px-2 py-1 rounded border", m.prs > 0 ? "bg-accent/15 text-accent border-accent/30" : "bg-destructive/15 text-destructive border-destructive/30")}>
                    {m.prs > 0 ? "evidence ok" : "missing PR"}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="hero" size="sm"><GitPullRequest className="h-4 w-4" /> Review PR evidence</Button>
              <Button variant="soft" size="sm">Approve leader submission</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm">{label}</Label>
    {children}
  </div>
);

export default CurriculumStudio;
