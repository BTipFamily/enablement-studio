import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Globe, Code2, Target, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import README from "../../README.md?raw";

const PRD_CONTENT = `# Automation Enablement Studio — Product Requirements Document

## 1. Vision
Build an engaging, streamlined tool that helps infrastructure engineers design and generate automation (Python, Ansible, PowerShell, Bash) with embedded Automation Standards and Guardrails delivered as **enablement** — guidance, templates, examples — not a compliance exercise.

## 2. Problem Statement
Infrastructure engineers across 12+ technology areas need to produce automation that meets organizational standards. Currently:
- Standards are fragmented across multiple documents
- Engineers must reconcile requirements from many sources
- No single tool provides templates + obligations + evidence in one place
- Platform responsibilities are conflated with author obligations

## 3. Non-Negotiable Principle
Only items an engineer must **intentionally design or implement** are Author Standards. Everything else is:
- **Platform Enforcement** — pipeline/repo rules enforce automatically
- **Approval Gate** — review workflow verifies evidence before production
- **Template Requirement** — mandatory templates provide it
- **Guidance** — useful reference, not mandatory

## 4. Target Users
Infrastructure engineers in: Linux, Windows, Network, Firewall, Database, Middleware, Observability, Big Data, Virtualization, AIX, Storage, Mainframe. Many are experienced operators, not software engineers.

## 5. The 7 Author Standards

### 5.1 Safe Execution
**Risk Controlled:** Unintended impact from unvalidated inputs, unbounded scope, unhandled failures, and unsafe concurrent execution.

### 5.2 Idempotency & Re-runnable Behavior
**Risk Controlled:** Re-execution after partial failure compounding changes or creating inconsistent state.

### 5.3 Tested Before Production
**Risk Controlled:** False confidence from tests that don't reflect production conditions.

### 5.4 Automatic Backout & Recovery
**Risk Controlled:** No defined recovery path when automation causes unintended impact.

### 5.5 Observability, Logging & Reportability
**Risk Controlled:** Inability to reconstruct what happened from automation output alone.

### 5.6 Secured by Design
**Risk Controlled:** Security failures amplified by automation's scale and speed.

### 5.7 Naming, Metadata & Classification
**Risk Controlled:** Ungovernable automation assets at scale.

## 6. User Stories

| # | Story | Acceptance Criteria |
|---|-------|-------------------|
| US-1 | As an engineer, I want a guided wizard to configure my automation | 5-step wizard collects type, tech, scope, risk, safety, testing |
| US-2 | As an engineer, I want to see WHAT I must build vs HOW to build it | Toggle view shows obligations vs patterns/templates |
| US-3 | As an engineer, I want generated starter code for my technology | Templates for Python, Ansible, PowerShell, Bash |
| US-4 | As an engineer, I want real-time policy checks on my code | Guardrail engine checks against 7 standards |
| US-5 | As an engineer, I want to export an evidence pack | Structured artifact with metadata, output contract, test evidence |
| US-6 | As an engineer, I want clear distinction between my obligations and platform controls | Category badges and explicit separation in every standard |
| US-7 | As a reviewer, I want a compliance scoreboard | Green/Amber/Red with score percentage |

## 7. Features

### 7.1 Guided Build Wizard
- 5 steps: Basics → Scope & Risk → Safety → Testing → Review
- Generates code, metadata, README, backout documentation

### 7.2 WHAT vs HOW Experience
- WHAT tab: Standard statement, obligations, approval gates, platform controls
- HOW tab: Templates, patterns, anti-patterns, related standards

### 7.3 Live Code Workspace
- Multi-tab editor: Main code, Metadata, README, Backout
- Real-time policy check panel
- Evidence pack viewer

### 7.4 Guardrail Engine
- 14 automated policy checks across 7 standards
- Severity classification: Error (hard gate) vs Warning (recommendation)
- Clear failure messages with risk context and fix guidance

### 7.5 Evidence Pack
- Classification & metadata summary
- Structured output contract
- Test evidence references
- Backout evidence structure
- Standards compliance summary

### 7.6 Export
- Individual file downloads
- Future: ZIP export, repo scaffold, PR creation
`;

const ARCHITECTURE_CONTENT = `# Architecture

## System Architecture

\`\`\`
┌──────────────────────────────────────────────────────────────────────────┐
│                            Frontend (React 18 + Vite)                     │
│                                                                            │
│  ┌───────────┐  ┌───────────┐  ┌─────────────────────┐  ┌───────────┐  │
│  │ Dashboard │  │ Standards │  │ Activity Catalogue   │  │   Build   │  │
│  │           │  │ Registry  │  │                      │  │  Wizard   │  │
│  │ • Project │  │           │  │ • Activity Inventory │  │           │  │
│  │   stats   │  │ • WHAT /  │  │ • Curriculum builder │  │ • 5-step  │  │
│  │ • Enabl.  │  │   HOW     │  │ • Suggested paths    │  │   flow    │  │
│  │   Engage- │  │   tabs    │  │ • Email curriculum   │  │ • Code    │  │
│  │   ment    │  │ • Detail  │  │ • Completion tracker │  │   gen.    │  │
│  │   panel   │  │   sheets  │  │                      │  │           │  │
│  └─────┬─────┘  └───────────┘  └──────────┬───────────┘  └─────┬─────┘  │
│        │                                   │                     │        │
│  ┌───────────┐  ┌───────────┐              │              ┌───────────┐  │
│  │ Workspace │  │   Code    │              │              │   Docs    │  │
│  │           │  │ Validator │              │              │           │  │
│  │ • Editor  │  │           │              │              │ • README  │  │
│  │ • Policy  │  │ • Paste & │              │              │ • PRD     │  │
│  │   panel   │  │   score   │              │              │ • Arch.   │  │
│  │ • Evidence│  │ • 27      │              │              │ • API     │  │
│  │   pack    │  │   checks  │              │              │ • MVP     │  │
│  └─────┬─────┘  └─────┬─────┘              │              └───────────┘  │
│        │              │                    │                              │
│  ┌─────┴──────────────┴────┐    ┌──────────┴──────────┐                  │
│  │     Core Libraries       │    │  enablement-stats.js │                  │
│  │                          │    │                      │                  │
│  │ • standards-data.js      │    │ • recordAdd()        │                  │
│  │   (7 standards, 27       │    │ • recordRemove()     │                  │
│  │    policy checks,        │    │ • recordComplete()   │                  │
│  │    templates)            │    │ • recordUncomplete() │                  │
│  │ • reference-examples.js  │    │ • recordPathApplied()│                  │
│  │ • standards-config.js    │    │ • getStats()         │                  │
│  │ • AuthContext.jsx        │    │ • clearStats()       │                  │
│  │ • query-client.js        │    │                      │                  │
│  │ • utils.js               │    └──────────┬───────────┘                  │
│  └─────────────────────────┘               │                              │
└───────────────────────────────────────────┼──────────────────────────────┘
                                             │
               ┌─────────────────────────────┼────────────────────────────┐
               │           Browser localStorage                            │
               │                             │                             │
               │  ┌──────────────────────┐   │  ┌────────────────────┐   │
               │  │  enablement_studio_  │   │  │ enablement_activity │   │
               │  │      projects        │   │  │      _stats         │   │
               │  │                      │   │  │                     │   │
               │  │ Project[]            │   │  │ activities: {       │   │
               │  │  id, name,           │   │  │   [actId]: {        │   │
               │  │  automation_type,    │   │  │     addCount,       │   │
               │  │  technology_area,    │   │  │     removeCount,    │   │
               │  │  risk_tier,          │   │  │     completedCount, │   │
               │  │  compliance_score,   │   │  │     lastAdded,      │   │
               │  │  generated_code,     │   │  │     lastCompleted   │   │
               │  │  status, ...         │   │  │   }                 │   │
               │  └──────────────────────┘   │  │ }                   │   │
               │                             │  │ paths: { [pathId]:  │   │
               │                             │  │   count }           │   │
               │                             │  │ history: Event[200] │   │
               │                             │  └────────────────────┘   │
               └─────────────────────────────────────────────────────────┘
\`\`\`

---

## Data Flow — Build Wizard → Workspace

\`\`\`
User fills wizard steps
        │
        ▼
  Step 1: Basics
  (name, desc, type, tech)
        │
  Step 2: Scope & Risk
  (risk tier, target scope,
   credential type)
        │
  Step 3: Safety
  (backout approach,
   concurrency level)
        │
  Step 4: Testing
  (testing plan, environment)
        │
  Step 5: Review
  (validates + generates)
        │
        ▼
  generateCode(template, formData)
  ───────────────────────────────
  • Selects starter template by
    automation type
  • Substitutes {{placeholders}}
  • Returns: code, metadata,
    README, backout plan
        │
        ▼
  base44.entities.Project.create()
  ───────────────────────────────
  Persists to localStorage
  (enablement_studio_projects)
        │
        ▼
  Navigate → /Workspace?project=id
        │
        ▼
  runPolicyChecks(code, metadata)
  ───────────────────────────────
  27 regex/pattern checks across
  7 Author Standards
  → CheckResult[]
  → compliance_score (0–100)
\`\`\`

---

## Data Flow — Activity Catalogue → Curriculum → Statistics

\`\`\`
User opens Activity Catalogue
        │
        ├─── Browse / filter / search ───▶ ActivityCard grid (18 activities)
        │                                         │
        │                                   Click card
        │                                         │
        │                                         ▼
        │                                 ActivityDetailSheet
        │                                 (purpose, content,
        │                                  criteria, scheduling)
        │                                         │
        │                                    + / Add button
        │                                         │
        ├─── Select via Suggested Path ──▶  applyPath(path)
        │    (New Joiner / Practitioner /         │
        │     Expert / Full Programme)            │
        │                                         │
        │         ┌───────────────────────────────┘
        │         │
        │         ▼
        │   enablement-stats.js
        │   recordAdd(activityId)   ──▶  localStorage: enablement_activity_stats
        │   recordPathApplied(id)         activities[id].addCount++
        │                                 paths[pathId]++
        │                                 history.unshift({ type, timestamp })
        │
        ▼
  My Curriculum tab
  (selectedIds[] state)
        │
        ├─── Tick activity ──▶ recordComplete(id)
        │                        completedCount++
        │
        ├─── Untick ──────────▶ recordUncomplete(id)
        │
        ├─── Remove ──────────▶ recordRemove(id)
        │                        removeCount++
        │
        └─── Email Curriculum
                  │
                  ▼
            buildEmailBody(activities, completedIds)
            → formats plain-text curriculum
            → opens mailto: link in system email client
            (no server required)
\`\`\`

---

## Data Flow — Enablement Engagement Statistics → Dashboard

\`\`\`
  localStorage: enablement_activity_stats
             │
             ▼
  getStats()  ─── called on Dashboard mount
             │     and on Reset confirmation
             │
             ▼
  Computed metrics:
  ┌─────────────────────────────────────────────────────┐
  │  totalAdds       = Σ activities[*].addCount         │
  │  totalCompletions= Σ activities[*].completedCount   │
  │  uniqueActivities= count(addCount > 0)              │
  │  completionRate  = totalCompletions / totalAdds     │
  │                                                     │
  │  topByAdds[5]    = sort by addCount DESC            │
  │  topByCompletions[5] = sort by completedCount DESC  │
  │                                                     │
  │  formatCounts = { live, async, inteam }             │
  │    grouped by ACTIVITY_META[id].group               │
  │                                                     │
  │  pathEntries = Object.entries(paths)                │
  │    sorted by count DESC                             │
  │                                                     │
  │  recentHistory = history.slice(0, 8)                │
  └─────────────────────────────────────────────────────┘
             │
             ▼
  EnablementEngagement component renders:
  • 4 headline stat cards
  • Top-5 added bar chart (colour by format group)
  • Top-5 completed bar chart
  • Stacked format-mix bar
  • Paths-applied list
  • Recent activity feed with relative timestamps
\`\`\`

---

## Data Flow — Code Validator

\`\`\`
User pastes code + selects language
        │
        ▼
  Optional: expand Metadata panel
  (name, risk tier, type, testing plan)
        │
        ▼
  runPolicyChecks(code, metadata)
  ───────────────────────────────
  Same engine as Workspace —
  stateless, no project created
        │
        ▼
  CheckResult[] rendered in-page:
  • Pass / Fail badge per check
  • Expandable: why it matters,
    affected lines, fix guidance
  • Aggregate compliance score
\`\`\`

---

## Entity Relationship

\`\`\`
Project (localStorage)              EnablementStats (localStorage)
─────────────────────               ──────────────────────────────
id              UUID                activities    map<actId, Metrics>
name            string              paths         map<pathId, number>
automation_type string              history       Event[max 200]
technology_area string
risk_tier       string              Metrics
credential_need string              ─────────────
backout_approach string             addCount      number
concurrency_risk string             removeCount   number
testing_plan    string              completedCount number
generated_code  string              uncompleteCount number
metadata_yaml   string              lastAdded     ISO string | null
readme_content  string              lastCompleted ISO string | null
backout_plan    string
compliance_score number (0–100)     Event
status          string              ─────
created_date    ISO string          type          add | remove | complete
                                                  | uncomplete | path
                                    activityId    string (optional)
                                    pathId        string (optional)
                                    activityCount number (optional)
                                    timestamp     ISO string
\`\`\`
`;


const API_CONTENT = `# API Design

> **Implementation note:** The app is currently client-side only. All data is read from and written to browser \`localStorage\`. The endpoints below define the intended API contract for a future server implementation and document the shape of data available today. The **Enablement Engagement** endpoints include a JavaScript export helper that can be used right now to extract data for Power BI without a backend.

---

## Standards

### GET /api/standards
List all standards with optional category filter.

**Query parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| \`category\` | string | Filter by category, e.g. \`Author+Standard\` |

**Response:**
\`\`\`json
{
  "standards": [
    {
      "id": "...",
      "name": "Safe Execution",
      "slug": "safe-execution",
      "category": "Author Standard",
      "status": "Active",
      "author_obligations": [...],
      "approval_gate_requirements": [...],
      "platform_controls": [...]
    }
  ]
}
\`\`\`

### GET /api/standards/:slug
Get single standard with full detail.

---

## Projects

### POST /api/projects
Create a new project via wizard submission.

**Request:**
\`\`\`json
{
  "name": "linux-patch-deployment",
  "automation_type": "Python",
  "technology_area": "Linux",
  "risk_tier": "High",
  "target_scope": "Production Linux servers",
  "credential_need": "Vault Secret",
  "backout_approach": "Snapshot Restore",
  "concurrency_risk": "Medium",
  "testing_plan": "Test in staging with 3 servers..."
}
\`\`\`

### GET /api/projects/:id
Get project with generated artifacts and check results.

### PUT /api/projects/:id
Update project code and metadata.

### POST /api/projects/:id/check
Run policy checks against current project state.

**Response:**
\`\`\`json
{
  "score": 85,
  "status": "green",
  "checks": [
    {
      "id": "safe-exec-input-validation",
      "standard": "safe-execution",
      "name": "Input Validation Present",
      "passed": true,
      "severity": "error"
    }
  ]
}
\`\`\`

### POST /api/projects/:id/export
Generate export artifact (ZIP or individual files).

---

## Templates

### GET /api/templates?type=Python
Get starter templates for a given automation type.

---

## Enablement Engagement Statistics

These endpoints expose the data stored in \`localStorage\` key \`enablement_activity_stats\`. They are designed to be consumed by Power BI via the **Power BI Web connector** (pointing to a deployed instance) or extracted directly using the browser export helper below.

---

### GET /api/enablement/stats
Return the full raw statistics store.

**Response:**
\`\`\`json
{
  "activities": {
    "ACT-001": {
      "addCount": 14,
      "removeCount": 2,
      "completedCount": 9,
      "uncompleteCount": 1,
      "lastAdded": "2026-04-26T10:32:00.000Z",
      "lastCompleted": "2026-04-26T14:10:00.000Z"
    },
    "ACT-002": { ... }
  },
  "paths": {
    "new-joiner": 7,
    "practitioner": 4,
    "expert": 2,
    "full": 1
  },
  "history": [
    {
      "type": "complete",
      "activityId": "ACT-002",
      "timestamp": "2026-04-26T14:10:00.000Z"
    },
    {
      "type": "path",
      "pathId": "new-joiner",
      "activityCount": 7,
      "timestamp": "2026-04-26T09:01:00.000Z"
    }
  ]
}
\`\`\`

---

### GET /api/enablement/stats/summary
Return computed headline metrics ready for a KPI card visual in Power BI.

**Response:**
\`\`\`json
{
  "totalEnrolments": 87,
  "totalCompletions": 53,
  "uniqueActivitiesUsed": 15,
  "completionRatePct": 61,
  "totalActivities": 18,
  "coverageRatePct": 83,
  "generatedAt": "2026-04-26T15:00:00.000Z"
}
\`\`\`

**Power BI use:** Connect with the Web connector, parse JSON. Each field maps directly to a KPI card or gauge visual.

---

### GET /api/enablement/stats/activities
Return per-activity metrics as a flat array — optimized for table and bar-chart visuals.

**Response:**
\`\`\`json
{
  "activities": [
    {
      "activityId": "ACT-001",
      "activityName": "Awareness Workshop",
      "format": "Live",
      "audienceTier": "Tier 0",
      "addCount": 14,
      "removeCount": 2,
      "netEnrolments": 12,
      "completedCount": 9,
      "completionRatePct": 64,
      "lastAdded": "2026-04-26T10:32:00.000Z",
      "lastCompleted": "2026-04-26T14:10:00.000Z"
    }
  ]
}
\`\`\`

**Power BI use:**
- Bar chart: \`activityName\` (axis) vs \`netEnrolments\` and \`completedCount\` (values) — shows adoption vs completion side by side
- Slicer: \`format\` or \`audienceTier\` — filter by Live / Async / In-Team or by tier
- Table: full flat list for drill-through detail

---

### GET /api/enablement/stats/paths
Return suggested curriculum path usage.

**Response:**
\`\`\`json
{
  "paths": [
    {
      "pathId": "new-joiner",
      "pathName": "New Joiner Essentials",
      "targetTier": "Tier 0 → 1",
      "activityCount": 7,
      "timesApplied": 7
    },
    {
      "pathId": "practitioner",
      "pathName": "Practitioner Path",
      "targetTier": "Tier 1 → 2",
      "activityCount": 6,
      "timesApplied": 4
    }
  ]
}
\`\`\`

**Power BI use:** Donut or bar chart showing which curriculum paths are most used — proxy for team maturity distribution.

---

### GET /api/enablement/stats/history
Return the event history log, optionally filtered by type or date range.

**Query parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| \`type\` | string | Filter by event type: \`add\`, \`remove\`, \`complete\`, \`uncomplete\`, \`path\` |
| \`from\` | ISO date | Return events on or after this date |
| \`to\` | ISO date | Return events on or before this date |
| \`limit\` | number | Max events to return (default 200) |

**Response:**
\`\`\`json
{
  "events": [
    {
      "type": "complete",
      "activityId": "ACT-002",
      "activityName": "Foundation Skills Workshop",
      "format": "Live",
      "audienceTier": "Tier 0 → Tier 1",
      "pathId": null,
      "pathName": null,
      "activityCount": null,
      "timestamp": "2026-04-26T14:10:00.000Z",
      "date": "2026-04-26",
      "hour": 14
    }
  ],
  "total": 1
}
\`\`\`

**Power BI use:**
- Line chart: events grouped by \`date\` (x-axis) with count (y-axis) — shows engagement trend over time
- Slicer: \`type\` to isolate completions vs enrolments
- Heat map: \`date\` vs \`hour\` to identify peak engagement times

---

### DELETE /api/enablement/stats
Reset all statistics. Requires confirmation token.

**Request:**
\`\`\`json
{ "confirm": "RESET" }
\`\`\`

---

## Enablement Catalogue Interaction Statistics *(new)*

These endpoints expose browsing behaviour recorded within the Activity Catalogue itself — which activities were viewed, what was searched, which filters were applied, and how many curricula were emailed. They complement the curriculum metrics above.

---

### GET /api/enablement/catalogue/views
Return per-activity view counts — how many times each detail sheet was opened.

**Response:**
\`\`\`json
{
  "totalDetailViews": 47,
  "activities": [
    {
      "activityId":   "ACT-002",
      "activityName": "Foundation Skills Workshop",
      "format":       "Live",
      "audienceTier": "Tier 0 → Tier 1",
      "viewCount":    12,
      "lastViewed":   "2026-04-26T11:05:00.000Z"
    }
  ]
}
\`\`\`

**Power BI use:** Bar chart — \`activityName\` vs \`viewCount\` side-by-side with \`netEnrolments\` to see browse-to-enrol conversion per activity.

---

### GET /api/enablement/catalogue/searches
Return search query history and aggregated term frequency.

**Query parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| \`from\` | ISO date | Return searches on or after this date |
| \`to\`   | ISO date | Return searches on or before this date |

**Response:**
\`\`\`json
{
  "totalSearches": 23,
  "topTerms": [
    { "query": "coaching", "count": 5 },
    { "query": "tier 1",   "count": 3 },
    { "query": "onboard",  "count": 3 }
  ],
  "searches": [
    {
      "query":        "coaching",
      "resultsCount": 2,
      "timestamp":    "2026-04-26T10:45:00.000Z"
    }
  ]
}
\`\`\`

**Power BI use:** Word cloud or bar chart on \`topTerms\` to understand what users are looking for that the catalogue should surface more prominently.

---

### GET /api/enablement/catalogue/filters
Return how often each format and tier filter was applied.

**Response:**
\`\`\`json
{
  "format": {
    "all":    18,
    "live":   12,
    "async":  7,
    "inteam": 4
  },
  "tier": {
    "all": 22,
    "0":   6,
    "1":   14,
    "2":   9,
    "3":   3
  }
}
\`\`\`

**Power BI use:** Stacked bar showing filter preference distribution — signals which audience tiers or format types are most in demand.

---

### GET /api/enablement/catalogue/emails
Return curriculum email statistics.

**Response:**
\`\`\`json
{
  "totalEmailsSent":      8,
  "averageActivitiesPerEmail": 6.25,
  "activityCountDistribution": [4, 7, 5, 7, 18, 7, 5, 4]
}
\`\`\`

---

## Extracting Data for Power BI (Browser Export Helper)

Because the app is currently client-side, data lives in \`localStorage\`. Use the following snippet in the **browser DevTools console** to export all enablement stats — including catalogue interaction data — as a JSON file for Power BI Desktop via **Get Data → JSON**:

\`\`\`javascript
// Run in browser DevTools console on the Enablement Studio page
(function exportEnablementStats() {
  const raw = localStorage.getItem('enablement_activity_stats');
  if (!raw) { console.warn('No stats found.'); return; }

  const data = JSON.parse(raw);

  const ACTIVITY_META = {
    'ACT-001': { name: 'Awareness Workshop',           format: 'Live',    tier: 'Tier 0'       },
    'ACT-002': { name: 'Foundation Skills Workshop',   format: 'Live',    tier: 'Tier 0 → 1'   },
    'ACT-003': { name: 'Advanced Workshop',            format: 'Live',    tier: 'Tier 1 → 2'   },
    'ACT-004': { name: 'Code Review Sessions',         format: 'Live',    tier: 'Tier 1–2'     },
    'ACT-005': { name: 'Office Hours',                 format: 'Live',    tier: 'All Tiers'    },
    'ACT-006': { name: 'Lunch & Learn',                format: 'Live',    tier: 'Tier 0–1'     },
    'ACT-007': { name: 'Squad Embed / Pairing',        format: 'In-Team', tier: 'Tier 1–2'     },
    'ACT-008': { name: 'Hackathon / Build Day',        format: 'Live',    tier: 'Tier 1–3'     },
    'ACT-009': { name: 'Community of Practice',        format: 'Live',    tier: 'Tier 2–3'     },
    'ACT-010': { name: 'ADR / Design Clinic',          format: 'Live',    tier: 'Tier 2–3'     },
    'ACT-011': { name: 'Onboarding Pathway',           format: 'Async',   tier: 'All Tiers'    },
    'ACT-012': { name: 'Pattern Library Review',       format: 'Async',   tier: 'Tier 2–3'     },
    'ACT-013': { name: 'Newsletter / Digest',          format: 'Async',   tier: 'All Tiers'    },
    'ACT-014': { name: 'Recorded Demo Library',        format: 'Async',   tier: 'All Tiers'    },
    'ACT-015': { name: 'Certification Study Group',    format: 'Live',    tier: 'Tier 2–3'     },
    'ACT-016': { name: 'First Asset Coaching',         format: 'In-Team', tier: 'Tier 1'       },
    'ACT-017': { name: 'Legacy Classification Sprint', format: 'In-Team', tier: 'All Tiers'    },
    'ACT-018': { name: 'Reviewer Certification',       format: 'Live',    tier: 'Tier 2–3'     },
  };

  // ── Activity stats (curriculum + views) ───────────────────────────────────
  const activityRows = Object.entries(data.activities || {}).map(([id, m]) => ({
    activityId:        id,
    activityName:      ACTIVITY_META[id]?.name   ?? id,
    format:            ACTIVITY_META[id]?.format ?? '',
    audienceTier:      ACTIVITY_META[id]?.tier   ?? '',
    addCount:          m.addCount        || 0,
    removeCount:       m.removeCount     || 0,
    netEnrolments:     (m.addCount || 0) - (m.removeCount || 0),
    completedCount:    m.completedCount  || 0,
    completionRatePct: m.addCount > 0
                         ? Math.round((m.completedCount / m.addCount) * 100)
                         : 0,
    viewCount:         m.viewCount       || 0,
    lastAdded:         m.lastAdded       || null,
    lastCompleted:     m.lastCompleted   || null,
    lastViewed:        m.lastViewed      || null,
  }));

  // ── Path stats ────────────────────────────────────────────────────────────
  const pathRows = Object.entries(data.paths || {}).map(([pathId, count]) => ({
    pathId,
    timesApplied: count,
  }));

  // ── Catalogue interaction stats ───────────────────────────────────────────
  const cat = data.catalogue || {};

  // Top search terms
  const searchTerms = {};
  (cat.searches || []).forEach(s => {
    searchTerms[s.query] = (searchTerms[s.query] || 0) + 1;
  });
  const topSearchTerms = Object.entries(searchTerms)
    .sort((a, b) => b[1] - a[1])
    .map(([query, count]) => ({ query, count }));

  const catalogueStats = {
    totalSearches:              (cat.searches || []).length,
    topSearchTerms,
    searchHistory:              cat.searches || [],
    filterUsage:                cat.filterUsage || { format: {}, tier: {} },
    emailsSent:                 cat.emailsSent || 0,
    emailActivityCounts:        cat.emailActivityCounts || [],
    avgActivitiesPerEmail:      cat.emailActivityCounts?.length > 0
      ? +(cat.emailActivityCounts.reduce((s, v) => s + v, 0) / cat.emailActivityCounts.length).toFixed(1)
      : 0,
  };

  // ── Full export ───────────────────────────────────────────────────────────
  const export_ = {
    exportedAt:       new Date().toISOString(),
    activityStats:    activityRows,
    pathStats:        pathRows,
    catalogueStats,
    eventHistory:     data.history || [],
  };

  const blob = new Blob([JSON.stringify(export_, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href:     url,
    download: \`enablement-stats-\${new Date().toISOString().slice(0, 10)}.json\`,
  });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  console.log(
    'Exported', activityRows.length, 'activity rows,',
    pathRows.length, 'path rows,',
    export_.eventHistory.length, 'events,',
    catalogueStats.totalSearches, 'searches,',
    catalogueStats.emailsSent, 'emails sent.'
  );
})();
\`\`\`

### Loading into Power BI Desktop

1. Run the export snippet above — a \`.json\` file downloads automatically.
2. Open Power BI Desktop → **Home → Get Data → JSON**.
3. Select the downloaded file.
4. In Power Query Editor, expand each top-level list into a separate table:

| Table | Source field | Key columns |
|-------|-------------|-------------|
| ActivityStats | \`activityStats\` | \`activityId\`, \`format\`, \`audienceTier\` |
| PathStats | \`pathStats\` | \`pathId\` |
| CatalogueSearches | \`catalogueStats.searchHistory\` | \`query\`, \`resultsCount\` |
| FilterUsage | \`catalogueStats.filterUsage\` | \`filterType\`, \`value\` |
| EventHistory | \`eventHistory\` | \`type\`, \`date\`, \`hour\` |

5. Set correct data types: dates as *Date/Time*, counts as *Whole Number*, percentages as *Decimal Number*.
6. Suggested visuals:

| Visual | Fields |
|--------|--------|
| KPI cards | \`netEnrolments\`, \`completedCount\`, \`completionRatePct\`, \`emailsSent\` |
| Clustered bar | \`activityName\` axis · \`netEnrolments\` + \`viewCount\` values (browse-to-enrol funnel) |
| Donut chart | \`format\` legend · \`netEnrolments\` values — Live / Async / In-Team mix |
| Stacked bar | \`audienceTier\` axis · \`netEnrolments\` values — tier coverage |
| Line chart | \`eventHistory.date\` axis · count of events — engagement trend over time |
| Bar chart | \`topSearchTerms.query\` axis · \`count\` — what users search for |
| Table | Full \`activityStats\` with conditional formatting on \`completionRatePct\` |
| Slicer | \`format\`, \`audienceTier\`, event \`type\` |
`;

const MVP_CONTENT = `# MVP Build Plan

## Phase 1: Foundation (Weeks 1-2)
- [x] Entity schemas (Standard, Project, Template)
- [x] Design system and layout
- [x] Dashboard with overview
- [x] Standards Registry with WHAT/HOW toggle
- [x] 7 consolidated Author Standards data

## Phase 2: Build Wizard (Weeks 2-3)
- [x] 5-step guided wizard
- [x] Code generation from templates
- [x] Starter templates for all 4 languages
- [x] Metadata, README, and backout generation

## Phase 3: Workspace (Weeks 3-4)
- [x] Multi-tab code editor
- [x] Real-time policy check panel
- [x] Evidence pack viewer
- [x] Save and export functionality
- [x] 14 automated policy checks

## Phase 4: Polish (Week 5)
- [ ] OPA integration for advanced policy evaluation
- [ ] ZIP export with full repo scaffold
- [ ] Git integration (PR creation)
- [ ] Template library expansion

## Iteration 2 Backlog
1. **Feedback loops** — engineer satisfaction surveys per standard
2. **Usage analytics** — which standards cause most failures
3. **Template marketplace** — community-contributed templates
4. **CI/CD integration** — run checks in pipeline
5. **Multi-file projects** — support complex automation with multiple files
6. **Version history** — track changes to projects over time
7. **Team collaboration** — shared projects with comments
8. **Advanced code generation** — LLM-assisted code completion
9. **Environment parity checker** — automated comparison tool
10. **Approval workflow** — built-in review and sign-off flow
`;

const tabs = [
  { id: "readme", label: "README", icon: BookOpen, content: README },
  { id: "prd", label: "PRD", icon: FileText, content: PRD_CONTENT },
  { id: "architecture", label: "Architecture", icon: Globe, content: ARCHITECTURE_CONTENT },
  { id: "api", label: "API Design", icon: Code2, content: API_CONTENT },
  { id: "mvp", label: "MVP Plan", icon: Target, content: MVP_CONTENT },
];

export default function Documentation() {
  const [activeTab, setActiveTab] = useState("readme");

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Documentation</h1>
        <p className="text-sm text-muted-foreground mt-1">PRD, architecture, API design, and build plan</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id}>
            <Card>
              <CardContent className="p-6 lg:p-8">
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-table:text-sm">
                  <ReactMarkdown>{tab.content}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}