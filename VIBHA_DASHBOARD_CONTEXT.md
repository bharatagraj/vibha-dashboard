# Vibha Dashboard Platform — Claude Session Context
# Version: 1.0 | Created: May 2026
# Purpose: Paste at the start of ANY Claude session on this project.
#          Keeps Claude anchored to all brainstorm decisions made so far.
# Project folder: C:\Users\bhara\Projects\Claude\VibhaDashboard\
# Claude Project: Agentic AI driven Web based - Vibha Dashboard Platform
# ============================================================

## WHAT THIS IS

An **Agentic AI driven, web-based, horizontal dashboard platform** for
Vibha Technologies Pvt. Ltd. This is NOT a feature inside GreenOps or
VibhaSaaS — it is a standalone PLATFORM product that every SaaS/AaaS
solution Vibha builds will consume.

**Core value proposition:**
- Replaces costly tools (Tableau, Power BI, Metabase, Looker) — zero licence cost
- Sales weapon: live NL → chart demos pull enterprise clients
- Ships with every product — no product is complete or salable without it
- Security as a selling point, especially for Healthcare (HIPAA) and BnFs (SOC2)

---

## FOUNDER & COMPANY

Bharatagraj Shinde — Senior Cloud Data Architect, 30+ years enterprise experience
(HCA Nashville, Lloyds Banking Group, Defra UK, American Express, CPI-MMIC)
Company: Vibha Technologies Pvt. Ltd. — AI-native, bootstrapped startup, Indian SMEs
Domain depth: 13+ domains, primarily BnFs (15yr), Healthcare (5yr), GreenOps (3yr)

---

## CONSUMERS OF THIS PLATFORM

| Solution         | Domain            | UI Stack           | Status     |
|------------------|-------------------|--------------------|------------|
| VibhaSaaS        | SME intelligence  | Flutter + webview  | Active     |
| GreenOps         | Carbon / ESG      | React / Next.js    | Active     |
| BMS connector    | Building mgmt     | TBD                | Active     |
| Future BnFs      | Banking / Finance | Web-first          | Planned    |
| Future Healthcare| Clinical / Ops    | Web-first          | Planned    |
| CRM module       | Customer mgmt     | Flutter + webview  | Planned    |

---

## HARD RULES — NEVER VIOLATE

Inherited from VibhaSaaS CLAUDE.md and extended for this platform:

| Rule                          | Use instead                          |
|-------------------------------|--------------------------------------|
| No Redis                      | Valkey 7.2+ (already installed)      |
| No RabbitMQ                   | Kafka 3.7+ KRaft                     |
| No ChromaDB / vector DB       | pgvector inside PostgreSQL 18        |
| No LangGraph / CrewAI         | Rig (Rust-native agent framework)    |
| No Go                         | Rust everywhere in backend           |
| No Next.js                    | React + TypeScript + Vite            |
| No Node.js server layer       | JWT goes browser → Axum directly     |
| Python only in ai-services/   | Never in Rust crates or DB layer     |
| 100% open source              | No proprietary dashboarding tools    |
| 100% API pluggable            | Every layer must have a clean interface |

---

## TECHNOLOGY STACK (decided)

### Frontend
| Layer          | Technology                  | Notes                                  |
|----------------|-----------------------------|----------------------------------------|
| Framework      | React + TypeScript          | Decided — no Angular, no Vue           |
| Build tool     | Vite                        | Decided — NOT webpack, NOT Next.js     |
| Charts         | D3.js                       | Full custom viz — Sankey, treemap, etc |
| Styling        | TBD                         | To be decided                          |
| Theming        | White-label per client      | Per-solution branding capability       |

### Backend API
| Layer          | Technology                  | Notes                                  |
|----------------|-----------------------------|----------------------------------------|
| API server     | Rust + Axum 0.7+            | Consistent with VibhaSaaS             |
| DB access      | SQLx 0.7+                   | Compile-time verified SQL, no ORM      |
| Auth           | JWT (RS256) + OAuth2        | Browser → Axum direct, no Node hop    |
| Multi-tenancy  | PostgreSQL 18 RLS           | app.current_org_id on every query      |

### AI Intent Engine
| Layer          | Technology                  | Notes                                  |
|----------------|-----------------------------|----------------------------------------|
| Cloud AI       | Claude API (Sonnet)         | NL → chart spec JSON                  |
| Local AI       | Ollama + Mistral 7B         | Air-gapped / HIPAA / BnFs deployments  |
| Layer location | Python in ai-services/      | Within VibhaSaaS polyglot boundary    |
| Communication  | REST to Axum                | Kafka also acceptable                  |
| Schema context | RAG injection               | Domain metadata injected per solution  |

### Data Layer
| Layer          | Technology                  | Notes                                  |
|----------------|-----------------------------|----------------------------------------|
| Cache          | Valkey 7.2+                 | Replaces Redis (BSD licence)           |
| Event bus      | Kafka 3.7+ KRaft            | No ZooKeeper                           |
| In-browser     | DuckDB-WASM + Apache Arrow  | Raw data never leaves browser          |
| Server query   | DuckDB (server-side)        | Large dataset fallback                 |
| Lakehouse      | Apache Iceberg              | GreenOps primary format                |
| Operational DB | PostgreSQL 18 (port 5434)   | VibhaSaaS; BMS on 5433                 |
| Transforms     | dbt                         | Domain-specific metric definitions     |

### Security (cross-cutting — every layer)
| Control                  | Implementation                                    |
|--------------------------|---------------------------------------------------|
| Auth                     | JWT RS256 → Axum CallerContext                   |
| Multi-tenant isolation   | PostgreSQL 18 RLS on all tables                  |
| Prompt injection defence | NeMo Guardrails + Bifrost CEL sidecar            |
| Audit trail              | Kafka append-only + TimescaleDB hypertable       |
| Compliance targets       | HIPAA, SOC2, ISO 27001, DPDP (India), RBI        |
| Secrets                  | HashiCorp Vault (prod), gitleaks pre-commit      |
| CVE scanning             | Trivy + Grype + cargo audit in CI                |

---

## ARCHITECTURE DECISIONS (brainstorm phase — May 2026)

### Decided ✅
1. **Generic platform from day one** — 2 consumers already (GreenOps + VibhaSaaS),
   break-even already reached. Not GreenOps-specific.
2. **Web-first** — enterprise dashboards are large-screen analytical tools.
   Flutter apps access via webview_flutter or browser deep-link.
3. **React + TypeScript + Vite** — NOT Next.js. No Node.js middleman.
   JWT goes browser → Rust/Axum directly. One auth boundary.
4. **D3.js for rendering** — full custom viz capability.
5. **AI intent engine in Python ai-services/** — within polyglot rules.
6. **100% open source** — no proprietary dashboarding tools ever.
7. **100% API pluggable** — schema registry, source adapters, chart spec contract
   all have clean interfaces for any solution to plug in.
8. **Security built-in from day one** — not bolted on. Component A pattern
   (compile-time enforcer) applies here too.

### Still to design 🔲
- Schema registry — how domain metadata registers per solution
- Universal chart spec JSON contract — the standard the AI produces,
  the D3 renderer consumes
- Security layer specifics — RLS scoping, prompt injection defence
  in the AI intent engine, NL query audit trail
- Source adapter interface — pluggable connector contract
- White-label theming system
- Export capability (PDF, PNG, shareable URL, iframe embed)

---

## DOMAIN COMPLIANCE REQUIREMENTS

| Domain     | Standard         | Dashboard platform must support                     |
|------------|------------------|-----------------------------------------------------|
| Healthcare | HIPAA            | PHI audit trail, data minimisation, encryption      |
| BnFs       | SOC2 + PCI-DSS   | Access controls, audit log, pen test evidence       |
| GreenOps   | GHG Protocol / CSRD | Data lineage, calculation audit trail            |
| All        | ISO 27001        | Information security management baseline            |
| India      | DPDP + RBI       | 7-year data retention, data residency on-prem       |

---

## RELATED PROJECTS & FILES

| Project         | Location                                          |
|-----------------|---------------------------------------------------|
| VibhaSaaS       | C:\vibha-saas\                                    |
| VibhaSaaS context | C:\Users\bhara\Projects\Claude\VIBHA_SESSION_CONTEXT.md |
| Security arch   | C:\Users\bhara\Projects\Claude\AgenticAI_Security_Architecture_VibhaSaaS_v2.docx |
| GreenOps        | C:\Users\bhara\Projects\Claude\GreenOps\          |
| This project    | C:\Users\bhara\Projects\Claude\VibhaDashboard\    |
| ADR folder      | C:\Users\bhara\Projects\Claude\VibhaDashboard\ADR\ |
| Brainstorm docs | C:\Users\bhara\Projects\Claude\VibhaDashboard\brainstorm\ |

---

## SESSION DISCIPLINE

1. This is a brainstorming platform — no code until architecture is signed off.
2. Read this file at the start of every session.
3. Check ADR\ folder for any recorded decisions before proposing alternatives.
4. When a decision is made, record it here AND in ADR\.
5. Never propose Redis, Next.js, Node.js server layer, or proprietary tools.
6. Security is non-negotiable — never suggest deferring it.

---

## NEXT BRAINSTORM TOPICS (priority order)

1. Schema registry design — domain metadata, pluggable per solution
2. Universal chart spec JSON contract — AI produces, D3 consumes
3. Security layer — RLS scoping, prompt injection, NL query audit
4. Source adapter interface — pluggable connector contract
5. White-label theming system
