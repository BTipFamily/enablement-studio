// The 7 consolidated Author Standards data
// Source: layer4-standards official documents — last synced 2026-04-24
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
    purpose: "Prevent unintended impact by ensuring every automation acts only within its intended scope, validates inputs before executing, fails in a classifiable and predictable way, and behaves safely when run concurrently against shared resources.",
    standard_statement: "Automation must act only within its intended scope, validate inputs before executing, fail in a classifiable and predictable way, and behave safely when run concurrently against shared resources.",
    author_obligations: [
      "Scope Control: Require an explicit scope selector appropriate to the domain (host group, environment tag, service ID, account ID, CIDR, cluster name). If the scope selector is missing or empty, fail closed — never default to all hosts or all environments. Log the confirmed scope at execution start, before any change. Confirm scope against the approved change record before proceeding; logging a change ID alone is not sufficient.",
      "Input Validation: Validate all inputs affecting execution behavior before any state change begins — presence, type, format, and value safety. Values of *, all, or an empty limit selector must fail closed. Destructive operations (delete, purge, overwrite, permanently alter data) require an explicit confirmation signal: a boolean flag plus a validated change ticket. Rejected inputs produce both a human-readable message and a structured log event: which input failed, what was provided, what was expected.",
      "Failure Classification: Classify every failure into one of five categories and surface the category in execution output. Every failure reports: what failed, which step, expected vs observed. A zero exit on a partially completed change is non-compliant. Automation must not continue executing further change steps after a failure is detected.",
      "Concurrent Execution Safety: Identify shared resources the automation reads and modifies. Document whether concurrent execution is safe in the operator header — read-only automation must still carry this declaration. If unsafe, a validated change ticket is the standard control; an AAP concurrency limit of 1 is supplementary only, not sufficient on its own."
    ],
    failure_categories: [
      { name: "Input or validation failure", description: "Missing, malformed, or unsafe input" },
      { name: "Dependency or service unavailable", description: "Required system, API, or service unreachable" },
      { name: "Authorization or permission failure", description: "Automation identity lacked required permissions" },
      { name: "Execution error", description: "A task failed during the change itself" },
      { name: "Post-execution validation failure", description: "Change completed but outcome could not be confirmed" }
    ],
    platform_controls: [
      "Pipeline enforces main-branch-only execution for production",
      "Platform captures execution initiator identity automatically",
      "Platform enforces commit SHA traceability",
      "Platform enforces approval workflow before production promotion"
    ],
    approval_gate_requirements: [
      "Scope selector present; fails closed when missing — demonstrated with a test, not asserted",
      "Input validation covers all execution-affecting parameters; malformed or missing inputs produce a clear classified rejection before any state change",
      "Failure classification is implemented for all five categories and surfaces correctly in the execution output",
      "Concurrent safety decision is documented in the operator header; if unsafe, the control is in place and shown"
    ],
    template_references: [
      "safe-execution-python-starter",
      "safe-execution-ansible-starter",
      "safe-execution-powershell-starter",
      "safe-execution-bash-starter"
    ],
    anti_patterns: [
      "Broad default scope: hosts: \"{{ target_hosts | default('all') }}\" — runs against all hosts when no limit is specified. Default must fail closed; replace with an assert.",
      "Silent validation skip: using unvalidated input directly as a filename or path component (e.g., include_tasks: \"deploy_{{ environment }}.yml\" without validating environment).",
      "Generic failure message: reporting 'FAILED' or 'non-zero return code' without stating the failure category, what was expected, and what was observed.",
      "Destructive action without confirmation: deleting or purging without requiring an explicit boolean confirm flag and a validated change ticket."
    ],
    review_checklist: [
      "Is there an explicit scope selector that fails closed when missing or empty?",
      "Is the confirmed scope logged before any change executes?",
      "Are all inputs validated for presence, type, format, and value safety before any state change?",
      "Do destructive operations require an explicit boolean confirmation plus a validated change ticket?",
      "Are all five failure categories implemented and surfaced in execution output?",
      "Does automation halt further change steps after detecting a failure?",
      "Is concurrent execution safety documented in the operator header?"
    ],
    operator_header_template: "# SAFE EXECUTION SUMMARY\n# Scope selector:      [parameter name and valid values]\n# Default scope:       [narrow — describe]\n# Fail-closed on:      [conditions that halt execution before any change]\n# Destructive actions: [yes/no — if yes, describe the confirmation requirement]\n# Concurrent safety:   [safe / unsafe — if unsafe, describe the control]\n# Failure categories:  [which of the five categories apply]",
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
    purpose: "Ensure automation produces the same outcome whether it runs once or multiple times against the same target in the same state. An automation that is not safe to re-run is a reliability risk that will compound failures during recovery.",
    standard_statement: "Automation must produce the same outcome whether it runs once or multiple times against the same target in the same state. Retries must be bounded and explicit. Every operation with a time dependency must define a timeout.",
    author_obligations: [
      "Idempotent Design: Before applying any change, check whether the target is already in the desired state; if it is, skip the action and record no change was needed. Do not append, add, or accumulate without first checking whether the item already exists. Do not delete or remove without confirming the item is still present — a missing item is the desired state, not an error. Use declarative state mechanisms where available. Supporting shell and Python scripts must also be idempotent; if a script cannot be made idempotent, add a compensating pre-check in the calling automation. Demonstrate idempotency: run the automation, then run it again without resetting the environment — the second run must complete without errors and report no changes.",
      "Bounded Retries: Define a maximum retry count for every retried operation — there is no compliant default of 'retry until success'. Use a backoff interval between attempts; exponential backoff is preferred for external services. Only retry idempotent operations — retrying a non-idempotent operation risks applying the same change multiple times. Log each retry attempt: attempt number, reason, and interval before next attempt. When the retry limit is reached, fail with a message stating the operation, number of attempts, last error, and recommended next action.",
      "Explicit Timeouts: Every network call, service health check, polling loop, file transfer, and database query must define an explicit timeout. When a timeout expires, treat it as a failure classified as 'dependency or service unavailable' — do not silently continue. Do not rely on platform-level connection timeouts; set application-level timeouts explicitly. For polling loops: define both a poll interval and a maximum wait duration; log the current state at each poll interval."
    ],
    platform_controls: [
      "Platform records execution run IDs for deduplication",
      "Pipeline prevents overlapping runs of the same automation against the same scope"
    ],
    approval_gate_requirements: [
      "Idempotency is demonstrated, not asserted — provide a second execution log against the same target showing no changes and no errors",
      "Every retry block defines a maximum attempt count and a backoff interval — show each one",
      "Every network call, polling loop, and long-running wait defines an explicit timeout — show each one",
      "Supporting scripts are confirmed idempotent or have a documented compensating pre-check in the calling automation"
    ],
    template_references: ["idempotency-pattern-python", "idempotency-pattern-ansible"],
    anti_patterns: [
      "Accumulating without checking: appending a rule or entry every time without checking for its existence first (e.g., echo \"rule\" >> /etc/hosts.allow runs again adds a duplicate).",
      "Deleting without confirming existence: calling userdel or rm without first checking if the target is present — a missing item is the desired state, not an error.",
      "Unbounded retry: using 'until:' or a retry loop without a 'retries:' / max_attempts key — this can retry indefinitely and amplify failures.",
      "Silent polling loop: looping without logging state at each interval, without a maximum wait, and without treating expiry as a classified failure.",
      "Non-idempotent script called without a guard: running a migration or one-time script from automation without a pre-check that confirms it has not already been applied."
    ],
    review_checklist: [
      "Has the automation been run twice against the same target and confirmed no changes or errors on the second run?",
      "Do all create or add operations check for pre-existing state before acting?",
      "Do all delete or remove operations check for existence before acting?",
      "Are all supporting scripts confirmed idempotent or guarded by a compensating pre-check?",
      "Does every retry block define a maximum attempt count?",
      "Does every retry block define a pause or backoff interval?",
      "Are retries limited to idempotent operations only?",
      "Does hitting the retry limit produce a classified, actionable failure message?",
      "Does every network call, polling loop, and long-running wait define an explicit timeout?",
      "Does every polling loop log its current state at each interval?",
      "Does every timeout expiry result in a classified failure rather than silent continuation?"
    ],
    operator_header_template: "# RE-RUNNABLE BEHAVIOR\n# Idempotent:                      [yes / no — if no, explain the compensating control]\n# Safe to re-run after partial failure: [yes / no — explain]\n# Retry-controlled operations:     [list operations with retries and their max attempts]\n# Timeout-controlled operations:   [list operations with explicit timeouts and values]",
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
    purpose: "Ensure that automation is successfully executed and validated in a non-production environment that reflects production conditions before it is approved for production deployment. Testing evidence must be retained as part of the approval record.",
    standard_statement: "Automation must be successfully executed and validated in a non-production environment that reflects production conditions before it is approved for production deployment. Testing evidence must be retained as part of the approval record. Environmental differences from production must be explicitly documented and risk-accepted.",
    author_obligations: [
      "Document the Manual Baseline: Before writing the automation, capture the exact manual steps it replicates — inputs, outputs, and known side effects. The procedure owner must review the automation against this baseline to confirm it is a complete and correct replication.",
      "Validate Steps in Isolation: Run each significant step independently against a test target before end-to-end execution. Confirm that variables and secrets resolve correctly at the step level, and that each step behaves correctly when its dependencies are unavailable. Document any hidden dependencies between steps and make them explicit.",
      "Execute End-to-End in Non-Production: Run against the same type of target that exists in production (same OS, platform, database version). The run must complete successfully without manual intervention. Test the failure and backout path: trigger a deliberate failure at a known point, confirm failure is classified correctly, confirm backout runs and target returns to pre-change state. Re-test after any code change. Test idempotency. Test retry behavior: confirm retries are bounded and do not duplicate side effects.",
      "Document Environmental Parity: Document all six parity dimensions — target system type, dependency versions, execution environment, permissions model, network and connectivity, configuration structure. Every difference from production must be documented with a written risk acceptance explaining why it does not invalidate the test result. Undocumented differences are not acceptable.",
      "Pass All Quality Gates: Linting (no errors; warnings reviewed and resolved or documented), security scanning (no unreviewed critical or high findings), standards compliance checks (all mandatory standards satisfied).",
      "Conduct a Team Review: Walk through the execution log with the team, including anyone who performs the manual process. Confirm every required step is covered, no logic is missing, and the end state matches manual execution.",
      "Retain Test Evidence: Retain as part of the approval record — execution log from the successful non-production run, execution log from the failure and backout test, environmental parity documentation with any documented differences and risk acceptances, linting/security scan/compliance check results."
    ],
    environmental_parity_dimensions: [
      { dimension: "Target system type", check: "Same OS, platform, or technology as production" },
      { dimension: "Dependency versions", check: "Same Ansible collections, Python libraries, or tooling versions as production" },
      { dimension: "Execution environment", check: "Same container image or execution environment definition" },
      { dimension: "Permissions model", check: "Automation identity with the same permission boundaries as production" },
      { dimension: "Network and connectivity", check: "Access to the same types of downstream services" },
      { dimension: "Configuration structure", check: "Same variable structure, vault layout, and inventory grouping" }
    ],
    platform_controls: [
      "Pipeline enforces test stage completion before production deployment",
      "Platform tracks test environment configuration for parity verification"
    ],
    approval_gate_requirements: [
      "Full non-production execution log provided — complete run, no manual intervention",
      "Failure and backout test log provided — deliberate failure, backout trigger, recovery confirmation",
      "Environmental parity documented against all six dimensions; differences documented and risk-accepted",
      "All quality gates passed — linting, security scan, compliance check results provided",
      "Test evidence is linked to the change record and retainable for post-incident review"
    ],
    template_references: ["test-evidence-template", "environment-parity-checklist"],
    approval_evidence_template: "TESTING EVIDENCE SUMMARY\nNon-production execution log:        [link or attachment]\nFailure and backout test log:        [link or attachment]\nEnvironmental parity documented:     [yes / differences listed below]\nDocumented differences:              [list or \"none\"]\nRisk acceptances for differences:    [list or \"none\"]\nLinting result:                      [pass — link]\nSecurity scan result:                [pass / findings reviewed — link]\nStandards compliance result:         [pass — link]",
    anti_patterns: [
      "Testing only in a development environment with no production resemblance",
      "Testing only the happy path and ignoring failure scenarios",
      "Relying on 'it worked in dev' as sufficient evidence",
      "Skipping backout testing because 'it should work'",
      "Marking environmental differences as acceptable without a written risk acceptance"
    ],
    review_checklist: [
      "Has the manual baseline been documented and reviewed by the procedure owner?",
      "Has each significant step been validated in isolation?",
      "Has a successful end-to-end non-production run been completed without manual intervention?",
      "Has a deliberate failure and backout test been executed?",
      "Are all six environmental parity dimensions documented?",
      "Are all differences from production documented with written risk acceptances?",
      "Have linting, security scanning, and standards compliance checks all passed?",
      "Has the execution log been reviewed with the team, including the procedure owner?",
      "Is all test evidence retained and linked to the change record?"
    ],
    related_standards: ["safe-execution", "backout-recovery"]
  },
  {
    name: "Automatic Backout & Recovery",
    slug: "backout-recovery",
    classification_layer: 4,
    status: "Active",
    owner: "Automation Platform Team",
    applies_to: "All automation that makes state-changing actions",
    order: 4,
    category: "Author Standard",
    purpose: "Ensure every state-changing automation detects its own failures and restores affected systems to a known good state without requiring human action to initiate recovery. Rollback must be tested before production deployment. Every rollback event must be tracked and must have a completed root cause analysis.",
    standard_statement: "Every state-changing automation must detect its own failures and restore affected systems to a known good state without requiring human action to initiate recovery. Rollback must be tested before production deployment. Every rollback event must be tracked and must have a completed root cause analysis.",
    seven_stage_pattern: [
      { stage: 1, name: "Before Running", purpose: "Capture and verify pre-change state" },
      { stage: 2, name: "Running", purpose: "Execute the intended change" },
      { stage: 3, name: "Check", purpose: "Validate the change completed successfully" },
      { stage: 4, name: "Problem Detected", purpose: "Detect validation failure; trigger rollback without human action" },
      { stage: 5, name: "Undo", purpose: "Restore the pre-change state" },
      { stage: 6, name: "Verify Undo", purpose: "Confirm rollback completed successfully" },
      { stage: 7, name: "Alert", purpose: "Create incident ticket and notify stakeholders automatically" }
    ],
    author_obligations: [
      "Design Recovery First: Design the rollback path before writing the change path. An automation is not eligible for testing until the recovery path is fully implemented.",
      "Capture and Verify Pre-Change State: Capture all state needed to deterministically restore the system, immediately before any change executes. Verify the captured state is readable and usable before proceeding — a backup that exists but cannot be read is not a valid capture. If capture cannot be verified as restorable, the automation must not proceed.",
      "Identify Irreversible Actions: Explicitly identify any action that cannot be undone: data deletion, external API calls that create permanent records, certificate revocation, schema changes. Each irreversible action requires a documented recovery strategy; prerequisites must be validated before the step executes. If no recovery is possible, a formal risk acceptance with a named owner and approval reference is required in the operator header before production execution.",
      "Implement Automated Rollback: Rollback must execute without human intervention — if it cannot be automated, obtain a formal exception. Rollback logic must be deterministic and idempotent where possible; partial rollbacks must be explicitly documented. If an exception to automated rollback has been approved, the automation must still automatically create an incident and assign it to the defined manual queue at the point of failure.",
      "Verify Rollback Success (Stage 6): Run verification checks after rollback executes — health checks, config validation, data integrity confirmation. A completed rollback attempt is not the same as a confirmed recovery — verification must pass before the incident can be resolved.",
      "Create Incident and Notify Automatically (Stage 7): When rollback triggers, open a ServiceNow incident automatically. Notify defined stakeholders automatically. Both actions must happen without human initiation.",
      "Test Rollback in Non-Production: Required test evidence — deliberate failure triggers rollback without human action, state is restored to pre-change baseline, ServiceNow incident is created and notification is sent automatically. An automation whose rollback has never been deliberately triggered is untested and non-compliant.",
      "Complete Root Cause Analysis After Rollback: Document root cause, corrective actions, and target dates in the incident record before closure. Closing an incident with 'rollback succeeded, no further action' is not a completed RCA."
    ],
    platform_controls: [
      "Platform stores pre-change snapshots when configured",
      "Pipeline requires backout documentation before production promotion"
    ],
    approval_gate_requirements: [
      "All seven stages are identifiable in the automation code",
      "Rollback test record includes: intentional failure log, backout trigger confirmation, state restoration verification, incident and notification artifacts",
      "Pre-change state capture is verified as restorable prior to any change step",
      "Irreversible actions are documented with recovery strategies or formal risk acceptances in the operator header",
      "Test log shows ServiceNow incident and stakeholder notification firing automatically"
    ],
    template_references: ["backout-documentation-template", "rollback-test-record"],
    anti_patterns: [
      "Assuming backout is 'just undo' without defining the exact state capture and restore steps",
      "No verification of the pre-change capture — a backup that cannot be read is not a valid capture",
      "Backout plan exists on paper but the rollback path was never deliberately triggered in testing",
      "Closing an RCA with 'rollback succeeded, no further action' without identifying root cause"
    ],
    review_checklist: [
      "Are all seven stages (Before Running, Running, Check, Problem Detected, Undo, Verify Undo, Alert) identifiable in the code?",
      "Is pre-change state captured and verified as restorable before any change executes?",
      "Are irreversible actions explicitly identified with documented recovery strategies?",
      "Does rollback execute automatically without requiring human intervention?",
      "Does Stage 6 run verification checks (not just confirm rollback completed)?",
      "Does Stage 7 automatically create a ServiceNow incident and notify stakeholders?",
      "Has a deliberate failure-and-rollback test been completed and logged?",
      "Is the rollback test log part of the approval record?"
    ],
    operator_header_template: "# BACKOUT SUMMARY\n# Rollback method:      [describe how state is restored]\n# Pre-change capture:   [what is captured and how it is verified]\n# Irreversible actions: [none / list with approval references]\n# Rollback tested:      [yes — reference the rollback test record]\n# Incident contact:     [team name and escalation path]",
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
    purpose: "Ensure every execution produces output that is structured, complete, and consistent enough to reconstruct what happened from the log alone. That output must be readable by an operator under pressure, aggregable across teams without manual transformation, and free of secrets and sensitive data at all log levels.",
    standard_statement: "Every automation execution must produce output that is structured, complete, and consistent enough to reconstruct what happened from the log alone. That output must be readable by an operator under pressure, aggregable across teams and platforms without manual transformation, and free of secrets and sensitive data at all log levels.",
    author_obligations: [
      "Structured Execution Output — Run-level summary: Produce a run-level summary at start and end of execution containing all required fields: Execution ID, Automation name, Automation revision, Initiator, Initiator type (Manual/Scheduled/Event-driven), Target scope, Environment (dev/test/prod), Start time, End time, Duration, Outcome (Success/Failure/Partial/Backout triggered).",
      "Structured Execution Output — Task-level detail: For every task that changes state, emit task-level detail containing: Task name, Target (specific host/resource/object), Action taken, Result (Changed/Unchanged/Failed/Skipped), Timestamp.",
      "Structured Execution Output — Completion record: At the end of every execution, produce a completion record containing: Final outcome, Failure classification (which of the five Safe Execution categories applies, if failed), Failure point (which task or step failed, if failed), Change summary (count of targets changed/unchanged/failed/skipped), Reference links (backout evidence if rollback occurred).",
      "Operator-Readable Log Messages: Log every significant action before it executes and after it completes. Error messages state what went wrong, where, and why. Use plain language; avoid internal variable names and unexplained codes. Distinguish information, warning, and error levels consistently.",
      "Sensitive Output Controls: Never log a secret, token, password, API key, or certificate value — even in debug mode; log only that it was retrieved. Mask sensitive fields before they reach any log sink; masking must apply in verbose and debug output. Do not log the content of data that may include PII, financial records, or other regulated data — log counts, identifiers, and outcomes."
    ],
    run_level_fields: [
      "Execution ID", "Automation name", "Automation revision", "Initiator",
      "Initiator type", "Target scope", "Environment", "Start time",
      "End time", "Duration", "Outcome"
    ],
    task_level_fields: [
      "Task name", "Target", "Action taken", "Result", "Timestamp"
    ],
    completion_record_fields: [
      "Final outcome", "Failure classification", "Failure point", "Change summary", "Reference links"
    ],
    platform_controls: [
      "Platform captures execution timestamps automatically",
      "Platform aggregates structured output for dashboarding",
      "Platform enforces output schema validation where configured"
    ],
    approval_gate_requirements: [
      "Run-level summary fields are all present in the non-production test execution log",
      "Task-level output is present for all state-changing tasks in the test log",
      "All failure paths exercised in testing produce a classified, actionable error message",
      "Verbose test log contains no secret values, credential content, or PII",
      "Run-level field names match the aggregation schema; any deviations are documented and agreed with the platform team"
    ],
    template_references: ["structured-output-schema", "execution-summary-template"],
    anti_patterns: [
      "Using unstructured text logging (print statements, echo) instead of structured JSON or key-value output",
      "Logging only errors and not successful actions — log before and after every significant action",
      "Inconsistent field names between versions or automations — breaks downstream aggregation",
      "Missing execution context (who, what, when, where) in output",
      "Error messages that say only 'FAILED' or 'non-zero return code' without classification or context"
    ],
    review_checklist: [
      "Are all eleven run-level summary fields present in execution output?",
      "Is task-level detail emitted for every state-changing task?",
      "Does every failure path produce a message that states: what failed, which step, expected vs observed?",
      "Does the completion record include failure classification aligned to the five Safe Execution categories?",
      "Is output format consistent with the aggregation schema?",
      "Is verbose/debug output confirmed free of secret values and PII?"
    ],
    operator_header_template: "# OBSERVABILITY SUMMARY\n# Structured output:    [yes / no — if no, explain]\n# Run summary location: [where in the output the run-level summary appears]\n# Sensitive fields:     [yes / no — if yes, confirm masking is applied]\n# Aggregation schema:   [confirmed / deviations listed]",
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
    purpose: "Ensure automation requests only the permissions it needs, retrieves credentials securely and never exposes them, protects sensitive data in its output, and requires a separate approver for high-risk changes. An automation that works correctly but ignores these obligations is not production-ready.",
    standard_statement: "Automation must request only the permissions it needs, retrieve credentials securely and never expose them, protect sensitive data in its output, and require a separate approver for high-risk changes.",
    author_obligations: [
      "Least Privilege: Define the exact permissions required before requesting access; do not start broad and narrow later. Production and non-production environments must use separate automation identities. Scope access to the automation's domain — a network automation identity must not have permission to modify databases. Document the permissions required in the operator header and update it when scope changes.",
      "Secret and Credential Management: Store secrets in an approved credential provider; CyberArk is the recommended option. Never store secrets as hardcoded values, base64-encoded values in YAML, or in version control regardless of encoding. Retrieve secrets dynamically at runtime on every execution; hard-referencing a version-pinned secret value is non-compliant. Secrets must never appear in logs, console output, error messages, or notifications — mask every retrieved value before it reaches any output sink, including verbose and debug modes. Handle secret expiration gracefully: fail with a classified authorization or permission failure message rather than an unhandled exception.",
      "Separation of Duties for High-Risk Automation: The author must not be the sole approver for high-risk automation. A second reviewer who did not author the change must approve before execution. The approval must be documented and retained in the change record — a verbal approval is not compliant. For self-service workflows, the approval step must be built into the workflow before execution proceeds.",
      "Sensitive Data in Output: Do not log content that may include PII, financial records, health information, or other regulated data — log counts, identifiers, and outcomes. Confirm that third-party tools and modules used by the automation do not produce sensitive output; if they do, suppress or redact before it reaches any log sink."
    ],
    high_risk_criteria: [
      { criterion: "Production-wide scope", examples: "Changes to all hosts in a production environment, all members of a group" },
      { criterion: "Destructive operations", examples: "Data deletion, record purges, certificate revocations, decommissioning" },
      { criterion: "Security policy changes", examples: "Firewall rule modifications, ACL changes, authentication policy updates" },
      { criterion: "Identity and access changes", examples: "User creation/deletion, role assignments, service account changes" },
      { criterion: "Network perimeter changes", examples: "Routing, DNS, load balancer configuration, network security groups" }
    ],
    platform_controls: [
      "Platform injects credentials from vault at runtime",
      "Pipeline scans for hardcoded secrets before merge",
      "Platform enforces role-based access to automation execution"
    ],
    approval_gate_requirements: [
      "Permissions list provided; each permission is required for a specific function; prod and non-prod identities are separate",
      "No secrets appear in code, configuration, or version control — reviewer confirms a secret-pattern search returns no matches",
      "All credentials retrieved from an approved credential provider at runtime; retrieval is dynamic and supports rotation without a code change",
      "Verbose test log contains no secret values; masking is confirmed at all output levels",
      "If high-risk criteria are met: second reviewer's approval is in the change record; for self-service workflows, an approval node is configured before execution"
    ],
    template_references: ["secrets-handling-pattern", "least-privilege-checklist"],
    anti_patterns: [
      "Hardcoding credentials, tokens, or keys anywhere in automation code — including as base64-encoded values in YAML",
      "Running automation with admin/root when lesser privileges suffice",
      "Exposing secrets in logs, error messages, or structured output — including in verbose/debug modes",
      "Accepting secret values as command-line arguments or input parameters",
      "Using the same automation identity for production and non-production environments"
    ],
    review_checklist: [
      "Is the automation identity separate for production and non-production?",
      "Are permissions documented and scoped to the minimum required for the automation's function?",
      "Are all secrets retrieved dynamically from CyberArk or an approved vault at runtime?",
      "Does a secret-pattern search of the codebase return no matches?",
      "Are sensitive values masked at all output levels, including verbose and debug?",
      "If any high-risk criteria are met, is a second reviewer's approval documented in the change record?"
    ],
    operator_header_template: "# SECURITY SUMMARY\n# Automation identity:      [identity name — confirm prod/non-prod separation]\n# Permissions required:     [list — confirm minimum required]\n# Secret systems used:      [CyberArk / Azure Key Vault — confirm dynamic retrieval]\n# Sensitive data processed: [yes / no — if yes, describe handling]\n# High-risk classification: [yes / no — if yes, state the criterion and the approver]",
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
    purpose: "Ensure every automation asset carries a consistent name, a complete operator header, a full classification across four dimensions, and a defined lifecycle with a named team owner. All four must be present before the asset enters the catalog and must be kept current throughout its life.",
    standard_statement: "Every automation asset must carry a consistent name, a complete operator header, a full classification across four dimensions, and a defined lifecycle with a named team owner. All four must be present before the asset enters the catalog and must be kept current throughout its life.",
    author_obligations: [
      "Asset Naming: Structure is [domain]-[action]-[target]. Use lowercase only. Use hyphens for asset names, underscores for variable names. Place action before target. Use domain as prefix. No personal or team identifiers. Descriptive, not abbreviated. Variable names must be consistent at the concept level across all automation in a domain.",
      "Operator Header: Every production entrypoint must include a complete operator header before any code review. All fields are mandatory — empty or placeholder values are not compliant. Required fields: Name (as it appears in catalog), Purpose (1-3 sentences), Automation type, SLA binding, Scope, Inputs (every required parameter), Preconditions, Outputs, Owner (team, not individual), Compliance status, Risk classification, Lifecycle state, Safety (dry-run available, scope selector name, backout reference).",
      "Classification — Four Independent Dimensions: (1) Automation Type: one of Configuration, Provisioning, Service Operation, Troubleshooting, SLA Management, Approval Workflow, One-Time Execution, Legacy. New assets must use one of the first seven types. (2) Risk Classification: Standard (bounded scope) or High-Risk (production-wide, destructive, security policy, identity/access, network perimeter, or SLA Management). (3) SLA Binding: SLA-Bound (directly contributes to a named SLO/SLA), Operational, or Best-Effort. (4) Compliance Status: Compliant, Legacy (pre-framework, needs remediation plan), or Non-Compliant (must not be promoted without time-bound exception).",
      "Lifecycle Management: Assign a team owner before the asset enters the catalog — individual owners are not acceptable. Define lifecycle state at creation: Active, Deprecated (replacement identified, retirement date set), or Pending retirement. When deprecating an SLA-bound asset, confirm the replacement satisfies the SLA commitment first. One-Time Execution assets more than six months past their last execution must be reviewed for retirement."
    ],
    approved_domain_prefixes: [
      "linux", "windows", "network", "firewall", "db", "middleware",
      "observability", "bigdata", "virt", "aix", "storage", "mainframe", "platform"
    ],
    automation_types: [
      { type: "Configuration", definition: "Establishes or modifies the desired state of a system, service, or component" },
      { type: "Provisioning", definition: "Creates or destroys infrastructure, services, or resources" },
      { type: "Service Operation", definition: "Operates or maintains a running service without changing its configuration" },
      { type: "Troubleshooting", definition: "Performs diagnostic or investigative actions; primarily read-only" },
      { type: "SLA Management", definition: "Takes availability, scaling, or resiliency actions directly fulfilling an SLA commitment" },
      { type: "Approval Workflow", definition: "Provides gating or authorization automation that controls whether another process may proceed" },
      { type: "One-Time Execution", definition: "Single-use automation for a specific migration, cutover, or decommission" },
      { type: "Legacy", definition: "Pre-framework asset retained pending remediation or retirement; assigned during classification sprint only" }
    ],
    lifecycle_states: ["Active", "Deprecated", "Pending retirement", "Retired"],
    naming_rules: [
      { rule: "Lowercase only", compliant: "db-backup-instance", non_compliant: "DB_Backup_Instance" },
      { rule: "Hyphens for asset names", compliant: "linux-restart-service", non_compliant: "linux_restart_service" },
      { rule: "Underscores for variables", compliant: "target_host", non_compliant: "target-host" },
      { rule: "Action before target", compliant: "firewall-update-ruleset", non_compliant: "firewall-ruleset-update" },
      { rule: "Domain as prefix", compliant: "network-apply-acl", non_compliant: "apply-network-acl" },
      { rule: "No personal or team identifiers", compliant: "db-backup-instance", non_compliant: "johns-backup / ase-patch-tool" },
      { rule: "Descriptive, not abbreviated", compliant: "firewall-update-ruleset", non_compliant: "fw-upd-rs" }
    ],
    platform_controls: [
      "Platform enforces naming pattern validation on commit",
      "Catalog enforces required metadata fields on registration",
      "Platform tracks lifecycle status and surfaces deprecation warnings"
    ],
    approval_gate_requirements: [
      "Asset name follows [domain]-[action]-[target] in lowercase with hyphens; matches in PR, header, and catalog",
      "Operator header is complete — all fields populated with specific content; a reviewer can answer every operational question from the header alone",
      "All four classification dimensions are assigned in both the header and the catalog entry; any missing dimension is non-compliant",
      "SLA-Bound assets carry the SLA name, affected metric, and escalation path in the catalog entry",
      "High-Risk assets have a documented second-approver approval in the change record",
      "Catalog entry exists before production promotion with all required fields",
      "Owner is a current active team with a confirmed escalation path; lifecycle state matches the automation type"
    ],
    template_references: ["operator-header-template", "catalog-entry-template"],
    anti_patterns: [
      "Ad-hoc naming that doesn't follow [domain]-[action]-[target] convention",
      "Missing or incomplete operator header — any empty field means the design is not sufficiently defined",
      "Misclassifying a destructive automation as Troubleshooting to reduce governance scrutiny — this is a governance violation",
      "Deprecated automations without a retirement date and confirmed replacement",
      "Automation exists in production but is not registered in the catalog"
    ],
    review_checklist: [
      "Does the asset name follow [domain]-[action]-[target] using an approved domain prefix, lowercase, and hyphens?",
      "Does the name match in the PR, operator header, and catalog entry?",
      "Is the operator header complete with all required fields containing specific (non-placeholder) content?",
      "Are all four classification dimensions assigned: automation type, risk classification, SLA binding, compliance status?",
      "If SLA-Bound, does the catalog entry carry the SLA name, affected metric, and escalation path?",
      "If High-Risk, is a second-approver approval documented in the change record?",
      "Does a catalog entry exist with all required fields?",
      "Is the owner a named team (not an individual) with a confirmed escalation path?"
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
  // ── Safe Execution ──────────────────────────────────────────────────────
  {
    id: "safe-exec-input-validation",
    standard: "safe-execution",
    name: "Input Validation Present",
    severity: "error",
    description: "Automation must validate all inputs affecting execution behavior — presence, type, format, and value safety — before any state change begins.",
    check: (code) => {
      const patterns = [/validate.*input/i, /assert/i, /if.*not.*valid/i, /raise.*ValueError/i, /throw.*Error/i, /Test-Input/i, /validate_inputs/i, /input.*validation/i, /param.*valid/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Add input validation at the start of execution before any state change. Use the validate_inputs() function from the template. Rejected inputs must produce both a human-readable message and a structured log event.",
    fixSnippet: `def validate_inputs(env, scope, change_id=""):
    errors = []
    if not scope or scope in ("all", "*"):
        errors.append("scope must be explicit — never 'all'")
    if env not in ("dev", "test", "prod"):
        errors.append(f"env must be dev/test/prod — got: '{env}'")
    if env == "prod" and not re.match(r"^CHG\\d{7}$", change_id):
        errors.append("change_id required for prod (CHG0123456)")
    if errors:
        raise ValueError("INPUT VALIDATION FAILURE:\n" + "\n".join(errors))`
  },
  {
    id: "safe-exec-fail-closed",
    standard: "safe-execution",
    name: "Scope Selector Fails Closed",
    severity: "error",
    description: "When the scope selector is missing or empty, automation must fail closed — never default to all hosts, all environments, or any broad scope.",
    check: (code) => {
      const patterns = [/fail_msg.*required/i, /fail.*closed/i, /assert.*target/i, /required.*scope/i, /cannot.*empty/i, /scope.*required/i, /must.*provide.*target/i, /target.*required/i, /\bfail\b.*\btarget_hosts\b/i];
      const hasBroadDefault = /default\s*\(\s*['"]all['"]\s*\)/i.test(code);
      return patterns.some(p => p.test(code)) && !hasBroadDefault;
    },
    fix: "Replace any default('all') scope with an explicit assert or fail that rejects missing scope values. A missing scope selector must halt execution before any change.",
    fixSnippet: `# Ansible: assert fails closed on empty or 'all' scope
- name: Validate scope is explicit
  ansible.builtin.assert:
    that:
      - target_hosts != ''
      - target_hosts != 'all'
    fail_msg: "target_hosts required — 'all' is never acceptable"

# Python:
if not target_scope or target_scope in ("all", "*"):
    raise InputValidationError("scope must be explicit")`
  },
  {
    id: "safe-exec-failure-classification",
    standard: "safe-execution",
    name: "Failure Classification (5 Categories)",
    severity: "error",
    description: "Every failure must be classified into one of the five standard categories and surfaced in execution output: Input/validation failure, Dependency unavailable, Authorization failure, Execution error, Post-execution validation failure.",
    check: (code) => {
      const categories = [
        [/input.*validation.*fail/i, /validation.*fail/i, /invalid.*input/i],
        [/dependency.*unavail/i, /service.*unavail/i, /unreachable/i, /connection.*refused/i],
        [/authorization.*fail/i, /permission.*fail/i, /access.*denied/i, /forbidden/i],
        [/execution.*error/i, /task.*fail/i, /change.*fail/i],
        [/post.*execution.*fail/i, /post.?execution/i, /validation.*fail.*after/i, /outcome.*not.*confirm/i]
      ];
      const matched = categories.filter(group => group.some(p => p.test(code)));
      return matched.length >= 2;
    },
    fix: "Classify failures into the five standard categories from the Safe Execution standard. Surface the category in execution output alongside what failed, which step, expected vs observed."
  },
  {
    id: "safe-exec-concurrent-safety",
    standard: "safe-execution",
    name: "Concurrent Execution Safety Documented",
    severity: "warning",
    description: "The automation must document whether concurrent execution is safe in the operator header. Read-only automation must also carry this declaration.",
    check: (code) => {
      const patterns = [/concurrent.?safe/i, /concurrency/i, /serial.*execution/i, /max_fail_pct/i, /concurrent.*unsafe/i, /Concurrent safety/i, /concurrently/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Add a 'Concurrent safety:' declaration to the operator header (safe / unsafe). If unsafe, describe the control (validated change ticket, AAP concurrency limit of 1 is supplementary only)."
  },
  {
    id: "safe-exec-dry-run",
    standard: "safe-execution",
    name: "Dry Run / Check Mode",
    severity: "warning",
    description: "Automation should support a dry-run or check mode that validates all inputs and scope without executing state changes.",
    check: (code) => {
      const patterns = [/dry.?run/i, /check.?mode/i, /--check/i, /--dry-run/i, /-DryRun/i, /WhatIf/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Add --dry-run flag support that validates inputs and scope without making changes. Check mode must skip all destructive actions."
  },

  // ── Idempotency ──────────────────────────────────────────────────────────
  {
    id: "idempotency-state-check",
    standard: "idempotency",
    name: "State Check Before Change",
    severity: "error",
    description: "Before applying any change, automation must check whether the target is already in the desired state. A missing item is the desired state for a delete, not an error.",
    check: (code) => {
      const patterns = [/pre.?state/i, /current.?state/i, /capture.*state/i, /get.*state/i, /state.*before/i, /register.*pre/i, /exists/i, /is_present/i, /already.*exist/i, /check.*before/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Check current state before making changes. Use capture_pre_state() from the template. Do not append, add, or delete without first verifying current state."
  },
  {
    id: "idempotency-bounded-retries",
    standard: "idempotency",
    name: "Bounded Retries with Backoff",
    severity: "error",
    description: "Every retry operation must define a maximum attempt count and a backoff interval. There is no compliant default of 'retry until success'.",
    check: (code) => {
      const retryPatterns = [/retries\s*:/i, /max_retries/i, /MAX_RETRIES/i, /max_attempts/i, /retry_count/i, /retry_limit/i];
      const backoffPatterns = [/backoff/i, /delay\s*:/i, /sleep/i, /wait.*seconds/i, /retry.*interval/i, /pause.*between/i];
      const hasRetry = retryPatterns.some(p => p.test(code));
      const hasBackoff = backoffPatterns.some(p => p.test(code));
      // Pass if: either no retry block at all, OR retry block has both max count AND backoff
      const hasRetryBlock = /retry|until:/i.test(code);
      if (!hasRetryBlock) return true;
      return hasRetry && hasBackoff;
    },
    fix: "Define retries: N (maximum count) and a backoff delay for every retry block. Unbounded retries that can amplify failures are non-compliant."
  },
  {
    id: "idempotency-timeout",
    standard: "idempotency",
    name: "Explicit Timeouts",
    severity: "warning",
    description: "Every network call, service health check, polling loop, file transfer, and database query must define an explicit application-level timeout.",
    check: (code) => {
      const patterns = [/timeout/i, /TIMEOUT/i, /timeout_seconds/i, /async_timeout/i, /connect_timeout/i, /read_timeout/i, /poll.*interval/i, /max.*wait/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Add explicit timeouts for all external calls and polling loops. Do not rely on platform-level connection timeouts. Treat timeout expiry as 'dependency or service unavailable', not silent continuation."
  },

  // ── Tested Before Production ─────────────────────────────────────────────
  {
    id: "tested-evidence-plan",
    standard: "tested-before-production",
    name: "Test Evidence Plan Defined",
    severity: "warning",
    description: "The project must define how test evidence will be captured, including what non-production environment will be used and what parity it has with production.",
    check: (_code, project) => {
      return project?.testing_plan && project.testing_plan.length > 20;
    },
    fix: "Define a testing plan that specifies: environment parity documentation, end-to-end run evidence, failure and backout test log, and quality gate results."
  },
  {
    id: "tested-parity-documented",
    standard: "tested-before-production",
    name: "Environmental Parity Documented",
    severity: "warning",
    description: "All six parity dimensions must be documented: target system type, dependency versions, execution environment, permissions model, network/connectivity, and configuration structure.",
    check: (_code, project) => {
      return project?.testing_plan && /parity|non.?prod|same.*os|same.*version|environment.*match|permission.*bound/i.test(project.testing_plan);
    },
    fix: "Document environmental parity against all six dimensions. Every difference from production must be documented with a written risk acceptance — undocumented differences are not acceptable."
  },
  {
    id: "tested-quality-gates",
    standard: "tested-before-production",
    name: "Quality Gates Evidence",
    severity: "warning",
    description: "Linting (no errors), security scanning (no unreviewed critical/high findings), and standards compliance check results must be provided before production promotion.",
    check: (_code, project) => {
      return project?.testing_plan && /lint|security.*scan|compliance.*check|quality.*gate/i.test(project.testing_plan);
    },
    fix: "Include evidence of passing: linting (no errors), security scan (no unreviewed critical/high findings), and standards compliance check as part of the test evidence record."
  },

  // ── Automatic Backout & Recovery ─────────────────────────────────────────
  {
    id: "backout-hook",
    standard: "backout-recovery",
    name: "Backout / Rollback Mechanism Present",
    severity: "error",
    description: "Automation must have a defined backout or rollback mechanism (Stage 5: Undo). Design the recovery path before writing the change path.",
    check: (code) => {
      const patterns = [/backout/i, /rollback/i, /recovery/i, /restore/i, /undo/i, /trap.*ERR/i, /rescue/i, /revert/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Implement a backout function that restores pre-change state. The recovery path must be designed and implemented before testing begins.",
    fixSnippet: `# Ansible: rescue = automatic rollback
- name: Apply change with rollback
  block:
    - name: Apply change
      ... # your change task
    - name: Post-validate
      ... # your health check
  rescue:
    - name: Automatic rollback
      ansible.builtin.copy:
        src: /tmp/backups/app.conf.bak
        dest: /etc/app/app.conf
        remote_src: true`
  },
  {
    id: "backout-pre-state",
    standard: "backout-recovery",
    name: "Pre-Change State Capture (Stage 1)",
    severity: "error",
    description: "State must be captured and verified as restorable immediately before any change executes. A backup that exists but cannot be read is not a valid capture.",
    check: (code) => {
      const patterns = [/pre.?state/i, /pre.?change/i, /snapshot/i, /backup.*state/i, /capture.*state/i, /before.*change/i, /capture.*before/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Capture system state before making changes and verify it is restorable. If capture cannot be verified, the automation must not proceed.",
    fixSnippet: `# Python: capture + validate before any change
backup_path = config_path + f".bak.{run_id}"
shutil.copy2(config_path, backup_path)
if os.path.getsize(backup_path) == 0:
    raise RuntimeError("Backup validation failed — halting")

# Ansible:
- name: Capture pre-change state
  ansible.builtin.copy:
    src: /etc/app/app.conf
    dest: /tmp/backups/app.conf.bak
    remote_src: true`
  },
  {
    id: "backout-auto-trigger",
    standard: "backout-recovery",
    name: "Automatic Rollback Trigger (Stage 4)",
    severity: "error",
    description: "When Stage 3 (Check) fails, rollback must be triggered automatically without human intervention. A rescue block, error trap, or exception handler is required.",
    check: (code) => {
      const patterns = [/rescue/i, /block.*rescue/i, /on_failure/i, /on.*failure/i, /except.*rollback/i, /except.*backout/i, /except.*restore/i, /trap/i, /ErrorAction.*Stop/i, /catch.*rollback/i, /catch.*backout/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Implement a rescue block, error trap, or exception handler that automatically triggers rollback without requiring human action. If automated rollback cannot be implemented, a formal exception is required.",
    fixSnippet: `# Ansible
  rescue:
    - name: Auto-trigger rollback (Stage 5)
      include_tasks: rollback.yml

# Python
try:
    apply_change(ctx)
    validate_change(ctx)
except Exception as exc:
    backout_change(ctx)   # Stage 5 — automatic, no human needed
    raise

# Bash
trap 'rollback; exit 1' ERR`
  },
  {
    id: "backout-verify-undo",
    standard: "backout-recovery",
    name: "Rollback Verification (Stage 6)",
    severity: "error",
    description: "After rollback executes, verification checks must confirm the system returned to pre-change state. A completed rollback attempt is not the same as a confirmed recovery.",
    check: (code) => {
      const patterns = [/verify.*undo/i, /verify.*rollback/i, /verify.*backout/i, /verify.*recovery/i, /confirm.*rollback/i, /validate.*restore/i, /post.*rollback/i, /after.*rollback/i, /rollback.*verify/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Add verification after rollback to confirm the target returned to pre-change state (health checks, config validation, data integrity). Stage 6 must pass before the incident can be resolved."
  },
  {
    id: "backout-auto-incident",
    standard: "backout-recovery",
    name: "Automatic Incident Creation (Stage 7)",
    severity: "warning",
    description: "When rollback triggers, a ServiceNow incident must be created and stakeholders notified automatically — both must fire without human initiation.",
    check: (code) => {
      const patterns = [/incident/i, /ServiceNow/i, /servicenow/i, /notify.*stakeholder/i, /alert.*stakeholder/i, /create.*ticket/i, /open.*incident/i, /escalat/i, /notify.*team/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Add automatic incident creation and stakeholder notification when rollback triggers. Both must fire without human initiation. Document the incident contact in the operator header."
  },

  // ── Observability, Logging & Reportability ───────────────────────────────
  {
    id: "observability-structured-output",
    standard: "observability-logging",
    name: "Structured Output",
    severity: "error",
    description: "Automation must produce structured (JSON or consistent key-value) output that can be aggregated across teams without manual transformation.",
    check: (code) => {
      const patterns = [/json\.dumps/i, /ConvertTo-Json/i, /printf.*json/i, /structured.*log/i, /log_action/i, /Write-StructuredLog/i, /json\.marshal/i, /to_json/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Use structured JSON logging. Use the AutomationLogger / Write-StructuredLog / log_action from the template. Use consistent field names across all automation.",
    fixSnippet: `import json, logging
logger = logging.getLogger(__name__)

def log_event(event, **fields):
    logger.info(json.dumps({"event": event, **fields}))

# Usage:
log_event("execution_start", run_id=run_id, env=env, target=target)
log_event("task_complete", task="apply_config", result="changed")
log_event("execution_complete", outcome="success", changed=1)`
  },
  {
    id: "observability-run-id",
    standard: "observability-logging",
    name: "Execution ID / Run ID Tracking",
    severity: "error",
    description: "Every execution must have a unique run ID or execution ID so actions can be correlated across logs and incident reviews.",
    check: (code) => {
      const patterns = [/run_id/i, /RUN_ID/i, /RunId/i, /uuid/i, /execution.?id/i, /job.*id/i, /correlation.?id/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Generate a unique run ID (UUID) at execution start and include it in every log event and the completion record.",
    fixSnippet: `import uuid
run_id = str(uuid.uuid4())[:8]  # short form for readability

# Include in every structured log event:
log_event("execution_start", run_id=run_id, ...)

# Ansible:
run_id: "{{ lookup('pipe', 'python3 -c \"import uuid; print(str(uuid.uuid4())[:8])\"') }}"`
  },
  {
    id: "observability-run-summary",
    standard: "observability-logging",
    name: "Run-Level Summary (11 Required Fields)",
    severity: "error",
    description: "A run-level summary must be produced at execution start and end containing all 11 required fields: Execution ID, Automation name, Revision, Initiator, Initiator type, Target scope, Environment, Start time, End time, Duration, Outcome.",
    check: (code) => {
      const requiredFields = [
        [/run_id|execution.?id/i],
        [/automation.?name|automation_name/i],
        [/initiator/i],
        [/target.?scope|target_scope|target_hosts/i],
        [/environment|env/i],
        [/start.?time|start_time/i],
        [/end.?time|end_time|duration/i],
        [/outcome|overall_status|status/i]
      ];
      const matched = requiredFields.filter(group => group.some(p => p.test(code)));
      return matched.length >= 5;
    },
    fix: "Produce a run-level summary containing all 11 fields: Execution ID, Automation name, Revision, Initiator, Initiator type, Target scope, Environment, Start time, End time, Duration, Outcome."
  },
  {
    id: "observability-completion-record",
    standard: "observability-logging",
    name: "Completion Record",
    severity: "warning",
    description: "At the end of every execution, produce a completion record with: Final outcome, Failure classification (if failed), Failure point (if failed), Change summary (counts), Reference links.",
    check: (code) => {
      const patterns = [/summary/i, /overall_status/i, /final.*outcome/i, /completion/i, /total_actions/i, /changed.*count/i, /failed.*count/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Add a completion record that includes final outcome, failure classification (if failed), failure point (if failed), change summary (targets changed/unchanged/failed/skipped), and reference links."
  },
  {
    id: "observability-failure-classification",
    standard: "observability-logging",
    name: "Failure Classification in Output",
    severity: "error",
    description: "All failure paths must surface the failure category in execution output so operators can reconstruct what happened and filter by severity.",
    check: (code) => {
      const patterns = [/failure_classification/i, /error_type/i, /failure_type/i, /error_category/i, /failure_category/i, /failure.*class/i, /error.*class/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Include a failure_classification field in error output that names one of the five standard failure categories (input/validation failure, dependency unavailable, authorization failure, execution error, post-execution validation failure)."
  },

  // ── Secured by Design ────────────────────────────────────────────────────
  {
    id: "security-no-hardcoded-secrets",
    standard: "secured-by-design",
    name: "No Hardcoded Secrets",
    severity: "error",
    description: "No passwords, tokens, API keys, or secrets hardcoded in automation — including base64-encoded values in YAML or configuration files.",
    check: (code) => {
      const badPatterns = [
        /password\s*=\s*["'][^"']{4,}["']/i,
        /token\s*=\s*["'][^"']{8,}["']/i,
        /api_key\s*=\s*["'][^"']{4,}["']/i,
        /secret\s*=\s*["'][^"']{4,}["']/i,
        /private_key\s*=\s*["'][^"']{4,}["']/i
      ];
      return !badPatterns.some(p => p.test(code));
    },
    fix: "Remove hardcoded secrets. Retrieve credentials from an approved vault/secret manager (CyberArk recommended) at runtime dynamically on every execution.",
    fixSnippet: `# WRONG — never do this:
# password = "MyP@ssword123"
# token = "ghp_abc123..."

# CORRECT — CyberArk CCP at runtime:
resp = requests.get(
    f"{cyberark_url}/AIMWebService/api/Accounts",
    params={"AppID": app_id, "Safe": safe, "Object": obj},
    verify=True   # always verify TLS
).json()
password = resp["Content"]  # use but NEVER log this value`
  },
  {
    id: "security-vault-retrieval",
    standard: "secured-by-design",
    name: "Vault-Based Secret Retrieval",
    severity: "error",
    description: "Credentials must be retrieved from an approved credential provider (CyberArk, Azure Key Vault) at runtime, not stored in code, config files, or version control.",
    check: (code) => {
      const patterns = [/CyberArk/i, /cyberark/i, /vault/i, /KeyVault/i, /key_vault/i, /secret.*manager/i, /lookup.*password/i, /retrieve.*secret/i, /fetch.*credential/i, /azure.*vault/i, /conjur/i, /hashicorp/i];
      return patterns.some(p => p.test(code));
    },
    fix: "Retrieve secrets dynamically from CyberArk, Azure Key Vault, or another approved credential provider. Retrieval must be dynamic on every execution and support rotation without a code change."
  },
  {
    id: "security-sensitive-output",
    standard: "secured-by-design",
    name: "Sensitive Output Masking",
    severity: "warning",
    description: "Sensitive values must be masked or redacted before reaching any log sink, including verbose and debug output. PII and regulated data must not appear in logs.",
    check: (code) => {
      const patterns = [/mask/i, /redact/i, /sanitize/i, /no_log/i, /SecureString/i, /suppress/i, /\*\*\*\*/];
      return patterns.some(p => p.test(code));
    },
    fix: "Add output masking/redaction for all sensitive values. Apply masking at all output levels including verbose and debug mode. Log only that a secret was retrieved, never its value."
  },

  // ── Naming, Metadata & Classification ───────────────────────────────────
  {
    id: "naming-domain-pattern",
    standard: "naming-metadata",
    name: "Domain-Action-Target Naming Pattern",
    severity: "error",
    description: "Asset name must follow [domain]-[action]-[target] in lowercase with hyphens, using an approved domain prefix: linux, windows, network, firewall, db, middleware, observability, bigdata, virt, aix, storage, mainframe, or platform.",
    check: (_code, project) => {
      if (!project?.name) return false;
      const approvedDomains = /^(linux|windows|network|firewall|db|middleware|observability|bigdata|virt|aix|storage|mainframe|platform)-/;
      const name = project.name.toLowerCase();
      return approvedDomains.test(name) && /^[a-z][a-z0-9-]+$/.test(name);
    },
    fix: "Rename the asset to follow [domain]-[action]-[target] format using an approved domain prefix in lowercase with hyphens. No personal names, team identifiers, or abbreviations."
  },
  {
    id: "naming-metadata-header",
    standard: "naming-metadata",
    name: "Operator Header Present",
    severity: "warning",
    description: "Automation must include an operator header with at minimum: Name, Owner, Risk classification, Compliance status, Lifecycle state, and Scope. Empty or placeholder values are non-compliant.",
    check: (code) => {
      const requiredFields = [/Name:/i, /Owner:/i, /Risk/i, /Classification:/i, /Lifecycle/i, /Scope:/i, /Purpose:/i];
      const matches = requiredFields.filter(p => p.test(code));
      return matches.length >= 4;
    },
    fix: "Add a complete operator header with all required fields. Every field must contain specific content — empty or placeholder values are non-compliant. A reviewer must be able to answer every operational question from the header alone.",
    fixSnippet: `# Operator Header (Minimum Required Fields)
# Purpose:          <what the automation does>
# Scope:            <what it targets — never 'all' without approval>
# Owner:            <team> (<email>)
# Risk:             Standard | High-Risk
# Lifecycle:        Active | Retired | Legacy
# Compliance:       Compliant | Non-Compliant
# Concurrent safety: safe | unsafe — <control mechanism>`
  },
  {
    id: "naming-four-classifications",
    standard: "naming-metadata",
    name: "All Four Classification Dimensions",
    severity: "warning",
    description: "All four classification dimensions must be assigned: Automation type, Risk classification (Standard/High-Risk), SLA binding, and Compliance status.",
    check: (code, project) => {
      const codePatterns = [/Automation.?type:|automation_type/i, /Risk.?Classification:|risk_tier/i, /SLA.?Binding:|sla_binding/i, /Compliance.?Status:/i];
      const codeMatches = codePatterns.filter(p => p.test(code)).length;
      const hasProjectData = project?.automation_type && project?.risk_tier;
      return codeMatches >= 2 || hasProjectData;
    },
    fix: "Assign all four classification dimensions in both the operator header and the catalog entry: Automation type, Risk classification, SLA binding, and Compliance status. Any missing dimension is non-compliant."
  }
];

function extractViolations(check, code, project) {
  const codeStr = code || "";
  const codeLines = codeStr.split('\n');

  // Project-field checks — surface the relevant field value
  if (["tested-evidence-plan", "tested-parity-documented", "tested-quality-gates"].includes(check.id)) {
    const val = project?.testing_plan;
    return { type: "project", field: "testing_plan", value: val ? val.substring(0, 300) : "(not set)" };
  }
  if (check.id === "naming-domain-pattern") {
    return { type: "project", field: "project name", value: project?.name || "(not set)" };
  }
  if (check.id === "naming-four-classifications") {
    const parts = [
      project?.automation_type && `automation_type: ${project.automation_type}`,
      project?.risk_tier && `risk_tier: ${project.risk_tier}`,
      project?.compliance_status && `compliance_status: ${project.compliance_status}`,
    ].filter(Boolean);
    return { type: "project", field: "classification fields", value: parts.join("\n") || "(not set)" };
  }

  // Absence check — find the offending lines
  if (check.id === "security-no-hardcoded-secrets") {
    const badPatterns = [
      /password\s*=\s*["'][^"']{4,}["']/i,
      /token\s*=\s*["'][^"']{8,}["']/i,
      /api_key\s*=\s*["'][^"']{4,}["']/i,
      /secret\s*=\s*["'][^"']{4,}["']/i,
      /private_key\s*=\s*["'][^"']{4,}["']/i,
    ];
    const offending = codeLines
      .map((content, i) => ({ lineNum: i + 1, content }))
      .filter(({ content }) => badPatterns.some(p => p.test(content)));
    return { type: "offending", lines: offending.slice(0, 6) };
  }

  // Presence checks — find related lines using key terms from check name
  const keyTerms = check.name
    .toLowerCase()
    .replace(/[()\/&\d]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 5)
    .slice(0, 4);
  const relatedLines = codeLines
    .map((content, i) => ({ lineNum: i + 1, content }))
    .filter(({ content }) => {
      const lower = content.toLowerCase().trim();
      return lower.length > 2 && keyTerms.some(t => lower.includes(t));
    })
    .slice(0, 5);

  return { type: "missing", lines: relatedLines };
}

export function runPolicyChecks(code, project) {
  return POLICY_CHECKS.map(check => {
    const passed = check.check(code || "", project);
    return {
      ...check,
      passed,
      violations: passed ? null : extractViolations(check, code || "", project),
    };
  });
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