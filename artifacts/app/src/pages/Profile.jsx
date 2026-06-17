import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { fetcher } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/common/Card";
import { cn } from "@/lib/utils";
import {
  User, Lock, CreditCard, Buildings, ShieldWarning, Check, Eye, EyeSlash,
  Star, ArrowRight, Sparkle, SignOut,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

const PLAN_FEATURES = {
  Free:     { color: "text-muted-foreground", sessions: "10k / mo", domains: "1", retention: "7 days", team: "1 seat", badge: "Free" },
  Starter:  { color: "text-blue-400", sessions: "100k / mo", domains: "3", retention: "30 days", team: "3 seats", badge: "Starter" },
  Growth:   { color: "text-trusted", sessions: "1M / mo", domains: "10", retention: "90 days", team: "10 seats", badge: "Growth" },
  Scale:    { color: "text-amber-400", sessions: "Unlimited", domains: "Unlimited", retention: "1 year", team: "Unlimited", badge: "Scale" },
};

const UPGRADE_PLANS = [
  { name: "Starter", price: "$49", interval: "/ mo", highlight: false, features: ["100k sessions / month", "3 domains", "30-day retention", "3 team seats", "Email alerts"] },
  { name: "Growth", price: "$149", interval: "/ mo", highlight: true, features: ["1M sessions / month", "10 domains", "90-day retention", "10 team seats", "Priority support", "Campaign reporting"] },
  { name: "Scale", price: "$499", interval: "/ mo", highlight: false, features: ["Unlimited sessions", "Unlimited domains", "1-year retention", "Unlimited seats", "Dedicated support", "Custom integrations"] },
];

function SectionHeading({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5">
        <Icon size={16} className="text-trusted" />
      </div>
      <div>
        <div className="font-semibold text-white text-sm">{title}</div>
        {desc && <div className="text-[11px] text-muted-foreground">{desc}</div>}
      </div>
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder, id }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full rounded-md border border-white/10 bg-surface px-3 py-2 text-sm text-white outline-none focus:border-white/30 pr-10 placeholder:text-muted-foreground/50" />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
        {show ? <EyeSlash size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

export default function Profile() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const { data: ws } = useQuery({ queryKey: ["workspace"], queryFn: () => fetcher("/workspace") });
  const workspace = ws?.workspace;
  const plan = workspace?.plan ?? "Growth";
  const planInfo = PLAN_FEATURES[plan] ?? PLAN_FEATURES.Growth;

  // Personal info
  const [name, setName] = useState(user?.name ?? "");
  const updateProfile = useMutation({
    mutationFn: () => api.patch("/auth/profile", { name }),
    onSuccess: () => { toast.success("Name updated"); refreshUser(); },
    onError: (e) => toast.error(e.response?.data?.detail || "Failed to update"),
  });

  // Change password
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const changePw = useMutation({
    mutationFn: () => {
      if (pw.next !== pw.confirm) { toast.error("Passwords don't match"); throw new Error("mismatch"); }
      return api.post("/auth/change-password", { current_password: pw.current, new_password: pw.next });
    },
    onSuccess: () => { toast.success("Password changed"); setPw({ current: "", next: "", confirm: "" }); },
    onError: (e) => { if (e.message !== "mismatch") toast.error(e.response?.data?.detail || "Failed"); },
  });

  const handleLogout = async () => { await logout(); navigate("/login"); };

  return (
    <div className="space-y-5 max-w-2xl" data-testid="profile-page">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Profile & Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your identity, security and subscription.</p>
      </div>

      {/* Personal info */}
      <Card className="p-5">
        <SectionHeading icon={User} title="Personal information" desc="Your name and login identity" />
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/8 font-mono text-xl font-bold text-white">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-white">{user?.name}</div>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] capitalize text-slate-400">{user?.role}</span>
                <span className={cn("rounded border px-1.5 py-0.5 font-mono text-[10px]", planInfo.color, "border-current/30 bg-current/10")}>{planInfo.badge}</span>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="data-label">Display name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 w-full rounded-md border border-white/10 bg-surface px-3 py-2 text-sm text-white outline-none focus:border-white/30" />
            </label>
            <label className="block">
              <span className="data-label">Email address</span>
              <input value={user?.email ?? ""} disabled className="mt-1.5 w-full rounded-md border border-white/8 bg-white/[0.02] px-3 py-2 text-sm text-muted-foreground cursor-not-allowed" />
            </label>
          </div>
          <button onClick={() => updateProfile.mutate()} disabled={!name.trim() || name === user?.name || updateProfile.isPending}
            className="flex items-center gap-2 rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-black hover:bg-trusted disabled:opacity-40 transition-colors">
            <Check size={14} /> {updateProfile.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </Card>

      {/* Security */}
      <Card className="p-5">
        <SectionHeading icon={Lock} title="Security" desc="Change your password" />
        <div className="space-y-3 max-w-sm">
          <label className="block">
            <span className="data-label">Current password</span>
            <div className="mt-1.5"><PasswordInput id="current" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} placeholder="••••••••" /></div>
          </label>
          <label className="block">
            <span className="data-label">New password</span>
            <div className="mt-1.5"><PasswordInput id="next" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="Min. 8 characters" /></div>
          </label>
          <label className="block">
            <span className="data-label">Confirm new password</span>
            <div className="mt-1.5"><PasswordInput id="confirm" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} placeholder="Repeat new password" /></div>
          </label>
          {pw.next && pw.confirm && pw.next !== pw.confirm && (
            <p className="text-xs text-fraudulent">Passwords don't match</p>
          )}
          {pw.next && pw.next.length < 8 && (
            <p className="text-xs text-suspicious">Password must be at least 8 characters</p>
          )}
          <button onClick={() => changePw.mutate()} disabled={!pw.current || !pw.next || !pw.confirm || pw.next !== pw.confirm || pw.next.length < 8 || changePw.isPending}
            className="flex items-center gap-2 rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-black hover:bg-trusted disabled:opacity-40 transition-colors">
            <Lock size={14} /> {changePw.isPending ? "Updating…" : "Change password"}
          </button>
        </div>
      </Card>

      {/* Workspace info */}
      <Card className="p-5">
        <SectionHeading icon={Buildings} title="Workspace" desc="Your organisation settings" />
        <div className="grid gap-2 text-sm">
          {[
            ["Workspace name", workspace?.name],
            ["Plan", planInfo.badge],
            ["Sessions per month", planInfo.sessions],
            ["Max domains", planInfo.domains],
            ["Data retention", planInfo.retention],
            ["Team seats", planInfo.team],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between border-b border-white/5 py-2 last:border-0">
              <span className="text-muted-foreground">{label}</span>
              <span className={cn("font-medium", label === "Plan" ? planInfo.color : "text-white")}>{value ?? "—"}</span>
            </div>
          ))}
        </div>
        <button onClick={() => navigate("/app/settings")} className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors">
          Workspace settings <ArrowRight size={13} />
        </button>
      </Card>

      {/* Plan */}
      <Card className="p-5">
        <SectionHeading icon={CreditCard} title="Plan & Billing" desc="Upgrade for more sessions, domains and retention" />
        <div className="grid gap-3 sm:grid-cols-3">
          {UPGRADE_PLANS.map((p) => (
            <div key={p.name} className={cn("rounded-md border p-4", p.highlight ? "border-trusted/40 bg-trusted/[0.03]" : "border-white/8 bg-white/[0.01]")}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn("font-semibold text-sm", p.highlight ? "text-trusted" : "text-white")}>{p.name}</span>
                {p.highlight && <Sparkle size={14} className="text-trusted" weight="fill" />}
              </div>
              <div className="mb-3">
                <span className="font-mono text-xl font-bold text-white">{p.price}</span>
                <span className="text-xs text-muted-foreground ml-1">{p.interval}</span>
              </div>
              <ul className="space-y-1.5 mb-4">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check size={11} className={p.highlight ? "text-trusted shrink-0" : "text-white/40 shrink-0"} weight="bold" /> {f}
                  </li>
                ))}
              </ul>
              <button disabled={workspace?.plan === p.name} className={cn("w-full rounded-md py-1.5 text-xs font-semibold transition-colors", workspace?.plan === p.name ? "bg-white/5 text-muted-foreground cursor-default" : p.highlight ? "bg-trusted/20 text-trusted hover:bg-trusted/30" : "bg-white/8 text-white hover:bg-white/15")}>
                {workspace?.plan === p.name ? "Current plan" : `Upgrade to ${p.name}`}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Billing is handled through Stripe. Contact <span className="text-white">support@poh.io</span> for enterprise pricing.</p>
      </Card>

      {/* Danger zone */}
      <Card className="p-5 border-fraudulent/15">
        <SectionHeading icon={ShieldWarning} title="Danger zone" desc="Irreversible account actions" />
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-md border border-white/8 p-3">
            <div>
              <div className="text-sm font-medium text-white">Sign out</div>
              <div className="text-xs text-muted-foreground">End your current session on this device</div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-sm text-muted-foreground hover:text-white hover:border-white/20 transition-colors">
              <SignOut size={14} /> Sign out
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-md border border-fraudulent/20 p-3 opacity-60">
            <div>
              <div className="text-sm font-medium text-fraudulent">Delete account</div>
              <div className="text-xs text-muted-foreground">Permanently remove your account and all data</div>
            </div>
            <button disabled className="flex items-center gap-1.5 rounded-md border border-fraudulent/30 px-3 py-1.5 text-sm text-fraudulent cursor-not-allowed">
              Contact support
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
