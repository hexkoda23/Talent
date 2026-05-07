import { useEffect, useState } from "react";
import { GitBranch, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lmsApi } from "@/api/endpoints";
import { toErrorMessage } from "@/api/client";

const Quests = () => {
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    lmsApi.launch("/quests")
      .then(({ url }) => {
        if (!cancelled) window.location.assign(url);
      })
      .catch((err) => {
        if (!cancelled) setError(toErrorMessage(err));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-2">// quest launcher</p>
        <h1 className="font-display text-2xl lg:text-4xl font-bold">Quests</h1>
        <p className="text-muted-foreground mt-2">
          Opening your Gitea-backed quest workspace with your TalentNation session.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-muted border border-border grid place-items-center">
            <GitBranch className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h2 className="font-display font-semibold">Quest service</h2>
            <p className="text-sm text-muted-foreground">{error || "Redirecting..."}</p>
          </div>
        </div>
        {error ? (
          <Button variant="hero" onClick={() => window.location.reload()}>Retry</Button>
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-secondary" />
        )}
      </div>
    </div>
  );
};

export default Quests;
