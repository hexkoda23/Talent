import { AlertTriangle, Ban, ClipboardCheck, Eye, Flag, Gavel, Mic, MonitorX, Send, ShieldAlert, Timer, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const offenses = [
  { user: "Kayode Williams", reason: "Tab-switch burst during checkpoint exam", level: "2nd offense", action: "Suspend 72h" },
  { user: "Ifeanyi Obi", reason: "Fake peer audit scores with no repo evidence", level: "1st offense", action: "Warning" },
  { user: "Bola Martins", reason: "Raid non-participation confirmed by interview", level: "3rd offense", action: "Expulsion review" },
];

const proctorFlags = [
  { icon: Mic, text: "Suspicious noise", count: 18 },
  { icon: Users, text: "Multiple faces detected", count: 7 },
  { icon: Eye, text: "Looking away frequently", count: 12 },
  { icon: MonitorX, text: "Tab-switch detection", count: 24 },
];

const peerFlags = ["Users giving everyone 95%+", "Friend-circle reciprocal scoring", "Random scores without comments"];
const raidReviews = ["Team #07 Q&A pending", "Team #11 contribution dispute", "Team #04 failed demo validation"];

export default function AdminModeration() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-destructive mb-2">// discipline and integrity</p>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3"><ShieldAlert className="h-7 w-7 text-destructive" /> Enforcement Center</h1>
          <p className="text-muted-foreground max-w-2xl">Issue warnings, suspend, expel, review AI proctoring, audit peer scoring, and validate raid contribution.</p>
        </div>
        <Button variant="hero" size="sm"><Send className="h-4 w-4" /> Send system message</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric icon={Flag} label="Open flags" value="37" tone="text-warning" />
        <Metric icon={Timer} label="Suspensions" value="18" tone="text-warning" />
        <Metric icon={Ban} label="Expulsions" value="84" tone="text-destructive" />
        <Metric icon={ClipboardCheck} label="Resolved 30d" value="421" tone="text-accent" />
      </div>

      <div className="grid xl:grid-cols-[1.2fr,0.8fr] gap-6">
        <Card className="glass-panel p-5">
          <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2"><Gavel className="h-5 w-5 text-warning" /> Escalation queue</h2>
          <div className="space-y-3">
            {offenses.map((o) => (
              <div key={o.user} className="rounded-xl bg-muted/30 border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{o.user}</p>
                    <p className="text-sm text-muted-foreground">{o.reason}</p>
                    <span className="inline-block mt-2 text-[10px] font-mono px-2 py-1 rounded border border-warning/30 bg-warning/15 text-warning">{o.level}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="soft" size="sm"><AlertTriangle className="h-4 w-4" /> Warning</Button>
                    <Button variant="soft" size="sm"><Timer className="h-4 w-4" /> Suspend</Button>
                    <Button variant="destructive" size="sm"><Ban className="h-4 w-4" /> Expel</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-panel p-5">
          <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2"><Video className="h-5 w-5 text-destructive" /> AI proctoring review</h2>
          <div className="space-y-2">
            {proctorFlags.map((f) => (
              <div key={f.text} className="rounded-lg bg-muted/40 border border-border p-3 flex items-center gap-3">
                <f.icon className="h-4 w-4 text-warning" />
                <span className="text-sm flex-1">{f.text}</span>
                <span className="font-mono text-warning">{f.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-panel p-5">
          <h2 className="font-display font-semibold text-lg mb-4">Quest and peer audit oversight</h2>
          <div className="space-y-2">
            {peerFlags.map((flag) => (
              <div key={flag} className="rounded-lg bg-muted/40 border border-border p-3 flex items-center justify-between gap-3">
                <span className="text-sm">{flag}</span>
                <Button variant="soft" size="sm">Override / flag</Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-panel p-5">
          <h2 className="font-display font-semibold text-lg mb-4">Raid audit validation</h2>
          <div className="space-y-2">
            {raidReviews.map((review) => (
              <div key={review} className="rounded-lg bg-muted/40 border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm">{review}</span>
                  <div className="flex gap-2">
                    <Button variant="soft" size="sm">Interview</Button>
                    <Button variant="hero" size="sm">Pass / fail</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const Metric = ({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) => (
  <Card className="glass-panel p-5">
    <Icon className={`h-5 w-5 ${tone} mb-3`} />
    <div className="text-2xl font-display font-bold">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </Card>
);
