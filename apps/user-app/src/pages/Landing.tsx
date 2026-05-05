import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Code2, Gamepad2, GraduationCap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { publicApi } from "@/api/endpoints";
import type { ActiveCohortResponse } from "@/api/types";

const Landing = () => {
  const registerTarget = "/signup";
  const [activeCohort, setActiveCohort] = useState<ActiveCohortResponse | null>(null);

  useEffect(() => {
    publicApi.activeCohort()
      .then(setActiveCohort)
      .catch(() => setActiveCohort(null));
  }, []);

  const closingCopy = useMemo(() => {
    const closesAt = activeCohort?.application_cohort.closes_at;
    if (!closesAt) return "Applications are tied to the active backend cohort.";
    const days = Math.max(0, Math.ceil((new Date(closesAt).getTime() - Date.now()) / 86_400_000));
    return `Applications close in ${days} day${days === 1 ? "" : "s"}.`;
  }, [activeCohort]);

  return (
    <div className="min-h-screen relative overflow-hidden font-mono landing-pattern-bg">
      <header className="relative z-20 px-5 lg:px-10 py-5 flex items-center justify-between border-b border-border">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#program" className="hover:text-foreground transition-colors">Roadmap</a>
          <a href="#how" className="hover:text-foreground transition-colors">Trail</a>
          <a href="#tracks" className="hover:text-foreground transition-colors">Tracks</a>
        </nav>
        <div className="flex items-center gap-2">
        <Link to="/login?redirect=/register">
          <Button variant="soft" size="sm">Login</Button>
        </Link>
        <Link to={registerTarget}>
          <Button variant="hero" size="sm" className="gap-1.5">
            <Gamepad2 className="h-4 w-4" /> Register for game
          </Button>
        </Link>
        </div>
      </header>

      <main className="relative z-10 px-5 lg:px-10 py-14 lg:py-24 max-w-7xl mx-auto">
        <section className="min-h-[68vh] grid content-center">
          <p className="text-sm text-primary mb-8">
            {activeCohort
              ? `// ${activeCohort.application_cohort.name} - ${activeCohort.application_cohort.status}`
              : "// Online Cognitive Games"}
          </p>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl leading-[1.08] max-w-6xl">
            Talent Nation
          </h1>
          <p className="mt-6 text-2xl sm:text-3xl lg:text-4xl text-secondary">
            Course: AI Engineering SIWES
          </p>
          <p className="mt-8 text-base lg:text-lg text-foreground max-w-3xl leading-8">
            Talent Nation is the learning platform. AI Engineering SIWES is the course
            path for students who want to train, build, and ship practical AI systems.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to={registerTarget}>
              <Button variant="hero" size="xl" className="gap-2">
                <Gamepad2 className="h-5 w-5" /> Register for game
              </Button>
            </Link>
            <Link to="/learn-more">
              <Button variant="soft" size="xl">Learn more</Button>
            </Link>
          </div>
        </section>

        <section id="program" className="py-16 border-t border-border">
          <div className="grid lg:grid-cols-[0.7fr,1.3fr] gap-10">
            <div>
              <p className="text-sm text-primary mb-3">// course roadmap</p>
              <h2 className="text-4xl lg:text-5xl leading-tight">Roadmap of AI Engineering</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Panel icon={GraduationCap} title="Foundations" text="Start with Python, data thinking, model basics, prompts, and the habits of an AI engineer." />
              <Panel icon={Code2} title="Applied AI builds" text="Move into APIs, agents, retrieval workflows, automation, and product-grade AI features." />
              <Panel icon={ShieldCheck} title="Production readiness" text="Learn evaluation, safety checks, deployment, documentation, and reviews before shipping." />
            </div>
          </div>
        </section>

        <section id="tracks" className="py-16 border-t border-border">
          <p className="text-sm text-primary mb-8">// choose your campus track</p>
          <div className="grid md:grid-cols-3 gap-6">
            <Track months="3" label="Standard" />
            <Track months="6" label="Deep dive" />
          </div>
        </section>

        <section id="how" className="py-16 border-t border-border">
          <div className="relative pl-10">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
            <div className="absolute left-0 top-2 h-5 w-5 rounded-full border-2 border-primary bg-background" />
            <h2 className="text-4xl lg:text-5xl mb-10">From registration to dashboard</h2>
            <div className="space-y-8">
              {steps.map((step) => (
                <div key={step.title} className="grid md:grid-cols-[1fr] gap-4 border-b border-border pb-8">
                  <div>
                    <h3 className="text-xl">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-3xl">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-border">
          <div className="grid lg:grid-cols-[1fr,auto] gap-6 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl">Ready to enter the trail?</h2>
              <p className="text-muted-foreground mt-4 max-w-xl">
                {closingCopy} Register for the qualifying game and start your journey.
              </p>
            </div>
            <Link to={registerTarget}>
              <Button variant="hero" size="xl" className="gap-2">
                <Gamepad2 className="h-5 w-5" /> Register for game <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border px-5 lg:px-10 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
        <Logo size="sm" />
        <p>(c) {new Date().getFullYear()} Talent Nation. Built for Nigerian engineers.</p>
      </footer>
    </div>
  );
};

const Panel = ({ icon: Icon, title, text }: { icon: any; title: string; text: string }) => (
  <div className="glass-panel p-5">
    <Icon className="h-6 w-6 text-primary mb-5" />
    <h3 className="text-xl mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground leading-6">{text}</p>
  </div>
);

const Track = ({ months, label }: { months: string; label: string }) => (
  <div className="glass-panel p-6 min-h-48 flex flex-col justify-between">
    <p className="text-muted-foreground">Campus</p>
    <div>
      <div className="h-px bg-border mb-5" />
      <p className="text-secondary text-2xl">{months} months</p>
      <p className="text-muted-foreground mt-2">{label}</p>
    </div>
  </div>
);

const steps = [
  { title: "Register for game day", text: "No CV needed. Register first, then wait for the shared game window to open for every applicant." },
  { title: "Complete private assessment", text: "Applicants are tested inside a timed assessment window without public hints on the landing page." },
  { title: "Admin verification", text: "Game qualification is attached to identity, NIN, school, and document checks before admission." },
  { title: "Start the program", text: "Accepted students enter the dashboard for quests, raids, audits, checkpoints, and workspace tasks." },
];

export default Landing;
