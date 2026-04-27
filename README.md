# Automation Enablement Studio

A browser-based tool for designing, generating, and validating automation artifacts against the Layer 4 Author Standards — and for planning and tracking automation enablement across teams. Built with React, Vite, and Tailwind CSS. No backend required — all data is stored locally in the browser.

## Features

### Dashboard
Overview of all projects with compliance scores and health indicators (Green ≥ 80, Amber 50–79, Red < 50). Quick links to the Build Wizard and Standards Registry. Includes the **Enablement Engagement** statistics panel (see below).

### Standards Registry
Browse all seven Layer 4 Author Standards with full detail views — standard statement, author obligations, approval gate requirements, anti-patterns, review checklists, and operator header templates. Each standard includes a **WHAT** (normative requirements) and **HOW** (templates, patterns, anti-patterns) tab.

Standards covered:
1. Safe Execution
2. Idempotency & Re-runnable Behavior
3. Tested Before Production
4. Automatic Backout & Recovery
5. Observability, Logging & Reportability
6. Secured by Design
7. Naming, Metadata & Classification

### Enablement Activity Catalogue *(new)*
A full catalogue of all 18 enablement activities drawn from the programme's Activity Inventory. Enablement leads, team managers, and programme coordinators can use this page to plan and track individual and team curricula.

**Activity Inventory** — all 18 activities are browsable in a filterable card grid:
- Filter by **Format** (Live, Async, In-Team) and **Audience Tier** (0–3)
- Full-text search across activity name, ID, and purpose
- Each card shows format group, duration, frequency, and audience tier at a glance

Activities covered:

| ID | Name | Format |
|----|------|--------|
| ACT-001 | Awareness Workshop | Live |
| ACT-002 | Foundation Skills Workshop | Live |
| ACT-003 | Advanced Workshop | Live |
| ACT-004 | Code Review Sessions | Live |
| ACT-005 | Office Hours | Live |
| ACT-006 | Lunch & Learn | Live |
| ACT-007 | Squad Embed / Pairing | In-Team |
| ACT-008 | Hackathon / Build Day | Live |
| ACT-009 | Community of Practice (CoP) | Live |
| ACT-010 | ADR / Design Clinic | Live |
| ACT-011 | Onboarding Pathway | Async |
| ACT-012 | Pattern Library Review | Async |
| ACT-013 | Newsletter / Digest | Async |
| ACT-014 | Recorded Demo Library | Async |
| ACT-015 | Certification Study Group | Live + Async |
| ACT-016 | First Asset Coaching Engagement | In-Team |
| ACT-017 | Legacy Classification Sprint | In-Team |
| ACT-018 | Reviewer Certification | Live |

**Activity Detail Sheets** — clicking any activity opens a full detail sheet with purpose, format, duration, audience tier, content/agenda, facilitator requirements, success criteria, materials, scheduling guidance, and contextual notes (eligibility, follow-up actions, blameless standards).

**Suggested Curriculum Paths** — four preset paths auto-populate the curriculum with one click:
- *New Joiner Essentials* (Tier 0 → 1) — 7 activities
- *Practitioner Path* (Tier 1 → 2) — 6 activities
- *Expert & Champion Path* (Tier 2 → 3) — 5 activities
- *Full Programme* (All Tiers) — all 18 activities

**My Curriculum tab** — a personal checklist of selected activities showing:
- Summary stats: total activities, completed count, completion %, format mix
- Progress bar
- Tick-off each activity as it is completed
- Remove individual activities or clear the whole curriculum

**Email Curriculum** — from the My Curriculum tab, enter an email address to open your default email client pre-addressed and pre-filled with the full formatted curriculum (activity IDs, names, purposes, success criteria, and scheduling guidance for every selected activity). No server required — uses the browser's `mailto:` protocol.

### Enablement Engagement Statistics *(new)*
Every action taken in the Activity Catalogue is recorded to browser `localStorage` and surfaced on the **Dashboard** as programme-level engagement metrics. This allows enablement leads and programme coordinators to measure adoption and identify which activities are resonating.

**Tracked events:**
- Activity added to a curriculum
- Activity removed from a curriculum
- Activity marked complete
- Activity uncompleted
- Suggested curriculum path applied (with path ID and activity count)

**Dashboard panel — Enablement Engagement:**
- **4 headline stats:** Curriculum Enrolments, Activities Completed, Unique Activities Used, Completion Rate
- **Most Added to Curricula** — top 5 activities ranked by add count, with proportional bars colour-coded by format group
- **Most Completed** — top 5 activities ranked by completion count
- **Format Mix** — stacked proportion bar showing Live / Async / In-Team split across all curriculum enrolments
- **Paths Applied** — which suggested paths were used and how many times
- **Recent Activity** — last 8 events with relative timestamps
- Empty state when no data exists yet, with a direct link to the Catalogue
- **Reset** button (requires confirmation) to clear all statistics

Statistics are scoped to the local browser — they accumulate across sessions and do not sync across devices or users. Rolling history is capped at 200 events.

### Build Wizard
Five-step guided workflow for creating a new automation project. Generates starter code (Python, Ansible Playbook, PowerShell, Bash) from templates pre-wired for standards compliance.

**Naming validation** — the Automation Name field validates in real time against the `[domain]-[action]-[target]` naming rule. It enforces:
- Approved domain prefix (`linux`, `windows`, `network`, `firewall`, `db`, `middleware`, `observability`, `bigdata`, `virt`, `aix`, `storage`, `mainframe`, `platform`)
- Lowercase letters, numbers, and hyphens only (no underscores, no spaces)
- At least three hyphen-separated parts

The Next button is blocked until the name passes all rules.

### Workspace
Multi-tab code editor for viewing and editing generated projects. The right panel runs 27 automated policy checks live as you edit:

**Safe Execution** — input validation, fail-closed scope selector, 5-category failure classification, concurrent safety documentation, dry-run mode  
**Idempotency** — state check before change, bounded retries with backoff, explicit timeouts  
**Tested Before Production** — test evidence plan, environmental parity documentation, quality gate evidence  
**Automatic Backout & Recovery** — rollback mechanism (Stage 5), pre-change state capture (Stage 1), auto-trigger on failure (Stage 4), rollback verification (Stage 6), automatic incident creation (Stage 7)  
**Observability** — structured output, execution ID, run-level summary (11 required fields), completion record, failure classification in output  
**Secured by Design** — no hardcoded secrets, vault-based credential retrieval, sensitive output masking  
**Naming, Metadata & Classification** — domain-action-target naming pattern, operator header, all four classification dimensions

Each failing check shows why it matters, which lines are affected, and how to fix it. Projects can be saved to browser storage and exported as individual files.

### Code Validator
Paste any existing automation code (Python, Ansible, PowerShell, Bash, YAML, or other) and score it immediately against all 27 policy checks — no project setup required.

- Select the language from the dropdown for relevant placeholder hints
- Expand the **Metadata** panel to supply an automation name, risk tier, automation type, and testing plan summary — this activates checks that cannot be inferred from code alone
- The results panel is resizable; drag the divider to give the policy check list more space
- Each failing check is expandable with fix guidance and code snippets

### Documentation
In-app documentation including this README, the Product Requirements Document, system architecture, API design, and MVP build plan.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build tool | Vite |
| Styling | Tailwind CSS + `@tailwindcss/typography` |
| UI components | Radix UI |
| State / data fetching | TanStack React Query |
| Routing | React Router v6 |
| Animations | Framer Motion |
| Panel resizing | react-resizable-panels |
| Markdown rendering | react-markdown |
| Data persistence | Browser `localStorage` |
| Auth | Password-based (single shared password via `.env`) |

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create the environment file
cp .env.example .env   # or create .env manually
```

Set one variable in `.env`:

```
VITE_APP_PASSWORD=your-password-here
```

This is the password shown on the login screen. All users share the same password.

### Running locally

```bash
npm run dev
```

The app opens at `http://localhost:5173`.

### Other commands

```bash
npm run build        # Production build
npm run preview      # Preview the production build locally
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix lint issues
npm run typecheck    # TypeScript / JSDoc type check
```

## Project Structure

```
src/
├── api/
│   └── base44Client.js      # localStorage-backed Project CRUD (list, filter, create, update)
├── pages/
│   ├── Dashboard.jsx        # Overview + Enablement Engagement stats panel
│   ├── Standards.jsx
│   ├── ActivityCatalogue.jsx # Activity Catalogue, curriculum builder, email export
│   ├── BuildWizard.jsx      # 5-step wizard with naming validation
│   ├── Workspace.jsx
│   ├── Validator.jsx        # Code Validator — paste-and-score any automation
│   └── Documentation.jsx
├── components/
│   ├── layout/              # AppLayout, Sidebar
│   ├── shared/              # HealthBadge
│   ├── ui/                  # Radix UI wrappers (Button, Card, Dialog, Resizable, …)
│   ├── wizard/              # WizardStep
│   └── workspace/           # CodeEditor, PolicyPanel, EvidencePack
└── lib/
    ├── standards-data.js    # AUTHOR_STANDARDS, POLICY_CHECKS, runPolicyChecks()
    ├── enablement-stats.js  # localStorage-backed enablement engagement tracker
    ├── AuthContext.jsx      # Password auth context
    ├── query-client.js
    └── utils.js
```

## Data Persistence

Projects are stored in browser `localStorage` under the key `enablement_studio_projects`. Enablement engagement statistics are stored under `enablement_activity_stats`. Data is scoped to the browser and origin — it does not sync across devices or users.

To back up projects, export them individually from the Workspace using the **Export** button, which downloads the generated code, metadata JSON, README, and backout plan as separate files.

## Authentication

The app shows a password prompt on load. Enter the value of `VITE_APP_PASSWORD` from `.env` to access it. The authenticated state is stored in `localStorage` and persists across browser sessions until you log out.


## Policy Check Scoring

Compliance score = passing checks ÷ total checks × 100, rounded to the nearest integer.

| Score | Status | Meaning |
|---|---|---|
| ≥ 80 | Green | Compliant — ready for review |
| 50–79 | Amber | Needs attention before production |
| < 50 | Red | Not production-ready |

Checks marked **Hard Gate** (error severity) represent non-negotiable requirements. Checks marked **Recommendation** (warning severity) are strongly advised but not blocking.

## License

Private project
