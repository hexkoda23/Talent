import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  FileCheck2,
  Fingerprint,
  GraduationCap,
  IdCard,
  Lock,
  MapPin,
  ShieldCheck,
  Smartphone,
  Upload,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { authApi, registrationApi } from "@/api/endpoints";
import { toErrorMessage } from "@/api/client";
import type { Campus } from "@/api/types";

const steps = [
  { id: 1, title: "Identity", icon: UserIcon },
  { id: 2, title: "Documents", icon: IdCard },
  { id: 3, title: "Security", icon: ShieldCheck },
  { id: 4, title: "Code Zone", icon: MapPin },
];

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const correctionMode = searchParams.get("correction") === "1";
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loadingCampuses, setLoadingCampuses] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    school: "",
    department: "",
    address: "",
    duration: "6 months",
    matric: "",
    level: "",
    nin: "",
    schoolId: null as File | null,
    profilePhoto: null as File | null,
    governmentId: null as File | null,
    phoneLinkedToNin: false,
    duplicateConsent: false,
    truthConsent: false,
    codeZone: "",
  });

  const update = (k: keyof typeof data, v: any) => setData((d) => ({ ...d, [k]: v }));

  const ninValid = /^\d{11}$/.test(data.nin);
  const phoneValid = data.phone.replace(/\D/g, "").length >= 11;
  const canContinue = useMemo(() => {
    if (step === 1) return data.firstName.trim() && data.lastName.trim() && phoneValid && data.email.includes("@") && data.school.trim() && data.department.trim() && data.address.trim().length > 8;
    if (step === 2) return data.matric.trim() && data.level && ninValid && data.schoolId && data.profilePhoto && data.governmentId;
    if (step === 3) return data.phoneLinkedToNin && data.duplicateConsent && data.truthConsent;
    return !!data.codeZone;
  }, [data, ninValid, phoneValid, step]);

  const next = () => setStep((s) => Math.min(4, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  useEffect(() => {
    setLoadingCampuses(true);
    registrationApi.campuses()
      .then((response) => setCampuses(response.data))
      .catch((err) => setError(toErrorMessage(err)))
      .finally(() => setLoadingCampuses(false));
  }, []);

  const submit = async () => {
    if (correctionMode) {
      navigate("/status?state=review&correction=1");
      return;
    }

    setSubmitting(true);
    setError("");

    const selectedCampus = campuses.find((campus) => campus.id === data.codeZone);
    const formData = new FormData();
    formData.append("first_name", data.firstName.trim());
    formData.append("last_name", data.lastName.trim());
    formData.append("email", data.email.trim());
    formData.append("phone", data.phone.trim());
    formData.append("address", data.address.trim());
    formData.append("nin", data.nin);
    formData.append("institution_name", data.school.trim());
    formData.append("matric_number", data.matric.trim());
    formData.append("department", data.department.trim());
    formData.append("level", data.level);
    formData.append("campus_id", selectedCampus?.id || data.codeZone);
    formData.append("siwes_duration_months", data.duration.split(" ")[0]);
    formData.append("consents", JSON.stringify({
      phone_linked_to_nin: data.phoneLinkedToNin,
      duplicate_understanding: data.duplicateConsent,
      truth_attestation: data.truthConsent,
    }));
    if (data.schoolId) formData.append("school_id_card_file", data.schoolId);
    if (data.profilePhoto) formData.append("profile_picture_file", data.profilePhoto);
    if (data.governmentId) formData.append("government_id_file", data.governmentId);

    try {
      await authApi.registerApplicant(formData);
      navigate("/assessment", { replace: true });
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 lg:px-10 py-5 flex items-center justify-between border-b border-border">
        <Logo />
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Cancel</Link>
      </header>

      <main className="flex-1 px-5 py-8 lg:py-12 max-w-4xl w-full mx-auto">
        <div className="mb-8">
          <p className="text-sm font-mono uppercase tracking-widest text-secondary mb-3">
            {correctionMode ? "// correction request" : "// secure entry gate"}
          </p>
          <h1 className="font-display text-3xl lg:text-5xl font-bold">
            {correctionMode ? "Update your details." : "Verify once. Play next."}
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            {correctionMode
              ? "Admin requested a correction. Update the wrong details or upload clearer documents, then submit again for approval."
              : "TalentOS collects identity, school, address, NIN, document evidence, and your preferred Code Zone before the game opens."}
          </p>
        </div>

        <div className="mb-8">
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-6">
            <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {steps.map((s) => {
              const done = step > s.id;
              const current = step === s.id;
              const Icon = s.icon;
              return (
                <div key={s.id} className={cn("rounded-xl border p-3 flex items-center gap-3", current ? "border-primary bg-primary/10" : done ? "border-accent/40 bg-accent/10" : "border-border bg-muted/30")}>
                  <div className={cn("h-9 w-9 rounded-lg grid place-items-center", done ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono text-muted-foreground">STEP {s.id}</p>
                    <p className="text-sm font-medium truncate">{s.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <section className="glass-panel rounded-2xl p-6 lg:p-8 animate-fade-up" key={step}>
          {step === 1 && (
            <div className="space-y-5">
              <Header title="Basic identity" subtitle="This must match your school records, NIN record, and uploaded documents." />
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="First name">
                  <Input value={data.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="Adaeze" />
                </Field>
                <Field label="Last name">
                  <Input value={data.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Okonkwo" />
                </Field>
                <Field label="Phone number">
                  <Input value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+234 801 234 5678" />
                </Field>
                <Field label="School email address">
                  <Input type="email" value={data.email} onChange={(e) => update("email", e.target.value)} placeholder="you@school.edu.ng" />
                </Field>
                <Field label="School name">
                  <Input value={data.school} onChange={(e) => update("school", e.target.value)} placeholder="University of Lagos" />
                </Field>
                <Field label="Department">
                  <Input value={data.department} onChange={(e) => update("department", e.target.value)} placeholder="Computer Science" />
                </Field>
              </div>
              <Field label="House address">
                <Input value={data.address} onChange={(e) => update("address", e.target.value)} placeholder="House number, street, area, city, state" />
              </Field>
              <Field label="SIWES duration">
                <div className="grid grid-cols-3 gap-2">
                  {["3 months", "4 months", "6 months"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => update("duration", d)}
                      className={cn(
                        "h-11 rounded-lg border text-sm font-medium transition-all",
                        data.duration === d ? "bg-primary/15 border-primary text-foreground" : "bg-muted border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Field>
              <TrustPanel items={["Phone number is checked against prior applications", "School email and school name are used for duplicate detection", "Admin approval is required even after a high game score"]} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <Header title="Academic and legal documents" subtitle="Upload clear evidence so the admin can compare names, photos, NIN, and school identity." />
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Matric number">
                  <Input value={data.matric} onChange={(e) => update("matric", e.target.value)} placeholder="CSC/20/1032" />
                </Field>
                <Field label="Level">
                  <select value={data.level} onChange={(e) => update("level", e.target.value)} className="w-full h-10 rounded-md bg-muted border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select level</option>
                    <option>200L</option>
                    <option>300L</option>
                    <option>400L</option>
                    <option>500L</option>
                  </select>
                </Field>
                <Field label="NIN">
                  <Input value={data.nin} onChange={(e) => update("nin", e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="11-digit NIN" inputMode="numeric" />
                </Field>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <UploadZone title="School ID card" hint="Clear front image" file={data.schoolId} onChange={(f) => update("schoolId", f)} icon={GraduationCap} />
                <UploadZone title="Profile picture" hint="Face forward, good light" file={data.profilePhoto} onChange={(f) => update("profilePhoto", f)} icon={Camera} />
                <UploadZone title="NIN or government ID" hint="NIN slip, passport, or national ID" file={data.governmentId} onChange={(f) => update("governmentId", f)} icon={FileCheck2} />
              </div>

              <div className={cn("rounded-xl border p-3 text-sm", ninValid ? "border-accent/30 bg-accent/10 text-accent" : "border-warning/30 bg-warning/10 text-warning")}>
                {ninValid ? "NIN format looks valid: 11 digits captured." : "NIN must be exactly 11 digits before you can continue."}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <Header title="Security validation" subtitle="These checks help prevent one person from registering multiple times or entering with mismatched identity data." />
              <div className="grid md:grid-cols-3 gap-4">
                <SecurityCard icon={Fingerprint} title="Duplicate lock" text="NIN, phone, email, matric number, and device fingerprint are checked against previous applications." />
                <SecurityCard icon={Camera} title="Face match" text="Admin compares your profile picture with your school ID and government ID image." />
                <SecurityCard icon={Smartphone} title="Phone-NIN link" text="Phone ownership is reviewed against NIN-linked identity evidence before acceptance." />
              </div>

              <div className="space-y-3">
                <Consent checked={data.phoneLinkedToNin} onChange={(v) => update("phoneLinkedToNin", v)} text="I confirm this phone number belongs to me and can be checked against my identity/NIN evidence." />
                <Consent checked={data.duplicateConsent} onChange={(v) => update("duplicateConsent", v)} text="I understand duplicate applications, reused NIN, reused documents, or fake identity data can lead to permanent disqualification." />
                <Consent checked={data.truthConsent} onChange={(v) => update("truthConsent", v)} text="I confirm all uploaded documents are real, readable, and belong to me." />
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 flex gap-3 text-sm text-muted-foreground">
                <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p>
                  After the game, your score is attached to this verification file. Auto-pass means the score threshold was met, not automatic admission. An admin must manually accept you.
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <Header title="Choose your Talent Nation Code Zone" subtitle="Pick the closest zone for future physical verification, meetups, workshops, and cohort coordination." />
              {loadingCampuses && <p className="text-sm text-muted-foreground">Loading Code Zones...</p>}
              <div className="grid md:grid-cols-2 gap-3">
                {campuses.map((zone) => {
                  const selected = data.codeZone === zone.id;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => update("codeZone", zone.id)}
                      className={cn(
                        "text-left rounded-xl border p-4 transition-all",
                        selected ? "border-primary bg-primary/15 shadow-[0_10px_30px_-18px_hsl(var(--primary)/0.8)]" : "border-border bg-muted/30 hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={cn("h-10 w-10 rounded-lg grid place-items-center", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-display font-semibold">{zone.name}</h3>
                            <p className="text-xs text-muted-foreground">{zone.location.city}, {zone.location.state}</p>
                            <p className="text-xs text-primary mt-1">{zone.seats_remaining} seats remaining - {zone.demand_label}</p>
                          </div>
                        </div>
                        {selected && <Check className="h-5 w-5 text-primary shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {!loadingCampuses && campuses.length === 0 && (
                <p className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
                  Code Zones could not be loaded. The backend should provide them from GET /campuses.
                </p>
              )}
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 flex gap-3 text-sm text-muted-foreground">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p>
                  {correctionMode
                    ? "After submitting these corrections, your application returns to pending approval for admin to verify the new details."
                    : "Your selected Code Zone is attached to your application. The backend returns the official game schedule and access state after registration."}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button variant="ghost" onClick={prev} disabled={step === 1 || submitting} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < 4 ? (
              <Button variant="hero" onClick={next} disabled={!canContinue} className="gap-2">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="hero" size="lg" onClick={submit} disabled={!canContinue || submitting} className="gap-2">
                {submitting ? "Submitting..." : correctionMode ? "Submit corrections" : "Register for game"} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          {error && <p className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        </section>
      </main>
    </div>
  );
};

const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div>
    <h2 className="font-display text-2xl lg:text-3xl font-bold">{title}</h2>
    <p className="text-muted-foreground text-sm mt-1.5">{subtitle}</p>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm">{label}</Label>
    {children}
  </div>
);

const UploadZone = ({ title, hint, file, onChange, icon: Icon }: { title: string; hint: string; file: File | null; onChange: (f: File) => void; icon: any }) => (
  <label className="min-h-40 rounded-xl border-2 border-dashed border-border bg-muted/40 cursor-pointer hover:border-primary/60 hover:bg-muted/70 transition-all p-4 flex flex-col items-center justify-center gap-2 text-center">
    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])} />
    {file ? (
      <>
        <Check className="h-6 w-6 text-accent" />
        <p className="text-sm font-medium break-all">{file.name}</p>
        <p className="text-xs text-muted-foreground">Click to replace</p>
      </>
    ) : (
      <>
        <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
        <span className="inline-flex items-center gap-1 text-[11px] text-primary"><Upload className="h-3 w-3" /> Upload image</span>
      </>
    )}
  </label>
);

const SecurityCard = ({ icon: Icon, title, text }: { icon: any; title: string; text: string }) => (
  <div className="rounded-xl bg-muted/40 border border-border p-4">
    <Icon className="h-5 w-5 text-primary mb-3" />
    <h3 className="font-display font-semibold mb-1">{title}</h3>
    <p className="text-xs text-muted-foreground">{text}</p>
  </div>
);

const Consent = ({ checked, onChange, text }: { checked: boolean; onChange: (v: boolean) => void; text: string }) => (
  <label className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border cursor-pointer hover:border-primary/40 transition-colors">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 rounded accent-primary" />
    <span className="text-sm">{text}</span>
  </label>
);

const TrustPanel = ({ items }: { items: string[] }) => (
  <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
    <p className="text-sm font-semibold text-accent mb-3">Security checks started</p>
    <div className="grid md:grid-cols-3 gap-2">
      {items.map((item) => (
        <p key={item} className="text-xs text-muted-foreground rounded-lg bg-background/40 border border-border p-2">{item}</p>
      ))}
    </div>
  </div>
);

export default Register;
