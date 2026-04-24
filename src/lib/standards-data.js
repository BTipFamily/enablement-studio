// The 7 consolidated Author Standards data
export const AUTHOR_STANDARDS = [
  {
    name: "Safe Execution",
    slug: "safe-execution",
    classification_layer: 4,
    status: "Active",
    owner: "Automation Platform Team",
    applies_to: "All automation artifacts",
    order: 1,
    category: "Author Standard",
    purpose: "Prevent unintended impact by ensuring every automation validates its inputs, constrains its blast radius, classifies failures correctly, and handles concurrent execution safely. Uncontrolled execution is the primary source of automation-caused incidents.",
    standard_statement: "Every automation must validate inputs, enforce scope boundaries, classify and handle failures, and ensure concurrent execution cannot produce conflicting or compounded changes.",
    author_obligations: [
      "Validate all inputs against expected types, ranges, and allow-lists before execution begins",
      "Define and enforce blast radius limits (max targets, max changes per run)",
      "Implement failure classification: transient vs permanent, recoverable vs non-recoverable",
      "Ensure concurrent safety: automation must either serialize access to shared resources or detect and reject conflicting concurrent runs",
      "Implement dry-run / check mode that validates without making changes",
      "Exit with appropriate status codes that distinguish success, partial failure, and total failure"
    ],
    platform_controls: [
      "Pipeline enforces main-branch-only execution for production",
      "Platform captures execution initiator identity automatically",
      "Platform enforces commit SHA traceability",
      "Platform enforces approval workflow before production promotion"
    ],
    approval_gate_requirements: [
      "Evidence that input validation rejects invalid/out-of-scope values",
      "Evidence that blast radius controls are configured and tested",
      "Evidence that failure paths are classified and handled",
      "Evidence that concurrency risks are identified and mitigated"
    ],
    template_references: [
      "safe-execution-python-starter",
      "safe-execution-ansible-starter",
      "safe-execution-powershell-starter",
      "safe-execution-bash-starter"
    ],
    anti_patterns: [
      "Accepting raw user input without validation or sanitization",
      "Running against all targets with no scope limit",
      "Catching all exceptions with a generic handler that hides failure root cause",
      "Ignoring concurrent execution entirely — assuming single-threaded execution without verification"
    ],
    review_checklist: [
      "Are all inputs validated against expected types and ranges?",
      "Is blast radius explicitly bounded?",
      "Are failures classified as transient/permanent, recoverable/non-recoverable?",
      "Is concurrent execution safe or explicitly serialized?",
      "Does dry-run mode exist and correctly skip destructive actions?",
      "Do exit codes distinguish success, partial failure, and total failure?"
    ],
    related_standards: ["idempotency", "backout-recovery"]
  },
  {
    name: "Idempotency & Re-runnable Behavior",
    slug: "idempotency",
    classification_layer: 4,
    status: "Active",
    owner: "Automation Platform Team",
    applies_to: "All automation artifacts",
    order: 2,
    category: "Author Standard",
    purpose: "Ensure that re-running automation after a partial failure does not compound changes, create duplicates, or leave the system in an inconsistent state. Idempotency is an operational safety requirement, not just a coding best practice.",
    standard_statement: "Every automation must produce the same end state regardless of how many times it is executed, and must combine idempotent operations with bounded retries and explicit timeouts.",
    author_obligations: [
      "Design all operations to converge to the desired end state, not append/duplicate",
      "Implement bounded retries with backoff for transient failures",
      "Set explicit timeouts for all external calls and long-running operations",
      "Record state before changes to enable safe re-execution detection",
      "Ensure partial failure leaves system in a known, recoverable state"
    ],
    platform_controls: [
      "Platform records execution run IDs for deduplication",
      "Pipeline prevents overlapping runs of the same automation against the same scope"
    ],
    approval_gate_requirements: [
      "Evidence that re-running after partial failure does not create duplicate or conflicting changes",
      "Evidence that retries are bounded and timeouts are explicit",
      "Evidence of idempotent behavior tested in representative conditions"
    ],
    template_references: ["idempotency-pattern-python", "idempotency-pattern-ansible"],
    anti_patterns: [
      "Using 'append' operations where 'ensure present' is required",
      "Unbounded retries that can amplify failures",
      "Missing timeouts on API calls or remote commands",
      "Assuming clean state instead of checking current state before acting"
    ],
    review_checklist: [
      "Does re-execution produce the same end state?",
      "Are retries bounded with appropriate backoff?",
      "Are all external calls and operations explicitly timed out?",
      "Is pre-change state recorded for safe re-execution?",
      "Is partial failure handled without compounding changes?"
    ],
    related_standards: ["safe-execution", "backout-recovery"]
  },
  {
    name: "Tested Before Production",
    slug: "tested-before-production",
    classification_layer: 4,
    status: "Active",
    owner: "Automation Platform Team",
    applies_to: "All automation artifacts",
    order: 3,
    category: "Author Standard",
    purpose: "Ensure that automation is validated in conditions representative of production before it is promoted. Tests that do not reflect production conditions provide false confidence and miss the failures that matter most.",
    standard_statement: "Every automation must be tested in an environment with defined minimum parity to production, and test evidence must be recorded before production promotion.",
    author_obligations: [
      "Define minimum environmental parity requirements for testing",
      "Create test cases covering happy path, failure paths, and edge cases",
      "Execute tests in an environment meeting parity requirements",
      "Record test evidence including environment description, test cases, results, and timestamps",
      "Verify backout/recovery procedures during testing"
    ],
    platform_controls: [
      "Pipeline enforces test stage completion before production deployment",
      "Platform tracks test environment configuration for parity verification"
    ],
    approval_gate_requirements: [
      "Test evidence in representative conditions with defined parity",
      "Documentation of environmental parity (what was tested vs production)",
      "Test results covering success, failure, and edge case scenarios"
    ],
    template_references: ["test-evidence-template", "environment-parity-checklist"],
    anti_patterns: [
      "Testing only in a development environment with no production resemblance",
      "Testing only the happy path and ignoring failure scenarios",
      "Relying on 'it worked in dev' as sufficient evidence",
      "Skipping backout testing because 'it should work'"
    ],
    review_checklist: [
      "Are minimum parity requirements defined?",
      "Were tests executed in an environment meeting parity requirements?",
      "Do test cases cover success, failure, and edge cases?",
      "Is test evidence recorded with timestamps and environment details?",
      "Were backout procedures tested?"
    ],
    related_standards: ["safe-execution", "backout-recovery"]
  },
  {
    name: "Automatic Backout & Recovery",
    slug: "backout-recovery",
    classification_layer: 4,
    status: "Active",
    owner: "Automation Platform Team",
    applies_to: "All automation that makes changes to infrastructure",
    order: 4,
    category: "Author Standard",
    purpose: "Ensure every automation that modifies infrastructure has a defined, documented, and tested recovery path. Backout capability is the last line of defense when automation causes unintended impact.",
    standard_statement: "Every automation that makes changes must define a recovery path, document it in the approved template, and test it where the risk tier requires.",
    author_obligations: [
      "Define the backout/recovery strategy before implementation",
      "Implement automated backout hooks where feasible",
      "Capture pre-change state sufficient to enable rollback",
      "Document manual recovery steps where automation backout is not possible",
      "Test backout procedures in representative conditions for Medium+ risk tiers"
    ],
    platform_controls: [
      "Platform stores pre-change snapshots when configured",
      "Pipeline requires backout documentation before production promotion"
    ],
    approval_gate_requirements: [
      "Defined recovery path documented in approved template",
      "Backout tested where required by risk tier",
      "Pre-change state capture mechanism documented"
    ],
    template_references: ["backout-documentation-template", "rollback-test-record"],
    anti_patterns: [
      "Assuming backout is 'just undo' without defining specific steps",
      "No pre-change state capture before making changes",
      "Backout plan exists on paper but was never tested",
      "Relying solely on infrastructure snapshots without testing restore"
    ],
    review_checklist: [
      "Is the recovery strategy defined and documented?",
      "Are automated backout hooks implemented where feasible?",
      "Is pre-change state captured before modifications?",
      "Are manual recovery steps documented for non-automatable cases?",
      "Has backout been tested for this risk tier?"
    ],
    related_standards: ["safe-execution", "idempotency", "tested-before-production"]
  },
  {
    name: "Observability, Logging & Reportability",
    slug: "observability-logging",
    classification_layer: 4,
    status: "Active",
    owner: "Automation Platform Team",
    applies_to: "All automation artifacts",
    order: 5,
    category: "Author Standard",
    purpose: "Ensure every execution produces structured output sufficient to reconstruct what happened from automation output alone. Consistent output enables incident review, audit, and cross-team aggregation without requiring access to the executing system.",
    standard_statement: "Every automation must produce structured, queryable output that records execution context, actions taken, results, and timing with sufficient detail to reconstruct the execution from output alone.",
    author_obligations: [
      "Emit structured log output (JSON or consistent key-value format)",
      "Record execution context: run ID, initiator, scope, timestamps",
      "Log every significant action with before/after state where applicable",
      "Produce an execution summary record on completion (success/failure/partial)",
      "Ensure output format is consistent enough for cross-team querying and aggregation"
    ],
    platform_controls: [
      "Platform captures execution timestamps automatically",
      "Platform aggregates structured output for dashboarding",
      "Platform enforces output schema validation where configured"
    ],
    approval_gate_requirements: [
      "Structured output that supports incident review and audit",
      "Execution summary record format defined and implemented",
      "Output schema documented and consistent with aggregation requirements"
    ],
    template_references: ["structured-output-schema", "execution-summary-template"],
    anti_patterns: [
      "Using print statements or unstructured text logging",
      "Logging only errors and not successful actions",
      "Inconsistent output formats that prevent cross-team aggregation",
      "Missing execution context (who, what, when, where) in output"
    ],
    review_checklist: [
      "Is output structured (JSON or consistent key-value)?",
      "Is execution context recorded (run ID, initiator, scope, time)?",
      "Are significant actions logged with before/after state?",
      "Is an execution summary produced on completion?",
      "Is the output format consistent for cross-team aggregation?"
    ],
    related_standards: ["safe-execution", "naming-metadata"]
  },
  {
    name: "Secured by Design",
    slug: "secured-by-design",
    classification_layer: 4,
    status: "Active",
    owner: "Automation Platform Team",
    applies_to: "All automation artifacts",
    order: 6,
    category: "Author Standard",
    purpose: "Ensure automation operates with least privilege, handles secrets safely, controls sensitive output, and enforces separation of duties. Security failures in automation are amplified by the scale and speed of automated execution.",
    standard_statement: "Every automation must operate with least privilege, never store secrets in code or plain configuration, control sensitive output exposure, and enforce separation of duties where required.",
    author_obligations: [
      "Request only the minimum privileges required for the automation's scope",
      "Retrieve secrets from approved vault/secret management only — never hardcode or store in config",
      "Mask or redact sensitive values in all output, logs, and error messages",
      "Enforce separation of duties: automation that creates access must not be the same that approves it",
      "Validate that credential types match the declared credential need, never accept secret values as input parameters"
    ],
    platform_controls: [
      "Platform injects credentials from vault at runtime",
      "Pipeline scans for hardcoded secrets before merge",
      "Platform enforces role-based access to automation execution"
    ],
    approval_gate_requirements: [
      "Evidence that privilege scope is minimized and documented",
      "Evidence that secrets are retrieved from approved vault only",
      "Evidence that sensitive output is masked/redacted",
      "Evidence that separation of duties is enforced where applicable"
    ],
    template_references: ["secrets-handling-pattern", "least-privilege-checklist"],
    anti_patterns: [
      "Hardcoding credentials, tokens, or keys anywhere in automation code",
      "Running automation with admin/root when lesser privileges suffice",
      "Exposing secrets in logs, error messages, or structured output",
      "Accepting secret values as command-line arguments or input parameters"
    ],
    review_checklist: [
      "Does the automation request only minimum required privileges?",
      "Are all secrets retrieved from approved vault/secret management?",
      "Are sensitive values masked in all output and error messages?",
      "Is separation of duties enforced where required?",
      "Does the automation reject secret values as input parameters?"
    ],
    related_standards: ["safe-execution", "observability-logging"]
  },
  {
    name: "Naming, Metadata & Classification",
    slug: "naming-metadata",
    classification_layer: 4,
    status: "Active",
    owner: "Automation Platform Team",
    applies_to: "All automation artifacts",
    order: 7,
    category: "Author Standard",
    purpose: "Ensure every automation asset is consistently named, carries required metadata, is correctly classified, and is ready to catalog and govern. Without consistent naming and metadata, automation assets become ungovernable at scale.",
    standard_statement: "Every automation must follow consistent naming conventions, carry required metadata (owner, classification, lifecycle status), and be registered in the automation catalog.",
    author_obligations: [
      "Follow the naming convention for the target technology area",
      "Include required metadata: owner, technology area, risk tier, lifecycle status",
      "Classify the automation according to the approved classification taxonomy",
      "Register the automation in the catalog with complete metadata",
      "Manage lifecycle status: mark deprecated automations and provide migration guidance"
    ],
    platform_controls: [
      "Platform enforces naming pattern validation on commit",
      "Catalog enforces required metadata fields on registration",
      "Platform tracks lifecycle status and surfaces deprecation warnings"
    ],
    approval_gate_requirements: [
      "Asset is named consistently per convention",
      "Required metadata is complete and accurate",
      "Classification is correct per taxonomy",
      "Catalog entry is created/updated"
    ],
    template_references: ["operator-header-template", "catalog-entry-template"],
    anti_patterns: [
      "Ad-hoc naming that doesn't follow any convention",
      "Missing or incomplete metadata (no owner, no classification)",
      "Deprecated automations without deprecation markers or migration guidance",
      "Automation exists but is not registered in the catalog"
    ],
    review_checklist: [
      "Does the name follow the technology area naming convention?",
      "Is all required metadata present and accurate?",
      "Is the classification correct per the approved taxonomy?",
      "Is the automation registered in the catalog?",
      "If deprecated, is there a migration path documented?"
    ],
    related_standards: ["observability-logging"]
  }
];

// Items explicitly moved OUT of author standards
export const NON_AUTHOR_ITEMS = {
  platform_enforcement: [
    "Main-branch execution blocking",
    "Commit SHA capture",
    "Initiator identity capture",
    "Execution timestamp capture",
    "Dependency pinning enforcement",
    "Linting gate enforcement",
    "Classification blocking controls"
  ],
  template_requirements: [
    "Operator header content",
    "Exception request fields",
    "Rollback test record structure",
    "Approval evidence structure",
    "Catalog entry fields"
  ],
  guidance: [
    "SOLID principles for automation",
    "Detailed KPI taxonomy",
    "Detailed metric naming conventions",
    "Aggregation rules for dashboards",
    "Dashboard design patterns",
    "Anti-pattern catalogs by technology",
    "Platform-specific code examples"
  ]
};

// Technology-specific starter templates
export const STARTER_TEMPLATES = {
  Python: {
    main_code: `#!/usr/bin/env python3
"""
===============================================================================
Automation: {{name}}
Technology: {{technology_area}}
Owner: {{owner}}
Risk Tier: {{risk_tier}}
Classification: {{classification}}
Status: {{lifecycle_status}}
Created: {{created_date}}
===============================================================================
Description: {{description}}
Backout: {{backout_approach}}
===============================================================================
"""

import json
import sys
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional

# --- Structured Output ---
class AutomationLogger:
    def __init__(self, run_id: str, automation_name: str):
        self.run_id = run_id
        self.automation_name = automation_name
        self.actions = []
        self.start_time = datetime.now(timezone.utc)

    def log_action(self, action: str, target: str, status: str, details: Optional[Dict] = None):
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "run_id": self.run_id,
            "automation": self.automation_name,
            "action": action,
            "target": target,
            "status": status,
            "details": details or {}
        }
        self.actions.append(entry)
        print(json.dumps(entry))

    def summary(self, overall_status: str) -> Dict:
        return {
            "run_id": self.run_id,
            "automation": self.automation_name,
            "start_time": self.start_time.isoformat(),
            "end_time": datetime.now(timezone.utc).isoformat(),
            "overall_status": overall_status,
            "total_actions": len(self.actions),
            "successful": sum(1 for a in self.actions if a["status"] == "success"),
            "failed": sum(1 for a in self.actions if a["status"] == "failed")
        }


# --- Input Validation ---
def validate_inputs(params: Dict[str, Any]) -> Dict[str, Any]:
    """Validate all inputs before execution. Reject unsafe values."""
    validated = {}
    # TODO: Add input validation rules
    # Example:
    # if not isinstance(params.get("targets"), list):
    #     raise ValueError("targets must be a list")
    # if len(params["targets"]) > MAX_TARGETS:
    #     raise ValueError(f"blast radius exceeded: max {MAX_TARGETS} targets")
    return validated


# --- Pre-change State Capture (for backout) ---
def capture_pre_state(targets: list) -> Dict:
    """Capture current state before making changes."""
    pre_state = {}
    # TODO: Implement state capture for your technology
    return pre_state


# --- Backout Hook ---
def backout(pre_state: Dict, logger: AutomationLogger) -> bool:
    """Restore to pre-change state. Returns True if successful."""
    logger.log_action("backout", "all", "started")
    # TODO: Implement backout logic
    logger.log_action("backout", "all", "completed")
    return True


# --- Main Execution ---
def execute(params: Dict[str, Any], dry_run: bool = False) -> int:
    """Main execution entry point. Returns exit code."""
    import uuid
    run_id = str(uuid.uuid4())[:8]
    logger = AutomationLogger(run_id, "{{name}}")

    logger.log_action("initialize", "automation", "started", {"dry_run": dry_run})

    # 1. Validate inputs
    validated = validate_inputs(params)

    # 2. Capture pre-change state
    pre_state = capture_pre_state(validated.get("targets", []))

    # 3. Execute (skip destructive actions in dry-run)
    if dry_run:
        logger.log_action("dry_run", "all", "success", {"message": "No changes made"})
        print(json.dumps(logger.summary("dry_run_success")))
        return 0

    # TODO: Implement main execution logic here

    # 4. Produce summary
    summary = logger.summary("success")
    print(json.dumps(summary))
    return 0


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="{{description}}")
    parser.add_argument("--dry-run", action="store_true", help="Validate without making changes")
    parser.add_argument("--params-file", type=str, help="JSON file with execution parameters")
    args = parser.parse_args()

    params = {}
    if args.params_file:
        with open(args.params_file) as f:
            params = json.load(f)

    sys.exit(execute(params, dry_run=args.dry_run))
`,
    metadata_schema: `{
  "run_metadata": {
    "automation_name": "{{name}}",
    "version": "1.0.0",
    "technology_area": "{{technology_area}}",
    "owner": "{{owner}}",
    "risk_tier": "{{risk_tier}}",
    "classification": "{{classification}}",
    "requires_approval": true,
    "credential_type": "{{credential_need}}",
    "backout_approach": "{{backout_approach}}",
    "concurrency_mode": "{{concurrency_risk}}",
    "max_targets": 10,
    "timeout_seconds": 300,
    "retry_policy": {
      "max_retries": 3,
      "backoff_seconds": 5
    }
  },
  "output_contract": {
    "format": "json",
    "fields": ["run_id", "timestamp", "action", "target", "status", "details"],
    "summary_fields": ["run_id", "overall_status", "start_time", "end_time", "total_actions"]
  }
}`,
    readme_template: `# {{name}}

## Overview
{{description}}

## Technology Area
{{technology_area}}

## Risk Tier
{{risk_tier}}

## Prerequisites
- Python 3.8+
- Required credentials: {{credential_need}}
- Required access: [describe minimum privilege]

## Execution
\`\`\`bash
# Dry run (validate without changes)
python main.py --dry-run --params-file params.json

# Execute
python main.py --params-file params.json
\`\`\`

## Parameters
See \`params.json\` for required parameters.

## Backout
**Approach:** {{backout_approach}}
See \`backout.md\` for detailed recovery procedures.

## Evidence
Execution produces structured JSON output suitable for:
- Incident review
- Audit trail
- Cross-team aggregation

## Owner
{{owner}}
`,
    backout_template: `# Backout Plan: {{name}}

## Strategy
**Approach:** {{backout_approach}}

## Pre-Change State
Captured automatically before execution. Stored in run output.

## Automatic Backout
The \`backout()\` function in \`main.py\` restores pre-change state.

## Manual Recovery Steps
1. Identify affected targets from execution output
2. [Step-by-step manual recovery]
3. Verify recovery via [method]

## Backout Testing
- [ ] Tested in representative environment
- [ ] Recovery verified after partial failure
- [ ] Recovery verified after complete failure

## Escalation
If backout fails, escalate to: [team/contact]
`
  },

  "Ansible Playbook": {
    main_code: `---
# ============================================================================
# Automation: {{name}}
# Technology: {{technology_area}}
# Owner: {{owner}}
# Risk Tier: {{risk_tier}}
# Classification: {{classification}}
# Status: {{lifecycle_status}}
# Created: {{created_date}}
# Description: {{description}}
# Backout: {{backout_approach}}
# ============================================================================

- name: "{{name}}"
  hosts: "{{ target_hosts | default('localhost') }}"
  gather_facts: true
  serial: "{{ batch_size | default(1) }}"  # Blast radius control
  max_fail_percentage: "{{ max_fail_pct | default(0) }}"

  vars:
    automation_name: "{{name}}"
    dry_run: "{{ check_mode | default(false) }}"
    run_id: "{{ lookup('pipe', 'uuidgen') | default('unknown') }}"
    max_targets: 10
    timeout_seconds: 300

  pre_tasks:
    # --- Input Validation ---
    - name: Validate target count within blast radius
      ansible.builtin.assert:
        that:
          - groups[target_group] | length <= max_targets
        fail_msg: "Blast radius exceeded: {{ groups[target_group] | length }} targets (max: {{ max_targets }})"
      when: target_group is defined

    # --- Pre-change State Capture ---
    - name: Capture pre-change state
      ansible.builtin.shell: |
        echo '{"hostname": "{{ inventory_hostname }}", "timestamp": "{{ ansible_date_time.iso8601 }}"}'
      register: pre_state
      changed_when: false

    # --- Structured Logging: Start ---
    - name: Log execution start
      ansible.builtin.debug:
        msg: >-
          {"run_id": "{{ run_id }}", "automation": "{{ automation_name }}",
           "action": "start", "target": "{{ inventory_hostname }}",
           "status": "started", "timestamp": "{{ ansible_date_time.iso8601 }}"}

  tasks:
    # TODO: Implement main tasks here
    # Use check_mode for dry-run support
    - name: Example task (idempotent)
      ansible.builtin.debug:
        msg: "Implement your automation tasks here"

  post_tasks:
    # --- Structured Logging: Summary ---
    - name: Log execution summary
      ansible.builtin.debug:
        msg: >-
          {"run_id": "{{ run_id }}", "automation": "{{ automation_name }}",
           "action": "complete", "target": "{{ inventory_hostname }}",
           "status": "success", "timestamp": "{{ ansible_date_time.iso8601 }}"}

  handlers:
    # --- Backout Hook ---
    - name: Execute backout
      ansible.builtin.debug:
        msg: "Executing backout for {{ inventory_hostname }}"
      # TODO: Implement backout handler
`,
    metadata_schema: `{
  "run_metadata": {
    "automation_name": "{{name}}",
    "version": "1.0.0",
    "technology_area": "{{technology_area}}",
    "owner": "{{owner}}",
    "risk_tier": "{{risk_tier}}",
    "classification": "{{classification}}",
    "requires_approval": true,
    "credential_type": "{{credential_need}}",
    "backout_approach": "{{backout_approach}}",
    "concurrency_mode": "serial",
    "max_targets": 10,
    "timeout_seconds": 300,
    "ansible_config": {
      "serial": 1,
      "max_fail_percentage": 0,
      "gather_facts": true
    }
  }
}`,
    readme_template: `# {{name}}

## Overview
{{description}}

## Technology Area
{{technology_area}}

## Risk Tier
{{risk_tier}}

## Prerequisites
- Ansible 2.12+
- Required credentials: {{credential_need}}
- Inventory configured for target hosts

## Execution
\`\`\`bash
# Dry run (check mode)
ansible-playbook main.yml --check --diff -i inventory/

# Execute
ansible-playbook main.yml -i inventory/
\`\`\`

## Backout
**Approach:** {{backout_approach}}
See \`backout.md\` for detailed recovery procedures.

## Owner
{{owner}}
`,
    backout_template: `# Backout Plan: {{name}}

## Strategy
**Approach:** {{backout_approach}}

## Automatic Backout
Use the backout playbook:
\`\`\`bash
ansible-playbook backout.yml -i inventory/
\`\`\`

## Manual Recovery Steps
1. Identify affected hosts from execution output
2. [Step-by-step manual recovery]
3. Verify recovery

## Backout Testing
- [ ] Tested in representative environment
- [ ] Recovery verified after partial failure
`
  },

  PowerShell: {
    main_code: `<#
.SYNOPSIS
    {{name}} - {{description}}
.DESCRIPTION
    Technology: {{technology_area}}
    Owner: {{owner}}
    Risk Tier: {{risk_tier}}
    Classification: {{classification}}
    Status: {{lifecycle_status}}
    Created: {{created_date}}
    Backout: {{backout_approach}}
.PARAMETER DryRun
    Validate without making changes
.PARAMETER ParamsFile
    Path to JSON parameters file
#>

[CmdletBinding()]
param(
    [switch]$DryRun,
    [string]$ParamsFile
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# --- Structured Output ---
$script:RunId = [guid]::NewGuid().ToString().Substring(0, 8)
$script:AutomationName = "{{name}}"
$script:Actions = @()

function Write-StructuredLog {
    param(
        [string]$Action,
        [string]$Target,
        [string]$Status,
        [hashtable]$Details = @{}
    )
    $entry = @{
        timestamp  = (Get-Date -Format "o")
        run_id     = $script:RunId
        automation = $script:AutomationName
        action     = $Action
        target     = $Target
        status     = $Status
        details    = $Details
    }
    $script:Actions += $entry
    $entry | ConvertTo-Json -Compress | Write-Output
}

# --- Input Validation ---
function Test-Inputs {
    param([hashtable]$Params)
    # TODO: Add validation rules
    # if ($Params.Targets.Count -gt $MaxTargets) {
    #     throw "Blast radius exceeded"
    # }
    return $Params
}

# --- Pre-change State Capture ---
function Get-PreState {
    param([array]$Targets)
    $preState = @{}
    # TODO: Capture current state
    return $preState
}

# --- Backout Hook ---
function Invoke-Backout {
    param([hashtable]$PreState)
    Write-StructuredLog -Action "backout" -Target "all" -Status "started"
    # TODO: Implement backout
    Write-StructuredLog -Action "backout" -Target "all" -Status "completed"
}

# --- Main Execution ---
function Invoke-Main {
    Write-StructuredLog -Action "initialize" -Target "automation" -Status "started" -Details @{dry_run = $DryRun.IsPresent}

    $params = @{}
    if ($ParamsFile) {
        $params = Get-Content $ParamsFile | ConvertFrom-Json -AsHashtable
    }

    $validated = Test-Inputs -Params $params
    $preState = Get-PreState -Targets ($validated.Targets ?? @())

    if ($DryRun) {
        Write-StructuredLog -Action "dry_run" -Target "all" -Status "success"
        return 0
    }

    # TODO: Main execution logic

    # Summary
    $summary = @{
        run_id         = $script:RunId
        automation     = $script:AutomationName
        overall_status = "success"
        total_actions  = $script:Actions.Count
    }
    $summary | ConvertTo-Json -Compress | Write-Output
    return 0
}

exit (Invoke-Main)
`,
    metadata_schema: `{
  "run_metadata": {
    "automation_name": "{{name}}",
    "version": "1.0.0",
    "technology_area": "{{technology_area}}",
    "owner": "{{owner}}",
    "risk_tier": "{{risk_tier}}",
    "classification": "{{classification}}",
    "credential_type": "{{credential_need}}",
    "backout_approach": "{{backout_approach}}"
  }
}`,
    readme_template: `# {{name}}

## Overview
{{description}}

## Execution
\`\`\`powershell
# Dry run
.\\main.ps1 -DryRun -ParamsFile params.json

# Execute
.\\main.ps1 -ParamsFile params.json
\`\`\`

## Backout
**Approach:** {{backout_approach}}
`,
    backout_template: `# Backout Plan: {{name}}

## Strategy: {{backout_approach}}

## Recovery Steps
1. Run the backout function
2. Verify recovery
`
  },

  Bash: {
    main_code: `#!/usr/bin/env bash
# ============================================================================
# Automation: {{name}}
# Technology: {{technology_area}}
# Owner: {{owner}}
# Risk Tier: {{risk_tier}}
# Classification: {{classification}}
# Status: {{lifecycle_status}}
# Created: {{created_date}}
# Description: {{description}}
# Backout: {{backout_approach}}
# ============================================================================

set -euo pipefail

# --- Configuration ---
readonly AUTOMATION_NAME="{{name}}"
readonly RUN_ID="$(uuidgen 2>/dev/null || echo $$)-$(date +%s)"
readonly MAX_TARGETS=10
readonly TIMEOUT_SECONDS=300
DRY_RUN=false

# --- Structured Output ---
log_action() {
    local action="$1" target="$2" status="$3" details="\${4:-{}}"
    printf '{"timestamp":"%s","run_id":"%s","automation":"%s","action":"%s","target":"%s","status":"%s","details":%s}\\n' \\
        "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$RUN_ID" "$AUTOMATION_NAME" \\
        "$action" "$target" "$status" "$details"
}

log_summary() {
    local status="$1"
    printf '{"run_id":"%s","automation":"%s","overall_status":"%s","timestamp":"%s"}\\n' \\
        "$RUN_ID" "$AUTOMATION_NAME" "$status" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}

# --- Input Validation ---
validate_inputs() {
    # TODO: Add validation rules
    # if [[ "$target_count" -gt "$MAX_TARGETS" ]]; then
    #     echo "ERROR: Blast radius exceeded" >&2; exit 1
    # fi
    return 0
}

# --- Pre-change State Capture ---
capture_pre_state() {
    # TODO: Capture current state for backout
    log_action "pre_state_capture" "all" "started"
}

# --- Backout Hook ---
do_backout() {
    log_action "backout" "all" "started"
    # TODO: Implement backout
    log_action "backout" "all" "completed"
}

# --- Main ---
main() {
    log_action "initialize" "automation" "started" "{\\"dry_run\\": $DRY_RUN}"

    validate_inputs
    capture_pre_state

    if [[ "$DRY_RUN" == "true" ]]; then
        log_action "dry_run" "all" "success"
        log_summary "dry_run_success"
        exit 0
    fi

    # TODO: Main execution logic

    log_summary "success"
    exit 0
}

# --- Argument Parsing ---
while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run) DRY_RUN=true; shift;;
        --params-file) PARAMS_FILE="$2"; shift 2;;
        *) echo "Unknown option: $1" >&2; exit 1;;
    esac
done

# Trap for backout on failure
trap 'do_backout' ERR

main "$@"
`,
    metadata_schema: `{
  "run_metadata": {
    "automation_name": "{{name}}",
    "version": "1.0.0",
    "technology_area": "{{technology_area}}",
    "owner": "{{owner}}",
    "risk_tier": "{{risk_tier}}",
    "classification": "{{classification}}",
    "credential_type": "{{credential_need}}",
    "backout_approach": "{{backout_approach}}"
  }
}`,
    readme_template: `# {{name}}

## Overview
{{description}}

## Execution
\`\`\`bash
# Dry run
./main.sh --dry-run --params-file params.json

# Execute
./main.sh --params-file params.json
\`\`\`

## Backout
**Approach:** {{backout_approach}}
`,
    backout_template: `# Backout Plan: {{name}}

## Strategy: {{backout_approach}}

## Recovery Steps
1. The backout trap fires automatically on failure
2. For manual recovery: [steps]
`
  }
};

// Policy checks for guardrail engine
export const POLICY_CHECKS = [
  {
    id: "safe-exec-input-validation",
    standard: "safe-execution",
    name: "Input Validation Present",
    severity: "error",
    description: "Automation must validate all inputs before execution",
    check: (code) => {
      const patterns = [/validate.*input/i, /assert/i, /if.*not.*valid/i, /raise.*ValueError/i, /throw.*Error/i, /Test-Input/i, /validate_inputs/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Add input validation at the start of execution. Use the validate_inputs() function from the template."
  },
  {
    id: "safe-exec-blast-radius",
    standard: "safe-execution",
    name: "Blast Radius Controls",
    severity: "error",
    description: "Automation must limit the number of targets or changes per run",
    check: (code) => {
      const patterns = [/max_targets/i, /MAX_TARGETS/i, /serial/i, /batch_size/i, /blast.?radius/i, /max_fail/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Define maximum targets or batch size. Use MAX_TARGETS or serial execution from the template."
  },
  {
    id: "safe-exec-dry-run",
    standard: "safe-execution",
    name: "Dry Run Mode",
    severity: "warning",
    description: "Automation should support a dry-run/check mode",
    check: (code) => {
      const patterns = [/dry.?run/i, /check.?mode/i, /--check/i, /--dry-run/i, /-DryRun/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Add --dry-run flag support that validates without making changes."
  },
  {
    id: "idempotency-state-check",
    standard: "idempotency",
    name: "State Check Before Change",
    severity: "error",
    description: "Automation must check current state before making changes",
    check: (code) => {
      const patterns = [/pre.?state/i, /current.?state/i, /capture.*state/i, /get.*state/i, /state.*before/i, /register.*pre/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Capture and check current state before making changes. Use capture_pre_state() from the template."
  },
  {
    id: "idempotency-timeout",
    standard: "idempotency",
    name: "Explicit Timeouts",
    severity: "warning",
    description: "External calls and operations must have explicit timeouts",
    check: (code) => {
      const patterns = [/timeout/i, /TIMEOUT/i, /timeout_seconds/i, /async_timeout/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Add explicit timeouts for all external calls. Define TIMEOUT_SECONDS in configuration."
  },
  {
    id: "observability-structured-output",
    standard: "observability-logging",
    name: "Structured Output",
    severity: "error",
    description: "Automation must produce structured (JSON) output",
    check: (code) => {
      const patterns = [/json\.dumps/i, /ConvertTo-Json/i, /printf.*json/i, /structured.*log/i, /log_action/i, /Write-StructuredLog/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Use structured JSON logging. Use the AutomationLogger / Write-StructuredLog / log_action from the template."
  },
  {
    id: "observability-run-id",
    standard: "observability-logging",
    name: "Run ID Tracking",
    severity: "error",
    description: "Every execution must have a unique run ID for traceability",
    check: (code) => {
      const patterns = [/run_id/i, /RUN_ID/i, /RunId/i, /uuid/i, /execution.?id/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Generate and track a unique run ID for every execution."
  },
  {
    id: "observability-summary",
    standard: "observability-logging",
    name: "Execution Summary",
    severity: "warning",
    description: "Automation must produce a summary record on completion",
    check: (code) => {
      const patterns = [/summary/i, /log_summary/i, /execution.?summary/i, /overall_status/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Add an execution summary that records overall status, timing, and action counts."
  },
  {
    id: "security-no-hardcoded-secrets",
    standard: "secured-by-design",
    name: "No Hardcoded Secrets",
    severity: "error",
    description: "No passwords, tokens, or keys hardcoded in automation",
    check: (code) => {
      const badPatterns = [/password\s*=\s*["'][^"']+["']/i, /token\s*=\s*["'][^"']+["']/i, /api_key\s*=\s*["'][^"']+["']/i, /secret\s*=\s*["'][^"']+["']/i];
      return !badPatterns.some(p => p.test(code));
    },
    fix: "Remove hardcoded secrets. Retrieve credentials from an approved vault/secret manager at runtime."
  },
  {
    id: "security-sensitive-output",
    standard: "secured-by-design",
    name: "Sensitive Output Controls",
    severity: "warning",
    description: "Sensitive values should be masked in output",
    check: (code) => {
      const patterns = [/mask/i, /redact/i, /sanitize/i, /no_log/i, /SecureString/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Add output masking/redaction for sensitive values in logs and error messages."
  },
  {
    id: "backout-hook",
    standard: "backout-recovery",
    name: "Backout Hook Present",
    severity: "error",
    description: "Automation must have a defined backout/recovery mechanism",
    check: (code) => {
      const patterns = [/backout/i, /rollback/i, /recovery/i, /restore/i, /undo/i, /trap.*ERR/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Implement a backout function that can restore pre-change state."
  },
  {
    id: "backout-pre-state",
    standard: "backout-recovery",
    name: "Pre-Change State Capture",
    severity: "error",
    description: "State must be captured before changes for backout capability",
    check: (code) => {
      const patterns = [/pre.?state/i, /pre.?change/i, /snapshot/i, /backup.*state/i, /capture.*state/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Capture system state before making changes to enable rollback."
  },
  {
    id: "naming-metadata-header",
    standard: "naming-metadata",
    name: "Metadata Header Present",
    severity: "warning",
    description: "Automation must include metadata header with owner, classification, risk tier",
    check: (code) => {
      const patterns = [/Owner:/i, /Risk.?Tier:/i, /Classification:/i, /Technology:/i];
      const matches = patterns.filter(p => p.test(code));
      return matches.length >= 2;
    },
    fix: "Add a metadata header block with owner, technology, risk tier, and classification."
  },
  {
    id: "tested-evidence-plan",
    standard: "tested-before-production",
    name: "Test Evidence Structure",
    severity: "warning",
    description: "Project should define how test evidence will be captured",
    check: (_code, project) => {
      return project?.testing_plan && project.testing_plan.length > 10;
    },
    fix: "Define a testing plan that specifies environment parity, test cases, and evidence capture."
  }
];

export function runPolicyChecks(code, project) {
  return POLICY_CHECKS.map(check => ({
    ...check,
    passed: check.check(code || "", project)
  }));
}

export function getComplianceScore(checkResults) {
  if (!checkResults || checkResults.length === 0) return 0;
  const passed = checkResults.filter(c => c.passed).length;
  return Math.round((passed / checkResults.length) * 100);
}

export function getHealthStatus(score) {
  if (score >= 80) return "green";
  if (score >= 50) return "amber";
  return "red";
}