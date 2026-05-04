import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  ShieldAlert,
  Code2,
  BookOpen,
  ScrollText,
  UserCog,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  Activity,
  Gamepad2,
} from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin", label: "Command Center", icon: LayoutDashboard },
  { to: "/admin/applications", label: "Entry Gate", icon: ClipboardCheck },
  { to: "/admin/students", label: "User Intel", icon: Users },
  { to: "/admin/curriculum", label: "Curriculum Studio", icon: BookOpen },
  { to: "/admin/game-control", label: "Game Control", icon: Gamepad2 },
  { to: "/admin/code", label: "Activity Monitor", icon: Code2 },
  { to: "/admin/moderation", label: "Enforcement", icon: ShieldAlert },
  { to: "/admin/audit", label: "Audit Trail", icon: ScrollText },
  { to: "/admin/roles", label: "Roles", icon: UserCog },
];

export const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen flex w-full bg-background font-mono">
      <aside className="hidden lg:flex w-72 flex-col border-r border-sidebar-border bg-sidebar sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <Logo />
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/30">
              ADMIN
            </span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => <SidebarLink key={item.to} {...item} />)}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="rounded-sm glass-panel p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold">System healthy</span>
            </div>
            <p className="text-[11px] text-muted-foreground">All services operational • 99.98% uptime</p>
          </div>
          <NavLink to="/" className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-4 w-4" />
            Sign out
          </NavLink>
        </div>
      </aside>

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
            <nav className="space-y-1">{nav.map((item) => <SidebarLink key={item.to} {...item} />)}</nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 border-b border-border bg-background">
          <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="lg:hidden"><Logo withText={false} /></div>
            <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search students, repos, applications…"
                  className="w-full h-10 rounded-sm bg-muted border border-border pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex-1 md:hidden" />
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 h-10 rounded-sm bg-muted border border-border">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
              </Button>
              <div className="h-9 w-9 rounded-full bg-muted border border-border grid place-items-center text-sm font-semibold text-foreground">
                SA
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1500px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const SidebarLink = ({ to, label, icon: Icon }: { to: string; label: string; icon: any }) => (
  <NavLink
    to={to}
    end={to === "/admin"}
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
