import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Code2,
  FileCheck2,
  FileText,
  Flag,
  Gauge,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  Link as LinkIcon,
  ListChecks,
  LockKeyhole,
  LogOut,
  MapPin,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  XCircle
} from "lucide-react";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";

type CandidateStatus =
  | "registered"
  | "game_completed"
  | "verification_pending"
  | "onboarding"
  | "accepted"
  | "rejected";

type Candidate = {
  id: string;
  name: string;
  email: string;
  campus: string;
  institution: string;
  matric: string;
  cohort: string;
  status: CandidateStatus;
  gameScore: number;
  documents: "pending" | "approved" | "needs_reupload";
  verification: "pending" | "confirmed" | "denied" | "not_started";
};

type User = {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "campus_admin" | "coding_mentor" | "student" | "candidate";
  status: "active" | "away" | "restricted" | "blocked";
  campus: string;
};

type ModuleItem = {
  id: string;
  title: string;
  program: string;
  course: string;
  topic: string;
  status: "draft" | "published";
  xp: number;
  html: string;
};

type Raid = {
  id: string;
  title: string;
  type: "mini_pair" | "standard" | "deployment" | "extended_capstone";
  status: "draft" | "active" | "scheduled" | "completed";
  groupSize: number;
  auditor: string;
  startsAt: string;
  groups: string[][];
};

type AuditSession = {
  id: string;
  raid: string;
  group: string;
  auditor: string;
  date: string;
  time: string;
  meetingLink: string;
  status: "needs_schedule" | "scheduled" | "in_review" | "passed" | "failed";
};

const authStorageKey = "tn_admin_session";
const adminRoles = ["superadmin", "campus_admin", "coding_mentor"];

const candidatesSeed: Candidate[] = [
  {
    id: "APP-1042",
    name: "Adaeze Okonkwo",
    email: "adaeze@example.com",
    campus: "Lagos Ikeja",
    institution: "University of Lagos",
    matric: "CSC/20/1032",
    cohort: "October 2026 Intake",
    status: "verification_pending",
    gameScore: 84,
    documents: "approved",
    verification: "pending"
  },
  {
    id: "APP-1043",
    name: "Tunde Adeyemi",
    email: "tunde@example.com",
    campus: "Abuja Wuse",
    institution: "FUT Minna",
    matric: "FUT/ENG/1182",
    cohort: "October 2026 Intake",
    status: "game_completed",
    gameScore: 76,
    documents: "pending",
    verification: "not_started"
  },
  {
    id: "APP-1044",
    name: "Maryam Bello",
    email: "maryam@example.com",
    campus: "Kaduna Central",
    institution: "ABU Zaria",
    matric: "ABU/SE/2214",
    cohort: "October 2026 Intake",
    status: "onboarding",
    gameScore: 91,
    documents: "needs_reupload",
    verification: "confirmed"
  },
  {
    id: "APP-1045",
    name: "Chinedu Nwosu",
    email: "chinedu@example.com",
    campus: "Enugu Center",
    institution: "UNN",
    matric: "UNN/ECE/4012",
    cohort: "October 2026 Intake",
    status: "accepted",
    gameScore: 88,
    documents: "approved",
    verification: "confirmed"
  }
];

const usersSeed: User[] = [
  { id: "USR-001", name: "Nora Admin", email: "nora@talentnation.test", role: "superadmin", status: "active", campus: "All campuses" },
  { id: "USR-041", name: "Kayode Mentor", email: "kayode@talentnation.test", role: "coding_mentor", status: "active", campus: "Lagos Ikeja" },
  { id: "USR-108", name: "Adaeze Okonkwo", email: "adaeze@example.com", role: "student", status: "active", campus: "Lagos Ikeja" },
  { id: "USR-109", name: "Tunde Adeyemi", email: "tunde@example.com", role: "candidate", status: "restricted", campus: "Abuja Wuse" }
];

const modulesSeed: ModuleItem[] = [
  {
    id: "MOD-001",
    title: "Building your first vector index",
    program: "Track A - 6 Months",
    course: "Embeddings and Vector Search",
    topic: "pgvector fundamentals",
    status: "published",
    xp: 40,
    html: "<h2>Vector indexes</h2><p>Students learn how embeddings become searchable with pgvector.</p><ul><li>Create an index</li><li>Run a similarity query</li></ul>"
  },
  {
    id: "MOD-002",
    title: "HTTP handlers in Go",
    program: "Track B - 3 Months",
    course: "Backend foundations",
    topic: "REST APIs",
    status: "draft",
    xp: 25,
    html: "<h2>Handlers</h2><p>Use the standard library to receive requests and return JSON.</p>"
  }
];

const raidMembers = [
  "Adaeze Okonkwo",
  "Tunde Adeyemi",
  "Maryam Bello",
  "Chinedu Nwosu",
  "Ife Yusuf",
  "Simi Ajayi",
  "Emeka Obi",
  "Fatima Lawal",
  "Daniel Ekpo",
  "Aisha Musa",
  "Victor James",
  "Rita Eze"
];

const raidsSeed: Raid[] = [
  {
    id: "RAID-008",
    title: "Deploy a monitored RAG API",
    type: "deployment",
    status: "active",
    groupSize: 4,
    auditor: "Kayode Mentor",
    startsAt: "2026-06-02",
    groups: [
      ["Adaeze Okonkwo", "Tunde Adeyemi", "Maryam Bello", "Chinedu Nwosu"],
      ["Ife Yusuf", "Simi Ajayi", "Emeka Obi", "Fatima Lawal"]
    ]
  }
];

const auditsSeed: AuditSession[] = [
  {
    id: "AUD-301",
    raid: "Deploy a monitored RAG API",
    group: "Group 1",
    auditor: "Kayode Mentor",
    date: "2026-06-06",
    time: "15:00",
    meetingLink: "",
    status: "needs_schedule"
  },
  {
    id: "AUD-302",
    raid: "Deploy a monitored RAG API",
    group: "Group 2",
    auditor: "Nora Admin",
    date: "2026-06-07",
    time: "11:00",
    meetingLink: "https://meet.google.com/demo-room",
    status: "scheduled"
  }
];

const navSections = [
  {
    label: "Operate",
    links: [
      { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/candidates", label: "Candidates", icon: GraduationCap },
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/documents", label: "Documents", icon: FileCheck2 }
    ]
  },
  {
    label: "Learning",
    links: [
      { to: "/admin/modules", label: "Modules", icon: BookOpen },
      { to: "/admin/quests", label: "Quests", icon: GitBranch },
      { to: "/admin/raids", label: "Raids", icon: Flag },
      { to: "/admin/audit", label: "Audit", icon: ClipboardCheck }
    ]
  },
  {
    label: "Platform",
    links: [
      { to: "/admin/cohorts", label: "Cohorts", icon: CalendarClock },
      { to: "/admin/selection-game", label: "Selection Game", icon: Gauge },
      { to: "/admin/campuses", label: "Campuses", icon: MapPin },
      { to: "/admin/configuration", label: "Configuration", icon: Settings },
      { to: "/admin/gamification", label: "Gamification", icon: Trophy },
      { to: "/admin/records", label: "Records", icon: AlertTriangle },
      { to: "/admin/logbooks", label: "Logbooks", icon: FileText },
      { to: "/admin/system-logs", label: "System Logs", icon: Activity }
    ]
  }
];

const statusTone: Record<string, string> = {
  accepted: "success",
  active: "success",
  approved: "success",
  confirmed: "success",
  published: "success",
  passed: "success",
  scheduled: "info",
  game_completed: "info",
  verification_pending: "warning",
  onboarding: "warning",
  pending: "warning",
  needs_schedule: "warning",
  needs_reupload: "danger",
  rejected: "danger",
  denied: "danger",
  blocked: "danger",
  restricted: "danger",
  draft: "neutral"
};

function isAuthed() {
  const stored = window.localStorage.getItem(authStorageKey);
  if (!stored) return false;
  try {
    const session = JSON.parse(stored) as { token?: string; roles?: string[] };
    return Boolean(session.token && session.roles?.some((role) => adminRoles.includes(role)));
  } catch {
    return false;
  }
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!isAuthed()) {
    return <Navigate to={`/admin/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <>{children}</>;
}

function App() {
  const [candidates, setCandidates] = useState(candidatesSeed);
  const [users, setUsers] = useState(usersSeed);
  const [modules, setModules] = useState(modulesSeed);
  const [raids, setRaids] = useState(raidsSeed);
  const [audits, setAudits] = useState(auditsSeed);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route
          path="dashboard"
          element={<DashboardPage candidates={candidates} users={users} modules={modules} raids={raids} audits={audits} />}
        />
        <Route path="candidates" element={<CandidatesPage candidates={candidates} onChange={setCandidates} />} />
        <Route path="users" element={<UsersPage users={users} onChange={setUsers} />} />
        <Route path="modules" element={<ModulesPage modules={modules} onChange={setModules} />} />
        <Route path="quests" element={<QuestsPage />} />
        <Route path="raids" element={<RaidsPage raids={raids} onChange={setRaids} onAuditsChange={setAudits} />} />
        <Route path="audit" element={<AuditPage audits={audits} onChange={setAudits} raids={raids} />} />
        <Route path="documents" element={<DocumentsPage candidates={candidates} />} />
        <Route path="cohorts" element={<ControlPage title="Cohorts" icon={<CalendarClock />} kind="cohorts" />} />
        <Route path="selection-game" element={<ControlPage title="Selection Game" icon={<Gauge />} kind="selection-game" />} />
        <Route path="campuses" element={<ControlPage title="Campuses" icon={<MapPin />} kind="campuses" />} />
        <Route path="configuration" element={<ControlPage title="Configuration" icon={<Settings />} kind="configuration" />} />
        <Route path="gamification" element={<ControlPage title="Gamification" icon={<Trophy />} kind="gamification" />} />
        <Route path="records" element={<ControlPage title="Records" icon={<AlertTriangle />} kind="records" />} />
        <Route path="logbooks" element={<ControlPage title="Logbooks" icon={<FileText />} kind="logbooks" />} />
        <Route path="system-logs" element={<ControlPage title="System Logs" icon={<Activity />} kind="system-logs" />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect") || "/admin/dashboard";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password")
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Unable to sign in");
      }
      const roles = payload.user?.roles || [];
      if (!roles.some((role: string) => adminRoles.includes(role))) {
        throw new Error("This account does not have admin access");
      }
      window.localStorage.setItem(
        authStorageKey,
        JSON.stringify({
          token: payload.token,
          refresh_token: payload.refresh_token,
          roles,
          user: payload.user
        })
      );
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="brand-mark">
          <ShieldCheck size={26} />
        </div>
        <p className="eyebrow">TalentNation Admin</p>
        <h1 id="login-title">Admin sign in</h1>
        <p className="muted">Use a superadmin, campus admin, or mentor account.</p>
        <form onSubmit={submit} className="stack">
          <label>
            Email
            <input name="email" type="email" defaultValue="admin@talentnation.test" required />
          </label>
          <label>
            Password
            <input name="password" type="password" defaultValue="AdminPassword123!" required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-action" type="submit">
            <LockKeyhole size={18} />
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

function AdminLayout() {
  const navigate = useNavigate();

  function logout() {
    window.localStorage.removeItem(authStorageKey);
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link to="/admin/dashboard" className="sidebar-brand">
          <span className="brand-mark small">
            <ShieldCheck size={20} />
          </span>
          <span>
            <strong>TalentNation</strong>
            <small>Admin Control</small>
          </span>
        </Link>
        <nav className="sidebar-nav" aria-label="Admin sections">
          {navSections.map((section) => (
            <div key={section.label} className="nav-section">
              <p>{section.label}</p>
              {section.links.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="search-box">
            <Search size={17} />
            <input placeholder="Search candidates, modules, raids, users" />
          </div>
          <div className="topbar-actions">
            <span className="role-chip">Superadmin</span>
            <button className="ghost-action" onClick={logout} title="Log out">
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, icon, action }: { title: string; subtitle: string; icon: ReactNode; action?: ReactNode }) {
  return (
    <div className="page-header">
      <div className="title-row">
        <span className="page-icon">{icon}</span>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function DashboardPage({
  candidates,
  users,
  modules,
  raids,
  audits
}: {
  candidates: Candidate[];
  users: User[];
  modules: ModuleItem[];
  raids: Raid[];
  audits: AuditSession[];
}) {
  const pendingVerification = candidates.filter((candidate) => candidate.verification === "pending").length;
  const pendingAudits = audits.filter((audit) => audit.status === "needs_schedule").length;
  const activeRaids = raids.filter((raid) => raid.status === "active").length;
  const accepted = candidates.filter((candidate) => candidate.status === "accepted").length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Operational view of cohorts, candidates, raids, audits, and content readiness."
        icon={<LayoutDashboard />}
        action={
          <Link className="primary-action" to="/admin/raids">
            <Plus size={17} />
            Create raid
          </Link>
        }
      />
      <section className="metric-grid">
        <MetricCard icon={<GraduationCap />} label="Candidates" value={candidates.length} detail={`${pendingVerification} awaiting school response`} tone="blue" />
        <MetricCard icon={<Users />} label="Users" value={users.length} detail={`${accepted} accepted students`} tone="green" />
        <MetricCard icon={<BookOpen />} label="Modules" value={modules.length} detail={`${modules.filter((module) => module.status === "draft").length} drafts`} tone="amber" />
        <MetricCard icon={<Flag />} label="Active raids" value={activeRaids} detail={`${pendingAudits} audits need scheduling`} tone="red" />
      </section>
      <section className="split-grid">
        <Panel title="Immediate Actions" icon={<ListChecks />}>
          <ActionList
            items={[
              ["Review passed candidates", `${pendingVerification} verification requests need follow-up`, "/admin/candidates"],
              ["Schedule raid audits", `${pendingAudits} groups are missing meeting links`, "/admin/audit"],
              ["Publish module drafts", "Review rich HTML previews before students see them", "/admin/modules"],
              ["Check document queue", "Registration and SIWES documents need approvals", "/admin/documents"]
            ]}
          />
        </Panel>
        <Panel title="Recent Admin Trail" icon={<Activity />}>
          <ul className="event-list">
            <li><BadgeCheck size={16} /> Nora Admin accepted Chinedu Nwosu into October 2026 Intake.</li>
            <li><GitBranch size={16} /> Gitea repo provisioned for RAID-008 group 1.</li>
            <li><FileCheck2 size={16} /> Maryam Bello logbook marked needs reupload.</li>
            <li><Settings size={16} /> Cohort group size override changed from 3 to 4.</li>
          </ul>
        </Panel>
      </section>
    </>
  );
}

function CandidatesPage({ candidates, onChange }: { candidates: Candidate[]; onChange: (next: Candidate[]) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = candidates.filter((candidate) => {
    const matchesQuery = `${candidate.name} ${candidate.email} ${candidate.institution} ${candidate.matric}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "all" || candidate.status === status;
    return matchesQuery && matchesStatus;
  });

  function updateCandidate(id: string, patch: Partial<Candidate>) {
    onChange(candidates.map((candidate) => (candidate.id === id ? { ...candidate, ...patch } : candidate)));
  }

  return (
    <>
      <PageHeader title="Candidates" subtitle="Manage applicants from registration through game score, verification, onboarding, acceptance, and rejection." icon={<GraduationCap />} />
      <Toolbar>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search candidate, school, matric" />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="game_completed">Passed game</option>
          <option value="verification_pending">Verification pending</option>
          <option value="onboarding">Onboarding</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </Toolbar>
      <Panel title="Candidate Pipeline" icon={<ListChecks />}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Campus</th>
                <th>Score</th>
                <th>Docs</th>
                <th>Verification</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((candidate) => (
                <tr key={candidate.id}>
                  <td>
                    <strong>{candidate.name}</strong>
                    <small>{candidate.email} · {candidate.matric}</small>
                  </td>
                  <td>{candidate.campus}</td>
                  <td>{candidate.gameScore}%</td>
                  <td><StatusPill value={candidate.documents} /></td>
                  <td><StatusPill value={candidate.verification} /></td>
                  <td><StatusPill value={candidate.status} /></td>
                  <td className="action-cell">
                    <button onClick={() => updateCandidate(candidate.id, { verification: "confirmed", status: "onboarding" })}>Verify</button>
                    <button onClick={() => updateCandidate(candidate.id, { status: "accepted" })}>Accept</button>
                    <button className="danger" onClick={() => updateCandidate(candidate.id, { status: "rejected" })}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function UsersPage({ users, onChange }: { users: User[]; onChange: (next: User[]) => void }) {
  const [draft, setDraft] = useState({ name: "", email: "", role: "student" as User["role"], campus: "Lagos Ikeja" });

  function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange([...users, { id: `USR-${String(users.length + 121).padStart(3, "0")}`, ...draft, status: "active" }]);
    setDraft({ name: "", email: "", role: "student", campus: "Lagos Ikeja" });
  }

  function updateUser(id: string, patch: Partial<User>) {
    onChange(users.map((user) => (user.id === id ? { ...user, ...patch } : user)));
  }

  return (
    <>
      <PageHeader title="Users" subtitle="CRUD for students, candidates, admins, mentors, and role assignment." icon={<Users />} />
      <section className="split-grid wide-left">
        <Panel title="Directory" icon={<Users />}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Campus</th>
                  <th>Status</th>
                  <th>Controls</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.name}</strong><small>{user.email}</small></td>
                    <td><StatusPill value={user.role} /></td>
                    <td>{user.campus}</td>
                    <td><StatusPill value={user.status} /></td>
                    <td className="action-cell">
                      <button onClick={() => updateUser(user.id, { status: "active" })}>Activate</button>
                      <button onClick={() => updateUser(user.id, { status: "away" })}>Away</button>
                      <button className="danger" onClick={() => updateUser(user.id, { status: "blocked" })}>Block</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Create User" icon={<Plus />}>
          <form onSubmit={createUser} className="stack">
            <label>Name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></label>
            <label>Email<input type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} required /></label>
            <label>Role<select value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value as User["role"] })}>
              <option value="student">Student</option>
              <option value="candidate">Candidate</option>
              <option value="coding_mentor">Coding mentor</option>
              <option value="campus_admin">Campus admin</option>
              <option value="superadmin">Superadmin</option>
            </select></label>
            <label>Campus<input value={draft.campus} onChange={(event) => setDraft({ ...draft, campus: event.target.value })} /></label>
            <button className="primary-action" type="submit"><Plus size={17} /> Create user</button>
          </form>
        </Panel>
      </section>
    </>
  );
}

function ModulesPage({ modules, onChange }: { modules: ModuleItem[]; onChange: (next: ModuleItem[]) => void }) {
  const [selectedId, setSelectedId] = useState(modules[0]?.id || "");
  const selected = modules.find((module) => module.id === selectedId) || modules[0];

  function updateSelected(patch: Partial<ModuleItem>) {
    onChange(modules.map((module) => (module.id === selected.id ? { ...module, ...patch } : module)));
  }

  function createModule() {
    const next: ModuleItem = {
      id: `MOD-${String(modules.length + 1).padStart(3, "0")}`,
      title: "Untitled module",
      program: "Track A - 6 Months",
      course: "New course",
      topic: "New topic",
      status: "draft",
      xp: 0,
      html: "<h2>New module</h2><p>Start writing here.</p>"
    };
    onChange([...modules, next]);
    setSelectedId(next.id);
  }

  if (!selected) return null;

  return (
    <>
      <PageHeader
        title="Modules"
        subtitle="CRUD for curriculum modules with a rich HTML editor for text, images, videos, code, and embeds."
        icon={<BookOpen />}
        action={<button className="primary-action" onClick={createModule}><Plus size={17} /> New module</button>}
      />
      <section className="module-grid">
        <Panel title="Curriculum Tree" icon={<ListChecks />}>
          <div className="module-list">
            {modules.map((module) => (
              <button key={module.id} className={module.id === selected.id ? "module-row active" : "module-row"} onClick={() => setSelectedId(module.id)}>
                <span>
                  <strong>{module.title}</strong>
                  <small>{module.program} · {module.course}</small>
                </span>
                <StatusPill value={module.status} />
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Module Editor" icon={<Pencil />}>
          <div className="editor-form">
            <label>Title<input value={selected.title} onChange={(event) => updateSelected({ title: event.target.value })} /></label>
            <div className="two-col">
              <label>Program<input value={selected.program} onChange={(event) => updateSelected({ program: event.target.value })} /></label>
              <label>XP reward<input type="number" value={selected.xp} onChange={(event) => updateSelected({ xp: Number(event.target.value) })} /></label>
            </div>
            <div className="two-col">
              <label>Course<input value={selected.course} onChange={(event) => updateSelected({ course: event.target.value })} /></label>
              <label>Topic<input value={selected.topic} onChange={(event) => updateSelected({ topic: event.target.value })} /></label>
            </div>
            <div className="editor-toolbar" aria-label="Rich text controls">
              <button onClick={() => updateSelected({ html: `${selected.html}<h2>Heading</h2>` })}>H2</button>
              <button onClick={() => updateSelected({ html: `${selected.html}<p><strong>Bold text</strong></p>` })}>B</button>
              <button onClick={() => updateSelected({ html: `${selected.html}<pre><code>// code sample</code></pre>` })}><Code2 size={15} /></button>
              <button onClick={() => updateSelected({ html: `${selected.html}<img src=\"https://placehold.co/960x420\" alt=\"Module visual\" />` })}>Image</button>
              <button onClick={() => updateSelected({ html: `${selected.html}<iframe src=\"https://www.youtube.com/embed/dQw4w9WgXcQ\" title=\"Video\"></iframe>` })}>Video</button>
            </div>
            <textarea className="html-editor" value={selected.html} onChange={(event) => updateSelected({ html: event.target.value })} />
            <div className="editor-actions">
              <button onClick={() => updateSelected({ status: "draft" })}>Save draft</button>
              <button className="primary-action" onClick={() => updateSelected({ status: "published" })}><CheckCircle2 size={17} /> Publish</button>
            </div>
          </div>
        </Panel>
        <Panel title="Student Preview" icon={<Sparkles />}>
          <article className="module-preview" dangerouslySetInnerHTML={{ __html: selected.html }} />
        </Panel>
      </section>
    </>
  );
}

function QuestsPage() {
  return (
    <>
      <PageHeader
        title="Quests"
        subtitle="Quest code and repositories live in Gitea; this admin page links out and tracks platform metadata."
        icon={<GitBranch />}
        action={
          <a className="primary-action" href="http://localhost:3000" target="_blank" rel="noreferrer">
            <LinkIcon size={17} />
            Open Gitea
          </a>
        }
      />
      <section className="split-grid">
        <Panel title="Gitea Service" icon={<GitBranch />}>
          <div className="callout">
            <h2>Self-hosted Git backend</h2>
            <p>Quest repositories, workflow files, submissions, and audit clone URLs should remain owned by the Gitea service.</p>
            <a href="http://localhost:3000" target="_blank" rel="noreferrer">http://localhost:3000</a>
          </div>
        </Panel>
        <Panel title="Platform Metadata" icon={<ListChecks />}>
          <FeatureList
            items={[
              "Quest title, parent module/topic/course, order, XP, deadline, cooldown, and max attempts",
              "Repository naming convention enforced before Gitea repo creation",
              "Audit checklist and peer-audit toggle",
              "Submission type: git repository, notebook, file upload, in-platform, or auto-graded"
            ]}
          />
        </Panel>
      </section>
    </>
  );
}

function RaidsPage({
  raids,
  onChange,
  onAuditsChange
}: {
  raids: Raid[];
  onChange: (next: Raid[]) => void;
  onAuditsChange: (updater: (current: AuditSession[]) => AuditSession[]) => void;
}) {
  const [draft, setDraft] = useState({ title: "", groupSize: 4, auditor: "Kayode Mentor", startsAt: "2026-06-10", type: "standard" as Raid["type"] });

  function createRaid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const groups = createGroups(raidMembers, draft.groupSize);
    const next: Raid = {
      id: `RAID-${String(raids.length + 9).padStart(3, "0")}`,
      title: draft.title,
      groupSize: draft.groupSize,
      auditor: draft.auditor,
      startsAt: draft.startsAt,
      type: draft.type,
      status: "scheduled",
      groups
    };
    onChange([...raids, next]);
    onAuditsChange((current) => [
      ...current,
      ...groups.map((_, index) => ({
        id: `AUD-${current.length + index + 401}`,
        raid: next.title,
        group: `Group ${index + 1}`,
        auditor: next.auditor,
        date: next.startsAt,
        time: "10:00",
        meetingLink: "",
        status: "needs_schedule" as const
      }))
    ]);
    setDraft({ title: "", groupSize: 4, auditor: "Kayode Mentor", startsAt: "2026-06-10", type: "standard" });
  }

  return (
    <>
      <PageHeader title="Raids" subtitle="CRUD for group challenges. Creating a raid forms random groups and assigns an admin auditor per group." icon={<Flag />} />
      <section className="split-grid wide-left">
        <Panel title="Raid List" icon={<Flag />}>
          <div className="raid-list">
            {raids.map((raid) => (
              <article className="raid-card" key={raid.id}>
                <div>
                  <h2>{raid.title}</h2>
                  <p>{raid.type} · group size {raid.groupSize} · auditor {raid.auditor}</p>
                </div>
                <StatusPill value={raid.status} />
                <div className="group-grid">
                  {raid.groups.map((group, index) => (
                    <div className="group-card" key={`${raid.id}-${index}`}>
                      <strong>Group {index + 1}</strong>
                      {group.map((member) => <span key={member}>{member}</span>)}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Panel>
        <Panel title="Create Raid" icon={<Plus />}>
          <form className="stack" onSubmit={createRaid}>
            <label>Raid title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required /></label>
            <label>Raid type<select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as Raid["type"] })}>
              <option value="mini_pair">Mini pair</option>
              <option value="standard">Standard</option>
              <option value="deployment">Deployment</option>
              <option value="extended_capstone">Extended capstone</option>
            </select></label>
            <label>Group size<input type="number" min="2" max="10" value={draft.groupSize} onChange={(event) => setDraft({ ...draft, groupSize: Number(event.target.value) })} /></label>
            <label>Assigned auditor<input value={draft.auditor} onChange={(event) => setDraft({ ...draft, auditor: event.target.value })} /></label>
            <label>Start date<input type="date" value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} /></label>
            <button className="primary-action" type="submit"><Flag size={17} /> Create raid and groups</button>
          </form>
        </Panel>
      </section>
    </>
  );
}

function AuditPage({ audits, onChange, raids }: { audits: AuditSession[]; onChange: (next: AuditSession[]) => void; raids: Raid[] }) {
  function updateAudit(id: string, patch: Partial<AuditSession>) {
    onChange(audits.map((audit) => (audit.id === id ? { ...audit, ...patch, status: patch.meetingLink ? "scheduled" : audit.status } : audit)));
  }

  const raidGroups = useMemo(() => raids.flatMap((raid) => raid.groups.map((group, index) => ({ raid: raid.title, group: `Group ${index + 1}`, members: group }))), [raids]);

  return (
    <>
      <PageHeader title="Audit" subtitle="Schedule raid conferences, manage group membership, attach meeting links, and record audit outcomes." icon={<ClipboardCheck />} />
      <section className="split-grid wide-left">
        <Panel title="Assigned Audit Sessions" icon={<ClipboardCheck />}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Audit</th>
                  <th>Schedule</th>
                  <th>Meeting</th>
                  <th>Status</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <tr key={audit.id}>
                    <td><strong>{audit.raid}</strong><small>{audit.group} · {audit.auditor}</small></td>
                    <td>
                      <input type="date" value={audit.date} onChange={(event) => updateAudit(audit.id, { date: event.target.value })} />
                      <input type="time" value={audit.time} onChange={(event) => updateAudit(audit.id, { time: event.target.value })} />
                    </td>
                    <td><input value={audit.meetingLink} onChange={(event) => updateAudit(audit.id, { meetingLink: event.target.value })} placeholder="Google Meet link" /></td>
                    <td><StatusPill value={audit.status} /></td>
                    <td className="action-cell">
                      <button onClick={() => updateAudit(audit.id, { status: "passed" })}>Pass</button>
                      <button className="danger" onClick={() => updateAudit(audit.id, { status: "failed" })}>Fail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Group Control" icon={<Users />}>
          <div className="group-stack">
            {raidGroups.map((item) => (
              <div className="group-card" key={`${item.raid}-${item.group}`}>
                <strong>{item.group}</strong>
                <small>{item.raid}</small>
                {item.members.map((member) => <span key={member}>{member}<button title="Remove member"><XCircle size={13} /></button></span>)}
                <button><Plus size={14} /> Add member</button>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </>
  );
}

function DocumentsPage({ candidates }: { candidates: Candidate[] }) {
  return (
    <>
      <PageHeader title="Documents" subtitle="Review registration documents, onboarding documents, CYS forms, logbooks, and physical signature status." icon={<FileCheck2 />} />
      <Panel title="Review Queue" icon={<FileCheck2 />}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Applicant</th><th>Registration docs</th><th>Onboarding docs</th><th>Campus</th><th>Controls</th></tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td><strong>{candidate.name}</strong><small>{candidate.institution}</small></td>
                  <td><StatusPill value={candidate.documents} /></td>
                  <td><StatusPill value={candidate.status === "onboarding" ? "pending" : candidate.status === "accepted" ? "approved" : "not_started"} /></td>
                  <td>{candidate.campus}</td>
                  <td className="action-cell"><button>Approve</button><button>Needs reupload</button><button className="danger">Reject</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function ControlPage({ title, icon, kind }: { title: string; icon: ReactNode; kind: string }) {
  const content: Record<string, string[]> = {
    cohorts: ["Open and close application cohorts", "Set game cutoff score, max applicants, and purge policy", "Create learning cohorts for accepted candidates"],
    "selection-game": ["Schedule game windows", "Edit duration and scoring configuration", "View attempts and recalculate pass/fail"],
    campuses: ["CRUD physical campuses", "Manage signing contact and capacity", "Set campus-level configuration overrides"],
    configuration: ["Cascading settings by organization, campus, program, and cohort", "Notification template editor", "Group, XP, audit, quest, and dashboard rules"],
    gamification: ["XP ledger and manual adjustment", "Leaderboard scopes", "Achievement and streak settings"],
    records: ["Create observations, notices, away, restrictions, blocks, and expulsions", "Schedule effects and dashboard notices", "End reversible records"],
    logbooks: ["Review entries and weekly reports", "Mark campus admin signatures", "Track SIWES documentation compliance"],
    "system-logs": ["Read-only admin action trail", "Filter by actor, target, action, timestamp, and IP", "Inspect before/after details"]
  };

  return (
    <>
      <PageHeader title={title} subtitle="Control surface planned from the system design and wiki." icon={icon} />
      <section className="split-grid">
        <Panel title={`${title} Controls`} icon={icon}>
          <FeatureList items={content[kind] || []} />
        </Panel>
        <Panel title="Backend Entities" icon={<Code2 />}>
          <EntityHints kind={kind} />
        </Panel>
      </section>
    </>
  );
}

function EntityHints({ kind }: { kind: string }) {
  const hints: Record<string, string> = {
    cohorts: "ApplicationCohort, Cohort, Enrollment, Application",
    "selection-game": "SelectionGame, GameAttempt, ApplicationCohort",
    campuses: "Campus, StudentProfile, Application, ConfigurationSetting",
    configuration: "ConfigurationSetting, NotificationTemplate, AuditLog",
    gamification: "XPTransaction, Leaderboard, Achievement, UserAchievement, Streak",
    records: "Record, RecordEffect, User, Enrollment",
    logbooks: "Logbook, LogbookEntry, WeeklyReport, OnboardingDocument",
    "system-logs": "AuditLog"
  };
  return <p className="entity-hint">{hints[kind]}</p>;
}

function MetricCard({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: number; detail: string; tone: string }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="panel">
      <header className="panel-header">
        <span>{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Toolbar({ children }: { children: ReactNode }) {
  return <div className="toolbar">{children}</div>;
}

function StatusPill({ value }: { value: string }) {
  const tone = statusTone[value] || "neutral";
  return <span className={`status-pill ${tone}`}>{value.replace(/_/g, " ")}</span>;
}

function ActionList({ items }: { items: [string, string, string][] }) {
  return (
    <div className="action-list">
      {items.map(([title, detail, to]) => (
        <Link key={title} to={to}>
          <span>
            <strong>{title}</strong>
            <small>{detail}</small>
          </span>
          <ChevronRight size={17} />
        </Link>
      ))}
    </div>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="feature-list">
      {items.map((item) => (
        <li key={item}><CheckCircle2 size={16} /> {item}</li>
      ))}
    </ul>
  );
}

function createGroups(members: string[], size: number) {
  const ordered = [...members].sort((a, b) => a.localeCompare(b));
  const groups: string[][] = [];
  for (let index = 0; index < ordered.length; index += size) {
    groups.push(ordered.slice(index, index + size));
  }
  return groups;
}

export default App;
