# Automation Enablement Studio

A browser-based tool for designing, generating, and validating automation artifacts against the Layer 4 Author Standards. Built with React, Vite, and Tailwind CSS. No backend required — all data is stored locally in the browser.

## Features

### Dashboard
Overview of all projects with compliance scores and health indicators (Green ≥ 80, Amber 50–79, Red < 50). Quick links to the Build Wizard and Standards Registry.

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
│   ├── Dashboard.jsx
│   ├── Standards.jsx
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
    ├── AuthContext.jsx      # Password auth context
    ├── query-client.js
    └── utils.js
```

## Data Persistence

Projects are stored in browser `localStorage` under the key `enablement_studio_projects`. Data is scoped to the browser and origin — it does not sync across devices or users.

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
