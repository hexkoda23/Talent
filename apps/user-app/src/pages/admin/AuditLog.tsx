import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Filter, ScrollText } from "lucide-react";

const logs = [
  { time: "13:42:01", user: "admin@talent.ng", action: "approved", target: "A-9301 · Adaeze Okafor", ip: "102.89.x.x" },
  { time: "13:39:18", user: "system", action: "auto-rejected", target: "A-9296 · Emeka Nwosu", ip: "—" },
  { time: "13:35:44", user: "mod.kunle@talent.ng", action: "blacklisted", target: "@fake_dev_99", ip: "197.210.x.x" },
  { time: "13:31:09", user: "system", action: "code-uploaded", target: "adaeze/rag-pipeline-mvp", ip: "—" },
  { time: "13:28:55", user: "rev.ada@talent.ng", action: "rejected", target: "A-9290 · Ibrahim K.", ip: "105.112.x.x" },
  { time: "13:21:37", user: "system", action: "submission-received", target: "logbook · Tunde Bakare · W12", ip: "—" },
  { time: "13:14:02", user: "admin@talent.ng", action: "role-changed", target: "@ada_mod -> campus_admin", ip: "102.89.x.x" },
  { time: "13:10:18", user: "system", action: "flag-raised", target: "@kayode_w · selfie mismatch", ip: "—" },
];

const actionColor = (a: string) =>
  a.includes("approved") || a.includes("uploaded") || a.includes("received") ? "text-accent" :
  a.includes("rejected") || a.includes("blacklisted") || a.includes("flag") ? "text-destructive" :
  a.includes("role") ? "text-secondary" :
  "text-primary";

export default function AdminAuditLog() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <ScrollText className="h-7 w-7 text-primary" /> Audit Log
          </h1>
          <p className="text-muted-foreground">Immutable record of every action on the platform.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="soft" size="sm"><Filter className="h-4 w-4" /> Filters</Button>
          <Button variant="soft" size="sm"><Download className="h-4 w-4" /> Export</Button>
        </div>
      </div>

      <Card className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="p-3">Time</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target</th>
                <th className="p-3 hidden md:table-cell">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 font-mono text-xs">
                  <td className="p-3 text-muted-foreground">{l.time}</td>
                  <td className="p-3">{l.user}</td>
                  <td className={`p-3 font-semibold ${actionColor(l.action)}`}>{l.action}</td>
                  <td className="p-3">{l.target}</td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
