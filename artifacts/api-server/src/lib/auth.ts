import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export type UserRole = "viewer" | "analyst" | "admin" | "owner";

const ROLE_RANK: Record<string, number> = {
  viewer: 0,
  analyst: 1,
  admin: 2,
  owner: 3,
};

function getJwtSecret(): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET env var is required");
  return secret;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(plain: string, hashed: string): boolean {
  try {
    return bcrypt.compareSync(plain, hashed);
  } catch {
    return false;
  }
}

export interface TokenPayload {
  sub: string;
  email: string;
  type: "access" | "refresh";
}

export function createAccessToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email, type: "access" }, getJwtSecret(), {
    expiresIn: "12h",
  });
}

export function createRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "refresh" }, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export function setAuthCookies(res: Response, userId: string, email: string): string {
  const access = createAccessToken(userId, email);
  const refresh = createRefreshToken(userId);
  const cookieOpts = {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  res.cookie("access_token", access, { ...cookieOpts, maxAge: 12 * 60 * 60 * 1000 });
  res.cookie("refresh_token", refresh, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
  return access;
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
}

export function verifyToken(token: string, expectedType: "access" | "refresh"): TokenPayload {
  const payload = jwt.verify(token, getJwtSecret()) as TokenPayload;
  if (payload.type !== expectedType) throw new Error("Invalid token type");
  return payload;
}

export type AuthedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  workspaceId: string | null;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

export async function getCurrentUser(req: Request): Promise<AuthedUser> {
  const tokenFromCookie = req.cookies?.["access_token"] as string | undefined;
  const authHeader = req.headers["authorization"] ?? "";
  const tokenFromHeader = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;
  const token = tokenFromCookie ?? tokenFromHeader;
  if (!token) throw Object.assign(new Error("Not authenticated"), { status: 401 });

  let payload: TokenPayload;
  try {
    payload = verifyToken(token, "access");
  } catch (err) {
    const msg = err instanceof jwt.TokenExpiredError ? "Token expired" : "Invalid token";
    throw Object.assign(new Error(msg), { status: 401 });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, payload.sub))
    .limit(1);

  if (!user) throw Object.assign(new Error("User not found"), { status: 401 });
  return { id: user.id, name: user.name, email: user.email, role: user.role, workspaceId: user.workspaceId };
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  getCurrentUser(req)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err: unknown) => {
      const status = (err as { status?: number }).status ?? 401;
      res.status(status).json({ detail: (err as Error).message });
    });
}

export function requireRole(minRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    getCurrentUser(req)
      .then((user) => {
        if ((ROLE_RANK[user.role] ?? 0) < (ROLE_RANK[minRole] ?? 0)) {
          res.status(403).json({ detail: "Insufficient permissions" });
          return;
        }
        req.user = user;
        next();
      })
      .catch((err: unknown) => {
        const status = (err as { status?: number }).status ?? 401;
        res.status(status).json({ detail: (err as Error).message });
      });
  };
}

export function publicUser(user: AuthedUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    workspace_id: user.workspaceId,
  };
}
