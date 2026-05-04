import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Shield, Eye, Plus, MoreVertical, Code2 } from "lucide-react";

const team = [
  { name: "Tobi Adeyemi", email: "tobi@talent.ng", role: "superadmin", icon: Crown, color: "text-warning" },
  { name: "Ada Nwoye", email: "ada@talent.ng", role: "campus_admin", icon: Shield, color: "text-secondary" },
  { name: "Kunle Bello", email: "kunle@talent.ng", role: "campus_admin", icon: Shield, color: "text-secondary" },
  { name: "Zainab Musa", email: "zainab@talent.ng", role: "coding_mentor", icon: Code2, color: "text-primary" },
  { name: "Femi Olu", email: "femi@talent.ng", role: "supervisor", icon: Eye, color: "text-accent" },
];

const permissions = [
  { perm: "View applications", sa: true, mod: true, rev: true },
  { perm: "Approve / reject", sa: true, mod: true, rev: true },
  { perm: "Override system decisions", sa: true, mod: true, rev: false },
  { perm: "Record expulsion", sa: true, mod: true, rev: false },
  { perm: "Edit roles", sa: true, mod: false, rev: false },
  { perm: "Access audit log", sa: true, mod: true, rev: false },
  { perm: "Manage integrations", sa: true, mod: false, rev: false },
];

export default function AdminRoles() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold">Role Management</h1>
          <p className="text-muted-foreground">Define who can do what across Talent Nation.</p>
        </div>
        <Button variant="hero" size="sm"><Plus className="h-4 w-4" /> Invite team member</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="glass-panel p-5 lg:col-span-2">
          <h2 className="font-display font-semibold text-lg mb-4">Team</h2>
          <div className="space-y-2">
            {team.map((t) => (
              <div key={t.email} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                <div className="h-10 w-10 rounded-full bg-gradient-primary grid place-items-center text-xs font-semibold text-primary-foreground">
                  {t.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.email}</div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${t.color}`}>
                  <t.icon className="h-4 w-4" />
                  {t.role}
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-panel p-5">
          <h2 className="font-display font-semibold text-lg mb-4">Permission matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left pb-2 font-normal">Permission</th>
                  <th className="pb-2 font-normal text-center">SA</th>
                  <th className="pb-2 font-normal text-center">Campus</th>
                  <th className="pb-2 font-normal text-center">Mentor</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((p) => (
                  <tr key={p.perm} className="border-t border-border">
                    <td className="py-2">{p.perm}</td>
                    <td className="text-center">{p.sa ? <Dot ok /> : <Dot />}</td>
                    <td className="text-center">{p.mod ? <Dot ok /> : <Dot />}</td>
                    <td className="text-center">{p.rev ? <Dot ok /> : <Dot />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

const Dot = ({ ok }: { ok?: boolean }) => (
  <span className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-accent" : "bg-muted-foreground/30"}`} />
);
