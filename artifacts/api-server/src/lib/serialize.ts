import type { Request, Response, NextFunction } from "express";

function toSnake(str: string): string {
  return str.replace(/([A-Z])/g, (ch) => `_${ch.toLowerCase()}`);
}

function convertKeys(val: unknown): unknown {
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) return val.map(convertKeys);
  if (typeof val === "object" && !(val instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      out[toSnake(k)] = convertKeys(v);
    }
    return out;
  }
  return val;
}

export function snakeCaseResponse(_req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    return originalJson(convertKeys(body));
  };
  next();
}
