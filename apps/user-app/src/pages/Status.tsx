import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { applicationApi } from "@/api/endpoints";
import { toErrorMessage } from "@/api/client";
import type { ApplicationResponse } from "@/api/types";

const Status = () => {
  const [applicationState, setApplicationState] = useState<ApplicationResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    applicationApi.current()
      .then(setApplicationState)
      .catch((err) => setError(toErrorMessage(err)));
  }, []);

  const state = statusToView(applicationState?.application.status);

  const config = {
    accepted: {
      Icon: CheckCircle2,
      tone: "accent",
      title: "You've been accepted",
      sub: "Welcome to Talent Nation. Let's get you set up.",
      body: "We've sent a confirmation to your email. Complete onboarding to enter the program and meet your cohort.",
      cta: { label: "Continue onboarding", to: "/onboarding" },
    },
    review: {
      Icon: Clock,
      tone: "warning",
      title: "Awaiting admin confirmation",
      sub: "Your game score and identity file are now waiting for admin review.",
      body: "Await email from admin. Even after passing the game cut off, a TalentOS admin must verify your photo, school ID, NIN, phone linkage, and duplicate checks before you enter the platform.",
      cta: { label: "Back to home", to: "/" },
    },
    failed: {
      Icon: XCircle,
      tone: "destructive",
      title: "Failed",
      sub: "You did not reach the cut off after three trials.",
      body: "This application did not auto-pass the assessment stage. You can wait for a future cohort or contact Talent Nation if an admin gives further instructions.",
      cta: { label: "Back to home", to: "/" },
    },
    rejected: {
      Icon: XCircle,
      tone: "destructive",
      title: "Not selected this cohort",
      sub: "Don't take it personally. Many strong applicants reapply and get in.",
      body: "Applications open again next quarter. We'll send tips on how to strengthen your application.",
      cta: { label: "Back to home", to: "/" },
    },
  } as const;

  const c = config[state as keyof typeof config] ?? config.accepted;
  const Icon = c.Icon;

  const tones: Record<string, string> = {
    accent: "bg-accent/15 text-accent border-accent/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    destructive: "bg-destructive/15 text-destructive border-destructive/30",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 lg:px-10 py-5 flex items-center justify-between border-b border-border">
        <Logo />
      </header>
      <div className="flex-1 grid place-items-center px-5 py-12">
        <div className="max-w-lg w-full text-center animate-fade-up">
          <div className={`inline-flex h-20 w-20 rounded-full grid place-items-center border-2 mb-6 ${tones[c.tone]}`}>
            <Icon className="h-10 w-10" />
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold mb-3">{c.title}</h1>
          <p className="text-muted-foreground mb-6">{c.sub}</p>
          <div className="glass-panel rounded-2xl p-6 mb-6 text-left">
            <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Await email from admin</p>
                <p className="text-sm text-muted-foreground mt-1">{c.body}</p>
                {applicationState?.application.game_score != null && (
                  <p className="text-sm text-muted-foreground mt-3">Game score: {applicationState.application.game_score}</p>
                )}
                {applicationState?.verification_request && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Verification: {applicationState.verification_request.status}
                  </p>
                )}
                {error && <p className="text-sm text-destructive mt-3">{error}</p>}
              </div>
            </div>
          </div>
          <Link to={applicationState?.next_action?.route || c.cta.to}>
            <Button variant="hero" size="lg" className="gap-2">
              {applicationState?.next_action?.label || c.cta.label} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

const statusToView = (status?: string) => {
  if (status === "accepted" || status === "onboarding" || status === "verified") return "accepted";
  if (status === "rejected") return "rejected";
  if (status === "game_completed" || status === "review" || status === "verification_pending" || status === "registered" || status === "game_pending") return "review";
  return "review";
};

export default Status;
