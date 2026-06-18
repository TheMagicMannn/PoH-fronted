import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const pageViewsTable = pgTable("page_views", {
  id:             text("id").primaryKey(),
  sessionId:      text("session_id").notNull(),
  workspaceId:    text("workspace_id").notNull(),
  url:            text("url").notNull(),
  path:           text("path"),
  title:          text("title"),
  referrer:       text("referrer"),
  timeOnPageMs:   integer("time_on_page_ms"),
  scrollDepthPct: integer("scroll_depth_pct"),
  enteredAt:      timestamp("entered_at", { withTimezone: true }).notNull().defaultNow(),
  exitedAt:       timestamp("exited_at",  { withTimezone: true }),
});
