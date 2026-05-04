import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  to?: string;
}

const sizes = {
  sm: { text: "text-sm" },
  md: { text: "text-base" },
  lg: { text: "text-xl" },
};

export const Logo = ({ className, size = "md", withText = true, to = "/" }: LogoProps) => {
  const s = sizes[size];
  const content = (
    <div className={cn("flex items-center font-mono", className)}>
      {withText && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-normal tracking-[0.04em]", s.text)}>Talent Nation</span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Cognitive Games
          </span>
        </div>
      )}
    </div>
  );

  return to ? <Link to={to} className="inline-flex">{content}</Link> : content;
};
