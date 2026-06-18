import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeSlash, LockKey, CheckCircle, ArrowRight } from "@phosphor-icons/react";
import { AuthShell } from "./Login";
import api from "@/lib/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const mismatch = confirm && password !== confirm;
  const weak = password && password.length < 8;

  const submit = async (e) => {
    e.preventDefault();
    if (mismatch || weak) return;
    setError(""); setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.detail ?? "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title="Invalid link" subtitle="This password reset link is missing a token.">
        <div className="mt-8">
          <Link to="/forgot-password" className="flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-trusted transition-all">
            Request a new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="You can now sign in with your new password.">
        <div className="mt-8 space-y-5">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-trusted/25 bg-trusted/10 px-5 py-6 text-center">
            <CheckCircle size={36} weight="fill" className="text-trusted" />
            <p className="text-sm text-slate-300">Your password has been updated successfully.</p>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="group flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-trusted"
          >
            Sign in <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create new password" subtitle="Choose a strong password of at least 8 characters.">
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block">
          <span className="data-label">New password</span>
          <div className="relative mt-1.5">
            <LockKey size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={show ? "text" : "password"} value={password} required autoFocus
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-surface pl-8 pr-10 py-2.5 text-sm text-white outline-none transition-colors focus:border-trusted/50 focus:ring-1 focus:ring-trusted/30"
              placeholder="Min. 8 characters"
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              {show ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {weak && <p className="mt-1 text-xs text-fraudulent">Password must be at least 8 characters</p>}
        </label>

        <label className="block">
          <span className="data-label">Confirm password</span>
          <input
            type={show ? "text" : "password"} value={confirm} required
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-white/10 bg-surface px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-trusted/50 focus:ring-1 focus:ring-trusted/30"
          />
          {mismatch && <p className="mt-1 text-xs text-fraudulent">Passwords do not match</p>}
        </label>

        {error && (
          <div className="rounded-md border border-fraudulent/25 bg-fraudulent/10 px-3 py-2 text-xs text-fraudulent">{error}</div>
        )}

        <button
          type="submit" disabled={loading || weak || mismatch || !password || !confirm}
          className="group flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-trusted disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update password"}
          {!loading && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
        </button>
      </form>
    </AuthShell>
  );
}
