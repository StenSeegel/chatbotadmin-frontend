# Campus Agents — Architecture Plan

## Overview

Campus Agents is a multi-tier agent orchestration platform that allows users to build, deploy, and monitor AI-powered agents and multi-agent workflows. The system is structured around three distinct abstraction layers that cleanly separate concerns: what an agent does, how agents collaborate, and how the system is accessed.

---

## Abstraction Model

### Layer 1 — Agent (Atomic Unit)

An Agent is the fundamental building block of the platform. It is a self-contained unit consisting of:

- **System Prompt** — defines the agent's role, behavior, and constraints
- **Model** — the underlying LLM (e.g. Claude Sonnet)
- **Tools** — callable actions the agent can perform, of two types:
  - *Native Tools* — internally implemented actions (API calls, lookups, writes)
  - *MCP Tools* — tools exposed by MCP Servers registered in the global MCP configuration (see Key Design Decisions); agents select from a curated list of pre-approved servers, they do not configure servers themselves
- **Knowledge** — document collections made available via RAG (retrieval-augmented generation)

An Agent can be used in two modes:
1. **Standalone** — deployed directly via a Connector (see Layer 3)
2. **As a building block** — referenced inside a Workflow (see Layer 2)

The existing Simple Agent Builder is refactored into the universal **Agent Editor**, which serves both modes without duplication.

---

### Layer 2 — Workflow (Orchestration)

A Workflow orchestrates multiple Agents to handle complex, multi-step tasks that a single agent cannot reliably solve alone. A Workflow consists of:

- **Trigger** — the event that starts the workflow (bound to a Connector)
- **Supervisor** — a routing and coordination layer that decides which Agent handles which part of the task, in what order, and under what conditions
- **Task Agents** — one or more Agents from Layer 1, reused without duplication
- **Output** — the result delivered via a Connector

The Supervisor is itself configurable: it can operate as a rule-based router (if condition X → Agent A) or as an LLM-driven orchestrator with its own system prompt.

Agents are never re-defined inside a Workflow. They are referenced by ID from the Agent Library (Layer 1). This means updates to an Agent are reflected everywhere it is used.

---

### Layer 3 — Deployment / Connectors

Connectors are orthogonal to both Agents and Workflows. Any Agent or Workflow can be bound to any Connector. The Connector defines how input reaches the system and how output is delivered.

**MVP Connectors:**

| Connector | Direction | Protocol | Notes |
|-----------|-----------|----------|-------|
| Chat Widget | In + Out | WebSocket / HTTP | Embeddable JS widget; configurable design, domain whitelist, embed code |
| API Webhook | In + Out | HTTP REST (OpenAI-compatible) | Stateless; API key auth; request/response format follows OpenAI chat completions schema |
| E-Mail | In + Out | EWS or Graph API (TBD) | Connects to existing shared mailboxes; protocol depends on infrastructure assessment — see Open Questions |
| MCP Server | In + Out | Model Context Protocol | Exposes an Agent or Workflow as an MCP Server; allows MCP-capable clients (e.g. other agents, Claude Desktop) to consume it as a tool |

Connector configuration is decoupled from Agent/Workflow configuration. The same Chat Widget instance could be re-pointed to a different Agent without generating a new embed code.

---

## Screen Architecture

### Agent Management

| Screen | Purpose |
|--------|---------|
| Agent List | Overview of all agents with status (standalone / used in workflows), last edited, deployment state |
| Agent Editor | Create and edit an agent: name, model, system prompt, tools, knowledge sources |
| Agent — Tools Tab | Attach and configure tools: Native Tools (internal actions) and MCP Tools (selected from globally registered MCP Servers) |
| Agent — Knowledge Tab | Upload documents, manage knowledge collections, configure chunking and retrieval settings |

### Workflow Management

| Screen | Purpose |
|--------|---------|
| Workflow List | Overview of all workflows with status, trigger type, last run |
| Workflow Canvas | Visual builder: place and connect Trigger → Supervisor → Agents → Output nodes |
| Supervisor Config | Configure routing logic: rule-based conditions or LLM-driven orchestration prompt |

### Connector Management

| Screen | Purpose |
|--------|---------|
| Connector List | All connectors across agents and workflows; filter by type |
| Connector Editor — Widget | Design (colors, avatar, welcome text), domain whitelist, embed code snippet |
| Connector Editor — API | Endpoint URL, API key management, request/response schema reference |
| Connector Editor — E-Mail | Shared mailbox address, reply-from settings, subject templates; protocol-specific config (EWS endpoint or Graph API OAuth) once infrastructure decision is finalized |
| Connector Editor — MCP Server | Tool name, description, capability schema; authentication settings; exposes the Agent or Workflow as a consumable MCP tool |

### Monitoring & Debugging

| Screen | Purpose |
|--------|---------|
| Run History | Paginated log of all executions across agents and workflows; filterable by status, connector, date |
| Run Detail / Trace | Step-by-step trace of a single execution: which agent ran, what input/output flowed through each node, latency, errors |
| Error Management | Failed runs grouped by type; retry controls; notification settings |

### Global

| Screen | Purpose |
|--------|---------|
| Dashboard | System-wide status: active deployments, recent runs, errors at a glance |
| MCP Server Management | Admin-only: register, configure, and disable MCP Servers available platform-wide; all servers must authenticate via the on-premises MCP Gateway |
| Settings | Team members, roles, global API keys, notification preferences |

---

## Key Design Decisions

### Agent Reuse Without Duplication
Agents are defined once and referenced by ID in any number of Workflows. There is no copy-on-use. This is the most important structural decision: it ensures consistency and reduces maintenance overhead as agents evolve.

### Connectors Are Not Owned by Agents or Workflows
A Connector is a first-class object that is linked to an Agent or Workflow, not embedded in one. This enables:
- Swapping the underlying agent without changing the embed code
- Running the same agent via multiple connectors simultaneously
- Reusing connector configuration across deployments

### E-Mail Connector — Protocol Decision Pending

The E-Mail Connector will connect to existing shared mailboxes in the organization's Microsoft mail infrastructure. Two protocols are under consideration:

**Option A — Exchange Web Services (EWS)**
Available on On-Premises Exchange without Microsoft 365. Uses a service account with mailbox delegation rights. Requires network access to the EWS endpoint (`/EWS/Exchange.asmx`) and firewall coordination with IT. Also supports calendar access natively via the same protocol, which is relevant for future extensions.

**Option B — Microsoft Graph API**
The modern Microsoft-recommended approach, suitable if the organization runs Exchange Online / Microsoft 365. Uses OAuth-based authentication (no stored passwords), supports push notifications (no polling), and scales cleanly. Requires an app registration in Azure AD.

The decision depends on the outcome of the infrastructure assessment with IT — specifically whether the environment is fully on-premises, hybrid, or moving toward Microsoft 365. Until that is confirmed, the connector UI and configuration schema will be designed protocol-agnostically, with the protocol-specific fields abstracted behind a provider selection.

### API Connector — OpenAI Compatibility
The API Connector exposes an HTTP endpoint following the OpenAI chat completions schema (`POST /v1/chat/completions`). This enables drop-in compatibility with any client or tool already built against the OpenAI API, without additional integration work.

### MCP Integration — Two Distinct Roles

Campus Agents integrates with the Model Context Protocol in two separate and complementary roles:

**1. MCP Client (Campus Agents consumes MCP Servers as Tools)**
Agents can use tools exposed by external MCP Servers. Campus Agents acts as an MCP Client, routing tool calls through the organization's on-premises MCP Gateway. This extends the agent tooling surface without requiring native integrations for every external system.

Security constraint: MCP Servers are configured exclusively by administrators in a global, platform-wide registry. Individual users building agents may select from the approved list of servers — they cannot add, modify, or directly connect to MCP Servers themselves. Every registered server must authenticate via the on-premises MCP Gateway; unauthenticated direct MCP connections are not permitted. This prevents the MCP tool layer from becoming an attack vector for prompt injection or data exfiltration via malicious servers.

**2. MCP Server (Campus Agents exposes Agents and Workflows as MCP Tools)**
Any Agent or Workflow can be published as an MCP Server via the MCP Server Connector. This allows MCP-capable clients — including other agent systems, Claude Desktop, or custom tooling — to invoke Campus Agents capabilities as structured tools. The MCP Server Connector is conceptually an extension of the API Webhook Connector, differing only in protocol: where the API Connector speaks OpenAI-compatible REST, the MCP Connector speaks the Model Context Protocol.

### Supervisor as Configurable Layer
The Supervisor is not a fixed routing engine. It is a configurable node that can operate in two modes:
1. **Rule-based** — deterministic routing based on user-defined conditions (e.g. message contains keyword X → Agent A)
2. **LLM-driven** — the Supervisor is itself an agent with a system prompt that decides routing dynamically

Both modes are supported from the start. The choice is made per workflow in the Supervisor Config screen.

---

## MVP Scope

In scope for the initial release:

- Agent Editor (refactored from existing Simple Agent Builder), including MCP Tool selection from global registry
- Workflow Canvas with Supervisor, up to N Task Agents, Trigger and Output nodes
- Four Connectors: Chat Widget, API Webhook, E-Mail (protocol TBD — EWS or Graph API), MCP Server
- Global MCP Server Management (admin-only, Gateway-enforced authentication)
- Run History and Run Detail / Trace screens
- Dashboard

Out of scope for MVP:

- Additional Connectors (Slack, Teams, Scheduler)
- A/B testing across agent deployments
- Analytics and cost tracking
- Template gallery
- Sandbox / test environment (beyond inline test buttons in the editors)

---

## Open Questions

1. **Supervisor model selection** — Does the Supervisor always use the same model as the Task Agents, or is it configurable independently?
2. **Agent versioning** — When an Agent used in a Workflow is updated, does the Workflow pick up the change immediately or on next deploy? Should rollback be supported?
3. **Widget identity** — If a Chat Widget is re-pointed to a different Agent, do existing conversation threads carry over or reset?
4. **E-Mail protocol** — EWS (On-Premises Exchange) or Microsoft Graph API (Exchange Online / M365)? Depends on IT infrastructure assessment: Exchange version, whether EWS endpoint is reachable, and the organization's longer-term infrastructure roadmap. Also determines whether calendar access is available via the same connector.
5. **Multi-tenancy** — Is the platform single-tenant (one organization) or multi-tenant from day one? This affects data isolation, connector scoping, and the settings model.
6. **MCP Gateway capabilities** — Which authentication methods does the on-premises MCP Gateway support? Does it handle authorization scopes per server, or is access binary (allowed / not allowed)? This determines how granular the MCP Server registry configuration needs to be.
