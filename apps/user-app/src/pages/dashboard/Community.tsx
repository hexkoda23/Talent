import { useState } from "react";
import { AtSign, Bell, Hash, MessageSquare, Paperclip, Pin, Plus, Search, Send, Smile, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const channels = [
  { id: "general", name: "general", topic: "Global feed for everyone" },
  { id: "announcements", name: "announcements", topic: "Admin-controlled information", locked: true },
  { id: "raid", name: "weekly-raid-group", topic: "Your raid group for this week" },
];

const dms = ["Ibrahim Musa", "Chinwe Eze", "Tunde Adeyemi"];

const seedMessages = [
  { user: "Admin", role: "admin", time: "09:00", text: "Welcome to the general feed. Keep updates clear and respectful." },
  { user: "Ibrahim Musa", role: "mentor", time: "10:14", text: "New quest brief is live. Read the acceptance criteria before coding." },
  { user: "Adaeze Okafor", role: "student", time: "10:30", text: "I just finished the embeddings module and I am moving into the quest." },
];

const Community = () => {
  const [active, setActive] = useState("general");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(seedMessages);
  const channel = channels.find((c) => c.id === active)!;

  const send = () => {
    if (!draft.trim() || channel.locked) return;
    setMessages((m) => [...m, { user: "Adaeze Okafor", role: "student", time: "now", text: draft }]);
    setDraft("");
  };

  return (
    <div className="animate-fade-up h-[calc(100vh-9rem)] flex rounded-2xl overflow-hidden glass-panel">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-background/40">
        <div className="p-4 border-b border-border">
          <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-1">// community</p>
          <h2 className="font-display font-bold">Talent Nation Feed</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <p className="px-2 py-1 text-[11px] font-mono uppercase text-muted-foreground tracking-wider">Feeds</p>
          {channels.map((c) => (
            <button key={c.id} onClick={() => setActive(c.id)} className={cn("w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors", active === c.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
              {c.locked ? <Bell className="h-4 w-4" /> : c.id === "raid" ? <Users className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
              {c.name}
            </button>
          ))}
          <p className="mt-4 px-2 py-1 text-[11px] font-mono uppercase text-muted-foreground tracking-wider">Direct messages</p>
          {dms.map((n) => (
            <button key={n} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground">
              <MessageSquare className="h-4 w-4" />
              <span className="truncate">{n}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 lg:px-6 py-3 border-b border-border flex items-center justify-between gap-3 bg-background/30">
          <div className="flex items-center gap-2 min-w-0">
            {channel.locked ? <Bell className="h-5 w-5 text-muted-foreground" /> : <Hash className="h-5 w-5 text-muted-foreground" />}
            <h3 className="font-display font-bold truncate">{channel.name}</h3>
            <span className="hidden sm:inline text-xs text-muted-foreground border-l border-border pl-3 ml-1 truncate">{channel.topic}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon"><Pin className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><AtSign className="h-4 w-4" /></Button>
            <div className="relative hidden lg:block ml-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input className="h-8 w-44 rounded-md bg-muted border border-border pl-7 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Search messages" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {messages.map((m, i) => <Message key={i} {...m} isMe={m.user === "Adaeze Okafor"} />)}
        </div>

        <div className="p-3 lg:p-4 border-t border-border bg-background/30">
          <div className="flex items-center gap-2 rounded-xl bg-muted border border-border px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
            <Button variant="ghost" size="icon" className="h-7 w-7"><Plus className="h-4 w-4" /></Button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={channel.locked}
              placeholder={channel.locked ? "Announcements are admin-only" : `Message #${channel.name}`}
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7"><Paperclip className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7"><Smile className="h-4 w-4" /></Button>
            <Button variant="hero" size="sm" onClick={send} disabled={channel.locked} className="gap-1"><Send className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Message = ({ user, role, time, text, isMe }: any) => (
  <div className="flex gap-3 group">
    <div className="h-9 w-9 rounded-full bg-gradient-primary grid place-items-center text-xs font-semibold text-primary-foreground flex-shrink-0">
      {user.split(" ").map((s: string) => s[0]).join("")}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline gap-2">
        <span className={cn("font-semibold text-sm", isMe && "text-primary")}>{user}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{role}</span>
        <span className="text-[11px] text-muted-foreground">{time}</span>
      </div>
      <p className="text-sm text-foreground/90 mt-0.5 break-words">{text}</p>
    </div>
  </div>
);

export default Community;
