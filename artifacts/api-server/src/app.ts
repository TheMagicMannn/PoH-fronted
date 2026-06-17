import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { snakeCaseResponse } from "./lib/serialize.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(snakeCaseResponse);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve the pre-built browser SDK bundle
app.get("/api/poh.js", async (_req, res) => {
  try {
    const bundlePath = path.resolve(__dirname, "poh.js");
    const js = await readFile(bundlePath, "utf-8");
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(js);
  } catch {
    res.status(503).json({ detail: "SDK bundle not available" });
  }
});

app.use("/api", router);

export default app;
