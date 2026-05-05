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
  const qualified = total >= 70;

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

          <div className={`mt-8 p-4 border ${qualified ? "bg-primary/10 border-primary/40 text-primary" : "bg-warning/10 border-warning/40 text-warning"}`}>
            <div className="flex items-center gap-2 mb-2 font-bold text-lg">
              <Trophy className="h-5 w-5" />
              {qualified ? "Congratulations you passed, waiting for verification" : "Waiting for verification"}
            </div>
            <p className="text-sm opacity-90">Verification would be sent to your email.</p>
          </div>
        </section>

        <div className="mt-8">
          {error && <p className="mb-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <Button variant="hero" size="xl" className="gap-2" onClick={() => navigate("/dashboard")}>
            Go to Dashboard <ArrowRight className="h-5 w-5" />
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



export default Result;
