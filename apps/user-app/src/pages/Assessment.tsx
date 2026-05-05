import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Brain, Clock, Grid3X3, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { formatGameTime, getGameSettings } from "@/lib/gameSettings";
import { selectionGameApi } from "@/api/endpoints";
import { toErrorMessage } from "@/api/client";
import type { SelectionGame } from "@/api/types";

const getGames = () => {
  const settings = getGameSettings();
  return [
    { id: "memory", name: "Game #1 - Memory", desc: "Four-by-four sequence recall with faster flashes and limited mistakes.", icon: Brain, time: formatGameTime(settings.memorySeconds) },
    { id: "zzle", name: "Game #2 - Zzle", desc: "Trace difficult hidden grid paths through decoys, tools, and three levels.", icon: Grid3X3, time: formatGameTime(settings.zzleSeconds) },
  ];
};

const Assessment = () => {
  const games = getGames();
  const [selectionGame, setSelectionGame] = useState<SelectionGame | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    selectionGameApi.current()
      .then((response) => {
        const sg = response.selection_game;
        setSelectionGame(sg);
        try {
          // If the game is upcoming or has a scheduled_at in the future, send user to countdown
          if (sg) {
            const now = Date.now();
            const scheduled = sg.scheduled_at ? new Date(sg.scheduled_at).getTime() : null;
            if (sg.status === "upcoming" || (scheduled && scheduled > now)) {
              navigate("/countdown", { replace: true });
              return;
            }
          }
        } catch (e) {
          // ignore navigation errors
        }
      })
      .catch((err) => setError(toErrorMessage(err)));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background font-mono">
    <header className="px-5 lg:px-10 py-5 flex items-center justify-between border-b border-border">
      <div className="flex items-center gap-3">
        <Logo />
        <Link to="/register" className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground">
          &lt;- Back to intra
        </Link>
      </div>
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Save and exit</Link>
    </header>

    <main className="flex-1 px-5 py-10 lg:py-16 max-w-6xl w-full mx-auto">
      <div className="mb-16 animate-fade-up">
        <h1 className="text-5xl lg:text-7xl leading-none">Games trail</h1>
      </div>

      <div className="relative pl-10 lg:pl-12">
        <div className="absolute left-2 top-3 bottom-0 w-px bg-border" />
        <div className="absolute left-0 top-2 h-5 w-5 rounded-full border-2 border-primary bg-background" />

        <section className="mb-16">
          <h2 className="text-2xl text-muted-foreground mb-10">Instructions</h2>
          <p className="max-w-none text-sm lg:text-base leading-7 text-foreground">
            The assessment confirms the abilities needed for AI engineering. Talent Nation opens the
            game according to the backend schedule and records every attempt against your application.
          </p>
          {selectionGame && (
            <p className="mt-4 text-sm text-muted-foreground">
              {selectionGame.name || "Selection game"} - {selectionGame.status}
              {selectionGame.scheduled_at ? ` - starts ${new Date(selectionGame.scheduled_at).toLocaleString()}` : ""}
            </p>
          )}
          {error && <p className="mt-4 border border-warning/40 bg-warning/10 p-3 text-sm text-warning">{error}</p>}
        </section>

        <div className="absolute left-0 top-52 h-3 w-3 rounded-full bg-foreground" />
        <section>
          <h2 className="text-2xl text-muted-foreground mb-8">Games</h2>
          <div className="space-y-0">
            {games.map((game) => (
              <article key={game.id} className="border-b border-border py-8 grid md:grid-cols-[1fr,auto] gap-5 items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <game.icon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg text-foreground">{game.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 max-w-2xl">{game.desc}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                    <Clock className="h-4 w-4" />
                    {game.time}
                  </div>
                </div>
                <Button variant="hero" size="lg" asChild>
                  <Link to="/assessment/play">-&gt; Start</Link>
                </Button>
              </article>
            ))}
          </div>
        </section>
      </div>

     

      <div className="mt-6 flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        Game qualification is private and reviewed with your identity file.
      </div>
    </main>
    </div>
  );
};

export default Assessment;
