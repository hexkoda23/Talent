import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lmsApi } from "@/api/endpoints";
import { toErrorMessage } from "@/api/client";

const AuditSubmit = () => {
  const { auditId = "" } = useParams<{ auditId: string }>();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auditId) return;
    let cancelled = false;
    lmsApi.launch(`/audit/${auditId}`)
      .then(({ url }) => {
        if (!cancelled) window.location.assign(url);
      })
      .catch((err) => {
        if (!cancelled) setError(toErrorMessage(err));
      });

    return () => {
      cancelled = true;
    };
  }, [auditId]);

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl">
      <Link to="/dashboard/audits" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to audits
      </Link>
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">// audit workspace</p>
        <h1 className="font-display text-2xl lg:text-3xl font-bold">Opening Audit</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Redirecting to the live audit workspace for {auditId}.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-muted border border-border grid place-items-center">
            <Send className="h-5 w-5 text-accent" />
          </div>
          <p className="text-sm text-muted-foreground">{error || "Redirecting..."}</p>
        </div>
        {error ? (
          <Button variant="hero" onClick={() => window.location.reload()}>Retry</Button>
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        )}
      </div>
    </div>
  );
};

export default AuditSubmit;
