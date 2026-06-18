import { Router } from "express";
import { randomUUID } from "crypto";
import { db } from "@workspace/db";
import { usersTable, workspacesTable, sitesTable, sessionsTable, auditLogsTable } from "@workspace/db";
import { eq, desc, ilike, count, avg, and, gte, or } from "drizzle-orm";
import { requireRole, hashPassword } from "../lib/auth.js";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/admin/stats", requireRole("owner"), async (_req, res) => {
  try {
    const [[totalWorkspaces], [totalUsers], [totalSessions], [fraudStats]] = await Promise.all([
      db.select({ count: count() }).from(workspacesTable),
      db.select({ count: count() }).from(usersTable),
      db.select({ count: count() }).from(sessionsTable),
      db.select({
        fraudulent: count(sql`CASE WHEN classification = 'fraudulent' THEN 1 END`),
        suspicious: count(sql`CASE WHEN classification = 'suspicious' THEN 1 END`),
        avgScore: avg(sessionsTable.trustScore),
      }).from(sessionsTable),
    ]);

    const total = Number(totalSessions?.count ?? 0);
    const fraudulent = Number(fraudStats?.fraudulent ?? 0);
    const suspicious = Number(fraudStats?.suspicious ?? 0);

    res.json({
      total_workspaces: Number(totalWorkspaces?.count ?? 0),
      total_users: Number(totalUsers?.count ?? 0),
      total_sessions: total,
      fraud_rate: total > 0 ? Math.round(((fraudulent + suspicious) / total) * 100 * 10) / 10 : 0,
      avg_trust_score: Math.round(Number(fraudStats?.avgScore ?? 0)),
      active_alerts: 0,
    });
  } catch {
    res.status(500).json({ detail: "Failed to load stats" });
  }
});

router.get("/admin/workspaces", requireRole("owner"), async (req, res) => {
  try {
    const { search, plan } = req.query as { search?: string; plan?: string };

    const workspaces = await db.select().from(workspacesTable).orderBy(desc(workspacesTable.createdAt)).limit(200);

    const wsIds = workspaces.map((w) => w.id);
    const [userCounts, sessionCounts, sitesData] = await Promise.all([
      db.select({ workspaceId: usersTable.workspaceId, count: count() }).from(usersTable).groupBy(usersTable.workspaceId),
      db.select({ workspaceId: sessionsTable.workspaceId, count: count() }).from(sessionsTable).groupBy(sessionsTable.workspaceId),
      db.select().from(sitesTable).orderBy(desc(sitesTable.createdAt)),
    ]);

    const userMap = Object.fromEntries(userCounts.map((r) => [r.workspaceId, Number(r.count)]));
    const sessionMap = Object.fromEntries(sessionCounts.map((r) => [r.workspaceId, Number(r.count)]));
    const siteMap: Record<string, typeof sitesData> = {};
    sitesData.forEach((s) => {
      if (!siteMap[s.workspaceId]) siteMap[s.workspaceId] = [];
      siteMap[s.workspaceId].push(s);
    });

    let result = workspaces.map((w) => ({
      ...w,
      member_count: userMap[w.id] ?? 0,
      session_count: sessionMap[w.id] ?? 0,
      site_count: (siteMap[w.id] ?? []).length,
    }));

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((w) => w.name.toLowerCase().includes(q));
    }
    if (plan) result = result.filter((w) => w.plan === plan);

    res.json({ workspaces: result, total: result.length });
  } catch {
    res.status(500).json({ detail: "Failed to load workspaces" });
  }
});

router.get("/admin/workspaces/:id", requireRole("owner"), async (req, res) => {
  try {
    const { id } = req.params;
    const [workspace] = await db.select().from(workspacesTable).where(eq(workspacesTable.id, id)).limit(1);
    if (!workspace) { res.status(404).json({ detail: "Workspace not found" }); return; }

    const [members, sites, recentSessions, auditLogs] = await Promise.all([
      db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt })
        .from(usersTable).where(eq(usersTable.workspaceId, id)),
      db.select().from(sitesTable).where(eq(sitesTable.workspaceId, id)),
      db.select().from(sessionsTable).where(eq(sessionsTable.workspaceId, id)).orderBy(desc(sessionsTable.createdAt)).limit(50),
      db.select().from(auditLogsTable).where(eq(auditLogsTable.workspaceId, id)).orderBy(desc(auditLogsTable.createdAt)).limit(100),
    ]);

    res.json({ workspace, members, sites, recent_sessions: recentSessions, audit_logs: auditLogs });
  } catch {
    res.status(500).json({ detail: "Failed to load workspace" });
  }
});

router.patch("/admin/workspaces/:id", requireRole("owner"), async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, sensitivity_profile } = req.body as { plan?: string; sensitivity_profile?: string };

    const updates: Record<string, string> = {};
    if (plan) updates.plan = plan;
    if (sensitivity_profile) updates.sensitivityProfile = sensitivity_profile;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ detail: "No fields to update" }); return;
    }

    await db.update(workspacesTable).set(updates as Record<string, string>).where(eq(workspacesTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ detail: "Failed to update workspace" });
  }
});

router.get("/admin/users", requireRole("owner"), async (req, res) => {
  try {
    const { search, role } = req.query as { search?: string; role?: string };

    const users = await db
      .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, workspaceId: usersTable.workspaceId, createdAt: usersTable.createdAt })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(500);

    const workspaces = await db.select({ id: workspacesTable.id, name: workspacesTable.name, plan: workspacesTable.plan }).from(workspacesTable);
    const wsMap = Object.fromEntries(workspaces.map((w) => [w.id, w]));

    let result = users.map((u) => ({
      ...u,
      workspace_name: wsMap[u.workspaceId ?? ""]?.name ?? "—",
      workspace_plan: wsMap[u.workspaceId ?? ""]?.plan ?? "—",
    }));

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (role) result = result.filter((u) => u.role === role);

    res.json({ users: result, total: result.length });
  } catch {
    res.status(500).json({ detail: "Failed to load users" });
  }
});

router.get("/admin/users/:id", requireRole("owner"), async (req, res) => {
  try {
    const { id } = req.params;
    const [user] = await db
      .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, workspaceId: usersTable.workspaceId, createdAt: usersTable.createdAt })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    if (!user) { res.status(404).json({ detail: "User not found" }); return; }

    const [workspace] = user.workspaceId
      ? await db.select().from(workspacesTable).where(eq(workspacesTable.id, user.workspaceId)).limit(1)
      : [];

    const [auditLogs] = await Promise.all([
      db.select().from(auditLogsTable)
        .where(eq(auditLogsTable.workspaceId, user.workspaceId ?? ""))
        .orderBy(desc(auditLogsTable.createdAt))
        .limit(50),
    ]);

    res.json({ user, workspace: workspace ?? null, audit_logs: auditLogs });
  } catch {
    res.status(500).json({ detail: "Failed to load user" });
  }
});

router.post("/admin/users/:id/reset-password", requireRole("owner"), async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body as { new_password?: string };

    if (!new_password || new_password.length < 8) {
      res.status(400).json({ detail: "new_password must be at least 8 characters" }); return;
    }

    const [user] = await db.select({ id: usersTable.id, email: usersTable.email, workspaceId: usersTable.workspaceId }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) { res.status(404).json({ detail: "User not found" }); return; }

    await db.update(usersTable).set({ passwordHash: hashPassword(new_password) }).where(eq(usersTable.id, id));

    if (user.workspaceId) {
      await db.insert(auditLogsTable).values({
        id: randomUUID(),
        workspaceId: user.workspaceId,
        userName: `Admin (${req.user!.email})`,
        action: "admin_password_reset",
        target: user.email,
        details: "Password reset by platform admin",
      });
    }

    res.json({ ok: true });
  } catch {
    res.status(500).json({ detail: "Failed to reset password" });
  }
});

router.patch("/admin/users/:id", requireRole("owner"), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body as { role?: string };

    if (!role) { res.status(400).json({ detail: "role is required" }); return; }
    const VALID = ["viewer", "analyst", "admin", "owner"];
    if (!VALID.includes(role)) { res.status(400).json({ detail: "Invalid role" }); return; }

    const [user] = await db.select({ email: usersTable.email, workspaceId: usersTable.workspaceId }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) { res.status(404).json({ detail: "User not found" }); return; }

    await db.update(usersTable).set({ role }).where(eq(usersTable.id, id));

    if (user.workspaceId) {
      await db.insert(auditLogsTable).values({
        id: randomUUID(),
        workspaceId: user.workspaceId,
        userName: `Admin (${req.user!.email})`,
        action: "admin_role_change",
        target: user.email,
        details: `Role changed to ${role} by platform admin`,
      });
    }

    res.json({ ok: true });
  } catch {
    res.status(500).json({ detail: "Failed to update user" });
  }
});

router.delete("/admin/users/:id", requireRole("owner"), async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user!.id) { res.status(400).json({ detail: "Cannot delete your own account" }); return; }

    const [user] = await db.select({ email: usersTable.email, workspaceId: usersTable.workspaceId }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) { res.status(404).json({ detail: "User not found" }); return; }

    await db.delete(usersTable).where(eq(usersTable.id, id));

    if (user.workspaceId) {
      await db.insert(auditLogsTable).values({
        id: randomUUID(),
        workspaceId: user.workspaceId,
        userName: `Admin (${req.user!.email})`,
        action: "admin_user_deleted",
        target: user.email,
        details: "User deleted by platform admin",
      });
    }

    res.json({ ok: true });
  } catch {
    res.status(500).json({ detail: "Failed to delete user" });
  }
});

router.get("/admin/audit-logs", requireRole("owner"), async (req, res) => {
  try {
    const { workspace_id, search, limit = "100" } = req.query as { workspace_id?: string; search?: string; limit?: string };

    let query = db.select({
      id: auditLogsTable.id,
      workspaceId: auditLogsTable.workspaceId,
      userName: auditLogsTable.userName,
      action: auditLogsTable.action,
      target: auditLogsTable.target,
      details: auditLogsTable.details,
      createdAt: auditLogsTable.createdAt,
      workspaceName: workspacesTable.name,
    })
      .from(auditLogsTable)
      .leftJoin(workspacesTable, eq(auditLogsTable.workspaceId, workspacesTable.id))
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(Math.min(Number(limit) || 100, 500));

    const logs = workspace_id
      ? await query.where(eq(auditLogsTable.workspaceId, workspace_id))
      : await query;

    const filtered = search
      ? logs.filter((l) => {
          const q = search.toLowerCase();
          return (
            (l.userName ?? "").toLowerCase().includes(q) ||
            l.action.toLowerCase().includes(q) ||
            (l.target ?? "").toLowerCase().includes(q) ||
            (l.workspaceName ?? "").toLowerCase().includes(q)
          );
        })
      : logs;

    res.json({ logs: filtered, total: filtered.length });
  } catch {
    res.status(500).json({ detail: "Failed to load audit logs" });
  }
});

export default router;
