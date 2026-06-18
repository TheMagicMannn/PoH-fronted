import { Router } from "express";
import { randomUUID } from "crypto";
import { db } from "@workspace/db";
import { usersTable, auditLogsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole, hashPassword } from "../lib/auth.js";

const router = Router();

router.get("/workspace/members", requireAuth, async (req, res) => {
  try {
    const wsId = req.user!.workspaceId;
    if (!wsId) { res.status(400).json({ detail: "No workspace associated with this account" }); return; }

    const members = await db
      .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt })
      .from(usersTable)
      .where(eq(usersTable.workspaceId, wsId));

    res.json({ members });
  } catch {
    res.status(500).json({ detail: "Failed to fetch members" });
  }
});

router.post("/workspace/members", requireRole("admin"), async (req, res) => {
  try {
    const wsId = req.user!.workspaceId;
    if (!wsId) { res.status(400).json({ detail: "No workspace" }); return; }

    const { name, email, role = "analyst", password = "ChangeMe2026!" } = req.body as {
      name?: string; email?: string; role?: string; password?: string;
    };

    if (!name?.trim() || !email?.trim()) {
      res.status(400).json({ detail: "name and email are required" }); return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ detail: "An account with this email already exists" }); return;
    }

    const VALID_ROLES = ["viewer", "analyst", "admin"];
    if (!VALID_ROLES.includes(role)) {
      res.status(400).json({ detail: "Invalid role. Must be viewer, analyst, or admin" }); return;
    }

    const userId = randomUUID();
    await db.insert(usersTable).values({
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role,
      workspaceId: wsId,
    });

    await db.insert(auditLogsTable).values({
      id: randomUUID(),
      workspaceId: wsId,
      userName: req.user!.name,
      action: "member_invited",
      target: normalizedEmail,
      details: `Role: ${role}`,
    });

    res.status(201).json({ ok: true, id: userId, name: name.trim(), email: normalizedEmail, role });
  } catch {
    res.status(500).json({ detail: "Failed to invite member" });
  }
});

router.patch("/workspace/members/:id", requireRole("admin"), async (req, res) => {
  try {
    const wsId = req.user!.workspaceId;
    const { id } = req.params;
    const { role } = req.body as { role?: string };

    if (!role) { res.status(400).json({ detail: "role is required" }); return; }
    const VALID_ROLES = ["viewer", "analyst", "admin"];
    if (!VALID_ROLES.includes(role)) {
      res.status(400).json({ detail: "Invalid role" }); return;
    }

    const [member] = await db.select().from(usersTable).where(and(eq(usersTable.id, id), eq(usersTable.workspaceId, wsId!))).limit(1);
    if (!member) { res.status(404).json({ detail: "Member not found" }); return; }
    if (member.id === req.user!.id) { res.status(400).json({ detail: "Cannot change your own role" }); return; }

    await db.update(usersTable).set({ role }).where(eq(usersTable.id, id));

    await db.insert(auditLogsTable).values({
      id: randomUUID(),
      workspaceId: wsId!,
      userName: req.user!.name,
      action: "member_role_changed",
      target: member.email,
      details: `Role changed to ${role}`,
    });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ detail: "Failed to update member" });
  }
});

router.delete("/workspace/members/:id", requireRole("admin"), async (req, res) => {
  try {
    const wsId = req.user!.workspaceId;
    const { id } = req.params;

    const [member] = await db.select().from(usersTable).where(and(eq(usersTable.id, id), eq(usersTable.workspaceId, wsId!))).limit(1);
    if (!member) { res.status(404).json({ detail: "Member not found" }); return; }
    if (member.id === req.user!.id) { res.status(400).json({ detail: "Cannot remove yourself" }); return; }

    await db.delete(usersTable).where(eq(usersTable.id, id));

    await db.insert(auditLogsTable).values({
      id: randomUUID(),
      workspaceId: wsId!,
      userName: req.user!.name,
      action: "member_removed",
      target: member.email,
      details: `Member removed`,
    });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ detail: "Failed to remove member" });
  }
});

export default router;
