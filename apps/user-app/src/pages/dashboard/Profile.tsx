import { Trophy, Github, MapPin, Calendar, Star, Award, Code2, Flame, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const submissions = [
  { name: "rag-pipeline-quest", type: "Quest repo", status: "passed" },
  { name: "sentiment-api", type: "Quest repo", status: "passed" },
  { name: "vector-bench", type: "Raid repo", status: "validated" },
];

const badges = [
  { name: "Vector Initiate", icon: Target, tone: "primary" },
  { name: "Streak x7", icon: Flame, tone: "warning" },
  { name: "First PR", icon: Github, tone: "violet" },
  { name: "Top 25 Cohort", icon: TrendingUp, tone: "accent" },
];

const Profile = () => {
  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header card */}
      <div className="relative overflow-hidden rounded-2xl glass-panel">
        <div className="h-32 bg-gradient-aurora" />
        <div className="px-6 pb-6 -mt-12 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="h-24 w-24 rounded-2xl bg-gradient-primary border-4 border-background grid place-items-center font-display text-3xl font-bold text-primary-foreground">
              AO
            </div>
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold">Adaeze Okonkwo</h1>
              <p className="text-muted-foreground text-sm">AI Engineering · Level 1</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Lagos, Nigeria</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined Mar 2026</span>
                <span className="flex items-center gap-1"><Github className="h-3.5 w-3.5" /> @adaeze-dev</span>
              </div>
            </div>
          </div>
          <Button variant="soft">Edit profile</Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Cohort rank" value="#24" icon={Trophy} />
        <Stat label="XP earned" value="2,480" icon={Star} />
        <Stat label="Quests completed" value="12" icon={Target} />
        <Stat label="Streak" value="7 days" icon={Flame} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Submissions */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Private submission repos</h2>
            <span className="text-xs text-muted-foreground">{submissions.length} total</span>
          </div>
          <div className="space-y-2">
            {submissions.map((p) => (
              <div key={p.name} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/40 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary grid place-items-center flex-shrink-0">
                    <Code2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.type}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-accent/15 text-accent border border-accent/30">{p.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-warning" /> Badges
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {badges.map((b) => {
              const tones: Record<string, string> = {
                primary: "bg-primary/15 text-primary",
                violet: "bg-secondary/15 text-secondary",
                accent: "bg-accent/15 text-accent",
                warning: "bg-warning/15 text-warning",
              };
              return (
                <div key={b.name} className="rounded-xl bg-muted/40 border border-border p-3 text-center">
                  <div className={`h-10 w-10 rounded-lg grid place-items-center mx-auto mb-2 ${tones[b.tone]}`}>
                    <b.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium">{b.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value, icon: Icon }: { label: string; value: string; icon: any }) => (
  <div className="glass-panel rounded-xl p-4">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <p className="font-display text-2xl font-bold">{value}</p>
  </div>
);

export default Profile;
