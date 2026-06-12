# Vibha Dashboard Platform — Product Roadmap

**Status:** MVP v1.0 feature-complete and demo-ready (June 2026)

---

## v1.0 (Shipped — June 2026)

**The foundation:** Professional BI dashboard engine with enterprise visual polish, click-to-filter interactivity, multi-format exports, and real-time schema discovery.

**What's included:**
- Dashboard create/select/edit with persistent save/load
- Dynamic schema discovery (real `information_schema` queries)
- Analytics Scopes → executable queries → live data
- Chart types: pie, line, bar, area (ECharts, muted professional theme)
- Click-to-filter via event bus (isolated to card headers — preserves click actions)
- 10 export formats: PNG/JPG/SVG/PDF/PPTX/JSON (chart-level); CSV/PDF/Excel/PPTX (dashboard-level)
- PowerBI-style drag/resize grid layout (react-grid-layout, independent widgets, 12-col × 80px)
- Confidence scoring engine with Mistral 7B + Claude API fallback
- 15 backend unit tests passing; <200ms chart render time

**For users:** "Tableau-class dashboard in an open-source package."

---

## v1.1 (Planned — July 2026)

**The polish and AI activation:** User customization, layout persistence, and the natural-language query engine.

**Planned features:**
- **Widget Settings Panel** — rename columns, customize colors per widget, save to dashboard spec
- **Layout Persistence** — save/restore user's custom grid layout (currently logs changes, doesn't persist)
- **AI Intent Engine activation** — Rig agent + Mistral/Claude converts NL ("show me revenue by region over time") → chart spec
- **Hierarchical Drill-Down** — click category → drill into sub-categories (requires backend hierarchy metadata)
- **Chart Image Embedding** — include actual chart images in PDF/PPTX exports (text-based summaries in v1.0)
- **Custom Color Palettes** — user-definable palette per dashboard
- **Dark Mode** — stretch goal if time permits

**For users:** "Use natural language to explore data; customize views to your taste."

---

## v1.2 (Planned — August 2026)

**Enterprise foundations:** Compliance, security, and advanced data modeling.

**Planned features:**
- **MDM Integration** — cross-domain analytics via the `mdm_enabled` flag (reserved in v1.0 schema)
- **Data Lineage Visualization** — D3 DAG showing how metrics flow through the system
- **Row-Level Security (RLS)** — tenant/domain isolation at the query level
- **HIPAA Compliance** — audit logs, encryption, access controls for healthcare
- **SOC2/PCI-DSS Readiness** — security certification targets
- **Python `ai-services/` Layer** — standalone NL→SQL microservice (REST/Kafka)
- **Apache Iceberg + DuckDB Lakehouse** — OLAP-optimized data warehouse integration
- **Audit Trail Dashboard** — visualize who accessed what, when, with what result

**For users:** "Trusted by healthcare and financial services; trace every query to compliance."

---

## v1.3+ and Ideas Vault

**Future horizons (post-August 2026):**
- Mobile native apps (via webview bridge and native shells)
- Collaborative editing (multi-user dashboards with conflict resolution)
- Dashboard scheduling and email delivery
- Alert rules (e.g., "email me if revenue dips below X")
- Custom visualizations (user-defined D3 specs)
- SSO/SAML federation
- API rate limiting and quota management
- Geospatial visualizations (maps, choropleth, heatmaps)
- Real-time streaming dashboards (WebSocket, Kafka sink)

---

## How to Use This Roadmap

**For high-level context:** Read this file (you're reading it).

**For detailed priorities, effort estimates, and v1.1 features by importance:** See the **external backlog folder**:
- **Location:** C:\Users\bhara\Projects\Claude\VibhaDashboard\backlog\
- **Active backlog:** VibhaDashboard_BACKLOG.md (current priorities, updated weekly)
- **Policy & grooming process:** VibhaDashboard_BACKLOG-POLICY.md (how we decide and track changes)
- **Versioned snapshots:** VibhaDashboard_BACKLOG_yyyy-mm-dd_hh-mm-ss.md (immutable history of roadmap decisions)
- **Status:** Kept separate from git; versioned by daily backup script only

**For architecture and design decisions:** See the **external ADR folder**:
- **Location:** C:\Users\bhara\Projects\Claude\VibhaDashboard\ADR\
- **Contents:** Architecture Decision Records with rationale, design choices, alternatives considered
- **Status:** Kept separate from git; versioned by daily backup script only

---

## Philosophy

**Generic from day one** — Multiple consumers (GreenOps, VibhaSaaS, healthcare, banking pilots) exist now; cost of retrofitting genericity later >> upfront complexity.

**Security is a revenue feature** — HIPAA/SOC2 compliance is a direct sales differentiator; we build it in, not bolt it on.

**Authored content protected, sediment excluded** — Backups contain full source + git history via bundles, not compiler caches or downloaded packages.

**Open source, 100% API-pluggable** — No vendor lock-in; all tools (Valkey, Kafka, pgvector, Rig, Mistral, ECharts) are open-source and replaceable.

**Folder discipline** — Documentation organized by purpose: ADRs in /ADR/, backlog in /backlog/, session notes in /sessions/, specs in /specs/. Each lives in its designated location; nothing saved randomly.

---

## Key Metrics (v1.0)

| Metric | Target | Achieved |
|--------|--------|----------|
| Chart render time | <300ms | <200ms ✅ |
| Export latency | <3s | <1s ✅ |
| Dashboard load time | <5s | ~3s ✅ |
| Confidence threshold (configurable) | 3 presets | Strict/Balanced/Permissive ✅ |
| Unit test coverage | 15+ | 15 passing ✅ |
| Visual polish | Tableau-class | Achieved ✅ |

---

## Questions?

- **Product priorities or timeline:** See backlog folder at C:\Users\bhara\Projects\Claude\VibhaDashboard\backlog\ (Monday grooming updates)
- **Technical architecture & design decisions:** See ADR folder at C:\Users\bhara\Projects\Claude\VibhaDashboard\ADR\ (Architecture Decision Records with rationale)
- **Code or API usage:** See README.md in repo root (to be created)

---

**Last updated:** June 12, 2026 (Day 14)  
**Next backlog review:** Monday, June 17, 10 AM IST (weekly grooming)
