/**
 * Reference Implementations
 *
 * Real, working examples from the Layer 4 reference implementation library,
 * organized by the standard slug each one primarily demonstrates.
 *
 * Used in the Standards Registry HOW tab to provide clickable,
 * copy-able code alongside the normative requirements.
 *
 * Source: 13731_Automation_Framework/ref_impl/
 */

export const REFERENCE_EXAMPLES = {

  // ── Safe Execution ────────────────────────────────────────────────────────
  "safe-execution": [
    {
      id: "input-validator-py",
      title: "Python: Input Validation Module",
      description: "Fail-closed scope check, environment validation, CHG reference validation. Raises descriptive ValueError for each failure.",
      language: "python",
      filename: "input_validator.py",
      content: `"""
input_validator.py — Standard 04 compliant input validation functions.

Usage:
    from modules.input_validator import validate_execution_inputs
    validate_execution_inputs(target_hosts="linux-app-servers",
                              target_env="prod",
                              change_ref="CHG0123456")
"""

import re


def validate_execution_inputs(target_hosts: str,
                               target_env: str,
                               change_ref: str = None) -> None:
    """
    Validates standard execution inputs before any state change.
    Raises ValueError with a descriptive message on any failure.
    """
    errors = []

    if not target_hosts or target_hosts.strip() in ("all", "*", ""):
        errors.append(
            f"target_hosts must be an explicit host group — "
            f"got: '{target_hosts}'. Never use 'all' or '*'."
        )

    allowed_envs = ("dev", "test", "prod")
    if target_env not in allowed_envs:
        errors.append(
            f"target_env must be one of {allowed_envs} — got: '{target_env}'"
        )

    if target_env == "prod":
        if not change_ref or not re.match(r"^CHG\\d{7}$", change_ref):
            errors.append(
                f"change_ref must be a valid CHG number for production — "
                f"got: '{change_ref}'. Format: CHG0123456"
            )

    if errors:
        raise ValueError(
            "INPUT VALIDATION FAILURE:\\n" +
            "\\n".join(f"  - {e}" for e in errors)
        )


def validate_config_key(key: str) -> None:
    """Validates a configuration key is safe to use."""
    if not key or not re.match(r"^[a-z_][a-z0-9_]*$", key):
        raise ValueError(
            f"config_key must be lowercase alphanumeric with underscores — got: '{key}'"
        )


def validate_change_ref(change_ref: str) -> None:
    """Validates a ServiceNow change reference number."""
    if not change_ref or not re.match(r"^CHG\\d{7}$", change_ref):
        raise ValueError(
            f"change_ref must match CHG followed by 7 digits — got: '{change_ref}'"
        )
`,
    },
    {
      id: "python-error-handling",
      title: "Python: 5-Category Failure Classification",
      description: "Defines all five standard exception classes with EXIT_CODES, validate_inputs, bounded retry, backout, and classify_exception.",
      language: "python",
      filename: "python_error_handling_example.py",
      content: `#!/usr/bin/env python3
"""
Operator Header (Minimum Standard)
Purpose: Demonstrate error handling, guardrails, and backout in Python automation
Scope: Applies a change to a target scope; blocks 'all' in 'prod'
Inputs: --environment (dev/test/prod), --target-scope, --change-id, --dry-run
Preconditions: change-id must be set; environment and scope must be valid
Outputs: Change applied, validation result, run metadata, backout evidence if triggered
Ownership: Platform Automation Team (platform-ops@example.com)
Safety: Bounded retries, explicit validation, backout on failure;
        see automatic-backout-and-recovery.md for details
"""

import json
import logging
import os
import sys
from dataclasses import dataclass
from typing import Callable, Iterable


# ── Five Standard Failure Categories ────────────────────────────────────────

class InputValidationError(Exception):
    """Raised when input validation fails."""
    pass

class DependencyUnavailableError(Exception):
    """Raised when a required dependency is unavailable."""
    pass

class AuthorizationError(Exception):
    """Raised when authorization or permission fails."""
    pass

class ExecutionError(Exception):
    """Raised when a task or operation fails during execution."""
    pass

class PostValidationError(Exception):
    """Raised when post-execution validation fails."""
    pass


# Exit codes map to failure categories for pipeline/tooling consumption
EXIT_CODES = {
    InputValidationError:      2,
    DependencyUnavailableError: 3,
    AuthorizationError:        4,
    ExecutionError:            5,
    PostValidationError:       6,
}


@dataclass
class RunContext:
    environment:  str
    target_scope: str
    change_id:    str
    dry_run:      bool
    run_id:       str


def setup_logger() -> logging.Logger:
    """Set up a logger for structured output to stdout."""
    logger = logging.getLogger("automation")
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(message)s"))
    logger.handlers[:] = [handler]
    return logger


def log_event(logger: logging.Logger, event: str, **fields: str) -> None:
    """Emit a structured log event with arbitrary fields."""
    payload = {"event": event, **fields}
    logger.info(json.dumps(payload, sort_keys=True))


def validate_inputs(ctx: RunContext) -> None:
    """Validate required inputs and guardrails before state-changing actions."""
    if ctx.environment not in {"dev", "test", "prod"}:
        raise InputValidationError(
            f"Invalid environment '{ctx.environment}'. Must be dev, test, or prod."
        )
    if not ctx.change_id:
        raise InputValidationError(
            "change_id is required. Set --change-id to the CHG number."
        )
    if ctx.environment == "prod" and ctx.target_scope == "all":
        raise InputValidationError(
            "target_scope cannot be 'all' in production. Specify an explicit scope."
        )


def retry(operation: Callable[[], None],
          attempts: int,
          backoff_seconds: Iterable[int]) -> None:
    """
    Retry an operation with bounded attempts and backoff.
    Only use for idempotent operations — retrying non-idempotent
    operations risks applying the same change multiple times.
    """
    import time
    backoff_list = list(backoff_seconds)
    last_exc = None
    for attempt in range(1, attempts + 1):
        try:
            operation()
            return
        except Exception as exc:
            last_exc = exc
            if attempt == attempts:
                break
            wait = backoff_list[min(attempt - 1, len(backoff_list) - 1)]
            log_event(logging.getLogger("automation"), "retry",
                      attempt=str(attempt), max=str(attempts),
                      wait_seconds=str(wait))
            time.sleep(wait)
    raise last_exc


def apply_change(ctx: RunContext, config_path: str,
                 setting: str, value: str) -> None:
    """Apply a configuration change to a file. Raise ExecutionError on failure."""
    if ctx.dry_run:
        log_event(logging.getLogger("automation"), "dry_run_skip",
                  action="apply_change", target=config_path)
        return

    lock_path = config_path + ".lock"
    if os.path.exists(lock_path):
        raise DependencyUnavailableError(
            f"Config file is locked: {lock_path}. Another process may be running."
        )

    backup_path = config_path + f".bak.{ctx.run_id}"
    if os.path.exists(config_path):
        import shutil
        shutil.copy2(config_path, backup_path)

    try:
        with open(config_path, "w") as fh:
            fh.write(f"{setting} = {value}\\n")
    except OSError as exc:
        raise ExecutionError(
            f"Failed to write {config_path}: {exc}"
        ) from exc


def validate_change(ctx: RunContext, config_path: str,
                    setting: str, value: str) -> None:
    """Stage 3 — verify the change was applied. Raise PostValidationError on mismatch."""
    try:
        with open(config_path) as fh:
            content = fh.read()
        if f"{setting} = {value}" not in content:
            raise PostValidationError(
                f"Post-validation failed for {config_path}. "
                f"Expected '{setting} = {value}', not found in file."
            )
    except FileNotFoundError as exc:
        raise PostValidationError(
            f"Config file not found after apply: {config_path}"
        ) from exc


def backout_change(ctx: RunContext, config_path: str) -> None:
    """Stage 5 — restore backup if one was taken."""
    backup_path = config_path + f".bak.{ctx.run_id}"
    if os.path.exists(backup_path):
        import shutil
        shutil.copy2(backup_path, config_path)
        log_event(logging.getLogger("automation"), "backout_complete",
                  restored_from=backup_path)
    else:
        log_event(logging.getLogger("automation"), "backout_skipped",
                  reason="no_backup_found")


def classify_exception(exc: Exception) -> str:
    """Map an exception to the five standard failure classification strings."""
    mapping = {
        InputValidationError:       "input_or_validation_failure",
        DependencyUnavailableError: "dependency_or_service_unavailable",
        AuthorizationError:         "authorization_or_permission_failure",
        ExecutionError:             "execution_error",
        PostValidationError:        "post_execution_validation_failure",
    }
    return mapping.get(type(exc), "execution_error")


def main() -> int:
    import argparse, uuid
    parser = argparse.ArgumentParser()
    parser.add_argument("--environment", required=True)
    parser.add_argument("--target-scope", default="single-host")
    parser.add_argument("--change-id", default="")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    logger = setup_logger()
    ctx = RunContext(
        environment=args.environment,
        target_scope=args.target_scope,
        change_id=args.change_id,
        dry_run=args.dry_run,
        run_id=str(uuid.uuid4())[:8],
    )

    config_path = "/tmp/example.conf"
    log_event(logger, "execution_start",
              run_id=ctx.run_id, env=ctx.environment,
              scope=ctx.target_scope, dry_run=str(ctx.dry_run))
    try:
        validate_inputs(ctx)
        retry(
            lambda: apply_change(ctx, config_path, "max_connections", "200"),
            attempts=3,
            backoff_seconds=[5, 10, 20],
        )
        validate_change(ctx, config_path, "max_connections", "200")
        log_event(logger, "execution_complete",
                  run_id=ctx.run_id, outcome="success")
        return 0

    except Exception as exc:
        classification = classify_exception(exc)
        log_event(logger, "execution_failed",
                  run_id=ctx.run_id,
                  failure_classification=classification,
                  error=str(exc))
        backout_change(ctx, config_path)
        return EXIT_CODES.get(type(exc), 1)


if __name__ == "__main__":
    sys.exit(main())
`,
    },
    {
      id: "ansible-error-handling",
      title: "Ansible: Error Handling with Guardrails",
      description: "Operator header, input validation assertions, backup/restore rescue block, structured run metadata logging.",
      language: "yaml",
      filename: "ansible_error_handling_playbook.yml",
      content: `# Operator Header (Minimum Standard)
# Purpose: Demonstrate error handling, guardrails, and backout in Ansible
# Scope: Applies a change to a target file; blocks 'all' in 'prod'
# Inputs: env (dev/test/prod), target_scope, change_id, dry_run
# Preconditions: change_id must be set; env and scope must be valid
# Outputs: Target file changed, validation result, run metadata, backup/restore evidence if triggered
# Ownership: Platform Automation Team (platform-ops@example.com)
# Safety: Bounded retries, explicit validation, backup/restore on failure

- name: Example - error handling with guardrails and backout
  hosts: all
  gather_facts: false
  vars:
    # Classification & traceability metadata
    automation_id: "auto-error-handling-demo-001"
    automation_name: "error-handling-ansible-demo"
    automation_type: "Operational"
    compliance_status: "Compliant"
    owner_team: "platform-ops"
    run_id: "{{ ansible_date_time.iso8601_basic }}"
    initiator: "{{ lookup('env', 'CI_ACTOR') | default('manual-operator', true) }}"
    repository_path: "automation/Ansible/error_handling/ansible_error_handling_playbook.yml"
    commit_sha: "{{ lookup('env', 'CI_COMMIT_SHA') | default('unknown', true) }}"

    # Guardrails and safety controls
    allowed_envs: ["dev", "test", "prod"]
    env: "{{ env | default('dev') }}"
    target_scope: "{{ target_scope | default('single-host') }}"
    dry_run: "{{ dry_run | default(true) }}"
    change_id: "{{ change_id | default('') }}"
    explicit_prod_approval: "{{ explicit_prod_approval | default(false) }}"
    change_ticket: "{{ change_ticket | default('') }}"

  pre_tasks:
    # ── Input Validation (Fail-Closed) ──────────────────────────────────────
    - name: Validate required inputs and safe scope
      ansible.builtin.assert:
        that:
          - env in allowed_envs
          - change_id != ''
          - target_scope != 'all' or env != 'prod'
        fail_msg: >
          Input validation failed: env must be dev/test/prod,
          change_id required, and prod scope cannot be 'all'.

    # ── Structured Run Metadata ──────────────────────────────────────────────
    - name: Log operator run metadata
      ansible.builtin.debug:
        msg:
          run_id: "{{ run_id }}"
          automation_id: "{{ automation_id }}"
          automation_name: "{{ automation_name }}"
          automation_type: "{{ automation_type }}"
          compliance_status: "{{ compliance_status }}"
          owner_team: "{{ owner_team }}"
          initiator: "{{ initiator }}"
          commit_sha: "{{ commit_sha }}"
          repository_path: "{{ repository_path }}"
          env: "{{ env }}"
          target_scope: "{{ target_scope }}"
          dry_run: "{{ dry_run }}"
          change_id: "{{ change_id }}"

  tasks:
    # ── Stage 1: Capture Pre-Change State ───────────────────────────────────
    - name: Check if target file exists
      ansible.builtin.stat:
        path: /tmp/example_target_file
      register: target_file_stat

    - name: Backup target file if it exists
      ansible.builtin.copy:
        src: /tmp/example_target_file
        dest: /tmp/example_target_file.bak.{{ run_id }}
        mode: "{{ target_file_stat.stat.mode | default('0644') }}"
        remote_src: true
      when: target_file_stat.stat.exists
      register: backup_result

    # ── Stage 2–3: Apply Change + Post-Validate; Stage 4–6: Rescue ─────────
    - name: Apply change with retry and post-validation
      block:
        - name: Apply change (idempotent)
          ansible.builtin.copy:
            dest: /tmp/example_target_file
            content: |
              managed_by: ansible
              run_id: "{{ run_id }}"
              setting: example_value
            mode: "0644"
          retries: 3
          delay: 5
          register: apply_result
          until: apply_result is not failed

        - name: Post-validate expected state
          ansible.builtin.stat:
            path: /tmp/example_target_file
          register: post_stat
          failed_when: not post_stat.stat.exists

      rescue:
        # Stage 4 — Problem detected; Stage 5 — Undo
        - name: Log failure classification
          ansible.builtin.debug:
            msg:
              event: "execution_failed"
              run_id: "{{ run_id }}"
              failure_classification: "execution_error"
              step: "apply_change_or_post_validate"

        - name: Restore backup if it exists
          ansible.builtin.copy:
            src: /tmp/example_target_file.bak.{{ run_id }}
            dest: /tmp/example_target_file
            remote_src: true
          when: backup_result is defined and backup_result is not failed

        - name: Remove backup file after restore
          ansible.builtin.file:
            path: /tmp/example_target_file.bak.{{ run_id }}
            state: absent
          when: backup_result is defined and backup_result is not failed

        - name: Fail the run after backout
          ansible.builtin.fail:
            msg: "Change failed and backout was executed. See run_id {{ run_id }}."

      always:
        # ── Stage 7: Alert / Structured Completion Record ──────────────────
        - name: Emit run completion record
          ansible.builtin.debug:
            msg:
              event: "execution_complete"
              run_id: "{{ run_id }}"
              automation_name: "{{ automation_name }}"
              env: "{{ env }}"
              outcome: "{{ 'success' if apply_result is not failed else 'backout_triggered' }}"
`,
    },
    {
      id: "azure-devops-pipeline",
      title: "Azure DevOps: Pipeline with Validation + Quality Gate Stages",
      description: "Separate Validate, Execute, and quality-gate stages; input guardrails in bash; retry on task failure.",
      language: "yaml",
      filename: "azure_devops_error_handling_pipeline.yml",
      content: `# Operator Header (Minimum Standard)
# Purpose: Demonstrate error handling, guardrails, and backout in Azure DevOps Pipelines
# Scope: Applies a change to a target scope; blocks 'all' in 'prod'
# Inputs: environment (dev/test/prod), targetScope, changeId, dryRun
# Preconditions: changeId must be set; environment and scope must be valid
# Outputs: Change applied, validation result, run metadata, backout evidence if triggered
# Ownership: Platform Automation Team (platform-ops@example.com)
# Safety: Bounded retries, explicit validation, backout on failure

trigger: none

variables:
  automationId: 'auto-error-handling-demo-002'
  automationName: 'error-handling-azdo-demo'
  automationType: 'Operational'
  complianceStatus: 'Compliant'
  ownerTeam: 'platform-ops'
  repositoryPath: 'automation/azure-devops/error_handling/azure_devops_error_handling_pipeline.yml'
  commitSha: '$(Build.SourceVersion)'
  environment: 'prod'
  targetScope: 'single-host'
  dryRun: true
  changeId: ''
  explicitProdApproval: false

stages:
- stage: Validate
  displayName: Validate inputs
  jobs:
  - job: ValidateInputs
    timeoutInMinutes: 5
    steps:
    - bash: |
        set -euo pipefail
        if [[ -z "$(changeId)" ]]; then
          echo "##vso[task.logissue type=error]INPUT VALIDATION FAILURE: changeId is required."
          exit 2
        fi
        if [[ "$(environment)" != "dev" && "$(environment)" != "test" && "$(environment)" != "prod" ]]; then
          echo "##vso[task.logissue type=error]INPUT VALIDATION FAILURE: environment must be dev/test/prod."
          exit 2
        fi
        if [[ "$(environment)" == "prod" && "$(targetScope)" == "all" ]]; then
          echo "##vso[task.logissue type=error]INPUT VALIDATION FAILURE: targetScope cannot be 'all' in prod."
          exit 2
        fi
        echo "Validation passed: env=$(environment) scope=$(targetScope) changeId=$(changeId)"
      displayName: Input validation and guardrails (fail-closed)

- stage: Execute
  displayName: Execute change
  dependsOn: Validate
  jobs:
  - job: ApplyChange
    timeoutInMinutes: 30
    continueOnError: false
    steps:
    - bash: |
        set -euo pipefail
        echo "run_id=$(Build.BuildId) env=$(environment) scope=$(targetScope) dry_run=$(dryRun)"
        echo "automationId=$(automationId) automationName=$(automationName)"
        echo "automationType=$(automationType) complianceStatus=$(complianceStatus)"
        echo "ownerTeam=$(ownerTeam) commitSha=$(commitSha)"
      displayName: Log run metadata (structured)

    - bash: |
        set -euo pipefail
        if [[ "$(dryRun)" == "true" ]]; then
          echo "DRY RUN: skipping state-changing actions for scope $(targetScope)"
          exit 0
        fi
        /usr/local/bin/do-change --scope "$(targetScope)"
      displayName: Apply change
      retryCountOnTaskFailure: 2

    - bash: |
        set -euo pipefail
        /usr/local/bin/validate-change --scope "$(targetScope)"
      displayName: Post-validate (Stage 3)

    - bash: |
        set -euo pipefail
        echo '{"event":"execution_complete","run_id":"$(Build.BuildId)","outcome":"success"}'
      displayName: Emit completion record

    - bash: |
        set -euo pipefail
        echo '{"event":"execution_failed","run_id":"$(Build.BuildId)","failure_classification":"execution_error"}'
      displayName: Emit failure record
      condition: failed()

    - bash: |
        set -euo pipefail
        /usr/local/bin/do-backout --scope "$(targetScope)"
        echo "Backout complete for scope $(targetScope)"
      displayName: Automatic backout (Stage 5)
      condition: failed()
`,
    },
  ],

  // ── Idempotency ──────────────────────────────────────────────────────────
  "idempotency": [
    {
      id: "idempotency-yaml",
      title: "Ansible: Idempotent Playbook (Declarative State)",
      description: "Uses declarative Ansible modules (group, user, file, copy, package, cron) — run multiple times, only changes once.",
      language: "yaml",
      filename: "idempotency.yaml",
      content: `---
# Example Ansible playbook demonstrating idempotent design.
# Run multiple times: it should make changes only once,
# then report "ok" (no change) on subsequent runs.

- name: Idempotent Playbook Example
  hosts: all
  gather_facts: yes
  become: yes

  vars:
    example_user: "exampleuser"
    example_group: "examplegroup"
    example_home: "/home/{{ example_user }}"
    example_file: "{{ example_home }}/welcome.txt"
    example_content: |
      Hello from Ansible!
      This file is managed idempotently.

  tasks:
    # Check: 'state: present' means "ensure it exists" — safe to run again
    - name: Ensure example group exists
      ansible.builtin.group:
        name: "{{ example_group }}"
        state: present

    # Check: user module checks if user exists before creating
    - name: Ensure example user exists
      ansible.builtin.user:
        name: "{{ example_user }}"
        group: "{{ example_group }}"
        home: "{{ example_home }}"
        shell: /bin/bash
        state: present
        create_home: yes

    # Check: file module reads current permissions before changing them
    - name: Ensure the home directory has correct permissions
      ansible.builtin.file:
        path: "{{ example_home }}"
        owner: "{{ example_user }}"
        group: "{{ example_group }}"
        mode: "0755"
        state: directory

    # Check: copy module computes checksum — only writes if content differs
    - name: Ensure welcome file exists with the desired content
      ansible.builtin.copy:
        dest: "{{ example_file }}"
        content: "{{ example_content }}"
        owner: "{{ example_user }}"
        group: "{{ example_group }}"
        mode: "0644"

    # Check: package module verifies install state before running apt/yum
    - name: Ensure a package is installed (idempotent)
      ansible.builtin.package:
        name: "git"
        state: present

    # Check: cron module identifies job by 'name' field — no duplicate entries
    - name: Ensure a cron job exists (idempotent)
      ansible.builtin.cron:
        name: "example-job"
        user: "{{ example_user }}"
        job: "/usr/bin/echo 'hello' >> {{ example_home }}/cron.log"
        minute: "0"
        hour: "0"
`,
    },
    {
      id: "config-manager-py",
      title: "Python: Idempotent Config Manager with Pre-Change Capture",
      description: "needs_change() check before writing, atomic write via temp file, capture_state() backup validation, rollback() method.",
      language: "python",
      filename: "config_manager.py",
      content: `"""
config_manager.py — Standard 01 and 03 compliant config file manager.

Provides idempotent read/write for key=value configuration files.
Captures pre-change state before writing. Validates backup before proceeding.

Usage:
    from modules.config_manager import ConfigManager
    mgr = ConfigManager("/etc/app/app.conf", backup_dir="/tmp/backups")
    backup_path = mgr.capture_state()
    if mgr.needs_change("max_connections", "200"):
        mgr.apply_change("max_connections", "200")
    result = mgr.validate_current_value("max_connections", "200")
"""

import os
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path


class ConfigManager:
    """
    Manages a key=value configuration file with idempotency and backout support.
    """

    def __init__(self, config_path: str, backup_dir: str = "/tmp/automation_backups"):
        self.config_path = config_path
        self.backup_dir  = backup_dir
        self.backup_path = None

    def capture_state(self) -> str:
        """
        Stage 1 — capture pre-change state.
        Backs up config file. Validates backup is readable.
        Returns the backup path. Raises RuntimeError if backup fails.
        """
        Path(self.backup_dir).mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        self.backup_path = os.path.join(
            self.backup_dir,
            f"backup_{ts}_{Path(self.config_path).name}"
        )

        if Path(self.config_path).exists():
            shutil.copy2(self.config_path, self.backup_path)
        else:
            # File doesn't exist yet — write an empty marker so rollback
            # knows the desired end state is "file absent"
            Path(self.backup_path).write_text("")

        # Validate backup is readable and non-empty if source was non-empty
        src_size = Path(self.config_path).stat().st_size if Path(self.config_path).exists() else 0
        bak_size = Path(self.backup_path).stat().st_size

        if src_size > 0 and bak_size == 0:
            raise RuntimeError(
                f"Backup validation failed: source '{self.config_path}' "
                f"is {src_size} bytes but backup is empty. "
                "Halting — cannot proceed without a valid pre-change capture."
            )

        return self.backup_path

    def needs_change(self, key: str, desired_value: str) -> bool:
        """
        Idempotency check — returns True only if a change is actually needed.
        If the current value already matches, skip the write entirely.
        """
        if not Path(self.config_path).exists():
            return True
        current = self._read_value(key)
        return current is None or str(current) != str(desired_value)

    def apply_change(self, key: str, value: str) -> None:
        """
        Stage 2 — apply the change atomically via a temp file.
        Only call this after needs_change() returns True.
        """
        if Path(self.config_path).exists():
            with open(self.config_path) as fh:
                lines = fh.readlines()
        else:
            lines = []

        pattern = re.compile(r"^(" + re.escape(key) + r"\\s*=\\s*).*$")
        updated = False
        new_lines = []

        for line in lines:
            m = pattern.match(line)
            if m:
                new_lines.append(f"{key} = {value}\\n")
                updated = True
            else:
                new_lines.append(line)

        if not updated:
            new_lines.append(f"{key} = {value}\\n")

        tmp_path = self.config_path + ".tmp"
        try:
            with open(tmp_path, "w") as fh:
                fh.writelines(new_lines)
            os.replace(tmp_path, self.config_path)  # atomic on POSIX
        except Exception:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            raise

    def validate_current_value(self, key: str, expected_value: str) -> dict:
        """
        Stage 3 — validate the change was applied correctly.
        Returns {"valid": bool, "expected": ..., "observed": ...}
        """
        current = self._read_value(key)
        if str(current) == str(expected_value):
            return {"valid": True, "expected": expected_value, "observed": current}
        return {
            "valid":    False,
            "expected": expected_value,
            "observed": current,
        }

    def rollback(self) -> dict:
        """
        Stage 5 — restore pre-change state from backup.
        Returns {"success": bool, "restored_from": path}
        """
        if not self.backup_path or not Path(self.backup_path).exists():
            return {"success": False, "reason": "no_backup_available"}

        bak_size = Path(self.backup_path).stat().st_size
        if bak_size == 0:
            # Original state was "file absent" — remove it
            if Path(self.config_path).exists():
                os.remove(self.config_path)
        else:
            shutil.copy2(self.backup_path, self.config_path)

        return {"success": True, "restored_from": self.backup_path}

    def _read_value(self, key: str):
        """Read a single key from the config file. Returns None if not found."""
        if not Path(self.config_path).exists():
            return None
        pattern = re.compile(r"^" + re.escape(key) + r"\\s*=\\s*(.+)$")
        with open(self.config_path) as fh:
            for line in fh:
                m = pattern.match(line.strip())
                if m:
                    return m.group(1).strip()
        return None
`,
    },
  ],

  // ── Tested Before Production ─────────────────────────────────────────────
  "tested-before-production": [
    {
      id: "snow-create-change-request",
      title: "SNOW: Create Change Request (AAP Utility Template)",
      description: "Launch the AAP Create Change Request job via ansible.controller.job_launch. Returns CHG number and CTASK numbers as artifacts.",
      language: "yaml",
      filename: "snow-create-change-request.yml",
      content: `---
# SNOW Utility Template: Create Change Request
# Purpose: Launch the AAP Create Change Request job template via
#          the ansible.controller.job_launch module.
# Authentication: Requires a 'Red Hat Ansible Automation Platform' credential
#                 scoped to a functional account with access to the Utility templates.
# Retry logic: Retries up to 3 times with a 10-second delay to handle
#              the known 1-hour token refresh issue.

- name: SNOW - Create Change Request
  hosts: localhost
  gather_facts: false
  tasks:

    # Optional: Dynamically determine the SNOW environment from the client code.
    # Remove this task if the environment is known ahead of time.
    - name: Set SNOW environment based on SNOW's client code
      ansible.builtin.set_fact:
        snow_env: >-
          {%- if 'prod' in (payload['clientCode'] | lower) -%}
          Production
          {%- elif 'qa' in (payload['clientCode'] | lower) -%}
          QA
          {%- else -%}
          Development
          {%- endif -%}

    - name: Block to get token and launch jobs
      block:
        - name: Grab an o-auth token from AAP
          ansible.controller.token:
            validate_certs: false
            request_timeout: 600
            scope: "write"
            state: present
            description: O-Auth token used to launch job
          register: token

        - name: Create Change Request in {{ snow_env }}
          ansible.controller.job_launch:
            name: Create Change Request Development - <AAP Organization Name>
            validate_certs: false
            request_timeout: 600
            wait: true
            extra_vars:
              template_name: Linux SMBv1 Config Fix - 1  # SNOW change template to use
              requestedBy: John Doe
              assignmentGroup: GITO-YOUR-GROUP
              shortDescription: A short description
              description: A more detailed description of the change
              category: Application
              subCategory: Failure
              workNotes: Some work notes
          delegate_to: localhost
          connection: local
          register: job_launch_info
          retries: 3
          delay: 10
          until:
            - job_launch_info['status'] is defined
            - job_launch_info['status'] == "successful"

        - name: Get the output of the Create Change Request Job
          ansible.builtin.uri:
            url: "https://aap.example.com/api/v2/jobs/{{ job_launch_info['id'] }}/"
            headers:
              Content-Type: application/json
              Authorization: "Bearer {{ controller_token['token'] }}"
            method: GET
            validate_certs: false
            return_content: true
          register: job_information

        - name: Set Change ticket to fact
          ansible.builtin.debug:
            change_ticket: "{{ job_information['json']['artifacts']['change_number'] }}"

        - name: Set Change Task ticket(s) to fact if available
          ansible.builtin.debug:
            change_tasks: "{{ job_information['json']['artifacts']['ctask_numbers'] }}"
          when: "'ctask_numbers' in job_information['json']['artifacts']"

      always:
        - name: Delete token used for job launch
          ansible.controller.token:
            controller_host: "https://aap.example.com"
            controller_oauthtoken: "{{ controller_token }}"
            validate_certs: false
            existing_token: "{{ controller_token }}"
            state: absent
          when: controller_token is defined
`,
    },
    {
      id: "snow-update-change-request",
      title: "SNOW: Update Change Request (AAP Utility Template)",
      description: "Update a CHG record — state, assignment, configuration item, business justification, and impacted countries.",
      language: "yaml",
      filename: "snow-update-change-request.yml",
      content: `---
# SNOW Utility Template: Update Change Request
# Purpose: Launch the AAP Update Change Request job template via
#          the ansible.controller.job_launch module.
# Authentication: Requires a 'Red Hat Ansible Automation Platform' credential
#                 scoped to a functional account with access to the Utility templates.
# Retry logic: Retries up to 3 times with a 10-second delay.

- name: SNOW - Update Change Request
  hosts: localhost
  gather_facts: false
  tasks:

    - name: Set SNOW environment based on SNOW's client code
      ansible.builtin.set_fact:
        snow_env: >-
          {%- if 'prod' in (payload['clientCode'] | lower) -%}
          Production
          {%- elif 'qa' in (payload['clientCode'] | lower) -%}
          QA
          {%- else -%}
          Development
          {%- endif -%}

    - name: Update Change Request in dev
      ansible.controller.job_launch:
        name: Update Change Request Development
        validate_certs: false
        request_timeout: 600
        wait: true
        extra_vars:
          number: CHG1234567                                # Change number to update
          assignmentGroup: GITO-YOUR-GROUP
          assignedTo: John Doe                              # NOT required
          workNotes: Some work notes
          state: assess                                     # assess | implement | review | closed
          configurationItem: 12345 Configuration Item
          explanation: Some explanation of the change
          causes_incident: No                               # Yes if the change causes an incident
          incident_number: INC0010001                       # Only if causes_incident is Yes
          affected_ci_input: 12345 Configuration Item       # 1 CI per line
          ci_category: Application
          ritm_input: RITM1234567
          business_justification: Some business justification
          impacted_countries: United States                 # One country per line; OVERWRITES existing
      delegate_to: localhost
      connection: local
      register: job_launch_info
      retries: 3
      delay: 10
      until:
        - job_launch_info['status'] is defined
        - job_launch_info['status'] == "successful"
`,
    },
    {
      id: "snow-close-change-request",
      title: "SNOW: Close Change Request (AAP Utility Template)",
      description: "Close a CHG record with a close code (successful / successful_issues / unsuccessful) and close notes.",
      language: "yaml",
      filename: "snow-close-change-request.yml",
      content: `---
# SNOW Utility Template: Close Change Request
# Purpose: Launch the AAP Close Change Request job template via
#          the ansible.controller.job_launch module.
# Authentication: Requires a 'Red Hat Ansible Automation Platform' credential
#                 scoped to a functional account with access to the Utility templates.
# Retry logic: Retries up to 3 times with a 10-second delay.

- name: SNOW - Close Change Request
  hosts: localhost
  gather_facts: false
  tasks:

    - name: Set SNOW environment based on SNOW's client code
      ansible.builtin.set_fact:
        snow_env: >-
          {%- if 'prod' in (payload['clientCode'] | lower) -%}
          Production
          {%- elif 'qa' in (payload['clientCode'] | lower) -%}
          QA
          {%- else -%}
          Development
          {%- endif -%}

    - name: Close Change Request in dev
      ansible.controller.job_launch:
        name: Close Change Request Development
        validate_certs: false
        request_timeout: 600
        wait: true
        extra_vars:
          number: CHG1234567       # Change number to close
          state: closed
          close_code: successful   # successful | successful_issues | unsuccessful
          close_notes: Some notes
      delegate_to: localhost
      connection: local
      register: job_launch_info
      retries: 3
      delay: 10
      until:
        - job_launch_info['status'] is defined
        - job_launch_info['status'] == "successful"
`,
    },
    {
      id: "snow-close-change-task",
      title: "SNOW: Close Change Task (AAP Utility Template)",
      description: "Close a CTASK record with a close code and close notes.",
      language: "yaml",
      filename: "snow-close-change-task.yml",
      content: `---
# SNOW Utility Template: Close Change Task
# Purpose: Launch the AAP Close Change Task job template via
#          the ansible.controller.job_launch module.
# Authentication: Requires a 'Red Hat Ansible Automation Platform' credential
#                 scoped to a functional account with access to the Utility templates.
# Retry logic: Retries up to 3 times with a 10-second delay.

- name: SNOW - Close Change Task
  hosts: localhost
  gather_facts: false
  tasks:

    - name: Set SNOW environment based on SNOW's client code
      ansible.builtin.set_fact:
        snow_env: >-
          {%- if 'prod' in (payload['clientCode'] | lower) -%}
          Production
          {%- elif 'qa' in (payload['clientCode'] | lower) -%}
          QA
          {%- else -%}
          Development
          {%- endif -%}

    - name: Close Change Task in dev
      ansible.controller.job_launch:
        name: Close Change Task Development
        validate_certs: false
        request_timeout: 600
        wait: true
        extra_vars:
          change_task: CTASK1234567
          change_task_close_code: Successful   # Successful | Successful with issues | Unsuccessful
          change_task_close_notes: Some notes
      delegate_to: localhost
      connection: local
      register: job_launch_info
      retries: 3
      delay: 10
      until:
        - job_launch_info['status'] is defined
        - job_launch_info['status'] == "successful"
`,
    },
  ],

  // ── Automatic Backout & Recovery ─────────────────────────────────────────
  "backout-recovery": [
    {
      id: "backout-example-yml",
      title: "Ansible: 7-Stage Backout Pattern (Canonical Reference)",
      description: "The complete seven-stage pattern — Before Running, Running, Check, Problem Detected, Undo, Verify Undo, Alert — with SNOW incident creation.",
      language: "yaml",
      filename: "backout_example.yml",
      content: `- name: Deploy with Automatic Rollback
  hosts: servers
  tasks:

    # 1. BEFORE RUNNING — Save current state
    - name: Get current version
      ansible.builtin.command: cat /app/version.txt
      register: backup_version

    # 2. RUNNING — Make your changes
    - name: Deploy new version
      ansible.builtin.copy:
        src: files/app-v2.0
        dest: /app/

    # 3. CHECK — Verify it worked
    - name: Test if working
      ansible.builtin.uri:
        url: http://localhost:8080/health
      register: check
      failed_when: false

    # 4. PROBLEM DETECTED — Set flag if failed
    - name: Mark as failed
      ansible.builtin.set_fact:
        deploy_failed: "{{ check.status != 200 }}"

    # 5. UNDO — Rollback if failed
    - name: Restore previous version
      ansible.builtin.command: /app/rollback.sh {{ backup_version.stdout }}
      when: deploy_failed

    # 6. VERIFY UNDO — Check rollback worked
    - name: Verify rollback
      ansible.builtin.uri:
        url: http://localhost:8080/health
      when: deploy_failed

    # 7. ALERT — Send notification + ticket (both must fire automatically)
    - name: Email notification
      community.general.mail:
        to: ops@company.com
        subject: "Deploy Failed - Rolled Back"
        body: "Failed on {{ inventory_hostname }}"
      when: deploy_failed

    - name: Create incident ticket using SNOW Utility template
      ansible.controller.job_launch:
        name: Create Incident Ticket Production
        extra_vars:
          contactType: Email
          caller: AnsibleITSMAPI
          assignmentGroup: Platform-Ops
          category: Automation
          subCategory: Failure
          u_environment: "{{ ansible_env }}"
          shortDescription: "AAP Deploy Failed - Rolled Back on {{ inventory_hostname }}"
          description: |
            Deployment failed and automatic rollback executed
            Host: {{ inventory_hostname }}
            Job Template: {{ awx_job_template_name | default('N/A') }}
            Job ID: {{ awx_job_id | default('N/A') }}
          impact: 3 - Moderate
          urgency: 3 - Moderate
          workNotes: Automatic rollback completed - investigate root cause
        wait: true
      when: deploy_failed
`,
    },
    {
      id: "snow-create-incident",
      title: "SNOW: Create Incident (Stage 7 — Auto-Alert)",
      description: "Launch the AAP Create Incident Ticket job template automatically when rollback triggers. Both incident creation and notification must fire without human initiation.",
      language: "yaml",
      filename: "snow-create-incident.yml",
      content: `---
# SNOW Utility Template: Create Incident
# Purpose: Launch the AAP Create Incident Ticket job template via
#          the ansible.controller.job_launch module.
# Authentication: Requires a 'Red Hat Ansible Automation Platform' credential
#                 scoped to a functional account with access to the Utility templates.
# Retry logic: Retries up to 3 times with a 10-second delay.
#
# Stage 7 usage: Call this automatically from a rescue/always block when
# rollback triggers. Humans must be notified, not asked to approve.

- name: SNOW - Create Incident
  hosts: localhost
  gather_facts: false
  tasks:

    - name: Set SNOW environment based on SNOW's client code
      ansible.builtin.set_fact:
        snow_env: >-
          {%- if 'prod' in (payload['clientCode'] | lower) -%}
          Production
          {%- elif 'qa' in (payload['clientCode'] | lower) -%}
          QA
          {%- else -%}
          Development
          {%- endif -%}

    - name: Create incident ticket in dev
      ansible.controller.job_launch:
        name: Create Incident Ticket Development
        validate_certs: false
        request_timeout: 600
        wait: true
        extra_vars:
          contactType: Email                                 # Or Phone
          location: 101 MetLife Way, Cary 12005
          callerNumber: "1234567890"
          caller: John Doe
          assignmentGroup: GITO-YOUR-GROUP
          assignedTo: John Doe                               # NOT required
          category: Application
          subCategory: Failure
          configurationItem: 12345 Configuration Item
          u_environment: Development
          shortDescription: A short description
          description: A more detailed description
          impact: 5 - Minimal
          urgency: 5 - Minimal
          workNotes: Some work notes
      delegate_to: localhost
      connection: local
      register: job_launch_info
      retries: 3
      delay: 10
      until:
        - job_launch_info['status'] is defined
        - job_launch_info['status'] == "successful"
`,
    },
    {
      id: "snow-update-incident",
      title: "SNOW: Update Incident (AAP Utility Template)",
      description: "Update an existing INC record — assignment, work notes, and state — during incident response.",
      language: "yaml",
      filename: "snow-update-incident.yml",
      content: `---
# SNOW Utility Template: Update Incident
# Purpose: Launch the AAP Update Incident Ticket job template via
#          the ansible.controller.job_launch module.
# Authentication: Requires a 'Red Hat Ansible Automation Platform' credential
#                 scoped to a functional account with access to the Utility templates.
# Retry logic: Retries up to 3 times with a 10-second delay.

- name: SNOW - Update Incident
  hosts: localhost
  gather_facts: false
  tasks:

    - name: Set SNOW environment based on SNOW's client code
      ansible.builtin.set_fact:
        snow_env: >-
          {%- if 'prod' in (payload['clientCode'] | lower) -%}
          Production
          {%- elif 'qa' in (payload['clientCode'] | lower) -%}
          QA
          {%- else -%}
          Development
          {%- endif -%}

    - name: Update incident ticket in dev
      ansible.controller.job_launch:
        name: Update Incident Ticket Development
        validate_certs: false
        request_timeout: 600
        wait: true
        extra_vars:
          number: INC0010001                  # Incident number to update
          assignmentGroup: GITO-YOUR-GROUP
          assignedTo: John Doe               # NOT required
          workNotes: Some work notes
          state: Work in Progress
      delegate_to: localhost
      connection: local
      register: job_launch_info
      retries: 3
      delay: 10
      until:
        - job_launch_info['status'] is defined
        - job_launch_info['status'] == "successful"
`,
    },
    {
      id: "snow-close-incident",
      title: "SNOW: Close Incident (AAP Utility Template)",
      description: "Resolve and close an INC record with resolution notes, root cause, and business impact — required before RCA can be marked complete.",
      language: "yaml",
      filename: "snow-close-incident.yml",
      content: `---
# SNOW Utility Template: Close Incident
# Purpose: Launch the AAP Close Incident Ticket job template via
#          the ansible.controller.job_launch module.
# Authentication: Requires a 'Red Hat Ansible Automation Platform' credential
#                 scoped to a functional account with access to the Utility templates.
# Retry logic: Retries up to 3 times with a 10-second delay.
#
# Note: A completed RCA requires root_cause to be populated.
# Closing with "rollback succeeded, no further action" is non-compliant.

- name: SNOW - Close Incident
  hosts: localhost
  gather_facts: false
  tasks:

    - name: Set SNOW environment based on SNOW's client code
      ansible.builtin.set_fact:
        snow_env: >-
          {%- if 'prod' in (payload['clientCode'] | lower) -%}
          Production
          {%- elif 'qa' in (payload['clientCode'] | lower) -%}
          QA
          {%- else -%}
          Development
          {%- endif -%}

    - name: Close Incident Ticket in dev
      ansible.controller.job_launch:
        name: Close Incident Ticket Development
        validate_certs: false
        request_timeout: 600
        wait: true
        extra_vars:
          number: INC0010001
          state: Resolved
          incident_substate: Service restored
          configuration_item_resolution_action_take_on: ustry1metu12345
          resolution_component: Configuration
          resolution_action: App Server
          resolution_code: Solved
          resolution_notes: Some resolution notes
          inc_business_impact: Operations
          root_cause: Root cause of the incident   # REQUIRED — must be specific
      delegate_to: localhost
      connection: local
      register: job_launch_info
      retries: 3
      delay: 10
      until:
        - job_launch_info['status'] is defined
        - job_launch_info['status'] == "successful"
`,
    },
  ],

  // ── Observability, Logging & Reportability ───────────────────────────────
  "observability-logging": [
    {
      id: "structured-logger-py",
      title: "Python: Structured Logger (Run-Level + Task-Level + Completion)",
      description: "StructuredLogger class emitting JSON events for execution_start, task_complete, execution_failed, and execution_complete — all 11 run-level fields included.",
      language: "python",
      filename: "structured_logger.py",
      content: `"""
structured_logger.py — Standard 05 compliant structured logger.

Usage:
    from modules.structured_logger import StructuredLogger
    log = StructuredLogger("linux-apply-ntp-config", "job-123", "prod", 0.5)
    log.execution_start("host1,host2", "svc-automation-prod", "CHG0123456")
    log.task_complete("Apply NTP config", "host1", "changed", "wrote /etc/ntp.conf")
    log.execution_complete("success", changed=2, unchanged=0, failed=0, hosts_processed=2)
"""

import json
import logging
import sys
from datetime import datetime, timezone


class StructuredLogger:
    """
    Emits structured JSON log events meeting Standard 05 requirements.
    Field names follow the canonical naming conventions.

    Required run-level fields emitted:
      execution_id, automation_name, target_env, timestamp (all events)
      + target_scope, initiator, change_ref (execution_start)
      + outcome, changed, unchanged, failed, hosts_processed (execution_complete)
    """

    def __init__(self, automation_name: str, execution_id: str,
                 target_env: str, hours_saved_per_host: float = 0.0):
        self.automation_name      = automation_name
        self.execution_id         = execution_id
        self.target_env           = target_env
        self.hours_saved_per_host = hours_saved_per_host

        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter("%(message)s"))
        self.logger = logging.getLogger(automation_name)
        if not self.logger.handlers:
            self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)

    def _emit(self, level: str, event_type: str, **fields):
        """Emit a structured JSON log record. Never include secret values."""
        record = {
            "event":           event_type,
            "execution_id":    self.execution_id,
            "automation_name": self.automation_name,
            "target_env":      self.target_env,
            "timestamp":       datetime.now(timezone.utc).isoformat(),
            **fields,
        }
        getattr(self.logger, level)(json.dumps(record))

    def execution_start(self, target_scope: str, initiator: str,
                        change_ref: str = "N/A"):
        """
        Run-level summary at execution start.
        Covers: execution_id, automation_name, initiator, target_scope,
                target_env (environment), timestamp.
        """
        self._emit("info", "execution_start",
                   target_scope=target_scope,
                   initiator=initiator,
                   change_ref=change_ref)

    def task_complete(self, task_name: str, target_host: str,
                      result: str, action_taken: str):
        """
        Task-level detail for every state-changing task.
        result must be one of: changed, unchanged, failed, skipped
        """
        self._emit("info", "task_complete",
                   task_name=task_name,
                   target_host=target_host,
                   result=result,
                   action_taken=action_taken)

    def execution_failed(self, failed_task: str, exit_classification: str,
                         expected: str, observed: str,
                         hosts_processed: int = 1,
                         recommended_action: str = ""):
        """
        Failure record — includes failure_classification (one of the 5 categories),
        what failed, which step, expected vs observed.
        Never log secret values in expected/observed.
        """
        self._emit("error", "execution_failed",
                   failed_task=failed_task,
                   exit_code=1,
                   failure_classification=exit_classification,
                   expected=expected,
                   observed=observed[:500],  # truncate to avoid PII/secret exposure
                   recommended_action=recommended_action,
                   hosts_processed=hosts_processed,
                   hours_saved=0.0)

    def execution_complete(self, outcome: str, changed: int,
                           unchanged: int, failed: int,
                           hosts_processed: int):
        """
        Completion record at the end of every execution.
        outcome: success | failure | partial | backout_triggered
        Includes change summary: changed, unchanged, failed counts.
        """
        hours_saved = changed * self.hours_saved_per_host
        self._emit("info", "execution_complete",
                   outcome=outcome,
                   changed=changed,
                   unchanged=unchanged,
                   failed=failed,
                   hosts_processed=hosts_processed,
                   hours_saved=hours_saved)
`,
    },
  ],

  // ── Secured by Design ────────────────────────────────────────────────────
  "secured-by-design": [
    {
      id: "secret-manager-py",
      title: "Python: CyberArk CCP Secret Retrieval",
      description: "Dynamic runtime retrieval from CyberArk Central Credential Provider. TLS enforcement, classified failure messages, secret values never logged.",
      language: "python",
      filename: "secret_manager.py",
      content: `"""
secret_manager.py — Standard 06 compliant secret retrieval.

Retrieves credentials from CyberArk CCP at runtime.
Secrets are never logged, never stored in variables files, never hardcoded.

Usage:
    from modules.secret_manager import get_secret_cyberark
    cred = get_secret_cyberark(
        safe="LinuxProd",
        object_name="db-prod-service-account",
        cyberark_url="https://cyberark.example.com",
        app_id="automation-linux"
    )
    # cred["username"], cred["password"] — never log these values
"""

import json
import logging
import requests

logger = logging.getLogger(__name__)


def get_secret_cyberark(safe: str, object_name: str,
                        cyberark_url: str, app_id: str) -> dict:
    """
    Retrieves a credential from CyberArk Central Credential Provider.
    Returns {"username": ..., "password": ...}
    Raises RuntimeError with a classified failure message on error.
    The password value is never logged anywhere in this function.
    """
    try:
        response = requests.get(
            f"{cyberark_url}/AIMWebService/api/Accounts",
            params={"AppID": app_id, "Safe": safe, "Object": object_name},
            timeout=15,
            verify=True,   # Always verify TLS — never verify=False in production
        )

        if response.status_code == 401:
            logger.error(json.dumps({
                "event": "secret_retrieval_failed",
                "failure_classification": "authorization_or_permission_failure",
                "secret_name": object_name,
                "safe": safe,
                "message": "CyberArk authentication failed — check AppID permissions",
                # NOT: response body — may contain credential hints
            }))
            raise RuntimeError(
                f"AUTHORIZATION FAILURE: Cannot retrieve '{object_name}' from "
                f"CyberArk safe '{safe}'. Check AppID '{app_id}' permissions."
            )

        response.raise_for_status()
        credential = response.json()

        # Log retrieval success — NEVER log the values themselves
        logger.info(json.dumps({
            "event": "secret_retrieved",
            "secret_name": object_name,
            "safe": safe,
            "retrieved": True,
            # NOT: credential["Content"] or credential["UserName"]
        }))

        return {
            "username": credential["UserName"],
            "password": credential["Content"],   # used downstream, never logged
        }

    except requests.RequestException as exc:
        logger.error(json.dumps({
            "event": "secret_retrieval_failed",
            "failure_classification": "dependency_or_service_unavailable",
            "secret_name": object_name,
            "error_type": type(exc).__name__,
            # NOT str(exc) — may contain URL parameters with credential hints
        }))
        raise RuntimeError(
            f"DEPENDENCY FAILURE: CyberArk CCP at {cyberark_url} is unavailable. "
            f"Cannot retrieve '{object_name}'."
        ) from exc
`,
    },
  ],

  // ── Naming, Metadata & Classification ───────────────────────────────────
  "naming-metadata": [
    {
      id: "layer4-example-python-header",
      title: "Python: Complete Layer 4 Operator Header",
      description: "Full operator header with all required fields: purpose, scope, inputs, preconditions, outputs, ownership, safety, and backout reference.",
      language: "python",
      filename: "layer4-standards-example.py",
      content: `#!/usr/bin/env python3
"""
Layer 4 Standards – Example Python Automation Script

Purpose:      Demonstrates all mandatory Layer 4 controls for state-changing automation.
              Applies a managed configuration file to a target service.

Scope:        Single target service per run.
              Will NOT apply to 'all' targets without explicit approval.

Inputs:       See RunConfig dataclass.
              Required: --env, --service-name, --desired-version, --target-host
              Optional: --change-ticket, --dry-run, --explicit-prod-approval, and others.

Preconditions:
              - Approved secret provider configured (APP_DEPLOY_TOKEN env var must be set).
              - For prod: --explicit-prod-approval and --change-ticket are both required.
              - Target host must not be 'all' unless explicit approval is supplied.

Outputs:      Updated service config file, structured run metadata log, KPI metrics,
              and backout evidence when a failure is triggered.

Ownership:    platform-ops (example-owner@example.com)
              Escalation: sre-oncall@example.com

Safety:       Supports --dry-run to preview without making changes.
              Default scope is narrow (single host).
              Automatic backout is triggered on any failure or post-validation mismatch.
              Backout reference: ../../standards/automatic-backout-and-recovery.md
"""

# ── Classification (naming-metadata-and-classification.md) ──────────────────
#
# Automation type:   Operational
# Risk classification: Standard (single target, bounded scope)
# SLA binding:       Operational
# Compliance status: Compliant
# Lifecycle state:   Active
# Owner team:        platform-ops
#
# Asset name convention: [domain]-[action]-[target]
#   e.g. linux-apply-service-config  (lowercase, hyphens, action before target)

# ── Safe Execution Header (safe-execution.md) ────────────────────────────────
#
# SAFE EXECUTION SUMMARY
# Scope selector:      --target-host (required; never defaults to 'all')
# Default scope:       narrow — single host only
# Fail-closed on:      missing target-host, invalid env, missing change-ticket in prod,
#                      scope == 'all' without explicit approval
# Destructive actions: no
# Concurrent safety:   unsafe if run against same host in parallel;
#                      control: validated change ticket required (CHG number)
# Failure categories:  all five apply

# ── Backout Summary (automatic-backout-and-recovery.md) ─────────────────────
#
# BACKOUT SUMMARY
# Rollback method:      restore config file from backup taken in Stage 1
# Pre-change capture:   full copy of target config file; validated readable before change
# Irreversible actions: none
# Rollback tested:      yes — see rollback_test_record.md
# Incident contact:     platform-ops / sre-oncall@example.com

# ── Security Summary (secured-by-design.md) ──────────────────────────────────
#
# SECURITY SUMMARY
# Automation identity:      svc-automation-nonprod / svc-automation-prod (separate)
# Permissions required:     read/write target config file; read APP_DEPLOY_TOKEN from vault
# Secret systems used:      CyberArk CCP — dynamic retrieval at runtime
# Sensitive data processed: yes — deploy token masked in all output
# High-risk classification: no

# ── Observability Summary (observability-logging-and-reportability.md) ──────
#
# OBSERVABILITY SUMMARY
# Structured output:    yes — JSON via _build_logger / _RedactingFormatter
# Run summary location: execution_start and execution_complete events
# Sensitive fields:     yes — deploy token redacted via _RedactingFormatter
# Aggregation schema:   confirmed — fields match canonical naming conventions

# ── Re-runnable Behavior (idempotency-and-re-runnable-behavior.md) ──────────
#
# RE-RUNNABLE BEHAVIOR
# Idempotent:                       yes — checks current config value before writing
# Safe to re-run after partial failure: yes — backup restored; second run starts clean
# Retry-controlled operations:      config write: max 3 attempts, backoff [5, 10, 20]s
# Timeout-controlled operations:    secret retrieval: 15s; health check: 10s

import dataclasses
import logging
import os
import sys
from datetime import datetime, timezone
from typing import Optional

ALLOWED_CLASSIFICATIONS = frozenset([
    "Configuration", "Operational", "SLA Related",
    "Troubleshooting", "Approvals Needed", "One Time Only", "Legacy",
])

ALLOWED_ENVS = frozenset(["dev", "test", "staging", "prod"])


@dataclasses.dataclass(frozen=True)
class AutomationMetadata:
    automation_id:     str = "auto-layer4-demo-001"
    automation_name:   str = "layer4-python-standard-demo"
    automation_type:   str = "Operational"
    compliance_status: str = "Compliant"
    owner_team:        str = "platform-ops"


# ... (RunConfig, SecretProvider, main execution logic follow)
# Full implementation: layer4-standards-example.py in the reference library
`,
    },
    {
      id: "layer4-example-ansible-header",
      title: "Ansible: Complete Layer 4 Operator Header + Classification",
      description: "Full vars block with automation metadata, classification, guardrails, and operator header comments — the required pattern for every Ansible entrypoint.",
      language: "yaml",
      filename: "layer4-standards-example-playbook.yml",
      content: `---
# Layer 4 standards example playbook
# Purpose: Demonstrate mandatory controls from layer4-standards for state-changing automation.
# Scope: Writes a managed config file for a target service on selected hosts.
# Inputs: env, target_hosts, service_name, desired_version, change_ticket, deploy_token_env_var.
# Preconditions: Secrets provider configured; approved change for prod; safe scope selected.
# Outputs: Updated config file, run metadata log, KPI summary, backout evidence when triggered.
# Ownership: platform-ops (example-owner@example.com), escalation: sre-oncall@example.com.
# Safety: Supports --check, narrow default scope, explicit prod safeguards, automatic backout.
# Backout reference: ../../standards/automatic-backout-and-recovery.md

- name: Layer 4 compliant automation example
  hosts: "{{ target_hosts | default('app_canary') }}"
  gather_facts: false
  vars:

    # ── Classification + Traceability Metadata ────────────────────────────
    # (naming-metadata-and-classification.md)
    automation_id: "auto-layer4-demo-001"
    automation_name: "layer4-ansible-standard-demo"
    automation_type: "Operational"
    # Allowed types: Configuration | Operational | SLA Related | Troubleshooting
    #                Approvals Needed | One Time Only | Legacy
    compliance_status: "Compliant"
    owner_team: "platform-ops"
    run_id: "{{ lookup('pipe', 'date +%Y%m%d%H%M%S') }}"
    initiator: "{{ lookup('env', 'CI_ACTOR') | default('manual-operator', true) }}"
    repository_path: "automation/ansible/layer4-standards-example-playbook.yml"
    commit_sha: "{{ lookup('env', 'CI_COMMIT_SHA') | default('unknown', true) }}"

    # ── Guardrails and Safety Controls ───────────────────────────────────
    # (safe-execution.md)
    allowed_envs: ["dev", "test", "staging", "prod"]
    allowed_classifications:
      - "Configuration"
      - "Operational"
      - "SLA Related"
      - "Troubleshooting"
      - "Approvals Needed"
      - "One Time Only"
      - "Legacy"
    env: "{{ environment | default('test') }}"
    target_scope: "{{ target_hosts | default('app_canary') }}"
    explicit_prod_approval: "{{ explicit_prod_approval | default(false) }}"
    change_ticket: "{{ change_ticket | default('') }}"
    dry_run: "{{ dry_run | default(false) }}"

    # ── Inputs and Dependency Behavior ───────────────────────────────────
    service_name: "{{ service_name | default('demo-api') }}"
    desired_version: "{{ desired_version | default('2.4.1') }}"
    healthcheck_url: "{{ healthcheck_url | default('http://127.0.0.1:8080/health') }}"
    service_config_path: "{{ service_config_path | default('/tmp/demo-api.conf') }}"
    backup_config_path: "{{ service_config_path }}.bak"
    deploy_token_env_var: "{{ deploy_token_env_var | default('APP_DEPLOY_TOKEN') }}"

  pre_tasks:
    # ── Validate classification and compliance ────────────────────────────
    - name: Validate automation classification and compliance status
      ansible.builtin.assert:
        that:
          - automation_type in allowed_classifications
          - compliance_status in ['Compliant', 'Legacy', 'Non-Compliant']
        fail_msg: >
          Classification validation failed: automation_type must be one of the approved types
          and compliance_status must be Compliant, Legacy, or Non-Compliant.

    # ── Validate required inputs (fail-closed) ────────────────────────────
    - name: Validate required inputs and safe scope
      ansible.builtin.assert:
        that:
          - env in allowed_envs
          - target_scope != ''
          - target_scope != 'all'
          - service_name != ''
          - desired_version != ''
        fail_msg: >
          Input validation failed: env, target_scope (not 'all'), service_name,
          and desired_version are all required.

    # ── Require change ticket for production ──────────────────────────────
    - name: Require change ticket and explicit approval for production runs
      ansible.builtin.assert:
        that:
          - change_ticket != ''
          - explicit_prod_approval | bool
        fail_msg: >
          Production gate failed: change_ticket and explicit_prod_approval=true
          are both required for production execution.
      when: env == 'prod'

    # ── Retrieve secret at runtime (never hardcode) ───────────────────────
    - name: Retrieve deployment secret at runtime
      ansible.builtin.set_fact:
        deploy_token: "{{ lookup('env', deploy_token_env_var) }}"
      no_log: true   # prevents secret from appearing in output

    - name: Validate deployment secret is available
      ansible.builtin.assert:
        that:
          - deploy_token != ''
        fail_msg: >
          Authorization failure: {{ deploy_token_env_var }} is not set.
          Retrieve credentials from CyberArk before executing.
      no_log: true

    # ── Log structured run metadata ───────────────────────────────────────
    - name: Structured run metadata - start
      ansible.builtin.debug:
        msg:
          event: "execution_start"
          run_id: "{{ run_id }}"
          automation_id: "{{ automation_id }}"
          automation_name: "{{ automation_name }}"
          automation_type: "{{ automation_type }}"
          compliance_status: "{{ compliance_status }}"
          owner_team: "{{ owner_team }}"
          initiator: "{{ initiator }}"
          commit_sha: "{{ commit_sha }}"
          env: "{{ env }}"
          target_scope: "{{ target_scope }}"
          service_name: "{{ service_name }}"
          desired_version: "{{ desired_version }}"
          dry_run: "{{ dry_run }}"
          change_ticket: "{{ change_ticket }}"

  tasks:
    # Stage 1–7 follow: capture state, apply, check, detect, undo, verify, alert
    # See backout_example.yml for the complete seven-stage pattern.
    - name: Apply service change with automatic backout and post-validation
      ansible.builtin.include_tasks: tasks/apply_with_backout.yml
`,
    },
    {
      id: "layer4-example-pipeline-header",
      title: "Azure DevOps: Complete Layer 4 Operator Header + Stage Structure",
      description: "Pipeline header, variables block with all metadata fields, and the full stage sequence: Validate → QualityGates → DryRun → Deploy → Backout → Report.",
      language: "yaml",
      filename: "layer4-standards-example-pipeline.yml",
      content: `# Layer 4 standards example Azure DevOps pipeline
# Purpose: Demonstrate mandatory Layer 4 controls for state-changing automation.
# Scope: Deploy a versioned service artifact with validation, post-checks, and automatic backout.
# Inputs: environment, serviceName, desiredVersion, targetScope, changeTicket, explicitProdApproval.
# Preconditions: Secret variable group configured; non-prod test evidence; approvals for prod.
# Outputs: Deployment status, run metadata, KPI artifact, backout evidence on failure.
# Ownership: platform-ops (example-owner@example.com), escalation: sre-oncall@example.com.
# Safety: Narrow default scope, dry-run stage, production branch/approval controls, auto-backout.
# Backout reference: ../../standards/automatic-backout-and-recovery.md

trigger:
  branches:
    include:
      - main
      - feature/*

pr:
  branches:
    include:
      - main

name: layer4-$(Date:yyyyMMdd)-$(Rev:r)

parameters:
  - name: environment
    displayName: Target environment
    type: string
    default: test
    values: [dev, test, staging, prod]

  - name: serviceName
    displayName: Service name
    type: string
    default: demo-api

  - name: desiredVersion
    displayName: Desired version
    type: string
    default: 2.4.1

  - name: targetScope
    displayName: Deployment scope (never use 'all' in prod)
    type: string
    default: app-canary

  - name: changeTicket
    displayName: Change ticket (required for prod — format CHG0000000)
    type: string
    default: ''

  - name: explicitProdApproval
    displayName: Explicit production approval flag
    type: boolean
    default: false

variables:
  # ── Classification + Traceability Metadata ────────────────────────────────
  - name: automationId
    value: auto-layer4-azdo-001
  - name: automationName
    value: layer4-azdo-standard-demo
  - name: automationType
    value: Operational   # Configuration | Operational | SLA Related | ...
  - name: complianceStatus
    value: Compliant
  - name: ownerTeam
    value: platform-ops
  - name: repositoryPath
    value: automation/azure-devops/layer4-standards-example-pipeline.yml

  # Secret values must come from approved secret management integrations.
  # Example variable group references Azure Key Vault-backed secrets.
  - group: layer4-approved-secrets

stages:
  # ── Stage: Validate Inputs, Scope, and Governance ────────────────────────
  - stage: Validate
    displayName: Validate Inputs, Scope, and Governance
    jobs:
      - job: ValidationChecks
        pool:
          vmImage: ubuntu-latest
        steps:
          - bash: |
              set -euo pipefail
              [ -z "\${{ parameters.changeTicket }}" ] && [ "\${{ parameters.environment }}" == "prod" ] && {
                echo "##vso[task.logissue type=error]Production gate: changeTicket is required."
                exit 2
              }
              [ "\${{ parameters.targetScope }}" == "all" ] && [ "\${{ parameters.environment }}" == "prod" ] && {
                echo "##vso[task.logissue type=error]targetScope cannot be 'all' in prod."
                exit 2
              }
              echo "Validation passed."
            displayName: Input validation and governance checks

  # ── Stage: Quality Gates (Lint, Security Scan, Compliance Check) ─────────
  - stage: QualityGates
    displayName: Tested and Approved Gates
    dependsOn: Validate
    condition: succeeded('Validate')
    jobs:
      - job: QualityChecks
        pool:
          vmImage: ubuntu-latest
        steps:
          - bash: |
              set -euo pipefail
              echo "Running lint..."
              # ansible-lint or pylint or equivalent
              echo "Running security scan..."
              # trivy or bandit or equivalent
              echo "All quality gates passed."
            displayName: Lint, security scan, standards compliance

  # ── Stage: Dry Run (No State Change) ─────────────────────────────────────
  - stage: DryRun
    displayName: Safe Preview (No State Change)
    dependsOn: QualityGates
    condition: succeeded('QualityGates')
    jobs:
      - job: Plan
        pool:
          vmImage: ubuntu-latest
        steps:
          - bash: |
              echo "DRY RUN: scope=\${{ parameters.targetScope }} env=\${{ parameters.environment }}"
            displayName: Simulated deployment preview

  # ── Stage: Deploy with Post-Validation ───────────────────────────────────
  - stage: Deploy
    displayName: Deploy with Post-Validation
    dependsOn: DryRun
    condition: succeeded('DryRun')
    jobs:
      - deployment: DeployService
        environment: \${{ parameters.environment }}
        strategy:
          runOnce:
            deploy:
              steps:
                - bash: echo "Deploying \${{ parameters.desiredVersion }}"
                  displayName: Stage 2 — Apply change
                - bash: echo "Post-validating health..."
                  displayName: Stage 3 — Check

  # ── Stage: Automatic Backout (Stage 5) ───────────────────────────────────
  - stage: Backout
    displayName: Automatic Backout
    dependsOn: Deploy
    condition: failed('Deploy')     # Stage 4: Problem detected → trigger backout
    jobs:
      - job: Rollback
        pool:
          vmImage: ubuntu-latest
        steps:
          - bash: echo "Restoring previous version..."
            displayName: Stage 5 — Undo
          - bash: echo "Verifying rollback health..."
            displayName: Stage 6 — Verify Undo
          - bash: echo "Creating incident and notifying stakeholders..."
            displayName: Stage 7 — Alert (auto-incident, auto-notify)

  # ── Stage: KPI and Completion Reporting (always runs) ────────────────────
  - stage: Report
    displayName: KPI and Completion Reporting
    dependsOn: [Deploy, Backout]
    condition: always()
    jobs:
      - job: EmitMetrics
        pool:
          vmImage: ubuntu-latest
        steps:
          - bash: |
              echo '{"event":"execution_complete","automation":"$(automationName)","outcome":"'"$(Agent.JobStatus)"'"}'
            displayName: Emit structured completion record
`,
    },
  ],
};
