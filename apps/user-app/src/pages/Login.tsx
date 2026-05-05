import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { authApi } from "@/api/endpoints";
import { toErrorMessage } from "@/api/client";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect") || "/register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");

    if (!email.includes("@") || password.length < 4) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.login({ email: email.trim(), password });
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-mono">
      <header className="px-5 lg:px-10 py-5 flex items-center justify-between border-b border-border">
        <Logo />
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
      </header>

      <main className="flex-1 px-5 py-12 max-w-xl w-full mx-auto grid place-items-center">
        <section className="glass-panel p-6 lg:p-8 w-full animate-fade-up">
          <p className="text-sm text-primary mb-3">// account gate</p>
          <h1 className="text-4xl lg:text-5xl mb-4">Login</h1>
          <p className="text-sm text-muted-foreground leading-7 mb-8">
            Login with the account email and password from your Talent Nation application.
          </p>

          <div className="space-y-4">
            <Field label="Email address">
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <PasswordInput
                value={password}
                onChange={setPassword}
                visible={showPassword}
                onToggle={() => setShowPassword((visible) => !visible)}
                placeholder="Password"
              />
            </Field>
          </div>

          {error && <p className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

          <Button variant="hero" size="xl" onClick={submit} disabled={submitting} className="mt-8 w-full gap-2">
            <LogIn className="h-5 w-5" />
            {submitting ? "Logging in..." : "Login and continue"}
            <ArrowRight className="h-5 w-5" />
          </Button>

          <div className="mt-5 border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            You can only register once. Multiple email sign-ups are not allowed and can lead to disqualification.
          </div>

          <Button variant="soft" size="lg" asChild className="mt-4 w-full gap-2">
            <Link to="/signup">
              <UserPlus className="h-4 w-4" /> New applicant 
            </Link>
          </Button>
        </section>
      </main>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm">{label}</Label>
    {children}
  </div>
);

const PasswordInput = ({
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  placeholder: string;
}) => (
  <div className="relative">
    <Input
      type={visible ? "text" : "password"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="pr-11"
    />
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      aria-label={visible ? "Hide password" : "Show password"}
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  </div>
);

export default Login;
