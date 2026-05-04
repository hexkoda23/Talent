import {
  Bell,
  CheckCircle2,
  Clock,
  MessageSquare,
  Trophy,
  AlertCircle,
  PlayCircle,
  Flame,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  {
    title: "Complete your learning to unlock today's quest",
    body: "You're 65% through the Learn phase. Quest closes at 11:59 PM.",
    time: "now",
    unread: true,
    icon: PlayCircle,
    tone: "primary",
  },
  {
    title: "Checkpoint readiness: 72%",
    body: "You need ≥ 80% weekly completion to sit Saturday's exam. 3 quests to go.",
    time: "1h ago",
    unread: true,
    icon: Trophy,
    tone: "violet",
  },
  {
    title: "Raid team assigned · Team #07",
    body: "You've been auto-grouped with Tunde and Kemi. Submit by Sunday 11:59 PM.",
    time: "3h ago",
    unread: true,
    icon: Users,
    tone: "warning",
  },
  {
    title: "Quest approved · +180 XP",
    body: "Your sentiment classifier API submission was approved.",
    time: "yesterday",
    unread: false,
    icon: CheckCircle2,
    tone: "accent",
  },
  {
    title: "Missed quest yesterday",
    body: "‘LangChain mini RAG demo’ closed at 11:59 PM. 0 XP earned. Streak reset to 0.",
    time: "yesterday",
    unread: false,
    icon: AlertCircle,
    tone: "destructive",
  },
  {
    title: "7-day streak unlocked",
    body: "You're on fire. Keep it going to earn the Phoenix badge.",
    time: "2d ago",
    unread: false,
    icon: Flame,
    tone: "warning",
  },
  {
    title: "Message from Talent Nation",
    body: "Cohort 03 town hall this Saturday at 4pm WAT.",
    time: "3d ago",
    unread: false,
    icon: MessageSquare,
    tone: "primary",
  },
];

const tones: Record<string, string> = {
  accent: "bg-accent/15 text-accent",
  warning: "bg-warning/15 text-warning",
  primary: "bg-primary/15 text-primary",
  violet: "bg-secondary/15 text-secondary",
  destructive: "bg-destructive/15 text-destructive",
};

const Notifications = () => {
  const unread = items.filter((i) => i.unread).length;
  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-2">
            // alerts
          </p>
          <h1 className="font-display text-2xl lg:text-4xl font-bold flex items-center gap-3 flex-wrap">
            Notifications
            <span className="text-sm font-sans font-normal text-muted-foreground">
              {unread} unread
            </span>
          </h1>
        </div>
        <Button variant="soft" size="sm">
          Mark all read
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((n, i) => (
          <div
            key={i}
            className={cn(
              "glass-panel rounded-xl p-4 flex gap-3 lg:gap-4 hover:border-primary/40 transition-colors",
              n.unread && "border-primary/30"
            )}
          >
            <div
              className={cn(
                "h-10 w-10 rounded-lg grid place-items-center flex-shrink-0",
                tones[n.tone]
              )}
            >
              <n.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3 mb-0.5">
                <p className="font-semibold text-sm">{n.title}</p>
                <span className="text-[11px] text-muted-foreground flex-shrink-0 font-mono">
                  {n.time}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{n.body}</p>
            </div>
            {n.unread && (
              <span className="h-2 w-2 rounded-full bg-primary self-center flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
