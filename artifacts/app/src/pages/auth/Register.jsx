import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight } from "@phosphor-icons/react";
import { AuthShell, Field } from "./Login";
import { cn } from "@/lib/utils";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", company: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    localStorage.setItem("poh_just_registered", "1");
    const res = await register({
      name: form.name.trim(), email: form.email.trim(),
      company: form.company.trim(), password: form.password,
    });
    setLoading(false);
    if (res.ok) navigate("/app/onboarding", { replace: true });
    else { localStorage.removeItem("poh_just_registered"); setError(res.error); }
  };

  return (
    <AuthShell title="Create your workspace" subtitle="Start scoring traffic in minutes. No credit card required.">
      <form onSubmit={submit} className="mt-7 space-y-4" data-testid="register-form">
        <Field label="Full name" value={form.name} required onChange={set("name")} data-testid="register-name" placeholder="Kyle W" />
        <Field label="Work email" type="email" value={form.email} required onChange={set("email")} data-testid="register-email" placeholder="kyle@internetsubway.com" />
        <Field label="Company / workspace" value={form.company} onChange={set("company")} data-testid="register-company" placeholder="Internet Subway" />
        <Field label="Password" type="password" value={form.password} required minLength={6} onChange={set("password")} data-testid="register-password" placeholder="At least 6 characters" />

        {error && <div data-testid="register-error" className="rounded-md border border-fraudulent/25 bg-fraudulent/10 px-3 py-2 text-xs text-fraudulent">{error}</div>}

        <button
          type="submit" disabled={loading} data-testid="register-submit"
          className={cn("group flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-trusted disabled:opacity-60")}
        >
          {loading ? "Creating…" : "Create workspace"}
          {!loading && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-trusted hover:underline" data-testid="go-login">Sign in</Link>
      </p>
    </AuthShell>
  );
}
