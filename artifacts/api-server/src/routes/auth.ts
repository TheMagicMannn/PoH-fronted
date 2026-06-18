import { Router } from "express";
import { randomUUID, randomBytes } from "crypto";
import { db } from "@workspace/db";
import { usersTable, workspacesTable, sitesTable, passwordResetTokensTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  setAuthCookies,
  clearAuthCookies,
  verifyToken,
  publicUser,
  requireAuth,
  type TokenPayload,
} from "../lib/auth.js";

const router = Router();

async function createWorkspaceFor(userId: string, name: string): Promise<string> {
  const wsId = randomUUID();
  const sdkKey = "poh_" + randomBytes(16).toString("hex");
  const siteId = randomUUID();
  await db.insert(workspacesTable).values({
    id: wsId,
    name,
    ownerId: userId,
    sensitivityProfile: "balanced",
    plan: "Growth",
  });
  await db.insert(sitesTable).values({
    id: siteId,
    workspaceId: wsId,
    name,
    domain: "example.com",
    sdkKey,
  });
  return wsId;
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, company } = req.body as {
      name: string;
      email: string;
      password: string;
      company?: string;
    };

    if (!name || !email || !password) {
      res.status(400).json({ detail: "name, email and password are required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      res.status(400).json({ detail: "An account with this email already exists" });
      return;
    }

    const userId = randomUUID();
    const wsName = (company ?? `${name.split(" ")[0]}'s Workspace`).trim();
    const wsId = await createWorkspaceFor(userId, wsName);

    await db.insert(usersTable).values({
      id: userId,
      name,
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role: "admin",
      workspaceId: wsId,
    });

    const user = { id: userId, name, email: normalizedEmail, role: "admin", workspaceId: wsId };
    setAuthCookies(res, userId, normalizedEmail);
    res.status(201).json(publicUser(user));
  } catch (err) {
    res.status(500).json({ detail: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      res.status(400).json({ detail: "email and password are required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail))
      .limit(1);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ detail: "Invalid email or password" });
      return;
    }

    setAuthCookies(res, user.id, user.email);
    res.json(publicUser({ id: user.id, name: user.name, email: user.email, role: user.role, workspaceId: user.workspaceId }));
  } catch (err) {
    res.status(500).json({ detail: "Login failed" });
  }
});

router.post("/logout", requireAuth, (_req, res) => {
  clearAuthCookies(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json(publicUser(req.user!));
});

router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const uid = req.user!.id;
    const { name } = req.body as { name?: string };
    if (!name?.trim()) { res.status(400).json({ detail: "name is required" }); return; }
    await db.update(usersTable).set({ name: name.trim() }).where(eq(usersTable.id, uid));
    res.json({ ok: true, name: name.trim() });
  } catch {
    res.status(500).json({ detail: "Failed to update profile" });
  }
});

router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const uid = req.user!.id;
    const { current_password, new_password } = req.body as { current_password?: string; new_password?: string };
    if (!current_password || !new_password) { res.status(400).json({ detail: "current_password and new_password are required" }); return; }
    if (new_password.length < 8) { res.status(400).json({ detail: "New password must be at least 8 characters" }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, uid)).limit(1);
    if (!user || !verifyPassword(current_password, user.passwordHash)) {
      res.status(401).json({ detail: "Current password is incorrect" }); return;
    }
    await db.update(usersTable).set({ passwordHash: hashPassword(new_password) }).where(eq(usersTable.id, uid));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ detail: "Failed to change password" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email?.trim()) { res.status(400).json({ detail: "email is required" }); return; }

    const [user] = await db
      .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()))
      .limit(1);

    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await db.insert(passwordResetTokensTable).values({
        id: randomUUID(),
        userId: user.id,
        token,
        expiresAt,
      });

      const resetUrl = `${process.env["APP_URL"] ?? "http://localhost:23863"}/reset-password?token=${token}`;
      console.log(`\n[PASSWORD RESET] User: ${user.email}\nReset URL: ${resetUrl}\n`);
    }

    res.json({ ok: true, message: "If an account exists for that email, a reset link has been sent." });
  } catch {
    res.status(500).json({ detail: "Failed to process request" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, new_password } = req.body as { token?: string; new_password?: string };
    if (!token) { res.status(400).json({ detail: "token is required" }); return; }
    if (!new_password || new_password.length < 8) {
      res.status(400).json({ detail: "new_password must be at least 8 characters" }); return;
    }

    const [resetToken] = await db
      .select()
      .from(passwordResetTokensTable)
      .where(eq(passwordResetTokensTable.token, token))
      .limit(1);

    if (!resetToken) { res.status(400).json({ detail: "Invalid or expired reset token" }); return; }
    if (resetToken.usedAt) { res.status(400).json({ detail: "This reset link has already been used" }); return; }
    if (new Date() > resetToken.expiresAt) { res.status(400).json({ detail: "Reset link has expired. Please request a new one." }); return; }

    await db.update(usersTable).set({ passwordHash: hashPassword(new_password) }).where(eq(usersTable.id, resetToken.userId));
    await db.update(passwordResetTokensTable).set({ usedAt: new Date() }).where(eq(passwordResetTokensTable.id, resetToken.id));

    res.json({ ok: true, message: "Password updated successfully. You can now sign in." });
  } catch {
    res.status(500).json({ detail: "Failed to reset password" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies?.["refresh_token"] as string | undefined;
    if (!token) {
      res.status(401).json({ detail: "No refresh token" });
      return;
    }

    let payload: TokenPayload;
    try {
      payload = verifyToken(token, "refresh");
    } catch {
      res.status(401).json({ detail: "Invalid refresh token" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.sub))
      .limit(1);

    if (!user) {
      res.status(401).json({ detail: "User not found" });
      return;
    }

    setAuthCookies(res, user.id, user.email);
    res.json(publicUser({ id: user.id, name: user.name, email: user.email, role: user.role, workspaceId: user.workspaceId }));
  } catch {
    res.status(500).json({ detail: "Refresh failed" });
  }
});

export default router;
