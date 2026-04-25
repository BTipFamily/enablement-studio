# Atelier — Automation Enablement Studio

A web application for building, reviewing, and governing automation assets against the Layer 4 Author Standards. Built with React, Vite, and Tailwind CSS.

## About

Atelier is the authoring and governance companion for the Automation Framework. It guides engineers through building standards-compliant automation, runs live policy checks against their code as they write it, and keeps the standards registry in sync with the authoritative source repository so policy definitions are always current.

## Features

### Standards Registry
Browse all seven Layer 4 Author Standards with full detail views — standard statement, author obligations, approval gate requirements, anti-patterns, review checklists, and operator header templates. Each standard includes a **WHAT** (normative requirements) and **HOW** (templates, patterns, anti-patterns) tab.

**Reference Implementations** — the HOW tab surfaces real, working code examples from the Layer 4 reference implementation library directly alongside each standard's normative requirements. Each card shows the implementation title, language badge, filename, and description. Clicking a card opens a slide-in viewer panel with the full source code and a **Copy** button for one-click clipboard capture.

Implementations covered per standard:
- **Safe Execution** — Python input validator, Python 5-category error handling, Ansible error handling playbook, Azure DevOps pipeline with guardrails
- **Idempotency** — Ansible idempotent state playbook, Python config manager with pre-change capture and rollback
- **Tested Before Production** — SNOW create/update/close change request and change task utility templates
- **Automatic Backout & Recovery** — canonical 7-stage Ansible backout pattern, SNOW create/update/close incident utility templates
- **Observability** — Python structured logger emitting all 11 required run-level fields
- **Secured by Design** — Python CyberArk CCP secret retrieval with TLS enforcement and classified failure messages
- **Naming, Metadata & Classification** — complete Layer 4 operator headers for Python, Ansible, and Azure DevOps pipelines

**Live standards sync** — the registry can be connected to the Git repository that contains the authoritative `layer4-standards` Markdown documents. Once configured, the app fetches the latest document content, parses it, and uses it in the policy descriptions and standard statements. The cache refreshes automatically every 4 hours; a **Sync now** button is available for immediate refresh.

Standards covered:
1. Safe Execution
2. Idempotency & Re-runnable Behavior
3. Tested Before Production
4. Automatic Backout & Recovery
5. Observability, Logging & Reportability
6. Secured by Design
7. Naming, Metadata & Classification

### Policy Checks (Workspace)
The Workspace panel runs 22 automated policy checks against automation code as it is written. Checks are mapped to the official standards and flag both hard gates (errors) and recommendations (warnings). Each failing check shows why it matters and how to fix it.

Checks cover:
- **Safe Execution** — input validation, fail-closed scope selector, 5-category failure classification, concurrent safety documentation, dry-run mode
- **Idempotency** — state check before change, bounded retries with backoff, explicit timeouts
- **Tested Before Production** — test evidence plan, environmental parity documentation (all 6 dimensions), quality gate evidence
- **Automatic Backout & Recovery** — rollback mechanism (Stage 5), pre-change state capture (Stage 1), auto-trigger on failure (Stage 4), rollback verification (Stage 6), automatic incident creation (Stage 7)
- **Observability** — structured output, execution ID, run-level summary (11 required fields), completion record, failure classification in output
- **Secured by Design** — no hardcoded secrets, vault-based credential retrieval, sensitive output masking
- **Naming, Metadata & Classification** — domain-action-target naming pattern, operator header, all four classification dimensions

### Build Wizard
Step-by-step guided workflow for creating a new automation project. Generates starter code (Python, Ansible Playbook, PowerShell, Bash) from templates that are pre-wired for standards compliance.

### Dashboard
Overview of all projects with compliance scores and health indicators.

### Documentation
In-app documentation and guides.

## Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with Typography plugin
- **UI Components**: Radix UI
- **State Management**: TanStack React Query
- **Routing**: React Router
- **Form Handling**: React Hook Form with Zod validation
- **Linting**: ESLint
- **Type Checking**: TypeScript (JSDoc)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create an `.env.local` file in the project root and set the required environment variables:
   ```
   VITE_BASE44_APP_ID=your_app_id
   VITE_BASE44_APP_BASE_URL=your_backend_url
   ```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Building

```bash
npm run build
```

### Other Commands

- **Linting**: `npm run lint`
- **Fix Lint Issues**: `npm run lint:fix`
- **Type Checking**: `npm run typecheck`
- **Preview Production Build**: `npm run preview`

## Project Structure

```
src/
├── pages/              # Page components (Dashboard, Standards, Workspace, etc.)
├── components/
│   ├── layout/         # AppLayout, Sidebar
│   ├── shared/         # CategoryBadge, HealthBadge
│   ├── ui/             # Radix UI component wrappers
│   ├── wizard/         # WizardStep
│   └── workspace/      # CodeEditor, PolicyPanel, EvidencePack
├── hooks/
│   ├── use-mobile.jsx
│   └── use-standards-sync.jsx   # Standards repository sync hook
├── lib/
│   ├── standards-data.js        # AUTHOR_STANDARDS and POLICY_CHECKS definitions
│   ├── standards-config.js      # Repo sync config, URL builder, Markdown parser
│   ├── reference-examples.js    # Reference implementations mapped to each standard
│   ├── AuthContext.jsx
│   ├── query-client.js
│   └── utils.js
├── api/                # Base44 API client
├── utils/
└── pages.config.js

entities/               # Data entity definitions (Project, Standard, Template)
```

## Standards Repository Sync

The Standards Registry can pull live content from the Git repository where the `layer4-standards` Markdown documents are maintained. This ensures the policy descriptions and standard statements in the app always match the authoritative source.

### Configuration

Open the **Standards** page and click **Repo source**. Enter:

| Field | Description |
|---|---|
| Provider | `github`, `gitlab`, or `raw` |
| Owner / Org | GitHub owner or org name |
| Repository | Repository name |
| Branch | Branch to read from (default: `main`) |
| Standards Folder Path | Path to the standards documents within the repo (default: `layer4-standards`) |
| Personal Access Token | Required only for private GitHub repositories |

Click **Save & Sync** to persist the configuration and perform an immediate fetch. Settings and cached data are stored in browser `localStorage`.

### How it works

- On each visit, the app checks whether the cache is older than 4 hours. If it is and the repo is configured, it automatically re-fetches in the background.
- Each Markdown document is parsed for its Standard Statement, Author Obligations, Approval Gate Requirements, and Anti-Patterns sections.
- Parsed content is overlaid on the static standards definitions — the Standards page displays the live repo version of the standard statement when available, indicated by a **Repo synced** badge.
- The static definitions in `src/lib/standards-data.js` remain as the reliable fallback when no repo is configured or when a sync has not yet run.

### Keeping policy checks current

When standards documents in the source repository change, re-sync the app by clicking **Sync now** on the Standards page. For automated updates, configure a CI step in the standards repository that calls `localStorage` isn't available server-side — instead, update `src/lib/standards-data.js` via a script that fetches the documents and regenerates the static definitions, then redeploy.

## Policy Check Scoring

The Workspace panel scores each project from 0–100 based on the fraction of passing policy checks. Health status thresholds:

| Score | Status |
|---|---|
| ≥ 80 | Green — compliant |
| 50–79 | Amber — needs attention |
| < 50 | Red — not production-ready |

## Authentication

The application uses password-based authentication managed through `AuthContext`. Users must enter the access password on the login screen to access the application.

## API Integration

The application connects to a Base44 backend. Configure your API endpoint in `.env.local` using `VITE_BASE44_APP_BASE_URL`.

## License

Private project
