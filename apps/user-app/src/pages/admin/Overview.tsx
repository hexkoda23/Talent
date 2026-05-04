import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  HeartPulse,
  Radar,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const stats = [
  { label: "Total users", value: "12,487", note: "1,920 active students", icon: Users, tone: "text-primary" },
  { label: "Applicants", value: "284", note: "61 pending verification", icon: ClipboardCheck, tone: "text-warning" },
  { label: "Avg completion", value: "78%", note: "+6% this week", icon: Gauge, tone: "text-accent" },
  { label: "Integrity records", value: "37", note: "filtered from record rows", icon: ShieldAlert, tone: "text-destructive" },
  { label: "Suspensions", value: "18", note: "4 expire today", icon: Ban, tone: "text-warning" },
  { label: "System health", value: "99.98%", note: "all services operational", icon: HeartPulse, tone: "text-accent" },
];

const queues = [
  { title: "Entry gate", count: 61, path: "/admin/applications", items: ["ID card blurry: A-9298", "NIN validation mismatch: A-9281", "Auto-pass needs final document check: A-9301"] },
  { title: "Curriculum studio", count: 14, path: "/admin/curriculum", items: ["3 module drafts awaiting publish", "6 student quests need assignment", "5 checkpoint gates scheduled"] },
  { title: "Proctoring review", count: 12, path: "/admin/moderation", items: ["Multiple faces detected: CP-041", "Background voice detected: CP-037", "Tab switch burst: CP-032"] },
  { title: "Raid validation", count: 9, path: "/admin/curriculum", items: ["Team #07 PR evidence pending", "Team #11 leader forfeiture request", "Team #04 leader repo submitted"] },
];

const incidents = [
  { icon: AlertTriangle, tone: "text-warning", text: "At-risk cohort spike: 143 users below 50% quest completion", time: "9 min ago" },
  { icon: ShieldAlert, tone: "text-destructive", text: "Fake peer audit pattern detected between 5 accounts", time: "18 min ago" },
  { icon: CheckCircle2, tone: "text-accent", text: "23 applicants auto-qualified by game score and document consistency", time: "41 min ago" },
  { icon: Activity, tone: "text-primary", text: "1,204 commits, 418 quest submissions, 88 audits in the last 24h", time: "1 hr ago" },
];

export default function AdminOverview() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-destructive mb-2">// talentos command center</p>
          <h1 className="text-3xl lg:text-4xl font-display font-bold">Governance Control Room</h1>
          <p className="text-muted-foreground max-w-3xl mt-2">
            Verification, progression integrity, proctoring review, raid validation, and enforcement in one operational view.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="soft" size="sm">Export integrity report</Button>
          <Button variant="hero" size="sm" asChild><Link to="/admin/applications">Review entry gate</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="glass-panel p-4">
            <s.icon className={`h-5 w-5 ${s.tone} mb-3`} />
            <div className="text-2xl font-display font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            <div className="text-[11px] mt-2 font-mono text-muted-foreground">{s.note}</div>
          </Card>
        ))}
      </div>

      <div className="grid xl:grid-cols-[1.25fr,0.75fr] gap-6">
        <Card className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg flex items-center gap-2"><Radar className="h-5 w-5 text-accent" /> Live Review Queues</h2>
            <span className="text-[11px] font-mono text-accent">ACTIVE MONITORING</span>
          </div>
          <div className="grid lg:grid-cols-4 gap-4">
            {queues.map((q) => (
              <Link key={q.title} to={q.path} className="rounded-xl border border-border bg-muted/30 p-4 hover:border-primary/50 transition-all block">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold">{q.title}</h3>
                  <span className="font-mono text-lg text-warning">{q.count}</span>
                </div>
                <div className="space-y-2">
                  {q.items.map((item) => (
                    <p key={item} className="text-xs text-muted-foreground border-l border-border pl-2">{item}</p>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="glass-panel p-5">
          <h2 className="font-display font-semibold text-lg mb-4">Incident Stream</h2>
          <div className="space-y-4">
            {incidents.map((i) => (
              <div key={i.text} className="flex gap-3">
                <div className={`h-8 w-8 rounded-lg bg-muted border border-border grid place-items-center shrink-0 ${i.tone}`}>
                  <i.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm leading-snug">{i.text}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{i.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="glass-panel p-5">
        <h2 className="font-display font-semibold text-lg mb-4">System Health and Integrity Trend</h2>
        <div className="grid grid-cols-12 gap-2 h-28 items-end">
          {[48, 56, 52, 71, 66, 76, 82, 69, 88, 91, 84, 94].map((h, i) => (
            <div key={i} className="rounded-t bg-gradient-primary min-h-4" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="mt-3 grid sm:grid-cols-4 gap-3 text-xs">
          <span className="rounded-lg bg-muted/40 border border-border p-2">Accepted: 74%</span>
          <span className="rounded-lg bg-muted/40 border border-border p-2">Rejected: 18%</span>
          <span className="rounded-lg bg-muted/40 border border-border p-2">Pending: 8%</span>
          <span className="rounded-lg bg-muted/40 border border-border p-2">Inactive: 11%</span>
        </div>
      </Card>
    </div>
  );
}
