import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Brain, Grid3X3, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { selectionGameApi } from "@/api/endpoints";
import { toErrorMessage } from "@/api/client";
import type { CompleteAttemptResponse, LatestAttemptResponse } from "@/api/types";

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const stateResponse = location.state as CompleteAttemptResponse | null;
  const [latest, setLatest] = useState<LatestAttemptResponse | CompleteAttemptResponse | null>(stateResponse);
  const [error, setError] = useState("");

  useEffect(() => {
    if (stateResponse) return;
    selectionGameApi.latestAttempt()
      .then((response) => setLatest(response))
      .catch((err) => setError(toErrorMessage(err)));
  }, [stateResponse]);

  const attempt = latest && "attempt" in latest ? latest.attempt : null;
  const application = latest?.application;
  const total = attempt?.score ?? 0;
  const qualified = Boolean(attempt?.passed ?? application?.passed_game);
  const nextRoute = latest && "next_route_hint" in latest
    ? routeFromHint(latest.next_route_hint)
    : routeFromApplication(application?.dashboard_state, application?.status);

  return (
    <div className="min-h-screen flex flex-col bg-background font-mono">
      <header className="px-5 lg:px-10 py-5 flex items-center justify-between border-b border-border">
        <Logo />
      </header>
      <main className="flex-1 px-5 py-10 lg:py-16 max-w-3xl w-full mx-auto">
        <div className="animate-fade-up">
          <p className="text-sm text-primary mb-3">// assessment complete</p>
          <h1 className="text-5xl lg:text-7xl leading-none mb-4">Game result</h1>
          <p className="text-muted-foreground">Your score is stored by the backend and attached to your application.</p>
        </div>

        <section className="glass-panel p-8 mt-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Overall score</p>
          <div className="text-7xl text-foreground mb-1">{total}</div>
          <p className="text-sm text-muted-foreground">out of 100</p>

          <div className="grid sm:grid-cols-2 gap-3 mt-8">
            <Score icon={Brain} label="Application status" value={application?.status || "pending"} />
            <Score icon={Grid3X3} label="Dashboard state" value={application?.dashboard_state || "pending"} />
          </div>

          <div className={`mt-8 inline-flex items-center gap-2 px-4 py-2 border text-sm ${qualified ? "bg-primary/10 text-primary border-primary/40" : "bg-warning/10 text-warning border-warning/40"}`}>
            <Trophy className="h-4 w-4" />
            {qualified ? "Game passed" : "Awaiting backend decision"}
          </div>
          <p className="text-xs text-muted-foreground mt-3 max-w-sm">
            The frontend no longer hardcodes a pass mark. The backend response decides the status and next route.
          </p>
        </section>

        <div className="mt-8">
          {error && <p className="mb-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <Button variant="hero" size="xl" className="gap-2" onClick={() => navigate(nextRoute)}>
            Continue <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </main>
    </div>
  );
};

const Score = ({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) => (
  <div className="bg-muted border border-border p-4">
    <Icon className="h-4 w-4 text-muted-foreground mb-2" />
    <div className="text-xl break-words">{value}</div>
    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
  </div>
);

const routeFromHint = (hint?: string) => {
  if (hint === "onboarding") return "/onboarding";
  if (hint === "dashboard") return "/dashboard";
  return "/status";
};

const routeFromApplication = (dashboardState?: string, status?: string) => {
  if (dashboardState === "onboarding_form" || status === "onboarding") return "/onboarding";
  if (dashboardState === "full_learning" || status === "accepted") return "/dashboard";
  return "/status";
};

export default Result;
