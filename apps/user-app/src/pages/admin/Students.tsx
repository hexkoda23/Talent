import { Activity, AlertTriangle, BarChart3, CalendarDays, CheckCircle2, Flame, Search, ShieldAlert, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const profile = {
  name: "Adaeze Okafor",
  school: "UNILAG",
  status: "verified",
  progress: 72,
  streak: 21,
  questRate: 88,
  xp: "8,420",
  level: 14,
  raidHistory: "6 raids - 5 passed - 1 disputed",
  checkpoint: "91% avg",
  peerAudit: "94% fairness",
};

const users = [
  { name: "Adaeze Okafor", status: "verified", risk: "low", progress: 72 },
  { name: "Chinedu Eze", status: "flagged", risk: "high", progress: 34 },
  { name: "Hauwa Ibrahim", status: "pending", risk: "medium", progress: 51 },
  { name: "Kayode Williams", status: "suspended", risk: "critical", progress: 18 },
];

const timeline = [
  "Checkpoint CP-04 passed with 94%, no proctor flags",
  "Raid #07 contribution validated by admin interview",
  "Peer audit score adjusted from 98 to 82 by campus_admin",
  "Warning issued for missed quest streak on Apr 22",
];

export default function AdminStudents() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">// user intelligence</p>
          <h1 className="text-3xl font-display font-bold">User Profile Deep Inspection</h1>
          <p className="text-muted-foreground max-w-2xl">Open any learner and inspect progress, behavior, warnings, suspicion markers, raids, checkpoints, and peer audit history.</p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Search by name, school, NIN, matric..." className="w-full h-10 rounded-lg bg-muted border border-border pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      <div className="grid xl:grid-cols-[0.8fr,1.6fr] gap-6">
        <Card className="glass-panel overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold">Sortable user list</h2>
            <Button variant="soft" size="sm">Filter</Button>
          </div>
          {users.map((u) => (
            <button key={u.name} className="w-full text-left p-4 border-b border-border last:border-0 hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-primary grid place-items-center text-xs font-semibold text-primary-foreground">
                  {u.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground">Progress {u.progress}% - risk {u.risk}</p>
                </div>
                <Status label={u.status} />
              </div>
            </button>
          ))}
        </Card>

        <div className="space-y-5">
          <Card className="glass-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-gradient-primary grid place-items-center text-sm font-bold text-primary-foreground">AO</div>
                <div>
                  <h2 className="font-display text-2xl font-semibold">{profile.name}</h2>
                  <p className="text-sm text-muted-foreground">{profile.school} - {profile.status}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="soft" size="sm"><AlertTriangle className="h-4 w-4" /> Issue warning</Button>
                <Button variant="destructive" size="sm"><ShieldAlert className="h-4 w-4" /> Suspend</Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <Metric icon={BarChart3} label="Learning progress" value={`${profile.progress}%`} />
              <Metric icon={Flame} label="Daily streak" value={`${profile.streak}d`} />
              <Metric icon={Trophy} label="Quest completion" value={`${profile.questRate}%`} />
              <Metric icon={Users} label="XP level" value={`L${profile.level} - ${profile.xp}`} />
            </div>
          </Card>

          <div className="grid lg:grid-cols-3 gap-4">
            <InfoCard title="Raid participation" value={profile.raidHistory} />
            <InfoCard title="Checkpoint scores" value={profile.checkpoint} />
            <InfoCard title="Peer audit history" value={profile.peerAudit} />
          </div>

          <div className="grid lg:grid-cols-[1.2fr,0.8fr] gap-5">
            <Card className="glass-panel p-5">
              <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Timeline</h2>
              <div className="space-y-3">
                {timeline.map((t) => (
                  <div key={t} className="border-l-2 border-primary/40 pl-3 text-sm">
                    <p>{t}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">May 2026</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="glass-panel p-5">
              <h2 className="font-display font-semibold text-lg mb-4">Suspicion markers</h2>
              <div className="space-y-2">
                {["No active cheating suspicion", "One prior missed-task warning", "Audit variance within normal range"].map((m, i) => (
                  <div key={m} className="rounded-lg bg-muted/40 border border-border p-3 flex items-center gap-2 text-sm">
                    {i === 0 ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <CalendarDays className="h-4 w-4 text-warning" />}
                    {m}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

const Metric = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="rounded-xl bg-muted/40 border border-border p-3">
    <Icon className="h-4 w-4 text-primary mb-2" />
    <div className="font-display text-xl font-bold">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

const InfoCard = ({ title, value }: { title: string; value: string }) => (
  <Card className="glass-panel p-4">
    <p className="text-xs text-muted-foreground font-mono uppercase mb-2">{title}</p>
    <p className="font-medium">{value}</p>
  </Card>
);

const Status = ({ label }: { label: string }) => {
  const tone = label === "verified" ? "bg-accent/15 text-accent border-accent/30" : label === "flagged" ? "bg-destructive/15 text-destructive border-destructive/30" : label === "suspended" ? "bg-warning/15 text-warning border-warning/30" : "bg-muted text-muted-foreground border-border";
  return <span className={`text-[10px] font-mono px-2 py-1 rounded border ${tone}`}>{label}</span>;
};
