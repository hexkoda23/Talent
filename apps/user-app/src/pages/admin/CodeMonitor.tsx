import { Activity, AlertTriangle, BarChart3, Clock, Filter, GitCommit, Search, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const lists = [
  { title: "Most active users", icon: TrendingUp, tone: "text-accent", users: ["Aisha Yusuf - 42 commits", "Adaeze Okafor - 38 submissions", "Tunde Bakare - 31 audits"] },
  { title: "Inactive users", icon: Clock, tone: "text-warning", users: ["Kayode Williams - 9 days idle", "Chinedu Eze - 4 days idle", "Bola Martins - 3 missed quests"] },
  { title: "Top performers", icon: BarChart3, tone: "text-primary", users: ["Fatima Bello - 96% avg", "Aisha Yusuf - L15", "Adaeze Okafor - 94% checkpoints"] },
  { title: "At-risk users", icon: AlertTriangle, tone: "text-destructive", users: ["Chinedu Eze - 34% completion", "Hauwa Ibrahim - audit variance", "Ifeanyi Obi - raid dispute"] },
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AdminCodeMonitor() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">// activity intelligence</p>
          <h1 className="text-3xl font-display font-bold">Activity and Performance Monitoring</h1>
          <p className="text-muted-foreground max-w-2xl">Sortable views for engagement, drop-off, completion health, code activity, and users who are about to fall behind.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Search users..." className="w-full h-9 rounded-md bg-muted border border-border pl-9 pr-3 text-sm focus:outline-none" />
          </div>
          <Button variant="soft" size="sm"><Filter className="h-4 w-4" /> Sort / filter</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {lists.map((list) => (
          <Card key={list.title} className="glass-panel p-5">
            <list.icon className={`h-5 w-5 ${list.tone} mb-3`} />
            <h2 className="font-display font-semibold mb-3">{list.title}</h2>
            <div className="space-y-2">
              {list.users.map((u) => <p key={u} className="text-sm text-muted-foreground rounded-lg bg-muted/40 border border-border p-2">{u}</p>)}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid xl:grid-cols-[1.2fr,0.8fr] gap-6">
        <Card className="glass-panel p-5">
          <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Activity heatmap</h2>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-md border border-border" style={{ backgroundColor: `hsl(var(--accent) / ${0.12 + ((i * 17) % 70) / 100})` }} />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 mt-2 text-[10px] text-muted-foreground text-center">
            {days.map((d) => <span key={d}>{d}</span>)}
          </div>
        </Card>

        <Card className="glass-panel p-5">
          <h2 className="font-display font-semibold text-lg mb-4">Daily engagement metrics</h2>
          <div className="space-y-4">
            <Metric icon={Users} label="Daily active learners" value="1,482" change="+8.4%" good />
            <Metric icon={GitCommit} label="Commits today" value="1,204" change="+13.1%" good />
            <Metric icon={TrendingDown} label="Drop-off risk" value="143" change="+22 users" />
            <Metric icon={AlertTriangle} label="Missed hard deadlines" value="87" change="-4.2%" good />
          </div>
        </Card>
      </div>
    </div>
  );
}

const Metric = ({ icon: Icon, label, value, change, good }: { icon: any; label: string; value: string; change: string; good?: boolean }) => (
  <div className="rounded-xl bg-muted/40 border border-border p-3 flex items-center gap-3">
    <Icon className={`h-5 w-5 ${good ? "text-accent" : "text-warning"}`} />
    <div className="flex-1">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{change}</p>
    </div>
    <span className="font-display text-xl font-bold">{value}</span>
  </div>
);
