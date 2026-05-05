import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Clock } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { selectionGameApi, publicApi } from "@/api/endpoints";
import { toErrorMessage } from "@/api/client";
import type { SelectionGame } from "@/api/types";

const pad = (n: number) => String(n).padStart(2, "0");

const Breakdown = ({ seconds }: { seconds: number }) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return (
    <div className="text-center">
      <div className="text-6xl font-mono">{days > 0 ? `${days}d` : ""} {pad(hours)}:{pad(minutes)}:{pad(secs)}</div>
    </div>
  );
};

const Countdown = () => {
  const navigate = useNavigate();
  const [target, setTarget] = useState<number | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const location = useLocation();
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const resp = await selectionGameApi.current();
        const sg: SelectionGame | undefined = resp.selection_game as SelectionGame | undefined;
        if (mounted && sg && sg.scheduled_at) {
          setTarget(new Date(sg.scheduled_at).getTime());
          setLabel(sg.name || "Selection game");
          return;
        }

        // fallback to cohort open date
        const cohort = await publicApi.activeCohort();
        const opens = cohort.application_cohort?.opens_at;
        if (opens) {
          setTarget(new Date(opens).getTime());
          setLabel(cohort.application_cohort.name || "Cohort open");
          return;
        }

        setError("No scheduled game or cohort open date available.");
      } catch (err) {
        setError(toErrorMessage(err));
      }
    };

    load();

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // enable admin/test bypass via URL ?admin=1 or persisted localStorage flag
    try {
      const params = new URLSearchParams(location.search);
      const fromUrl = params.get("admin") === "1";
      const persisted = typeof window !== "undefined" && window.localStorage.getItem("talentNationAdmin") === "1";
      setAdminMode(Boolean(fromUrl || persisted));
    } catch (e) {
      // ignore
    }
  }, [location.search]);

  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const now = Date.now();
      if (now >= target) {
        navigate("/assessment", { replace: true });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target, navigate]);

  const [nowSeconds, setNowSeconds] = useState(0);
  useEffect(() => {
    if (!target) return;
    const update = () => setNowSeconds(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="min-h-screen flex flex-col bg-background font-mono">
      <header className="px-5 lg:px-10 py-5 flex items-center justify-between border-b border-border">
        <Logo />
      </header>

      <main className="flex-1 px-5 py-12 max-w-2xl w-full mx-auto grid place-items-center">
        <section className="glass-panel p-6 lg:p-8 w-full animate-fade-up text-center">
          <p className="text-sm text-primary mb-3">// game countdown</p>
          <h1 className="text-4xl lg:text-5xl mb-2">{label || "Upcoming"}</h1>
          {error ? (
            <p className="text-sm text-destructive mt-4">{error}</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">The game will open at the scheduled time below. You will be able to play once the countdown reaches zero.</p>
              {target ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-3 text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    <div>{new Date(target).toLocaleString()}</div>
                  </div>
                  <Breakdown seconds={nowSeconds} />
                  <div className="flex items-center justify-center gap-3 flex-col">
                    <div className="flex gap-3">
                      {adminMode ? (
                        <Button variant="destructive" onClick={() => navigate("/assessment/play", { replace: true })}>Start now</Button>
                      ) : (
                        <Button variant="secondary" onClick={() => {
                          try {
                            window.localStorage.setItem("talentNationAdmin", "1");
                            setAdminMode(true);
                          } catch (e) {}
                        }}>Enable admin bypass</Button>
                      )}
                    </div>
                    {!adminMode && <p className="text-xs text-muted-foreground">Enable the admin bypass to start immediately (for admins/testing).</p>}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading schedule…</p>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default Countdown;
