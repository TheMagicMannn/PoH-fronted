import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ShieldChevron, Eye, EyeSlash, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const BG = "https://images.unsplash.com/photo-1578662996442-48f60103fc96?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwyfHxkYXJrJTIwYWJzdHJhY3QlMjB0ZXh0dXJlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3ODExNDkwODR8MA&ixlib=rb-4.1.0&q=85";

export function AuthShell({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen bg-[#08090A]">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex w-[44%] flex-col justify-between overflow-hidden border-r border-white/8 p-12">
        <img src={BG} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#08090A]/70 via-[#08090A]/85 to-[#08090A]" />
        <div className="absolute inset-0 grid-backdrop opacity-60" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-trusted/15 border border-trusted/30">
            <ShieldChevron size={22} weight="fill" className="text-trusted" />
          </div>
          <div>
            <div className="font-heading text-xl font-extrabold tracking-tight text-white">PoH</div>
            <div className="data-label">Trust &amp; Fraud Intelligence</div>
          </div>
        </div>

        <div className="relative">
          <h2 className="font-heading text-3xl font-bold leading-tight text-white">
            The trust layer for paid traffic, leads &amp; conversions.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
            Score every session and conversion in real time. See which traffic is real,
            which conversions to trust, and exactly what action to take — with explainable reason codes.
          </p>
          <ul className="mt-6 space-y-2.5">
            {["Real-time human vs bot scoring", "Campaign-linked fraud reporting", "Explainable reason codes & confidence", "Observe → Flag → Review → Block automation"].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-sm text-slate-300">
                <CheckCircle size={18} weight="fill" className="text-trusted shrink-0" /> {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative font-mono text-[11px] text-slate-500">
          PoH // session forensics · fingerprint recurrence · conversion authenticity
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-trusted/15 border border-trusted/30">
              <ShieldChevron size={18} weight="fill" className="text-trusted" />
            </div>
            <span className="font-heading text-lg font-extrabold text-white">PoH</span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="data-label">{label}</span>
      <input
        {...props}
        className="mt-1.5 w-full rounded-md border border-white/10 bg-surface px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-colors focus:border-trusted/50 focus:ring-1 focus:ring-trusted/30"
      />
    </label>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("analyst@poh.io");
  const [password, setPassword] = useState("PohDemo2026!");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (res.ok) navigate("/app");
    else setError(res.error);
  };

  return (
    <AuthShell title="Sign in" subtitle="Access your trust intelligence workspace.">
      <form onSubmit={submit} className="mt-7 space-y-4" data-testid="login-form">
        <Field label="Work email" type="email" value={email} required
               onChange={(e) => setEmail(e.target.value)} data-testid="login-email" placeholder="you@company.com" />
        <label className="block">
          <span className="data-label">Password</span>
          <div className="relative mt-1.5">
            <input
              type={show ? "text" : "password"} value={password} required
              onChange={(e) => setPassword(e.target.value)} data-testid="login-password"
              className="w-full rounded-md border border-white/10 bg-surface px-3 py-2.5 pr-10 text-sm text-white outline-none transition-colors focus:border-trusted/50 focus:ring-1 focus:ring-trusted/30"
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              {show ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        {error && <div data-testid="login-error" className="rounded-md border border-fraudulent/25 bg-fraudulent/10 px-3 py-2 text-xs text-fraudulent">{error}</div>}

        <button
          type="submit" disabled={loading} data-testid="login-submit"
          className={cn("group flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-trusted disabled:opacity-60")}
        >
          {loading ? "Signing in…" : "Sign in"}
          {!loading && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
        </button>

        <div className="rounded-md border border-white/8 bg-white/[0.02] px-3 py-2.5 text-[11px] font-mono text-slate-500">
          Demo: analyst@poh.io · PohDemo2026!
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          No workspace yet?{" "}
          <Link to="/register" className="font-medium text-trusted hover:underline" data-testid="go-register">Create one</Link>
        </p>
        <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-white transition-colors">
          Forgot password?
        </Link>
      </div>
    </AuthShell>
  );
}
