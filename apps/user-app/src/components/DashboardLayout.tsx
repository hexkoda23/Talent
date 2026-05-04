import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
          <div className="rounded-sm glass-panel p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-warning" />
              <span className="text-xs font-semibold">7-day streak</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Keep it going to earn the Phoenix badge.</p>
          </div>
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
            <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search quests, repos, students…"
                  className="w-full h-10 rounded-sm bg-muted border border-border pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex-1 md:hidden" />
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 h-10 rounded-sm bg-muted border border-border">
                <Sparkles className="h-4 w-4 text-secondary" />
                <span className="font-mono text-sm font-semibold">2,480</span>
                <span className="text-xs text-muted-foreground">XP</span>
              </div>
              <div className="hidden md:flex items-center gap-1.5 px-3 h-10 rounded-sm bg-muted border border-border">
                <Crown className="h-4 w-4 text-warning" />
                <span className="font-mono text-sm font-semibold">#13</span>
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
              </Button>
              <div className="h-9 w-9 rounded-full bg-muted border border-border grid place-items-center text-sm font-semibold text-foreground">
                AO
              </div>
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
