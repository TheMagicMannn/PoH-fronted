import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, EnvelopeSimple, CheckCircle } from "@phosphor-icons/react";
import { AuthShell, Field } from "./Login";
import api from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.detail ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="A reset link is on its way.">
        <div className="mt-8 space-y-5">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-trusted/25 bg-trusted/10 px-5 py-6 text-center">
            <CheckCircle size={36} weight="fill" className="text-trusted" />
            <p className="text-sm text-slate-300">
              If an account exists for <span className="font-medium text-white">{email}</span>, a password reset link has been sent.
            </p>
            <p className="text-xs text-slate-500">
              The link expires in 1 hour. Check your spam folder if you don't see it.
            </p>
          </div>
          <p className="text-center text-xs text-slate-500">
            Didn't get it?{" "}
            <button onClick={() => setSent(false)} className="text-trusted hover:underline">Try again</button>
          </p>
          <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send you a reset link.">
      <form onSubmit={submit} className="mt-7 space-y-4">
        <Field label="Work email" type="email" value={email} required
          onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com"
          autoFocus />

        {error && (
          <div className="rounded-md border border-fraudulent/25 bg-fraudulent/10 px-3 py-2 text-xs text-fraudulent">{error}</div>
        )}

        <button
          type="submit" disabled={loading || !email.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-trusted disabled:opacity-60"
        >
          <EnvelopeSimple size={16} />
          {loading ? "Sending…" : "Send reset link"}
        </button>

        <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}
