import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  FileCheck2,
  Gamepad2,
  GitBranch,
  GraduationCap,
  Layers3,
  Mail,
  MapPin,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const LearnMore = () => {
  const registerTarget = "/register";

  return (
    <div className="min-h-screen bg-background font-mono">
    <header className="px-5 lg:px-10 py-5 flex items-center justify-between border-b border-border">
      <Logo />
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Back home
      </Link>
    </header>

    <main className="px-5 lg:px-10 py-12 lg:py-20 max-w-7xl mx-auto">
      <section className="grid lg:grid-cols-[1.2fr,0.8fr] gap-10 items-end border-b border-border pb-16">
        <div>
          <p className="text-sm text-primary mb-8">01 - Talent Nation Overview</p>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl leading-[1.08]">
            How Talent Nation works
          </h1>
          <p className="mt-8 text-base lg:text-lg leading-8 text-foreground max-w-3xl">
            Talent Nation is designed as a serious AI Engineering SIWES pathway for Nigerian students.
            It combines private screening, identity verification, cohort placement, structured learning,
            real engineering tasks, peer review, and admin oversight.
          </p>
        </div>
        <div className="glass-panel p-6">
          <p className="text-muted-foreground text-sm mb-5">Program signal</p>
          <div className="space-y-4">
            <Metric label="Assessment" value="Private" />
            <Metric label="Tracks" value="3 / 6 months" />
            <Metric label="Admission" value="Admin verified" />
            <Metric label="Outcome" value="Portfolio + SIWES evidence" />
          </div>
        </div>
      </section>

      <section className="py-16 border-b border-border">
        <div className="grid lg:grid-cols-[0.7fr,1.3fr] gap-10">
          <div>
            <p className="text-sm text-primary mb-3">// why it exists</p>
            <h2 className="text-4xl lg:text-5xl leading-tight">A better SIWES experience for serious builders</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <InfoCard icon={BriefcaseBusiness} title="Real career preparation">
              Students do not just watch tutorials. They work through tasks, reviews, audits, and project-based challenges that feel closer to real engineering work.
            </InfoCard>
            <InfoCard icon={ShieldCheck} title="Fair selection process">
              Applicants are screened privately, then identity and document records are reviewed by admins before anyone enters the program.
            </InfoCard>
            <InfoCard icon={Code2} title="AI engineering focus">
              The program is built around modern software and AI workflows: APIs, automation, LLM systems, retrieval, evaluation, and deployment habits.
            </InfoCard>
            <InfoCard icon={GraduationCap} title="SIWES-ready structure">
              Tracks are organized around common school SIWES windows, so students can pick a duration that fits their academic schedule.
            </InfoCard>
          </div>
        </div>
      </section>

      <section className="py-16 border-b border-border">
        <p className="text-sm text-primary mb-8">// applicant journey</p>
        <div className="relative pl-10">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
          <div className="absolute left-0 top-2 h-5 w-5 rounded-full border-2 border-primary bg-background" />
          <div className="space-y-10">
            {journey.map((item, index) => (
              <div key={item.title} className="grid lg:grid-cols-[120px,1fr] gap-4 border-b border-border pb-8">
                <span className="text-3xl text-muted-foreground">0{index + 1}</span>
                <div className="grid md:grid-cols-[auto,1fr] gap-4">
                  <div className="h-12 w-12 bg-muted border border-border text-primary grid place-items-center">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-3 leading-7 max-w-4xl">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-b border-border">
        <div className="grid lg:grid-cols-[0.8fr,1.2fr] gap-10">
          <div>
            <p className="text-sm text-primary mb-3">// learning system</p>
            <h2 className="text-4xl lg:text-5xl leading-tight">After acceptance, the platform becomes the classroom</h2>
            <p className="text-muted-foreground mt-5 leading-7">
              Talent Nation is planned as a full operating system for the program: students learn, submit,
              collaborate, get reviewed, and build proof of work from one place.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <SystemCard icon={BookOpen} title="Curriculum modules" text="Admin-created lessons and checkpoints guide each student through the selected track." />
            <SystemCard icon={Trophy} title="Quests" text="Timed tasks help students practice core skills and earn progress toward their next level." />
            <SystemCard icon={Users} title="Raids" text="Weekly project teams push students to collaborate with different people, not only friends." />
            <SystemCard icon={ClipboardCheck} title="Peer audits" text="Students review other submissions, learn from comparison, and build review discipline." />
            <SystemCard icon={GitBranch} title="Workspace" text="A GitHub-style code area keeps project files, commits, reviews, and feedback together." />
            <SystemCard icon={Layers3} title="Admin control" text="Admins can manage curriculum, applications, moderation, student records, and assessment settings." />
          </div>
        </div>
      </section>

      <section className="py-16 border-b border-border">
        <p className="text-sm text-primary mb-8">// track durations</p>
        <div className="grid md:grid-cols-3 gap-6">
          <TrackDetail title="3 months" label="Standard" text="Best for students with a shorter SIWES window or stronger starting skills. It focuses on high-intensity execution and fast project output." />
          <TrackDetail title="6 months" label="Deep dive" text="Best for students with a longer placement period. It supports deeper projects, more reviews, and stronger graduation evidence." />
        </div>
      </section>

      <section className="py-16 border-b border-border">
        <div className="grid lg:grid-cols-[1fr,1fr] gap-8">
          <div className="glass-panel p-6">
            <Mail className="h-6 w-6 text-primary mb-5" />
            <h2 className="text-3xl mb-4">What happens after screening?</h2>
            <p className="text-sm text-muted-foreground leading-7">
              Passing the private screening does not automatically admit a student. The score is attached to
              the applicant file, then an admin reviews identity information, uploaded documents, school details,
              NIN format, duplicate signals, and code-zone selection. Applicants are told to await email from admin.
            </p>
          </div>
          <div className="glass-panel p-6">
            <MapPin className="h-6 w-6 text-primary mb-5" />
            <h2 className="text-3xl mb-4">Why Code Zones matter</h2>
            <p className="text-sm text-muted-foreground leading-7">
              Code Zones help Talent Nation organize future physical verification, log book signing, meetups,
              SIWES document handling, and local cohort support. The backend uses zones for operations and admin routing.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="grid lg:grid-cols-[1fr,auto] gap-6 items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl">Ready to register?</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl">
              Start with the registration form. The platform will create your application, open the private assessment flow,
              store your result, and send your file to admin confirmation.
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
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm text-foreground text-right">{value}</span>
  </div>
);

const InfoCard = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div className="glass-panel p-5">
    <Icon className="h-6 w-6 text-primary mb-5" />
    <h3 className="text-xl mb-3">{title}</h3>
    <p className="text-sm text-muted-foreground leading-7">{children}</p>
  </div>
);

const SystemCard = ({ icon: Icon, title, text }: { icon: any; title: string; text: string }) => (
  <div className="border border-border bg-muted/30 p-4">
    <Icon className="h-5 w-5 text-primary mb-4" />
    <h3 className="text-lg mb-2">{title}</h3>
    <p className="text-xs text-muted-foreground leading-6">{text}</p>
  </div>
);

const TrackDetail = ({ title, label, text }: { title: string; label: string; text: string }) => (
  <div className="glass-panel p-6 min-h-64 flex flex-col justify-between">
    <div>
      <p className="text-muted-foreground mb-6">{label}</p>
      <div className="h-px bg-border mb-5" />
      <h3 className="text-3xl text-secondary">{title}</h3>
    </div>
    <p className="text-sm text-muted-foreground leading-7 mt-8">{text}</p>
  </div>
);

const journey = [
  {
    icon: FileCheck2,
    title: "Register with identity details",
    text: "Applicants submit basic identity, school, address, duration preference, documents, and code-zone information. This creates the applicant record that later carries the assessment score.",
  },
  {
    icon: CalendarDays,
    title: "Wait for the shared assessment window",
    text: "The real Talent Nation website can place registered applicants on a countdown screen until the official assessment time, so everyone starts under the same conditions.",
  },
  {
    icon: ShieldCheck,
    title: "Complete private screening",
    text: "The public page does not reveal the assessment details. Applicants only enter the timed screening after registration and countdown, keeping the process cleaner and harder to game.",
  },
  {
    icon: ClipboardCheck,
    title: "Admin verifies the file",
    text: "Admins review score, identity, school information, uploaded documents, duplicate signals, and code-zone selection. Applicants are told to await email from admin.",
  },
  {
    icon: GraduationCap,
    title: "Accepted students enter the program",
    text: "Once approved, students move into onboarding, learning modules, quests, raids, audits, checkpoints, and workspace activity.",
  },
  {
    icon: CheckCircle2,
    title: "Graduate with proof of work",
    text: "At the end of the selected track, students should have project evidence, participation records, portfolio artifacts, and SIWES documentation support.",
  },
];

export default LearnMore;
