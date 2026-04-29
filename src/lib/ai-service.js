/**
 * ai-service.js
 * Two-step Claude-powered automation designer.
 *
 * Step 1 — analyzeRequest():  fast call, returns formData + reasoning only
 * Step 2 — generateCode():    streaming call, returns code artifacts after confirmation
 *
 * Splitting avoids the single-call token-limit / JSON-truncation problem and
 * lets the confirmation card appear in ~2 seconds instead of 15+.
 *
 * Requires: VITE_ANTHROPIC_API_KEY set in .env
 */

import Anthropic from "@anthropic-ai/sdk";

const APPROVED_DOMAINS = [
  "linux", "windows", "network", "firewall", "db", "middleware",
  "observability", "bigdata", "virt", "aix", "storage", "mainframe", "platform",
];

// ─── Prompts ──────────────────────────────────────────────────────────────────

const FIELDS_PROMPT = `You are a Layer 4 Author Standards specialist.
Given a plain-English automation request, return ONLY a JSON object with these two keys:

{
  "reasoning": "2-3 sentences explaining your field choices",
  "formData": {
    "name": "[domain]-[action]-[target] — approved prefixes: ${APPROVED_DOMAINS.join(", ")}",
    "description": "Clear description of what the automation does",
    "automation_type": "Python|PowerShell|Bash|JavaScript|Ansible Playbook|Other",
    "technology_area": "Linux|Windows|Network|Firewall|Database|Middleware|Observability|Big Data|Virtualization|AIX|Storage|Mainframe",
    "target_scope": "Specific target systems / environments",
    "risk_tier": "Low|Medium|High|Critical",
    "credential_need": "None|Service Account|Vault Secret|API Token|Certificate",
    "backout_approach": "Automatic Rollback|Manual Rollback|Snapshot Restore|Configuration Backup|No Backout Required",
    "concurrency_risk": "None|Low|Medium|High",
    "testing_plan": "Specific test scenarios and environment parity notes",
    "observability_needs": "Required logging, metrics, and reporting"
  }
}

Naming rules:
- Must follow [domain]-[action]-[target] (at least 3 hyphen-separated parts)
- First part must be one of the approved domain prefixes
- Lowercase, hyphens only — no spaces, no underscores

Respond with ONLY the JSON object. No markdown fences, no prose.`;

const CODE_PROMPT = `You are a Layer 4 Author Standards expert.
Generate production-quality, fully compliant automation code for the specification below.

Return ONLY a JSON object with these four keys — no prose, no markdown fences:

{
  "generated_code": "Complete, functional source code. NOT a stub. Must include: operator header, scope selector (fail-closed), input validation, 5-category failure classification (INPUT_VALIDATION|DEPENDENCY_UNAVAILABLE|AUTHORIZATION_FAILURE|EXECUTION_ERROR|POST_EXEC_VALIDATION), idempotency checks, bounded retries with backoff, explicit timeouts, structured JSON logging to stdout, unique run_id, run-level summary, pre-change state capture, backout/rollback logic, vault-based secret retrieval (no hardcoded credentials).",
  "metadata_schema": "JSON string: run_metadata object with automation_name, version, technology_area, owner, risk_tier, classification, requires_approval, credential_type, backout_approach, created_date",
  "readme_content": "Markdown README: purpose, prerequisites, inputs, outputs, usage examples, testing notes, backout procedure",
  "backout_content": "Markdown backout runbook: pre-conditions, step-by-step rollback, verification steps, escalation path"
}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClient() {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Add VITE_ANTHROPIC_API_KEY to your .env file and restart the dev server.");
  }
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

/**
 * Robust JSON extraction — handles:
 * - Leading/trailing prose from the model
 * - Markdown code fences (```json ... ```)
 * - Truncated responses (provides a clear error)
 */
function extractJSON(rawText) {
  // 1. Strip markdown fences (anywhere in string)
  let text = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // 2. Try direct parse
  try { return JSON.parse(text); } catch {}

  // 3. Locate outermost { ... } and try that slice
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");

  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }

  // 4. Diagnose truncation vs. garbled response
  if (start !== -1 && end <= start) {
    throw new Error(
      "Response was cut off before the JSON closed. Try a shorter or simpler request."
    );
  }

  const preview = rawText.slice(0, 300).replace(/\n/g, " ");
  throw new Error(`Could not parse AI response. Preview: "${preview}"`);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Step 1 — fast: analyze request and return wizard fields + reasoning.
 * Confirmation card appears in ~2 s.
 *
 * @param {string} description
 * @returns {Promise<{ reasoning: string, formData: object }>}
 */
export async function analyzeRequest(description) {
  const client = getClient();

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: FIELDS_PROMPT,
    messages: [
      {
        role: "user",
        content: `Automation request: "${description}"`,
      },
    ],
  });

  const raw = msg.content[0]?.text ?? "";
  return extractJSON(raw);
}

/**
 * Step 2 — streaming: generate full Layer 4-compliant code after confirmation.
 * Call this only after the user approves the proposed fields.
 *
 * @param {object} formData      - Fields returned by analyzeRequest()
 * @param {string} description   - Original plain-English request
 * @param {function} [onProgress] - Streaming callback (message: string) => void
 * @returns {Promise<{ generated_code: string, metadata_schema: string, readme_content: string, backout_content: string }>}
 */
export async function generateCodeForProject(formData, description, onProgress) {
  const client = getClient();

  const spec = JSON.stringify(formData, null, 2);

  let rawText = "";

  const stream = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    system: CODE_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate code for this automation:\n\nOriginal request: "${description}"\n\nApproved specification:\n${spec}`,
      },
    ],
    stream: true,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      rawText += event.delta.text;
      if (onProgress) {
        const pct = Math.min(90, Math.round((rawText.length / 8000) * 100));
        onProgress(`Generating ${formData.automation_type} code… ${pct}%`);
      }
    }
  }

  return extractJSON(rawText);
}
