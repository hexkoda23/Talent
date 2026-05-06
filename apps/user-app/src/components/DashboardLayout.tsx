import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Trophy,
  ClipboardCheck,
  Code2,
  BookOpen,
  GraduationCap,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Search,
  Flame,
  Sparkles,
  Map,
  Crown,
  MessagesSquare,
  Award,
  TrendingUp,
} from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { RankIcon } from "./RankIcon";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/learn", label: "Learn", icon: GraduationCap },
  { to: "/dashboard/quests", label: "Quest", icon: Trophy },
  { to: "/dashboard/raid", label: "Raid", icon: Flame },
  { to: "/dashboard/audits", label: "Audits", icon: ClipboardCheck },
  { to: "/dashboard/checkpoints", label: "Checkpoints", icon: Map },
  { to: "/dashboard/leaderboard", label: "Leaderboard", icon: Crown },
  { to: "/dashboard/workspace", label: "Workspace", icon: Code2 },
  { to: "/dashboard/community", label: "Community", icon: MessagesSquare },
  { to: "/dashboard/logbook", label: "Logbook", icon: BookOpen },
  { to: "/dashboard/achievements", label: "Achievements", icon: Award },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/profile", label: "Profile", icon: User },
];

export const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const summary = useDashboardSummary();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex w-full bg-background font-mono">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-sidebar-border bg-sidebar sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Logo />
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <NavLink to="/" className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-4 w-4" />
            Sign out
          </NavLink>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-sidebar-border p-4 animate-fade-up">
            <div className="flex items-center justify-between mb-6">
              <Logo />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="space-y-1">
              {nav.map((item) => <SidebarLink key={item.to} {...item} />)}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-border bg-background">
          <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="lg:hidden">
              <Logo withText={false} />
            </div>
            <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search quests, repos, students..."
                  className="w-full h-10 rounded-sm bg-muted border border-border pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="hidden xl:flex items-center gap-2">
              <MetricChip
                icon={Sparkles}
                tone="primary"
                label="XP"
                value={summary.xp.toLocaleString()}
              />
              <RankIcon level={summary.rankLevel} name={summary.rankName} size="md" />
              <MetricChip
                icon={Flame}
                tone="warning"
                label="Streak"
                value={`${summary.streakDays}d`}
              />
              <MetricChip
                icon={TrendingUp}
                tone="violet"
                label="Done"
                value={`${summary.programProgressPct}%`}
              />
            </div>

            <div className="flex-1 xl:hidden" />

            <div className="flex items-center gap-1.5">
              <div className="xl:hidden flex items-center">
                <RankIcon level={summary.rankLevel} size="sm" showName={false} />
              </div>
              <Link
                to="/dashboard/notifications"
                aria-label="Notifications"
                className="relative h-9 w-9 grid place-items-center rounded-sm hover:bg-muted transition-colors"
              >
                <Bell className="h-5 w-5" />
                {summary.unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                )}
              </Link>
              <Link
                to="/dashboard/profile"
                aria-label="Profile"
                className="h-9 w-9 rounded-full bg-muted border border-border grid place-items-center text-sm font-semibold text-foreground hover:border-primary/40 transition-colors"
              >
                {summary.initials}
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const MetricChip = ({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: any;
  tone: "primary" | "warning" | "violet";
  label: string;
  value: string;
}) => {
  const tones: Record<string, string> = {
    primary: "text-primary",
    warning: "text-warning",
    violet: "text-secondary",
  };
  return (
    <div className="flex items-center gap-1.5 px-2.5 h-9 rounded-sm bg-muted border border-border">
      <Icon className={cn("h-4 w-4", tones[tone])} />
      <span className="font-mono text-sm font-semibold">{value}</span>
      <span className="text-[11px] text-muted-foreground uppercase">{label}</span>
    </div>
  );
};

const SidebarLink = ({ to, label, icon: Icon }: { to: string; label: string; icon: any }) => (
  <NavLink
    to={to}
    end={to === "/dashboard"}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-normal transition-all",
        isActive
          ? "bg-muted text-primary border border-primary/60"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
      )
    }
  >
    <Icon className="h-4 w-4" />
    {label}
  </NavLink>
);
