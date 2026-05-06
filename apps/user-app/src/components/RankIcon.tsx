import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const TIER_TONES: Record<number, string> = {
  1: "text-muted-foreground bg-muted/60 border-border",
  2: "text-secondary bg-secondary/15 border-secondary/30",
  3: "text-primary bg-primary/15 border-primary/30",
  4: "text-accent bg-accent/15 border-accent/30",
  5: "text-warning bg-warning/15 border-warning/30",
  6: "text-warning bg-warning/20 border-warning/40",
  7: "text-destructive bg-destructive/15 border-destructive/30",
  8: "text-destructive bg-destructive/20 border-destructive/40",
};

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, { box: string; icon: string; text: string }> = {
  sm: { box: "h-7 px-2 gap-1",    icon: "h-3.5 w-3.5", text: "text-[11px]" },
  md: { box: "h-9 px-2.5 gap-1.5", icon: "h-4 w-4",     text: "text-xs"     },
  lg: { box: "h-10 px-3 gap-2",    icon: "h-4 w-4",     text: "text-sm"     },
};

export const RankIcon = ({
  level,
  name,
  size = "md",
  showName = true,
  className,
}: {
  level: number;
  name?: string;
  size?: Size;
  showName?: boolean;
  className?: string;
}) => {
  const tone = TIER_TONES[level] ?? TIER_TONES[1];
  const s = sizes[size];
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-sm border font-mono font-semibold",
        tone,
        s.box,
        s.text,
        className,
      )}
      aria-label={`Rank level ${level}${name ? `, ${name}` : ""}`}
    >
      <Shield className={s.icon} />
      <span>L{level}</span>
      {showName && name && <span className="opacity-80">· {name}</span>}
    </div>
  );
};
