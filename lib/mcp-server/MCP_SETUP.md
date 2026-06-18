# PoH MCP Server — Setup Guide

The PoH MCP (Model Context Protocol) server lets AI agents — Claude, GPT-4o, Cursor, Windsurf, Zed, or any MCP-compatible host — query, analyse, and act on your fraud & trust data in natural language.

---

## What the MCP server provides

### 16 Tools
| Tool | What it does |
|------|-------------|
| `get_overview` | Full dashboard KPIs, trends, breakdowns by source / country / device |
| `get_health` | Real-time health score, fraud burst level, rolling metrics |
| `list_sessions` | Paginated, filtered session list with all engine scores |
| `get_session` | Complete session detail — TIE composite score, 8 module breakdown, reason codes |
| `take_session_action` | Manually block / trust / flag a session |
| `list_campaigns` | Per-campaign fraud rates, wasted spend, invalid traffic |
| `list_conversions` | Conversion quality with suppression recommendations |
| `list_investigations` | Open and closed fraud investigation cases |
| `create_investigation` | Open a new fraud investigation |
| `list_fraud_clusters` | Identified bot/fraud clusters with session counts |
| `list_alerts` | Recent platform alerts and unread count |
| `list_rules` | Custom detection rules |
| `create_rule` | Create a new fraud detection rule |
| `score_session` | Score any session in real time via `/collect` |
| `get_workspace_info` | Workspace details + configured sites + SDK keys |
| `get_reason_codes` | Full catalogue of detection reason code labels |

### 2 Resources (live data)
- `poh://overview` — live 7-day overview, readable by the agent at any time
- `poh://health` — real-time health score

### 3 Prompts (structured analysis templates)
- `analyze_campaign_fraud` — deep campaign analysis with financial impact
- `investigate_session` — forensic breakdown of a single session
- `fraud_weekly_report` — full weekly intelligence report

---

## Prerequisites

1. **Node.js 18+** installed on the machine running your AI agent host (Claude Desktop, Cursor, etc.)
2. A PoH workspace with at least one site configured
3. Your PoH credentials (email + password) **or** an API token

---

## Step 1 — Build the server

From the workspace root:

```bash
pnpm --filter @workspace/poh-mcp run build
```

This produces a single self-contained file at:

```
lib/mcp-server/dist/index.js
```

Find its absolute path:

```bash
realpath lib/mcp-server/dist/index.js
# e.g. /home/runner/workspace/lib/mcp-server/dist/index.js
```

---

## Step 2 — Get your credentials

### Option A — Email & password (simplest)
Use the same email/password you log into the PoH dashboard with.

### Option B — API token (recommended for production)
1. Open your PoH dashboard
2. Open DevTools → Application → Local Storage → your domain
3. Copy the value of the `poh_token` key

Or via the API:

```bash
curl -s -X POST https://po-h-replit.replit.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}' \
  | jq -r '.token'
```

---

## Step 3 — Configure your AI agent host

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or  
`%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "poh-fraud-intelligence": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/lib/mcp-server/dist/index.js"],
      "env": {
        "POH_API_URL": "https://po-h-replit.replit.app/api",
        "POH_EMAIL": "you@example.com",
        "POH_PASSWORD": "yourpassword"
      }
    }
  }
}
```

Or with a token instead:

```json
{
  "mcpServers": {
    "poh-fraud-intelligence": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/lib/mcp-server/dist/index.js"],
      "env": {
        "POH_API_URL": "https://po-h-replit.replit.app/api",
        "POH_API_TOKEN": "eyJhbGci..."
      }
    }
  }
}
```

Restart Claude Desktop. You should see the PoH tools appear in the tool picker (🔧 icon).

---

### Cursor

Open **Cursor Settings → MCP** (or `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "poh-fraud-intelligence": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/lib/mcp-server/dist/index.js"],
      "env": {
        "POH_API_URL": "https://po-h-replit.replit.app/api",
        "POH_EMAIL": "you@example.com",
        "POH_PASSWORD": "yourpassword"
      }
    }
  }
}
```

Reload Cursor. The PoH tools are available in any Composer or chat session.

---

### Windsurf (Codeium)

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "poh-fraud-intelligence": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/lib/mcp-server/dist/index.js"],
      "env": {
        "POH_API_URL": "https://po-h-replit.replit.app/api",
        "POH_EMAIL": "you@example.com",
        "POH_PASSWORD": "yourpassword"
      }
    }
  }
}
```

---

### Zed Editor

In your `~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "poh-fraud-intelligence": {
      "command": {
        "path": "node",
        "args": ["/ABSOLUTE/PATH/TO/lib/mcp-server/dist/index.js"],
        "env": {
          "POH_API_URL": "https://po-h-replit.replit.app/api",
          "POH_EMAIL": "you@example.com",
          "POH_PASSWORD": "yourpassword"
        }
      }
    }
  }
}
```

---

### OpenAI Agents SDK (Python)

```python
from agents import Agent, MCPServerStdio

poh_server = MCPServerStdio(
    name="poh-fraud-intelligence",
    params={
        "command": "node",
        "args": ["/ABSOLUTE/PATH/TO/lib/mcp-server/dist/index.js"],
        "env": {
            "POH_API_URL": "https://po-h-replit.replit.app/api",
            "POH_EMAIL": "you@example.com",
            "POH_PASSWORD": "yourpassword",
        },
    },
)

agent = Agent(
    name="Fraud Analyst",
    instructions="You are a fraud intelligence analyst. Use the PoH tools to answer questions about ad fraud, session quality, and campaign performance.",
    mcp_servers=[poh_server],
)
```

---

### LangChain / LangGraph (Python)

```python
from langchain_mcp_adapters.client import MultiServerMCPClient

async with MultiServerMCPClient({
    "poh-fraud-intelligence": {
        "command": "node",
        "args": ["/ABSOLUTE/PATH/TO/lib/mcp-server/dist/index.js"],
        "transport": "stdio",
        "env": {
            "POH_API_URL": "https://po-h-replit.replit.app/api",
            "POH_EMAIL": "you@example.com",
            "POH_PASSWORD": "yourpassword",
        },
    }
}) as client:
    tools = await client.get_tools()
    # use tools in your LangGraph workflow
```

---

### Raw MCP (any client)

The server speaks plain JSON-RPC 2.0 over stdio. Start it with:

```bash
POH_API_URL=https://po-h-replit.replit.app/api \
POH_EMAIL=you@example.com \
POH_PASSWORD=yourpassword \
node /path/to/dist/index.js
```

Then send MCP messages to stdin and read responses from stdout.

---

## Step 4 — Test it

### Quick smoke test

In a terminal (with env vars set):

```bash
export POH_API_URL=https://po-h-replit.replit.app/api
export POH_EMAIL=you@example.com
export POH_PASSWORD=yourpassword

echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  | node lib/mcp-server/dist/index.js
```

You should see a JSON response listing all 16 tools.

### In Claude Desktop

After configuring, ask Claude:

> "What's my current fraud rate and which campaign has the most invalid traffic this week?"

Claude will call `get_overview` and `list_campaigns` automatically and give you a structured answer.

---

## Example queries for your AI agent

Once configured, you can ask natural-language questions:

```
"What's our platform health score right now?"
→ Uses: get_health

"Show me all fraudulent sessions from Google Ads in the last 7 days."
→ Uses: list_sessions (classification=fraudulent, source=google, days=7)

"Which campaign has the highest fraud rate this month?"
→ Uses: list_campaigns (days=30)

"Explain everything suspicious about session abc-123."
→ Uses: get_session, get_reason_codes

"Block session abc-123 — it's a clear bot."
→ Uses: take_session_action (action=block)

"How much ad spend did we waste to fraud last week?"
→ Uses: get_overview (days=7)

"Create an investigation for the bot cluster hitting our Meta Ads campaigns."
→ Uses: create_investigation

"Write me a weekly fraud report."
→ Uses: fraud_weekly_report prompt (calls 8 tools automatically)

"Create a rule to block all sessions from datacenters with fraud score > 75."
→ Uses: create_rule
```

---

## Environment variables reference

| Variable | Required | Description |
|----------|----------|-------------|
| `POH_API_URL` | No | PoH API base URL. Defaults to `https://po-h-replit.replit.app/api` |
| `POH_API_TOKEN` | One of these | Pre-obtained JWT bearer token (preferred for stability) |
| `POH_EMAIL` | One of these | Workspace email for auto-login |
| `POH_PASSWORD` | One of these | Workspace password for auto-login |

> **Token expiry:** JWT tokens expire after 24 hours. If using `POH_API_TOKEN`, refresh it daily or switch to email/password which auto-renews on each server start.

---

## Troubleshooting

**"No credentials configured" warning**  
→ Set `POH_API_TOKEN` or both `POH_EMAIL` and `POH_PASSWORD` in the env block.

**Tools not appearing in Claude Desktop**  
→ Check the path in `args` is the absolute path to `dist/index.js`. Run `node /that/path` manually to verify no errors.

**"401 Unauthorized" errors**  
→ Your token has expired. Re-obtain it from the login API or use email/password mode.

**"ECONNREFUSED" errors**  
→ The PoH API is unreachable. Check `POH_API_URL` is correct and the server is running.

**Slow responses**  
→ Some tools (like `fraud_weekly_report`) make 6–8 API calls. This is normal — the prompt coordinates multiple tool calls automatically.

---

## Architecture

```
AI Agent Host (Claude Desktop / Cursor / etc.)
        │
        │  JSON-RPC 2.0 over stdio
        ▼
┌─────────────────────────────┐
│   PoH MCP Server            │
│   lib/mcp-server/dist/      │
│                             │
│   16 tools                  │
│   2 resources               │
│   3 prompts                 │
└─────────┬───────────────────┘
          │  HTTPS / REST
          ▼
┌─────────────────────────────┐
│   PoH API Server            │
│   artifacts/api-server      │
│                             │
│   /overview  /sessions      │
│   /campaigns /collect       │
│   /investigations /rules    │
│   ...16 endpoints           │
└─────────┬───────────────────┘
          │  SQL
          ▼
┌─────────────────────────────┐
│   PostgreSQL                │
│   sessions, conversions,    │
│   campaigns, rules, ...     │
└─────────────────────────────┘
```
