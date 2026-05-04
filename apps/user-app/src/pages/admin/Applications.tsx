import { useState } from "react";
import { AlertTriangle, Check, ClipboardCheck, Eye, FileText, Filter, MessageSquareWarning, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const apps = [
  { id: "A-9301", name: "Adaeze Okafor", phone: "+234 801 444 1902", email: "adaeze@unilag.edu.ng", school: "UNILAG", matric: "CSC/20/1032", level: "400L", nin: "84293311902", score: 1000, pass: "pass", auto: true, status: "pending", issue: "Game-qualified. Awaiting manual identity approval." },
  { id: "A-9298", name: "Chinedu Eze", phone: "+234 816 222 7788", email: "chinedu@unn.edu.ng", school: "UNN", matric: "ENG/21/0441", level: "300L", nin: "33819902551", score: 640, pass: "review", auto: false, status: "flagged", issue: "Student ID appears blurry" },
  { id: "A-9281", name: "Hauwa Ibrahim", phone: "+234 809 118 3344", email: "hauwa@abu.edu.ng", school: "ABU Zaria", matric: "IT/19/7812", level: "400L", nin: "77102245113", score: 710, pass: "review", auto: false, status: "pending", issue: "Phone identity mismatch" },
];

const initialChecks = [
  { key: "id", label: "Student ID Card is clear and readable", checked: false, comment: "Upload is readable enough for school logo, but photo edge is soft.", flag: false },
  { key: "nin", label: "NIN is valid", checked: false, comment: "", flag: false },
  { key: "ninDigits", label: "NIN has exactly 11 digits", checked: false, comment: "", flag: false },
  { key: "matric", label: "Matric Number is correct", checked: false, comment: "", flag: false },
  { key: "school", label: "School Name is valid", checked: false, comment: "", flag: false },
  { key: "phone", label: "Phone Number is linked to NIN identity", checked: false, comment: "", flag: false },
  { key: "face", label: "Profile picture matches School ID and Government ID", checked: false, comment: "", flag: false },
  { key: "duplicate", label: "No duplicate NIN, phone, email, matric, or document hash", checked: false, comment: "", flag: false },
  { key: "gov", label: "Government ID or NIN image is clear and name-matched", checked: false, comment: "", flag: false },
  { key: "consistency", label: "Profile data consistency check", checked: false, comment: "", flag: false },
];

export default function AdminApplications() {
  const [active, setActive] = useState(apps[1]);
  const [checks, setChecks] = useState(initialChecks);
  const [selectedFields, setSelectedFields] = useState<string[]>(["Student ID Card"]);

  const toggleCheck = (key: string) =>
    setChecks((items) => items.map((item) => item.key === key ? { ...item, checked: !item.checked } : item));

  const toggleFlag = (key: string) =>
    setChecks((items) => items.map((item) => item.key === key ? { ...item, flag: !item.flag } : item));

  const updateComment = (key: string, comment: string) =>
    setChecks((items) => items.map((item) => item.key === key ? { ...item, comment } : item));

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-warning mb-2">// entry gate</p>
          <h1 className="text-3xl font-display font-bold">Applicant Review and Verification</h1>
          <p className="text-muted-foreground max-w-2xl">Review game qualification, submitted identity data, document evidence, and correction requests before anyone enters TalentOS.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="soft" size="sm"><Filter className="h-4 w-4" /> Filters</Button>
          <Button variant="soft" size="sm"><FileText className="h-4 w-4" /> Export queue</Button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[0.9fr,1.5fr] gap-6">
        <Card className="glass-panel overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold">Live queue</h2>
            <span className="text-xs font-mono text-muted-foreground">{apps.length} pending</span>
          </div>
          {apps.map((a) => (
            <button key={a.id} onClick={() => setActive(a)} className={`w-full text-left p-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${active.id === a.id ? "bg-primary/10" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {a.name}
                    {a.status === "flagged" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{a.id} - {a.school}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold">{a.score}</div>
                  <div className="text-[10px] text-muted-foreground">game score</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Status label={a.pass} tone={a.pass === "pass" ? "accent" : "warning"} />
                {a.auto && <Status label="auto-pass" tone="primary" />}
                <Status label={a.status} tone={a.status === "flagged" ? "destructive" : "muted" } />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{a.issue}</p>
            </button>
          ))}
        </Card>

        <div className="space-y-5">
          <Card className="glass-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-xl font-semibold">{active.name}</h2>
                <p className="text-xs text-muted-foreground font-mono">{active.id} - {active.pass.toUpperCase()} - {active.auto ? "AUTO-PASS THRESHOLD MET" : "HUMAN REVIEW REQUIRED"}</p>
              </div>
              <Button variant="soft" size="sm"><Eye className="h-4 w-4" /> View uploaded ID</Button>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 text-sm">
              <Info label="Full name" value={active.name} />
              <Info label="Phone number" value={active.phone} />
              <Info label="Email address" value={active.email} />
              <Info label="School name" value={active.school} />
              <Info label="Matric number" value={active.matric} />
              <Info label="Level" value={active.level} />
              <Info label="NIN" value={active.nin} />
              <Info label="Student ID card" value="student-id-front.jpg" />
              <Info label="Profile picture" value="profile-photo.jpg" />
              <Info label="NIN / Government ID" value="nin-slip-or-gov-id.jpg" />
            </div>
            <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-muted-foreground">
              Auto-pass only means this applicant passed the game threshold. Learning access stays locked until an admin accepts this verification file.
            </div>
          </Card>

          <Card className="glass-panel p-5">
            <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-accent" /> Document verification checklist</h2>
            <div className="space-y-3">
              {checks.map((item) => (
                <div key={item.key} className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium flex-1 min-w-64">
                      <input type="checkbox" checked={item.checked} onChange={() => toggleCheck(item.key)} className="accent-primary" />
                      {item.label}
                    </label>
                    <Button variant={item.flag ? "destructive" : "soft"} size="sm" onClick={() => toggleFlag(item.key)}>
                      <MessageSquareWarning className="h-4 w-4" /> {item.flag ? "Flagged" : "Flag inconsistency"}
                    </Button>
                  </div>
                  <Textarea value={item.comment} onChange={(e) => updateComment(item.key, e.target.value)} placeholder="Comment for this verification item..." className="mt-3 min-h-16" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass-panel p-5">
            <h2 className="font-display font-semibold text-lg mb-4">Decision actions and correction flow</h2>
            <div className="grid lg:grid-cols-[1fr,1.2fr] gap-4">
              <div className="space-y-2">
                {["Student ID Card", "Profile picture", "NIN", "Government ID image", "Matric Number", "School Name", "Phone Number", "Face match", "Duplicate check", "Profile consistency"].map((field) => (
                  <label key={field} className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border p-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field)}
                      onChange={() => setSelectedFields((fields) => fields.includes(field) ? fields.filter((f) => f !== field) : [...fields, field])}
                      className="accent-primary"
                    />
                    {field}
                  </label>
                ))}
              </div>
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
                <p className="text-sm font-medium mb-2">Correction request preview</p>
                <p className="text-sm text-muted-foreground">
                  Your ID card is blurry and your phone-NIN link needs confirmation. Please upload a clearer school ID and a valid NIN/government ID image. Direct edit link: /status/correct/{active.id}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button variant="hero" size="sm"><Check className="h-4 w-4" /> Accept user</Button>
                  <Button variant="soft" size="sm"><Send className="h-4 w-4" /> Send correction request</Button>
                  <Button variant="destructive" size="sm"><X className="h-4 w-4" /> Reject user</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-muted/40 border border-border p-3">
    <p className="text-[10px] uppercase font-mono text-muted-foreground mb-1">{label}</p>
    <p className="font-medium break-words">{value}</p>
  </div>
);

const Status = ({ label, tone }: { label: string; tone: "accent" | "warning" | "destructive" | "primary" | "muted" }) => {
  const tones = {
    accent: "bg-accent/15 text-accent border-accent/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    destructive: "bg-destructive/15 text-destructive border-destructive/30",
    primary: "bg-primary/15 text-primary border-primary/30",
    muted: "bg-muted text-muted-foreground border-border",
  };
  return <span className={`text-[10px] font-mono px-2 py-1 rounded border ${tones[tone]}`}>{label}</span>;
};
