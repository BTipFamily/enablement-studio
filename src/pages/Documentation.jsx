import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Globe, Code2, Target } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │Dashboard │ │Standards │ │  Wizard  │ │Workspace│ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│                        │                              │
│         ┌──────────────┼──────────────┐              │
│         │              │              │              │
│  ┌──────────┐ ┌──────────────┐ ┌───────────┐       │
│  │ Guardrail│ │   Template   │ │  Evidence  │       │
│  │  Engine  │ │  Generator   │ │  Pack Gen  │       │
│  └──────────┘ └──────────────┘ └───────────┘       │
└─────────────────────────────────────────────────────┘
                        │
              ┌─────────┴─────────┐
              │   Atelier Backend  │
              │  ┌─────────────┐  │
              │  │  Entities   │  │
              │  │ - Standard  │  │
              │  │ - Project   │  │
              │  │ - Template  │  │
              │  └─────────────┘  │
              └───────────────────┘
\`\`\`

## Data Flow

1. **Build Wizard** → collects configuration → generates code from templates
2. **Workspace** → edits code → runs policy checks in real-time
3. **Policy Engine** → regex/pattern checks against code → produces check results
4. **Evidence Pack** → aggregates project metadata + check results → exportable artifact

## Entity Relationship

- **Standard** — stores the 7 author standards with full schema
- **Project** — automation projects with generated code and check results
- **Template** — starter templates per automation type
`;

const API_CONTENT = `# API Design

## Standards

### GET /api/standards
List all standards with optional category filter.

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

## Templates

### GET /api/templates?type=Python
Get starter templates for a given automation type.
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
  { id: "prd", label: "PRD", icon: FileText, content: PRD_CONTENT },
  { id: "architecture", label: "Architecture", icon: Globe, content: ARCHITECTURE_CONTENT },
  { id: "api", label: "API Design", icon: Code2, content: API_CONTENT },
  { id: "mvp", label: "MVP Plan", icon: Target, content: MVP_CONTENT },
];

export default function Documentation() {
  const [activeTab, setActiveTab] = useState("prd");

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