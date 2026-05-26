# Skills & Agents Registry

A Firebase-hosted registry of MCP (Model Context Protocol) servers and ZybOS agents.
Used by the [skill-loader-agent](https://github.com/zyb-os/skill-loader-agent) to
dynamically acquire capabilities at runtime.

## Live

**Catalog:** `https://zybos-registry.web.app/catalog.json`  
**Browser:** `https://zybos-registry.web.app`

## Catalog

84 servers across 24 categories — including 5 **openclaw agent** entries (`agent` / `docker` types):

| Category | Servers |
|---|---|
| Productivity | Google Drive, Notion, Notion (Extended), Linear, Linear (Extended), Jira/Confluence, Airtable, Google Calendar, Google Sheets, Asana, Obsidian, Todoist, Box |
| Database | PostgreSQL, SQLite, MySQL, MongoDB, Redis, Supabase, Elasticsearch, Neon, Qdrant, Weaviate, Upstash, Snowflake, BigQuery |
| Development | GitHub, GitLab, Git, Sentry, GitHub Actions, **Code Execution Agent**, **Code Execution Agent (Docker)** |
| Communication | Slack, Discord, Gmail, Twilio, SendGrid, Resend, Telegram |
| Cloud | Cloudflare, AWS Knowledge Base, AWS, Vercel, Netlify |
| AI | OpenAI, OpenAI (Extended), Anthropic Claude, Pinecone, EverArt |
| Search | Brave Search, Perplexity, Tavily, Exa |
| Browser | Playwright, Puppeteer, **Browser Agent**, **Browser Agent (Docker)** |
| Infrastructure | Docker, Kubernetes |
| CRM | HubSpot, Salesforce, Zendesk, Intercom |
| Analytics | PostHog, Mixpanel |
| Media | YouTube, Spotify |
| Payments | Stripe |
| Ecommerce | Shopify |
| Design | Figma |
| Social | X / Twitter |
| Observability | Datadog, Grafana, PagerDuty |
| Web | Fetch |
| Utilities | Filesystem, Time, **Filesystem Agent (Docker)** |
| Location | Google Maps |
| Memory | Memory (Knowledge Graph) |
| Reasoning | Sequential Thinking |
| Weather | OpenWeather |
| Testing | Everything |

## Adding a server

1. Edit `public/catalog.json` — add an entry to the `servers` array
2. Push to `main` — GitHub Actions auto-deploys to Firebase Hosting
3. Optionally run `cd scripts && npm install && node seed.js` to sync Firestore

### Entry format

```json
{
  "id": "my-server",
  "name": "My Server",
  "description": "What it does.",
  "capabilities": ["snake_case_tool_name"],
  "category": "utilities",
  "tags": ["keyword1", "keyword2"],
  "install": {
    "type": "npx",
    "package": "@scope/mcp-server-name",
    "args": [],
    "env_required": [
      { "key": "API_KEY", "description": "Where to get it" }
    ],
    "env_optional": []
  },
  "source_url": "https://github.com/...",
  "version": "latest",
  "verified": false
}
```

### Agent / Docker entry format (openclaw skills)

Openclaw skills are full agents that **self-register** with the orchestrator.
The skill-loader just launches them and waits for them to appear.

```json
{
  "id": "my-agent",
  "install": {
    "type": "agent",
    "package": "my-pip-package",
    "command": ["python", "-m", "my_module"],
    "args": [],
    "env_required": [{ "key": "MY_API_KEY", "description": "..." }],
    "env_optional": [],
    "os_support": {
      "linux":   "✅ Full support",
      "macos":   "✅ Full support",
      "windows": "✅ Full support (Python 3.11+)"
    }
  }
}
```

```json
{
  "id": "my-agent-docker",
  "install": {
    "type": "docker",
    "package": "ghcr.io/my-org/my-agent:latest",
    "args": ["-v", "/host/data:/data"],
    "env_required": [{ "key": "MY_API_KEY", "description": "..." }],
    "env_optional": [
      { "key": "ORCHESTRATOR_EXTERNAL_URL",
        "description": "Override ORCHESTRATOR_URL inside the container. Required on macOS/Windows." }
    ],
    "os_support": {
      "linux":   "✅ --network=host auto-applied",
      "macos":   "✅ Docker Desktop ≥4.x — set ORCHESTRATOR_EXTERNAL_URL",
      "windows": "✅ Docker Desktop + WSL2 — set ORCHESTRATOR_EXTERNAL_URL"
    }
  }
}
```

`install.type` is one of `npx`, `uvx`, `pip`, `agent`, or `docker`.

#### OS support matrix

| Type   | Linux | macOS | Windows |
|--------|-------|-------|---------|
| `npx`  | ✅ | ✅ | ✅ Node.js ≥18 |
| `uvx`  | ✅ | ✅ | ✅ uv required |
| `pip`  | ✅ | ✅ | ✅ Python 3.11+ |
| `agent` | ✅ | ✅ | ✅ Python 3.11+ |
| `docker` | ✅ | ✅ Docker Desktop ≥4.x | ✅ Docker Desktop + WSL2 |

> **macOS/Windows Docker note:** `--network=host` is not supported. Set
> `ORCHESTRATOR_EXTERNAL_URL` to your host's LAN IP or `host.docker.internal`
> so the container can reach the orchestrator.

## Setup

### 1. Create Firebase project

```bash
firebase projects:create zybos-registry --display-name "MCP Registry"
firebase use zybos-registry
```

### 2. Enable Firestore

```bash
firebase firestore:databases:create --location=us-central
```

### 3. Deploy

```bash
firebase deploy
```

### 4. Seed Firestore (optional — catalog.json is the primary source)

```bash
cd scripts && npm install && node seed.js
```

### 5. Add GitHub secret for CI/CD

In Firebase Console → Project Settings → Service Accounts → Generate new private key.  
Add the JSON content as `FIREBASE_SERVICE_ACCOUNT` in GitHub → Settings → Secrets.

## API

| Endpoint | Description |
|---|---|
| `GET /catalog.json` | Full catalog — primary API used by skill-loader-agent |
| `GET /` | Visual catalog browser |
