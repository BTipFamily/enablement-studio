import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, Wand2, Loader2, CheckCircle2, XCircle,
  Sparkles, Pencil, ChevronRight, Bot, User, Lightbulb, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WizardStep from "@/components/wizard/WizardStep";
import { STARTER_TEMPLATES, runPolicyChecks, getComplianceScore } from "@/lib/standards-data";
import { analyzeRequest, generateCodeForProject } from "@/lib/ai-service";
import { getRequesterInfo } from "@/lib/user-profile";
import { cn } from "@/lib/utils";

const APPROVED_DOMAINS = [
  "linux", "windows", "network", "firewall", "db", "middleware",
  "observability", "bigdata", "virt", "aix", "storage", "mainframe", "platform",
];

function validateName(name) {
  if (!name) return null;
  const errors = [];
  if (/\s/.test(name))
    errors.push("No spaces — use hyphens between words");
  if (/_/.test(name))
    errors.push("Use hyphens (-) not underscores — underscores are for variable names only");
  if (/[^a-z0-9-]/.test(name.replace(/\s/g, "").replace(/_/g, "")))
    errors.push("Only lowercase letters, numbers, and hyphens allowed");
  else if (name !== name.toLowerCase())
    errors.push("Lowercase only");
  const parts = name.toLowerCase().split("-").filter(Boolean);
  if (parts.length > 0 && !APPROVED_DOMAINS.includes(parts[0]))
    errors.push(`"${parts[0]}" is not an approved domain prefix — choose from: ${APPROVED_DOMAINS.join(", ")}`);
  if (parts.length < 3)
    errors.push("Must have at least 3 parts: [domain]-[action]-[target]");
  return errors;
}

const STEPS = [
  { label: "Basics", key: "basics" },
  { label: "Scope & Risk", key: "scope" },
  { label: "Safety", key: "safety" },
  { label: "Testing", key: "testing" },
  { label: "Review", key: "review" },
];

const TECH_AREAS = [
  "Linux", "Windows", "Network", "Firewall", "Database",
  "Middleware", "Observability", "Big Data", "Virtualization", "AIX", "Storage", "Mainframe",
];
const AUTO_TYPES = ["Python", "PowerShell", "Bash", "JavaScript", "Ansible Playbook", "Other"];
const RISK_TIERS = ["Low", "Medium", "High", "Critical"];
const CRED_TYPES = ["None", "Service Account", "Vault Secret", "API Token", "Certificate"];
const BACKOUT_APPROACHES = [
  "Automatic Rollback", "Manual Rollback", "Snapshot Restore",
  "Configuration Backup", "No Backout Required",
];
const CONCURRENCY_LEVELS = ["None", "Low", "Medium", "High"];

// ─── Example prompts shown in AI Assist mode ─────────────────────────────────
const AI_EXAMPLES = [
  {
    label: "Linux service restart",
    prompt: "Script that checks all critical Linux services on a hostgroup, restarts any that are stopped, and sends a structured alert to Slack if any fail to come back up. Needs idempotent retry logic and pre/post state capture.",
  },
  {
    label: "Credential rotation",
    prompt: "Rotate AWS IAM service account credentials across all environments on a monthly schedule. Fetch current secrets from Vault, generate new keys, update all downstream consumers, then invalidate the old keys. Must roll back if any consumer fails validation.",
  },
  {
    label: "Kubernetes deployment",
    prompt: "Deploy a Python microservice to Kubernetes with health-check polling, automatic rollback on failed readiness probes, structured JSON logging, and compliance metadata in the pod annotations.",
  },
];

function generateCode(template, formData) {
  let code = template;
  const replacements = {
    "{{name}}": formData.name || "Untitled",
    "{{description}}": formData.description || "",
    "{{technology_area}}": formData.technology_area || "",
    "{{owner}}": "automation-team",
    "{{risk_tier}}": formData.risk_tier || "Medium",
    "{{classification}}": formData.technology_area || "",
    "{{lifecycle_status}}": "Draft",
    "{{created_date}}": new Date().toISOString().split("T")[0],
    "{{backout_approach}}": formData.backout_approach || "",
    "{{credential_need}}": formData.credential_need || "None",
    "{{concurrency_risk}}": formData.concurrency_risk || "None",
  };
  Object.entries(replacements).forEach(([key, val]) => {
    code = code.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), val);
  });
  return code;
}

// ─── AI Assist Panel ──────────────────────────────────────────────────────────

function AIAssistPanel({ onComplete, onSwitchToManual, generationError }) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(/** @type {any} */ (null));

  const apiKeyMissing = !import.meta.env.VITE_ANTHROPIC_API_KEY;

  const handleDesign = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress("Analyzing request…");
    try {
      const res = await analyzeRequest(description.trim());
      setResult(res);
    } catch (err) {
      setError(err.message || "AI design failed. Check your API key or try again.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  if (result) {
    return (
      <AIConfirmation
        result={result}
        generationError={generationError}
        onConfirm={() => onComplete(result, description)}
        onEdit={() => onSwitchToManual(result.formData)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <Bot className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-primary">AI Automation Designer</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Describe what you want the automation to do in plain English. Claude will validate the name
            against Layer 4 standards, fill in all fields, and generate compliant code.
          </p>
        </div>
      </div>

      {apiKeyMissing && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-semibold">API key not configured</p>
            <p className="mt-0.5">
              Add <code className="font-mono bg-warning/20 px-1 rounded">VITE_ANTHROPIC_API_KEY=sk-ant-…</code> to
              your <code className="font-mono">.env</code> file and restart the dev server.
            </p>
          </div>
        </div>
      )}

      {/* Examples */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Lightbulb className="w-3.5 h-3.5 text-warning" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Try an example</p>
        </div>
        <div className="space-y-2">
          {AI_EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setDescription(ex.prompt)}
              className="w-full text-left p-3 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary/40 hover:bg-primary/3 transition-all group"
            >
              <div className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary mt-0.5 transition-colors flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{ex.label}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-2">{ex.prompt}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Description input */}
      <div>
        <Label htmlFor="ai-desc" className="text-sm font-medium">Your automation request</Label>
        <Textarea
          id="ai-desc"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe what you want the automation to do, which systems it targets, and any specific requirements (language, risk level, rollback approach)…"
          className="mt-1.5"
          rows={5}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleDesign}
          disabled={!description.trim() || loading || apiKeyMissing}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {progress || "Designing…"}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Design with AI
            </>
          )}
        </Button>
        <Button variant="outline" onClick={() => onSwitchToManual(null)}>
          <Pencil className="w-4 h-4 mr-2" />
          Manual
        </Button>
      </div>
    </div>
  );
}

// ─── AI Confirmation Card ─────────────────────────────────────────────────────

function AIConfirmation({ result, generationError, onConfirm, onEdit }) {
  const { formData, reasoning } = result;
  const nameErrors = validateName(formData?.name || "");
  const nameValid = nameErrors !== null && nameErrors.length === 0;

  const fields = [
    ["Name", formData?.name],
    ["Type", formData?.automation_type],
    ["Technology", formData?.technology_area],
    ["Risk Tier", formData?.risk_tier],
    ["Credential", formData?.credential_need],
    ["Backout", formData?.backout_approach],
    ["Concurrency", formData?.concurrency_risk],
  ];

  return (
    <div className="space-y-5">
      {/* AI reasoning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-chart-2/5 border border-chart-2/20">
        <Bot className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-chart-2 mb-1">AI Analysis</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{reasoning}</p>
        </div>
      </div>

      {/* Name validation indicator */}
      <div className="p-3 rounded-lg bg-muted/50">
        <p className="text-xs text-muted-foreground mb-1">Automation Name (Layer 4 validated)</p>
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono font-bold flex-1">{formData?.name}</code>
          {nameValid
            ? <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
            : <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />}
        </div>
        {!nameValid && nameErrors?.map((err, i) => (
          <p key={i} className="text-xs text-destructive mt-1">{err}</p>
        ))}
      </div>

      {/* Field grid */}
      <div className="grid grid-cols-2 gap-2">
        {fields.map(([label, value]) => (
          <div key={label} className="p-2.5 rounded-lg bg-muted/40">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-xs font-semibold mt-0.5 truncate">{value || "—"}</p>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-lg bg-muted/40">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Description</p>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{formData?.description}</p>
      </div>

      <div className="p-3 rounded-lg bg-muted/40">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Testing Plan</p>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{formData?.testing_plan}</p>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-xs">{formData?.automation_type}</Badge>
        <Badge variant="secondary" className="text-xs">{formData?.technology_area}</Badge>
        <Badge variant="outline" className={cn(
          "text-xs",
          formData?.risk_tier === "Critical" && "border-destructive text-destructive",
          formData?.risk_tier === "High" && "border-warning text-warning",
        )}>
          {formData?.risk_tier} Risk
        </Badge>
      </div>

      {generationError && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {generationError}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button className="flex-1 bg-success hover:bg-success/90 text-success-foreground" onClick={onConfirm}>
          <Wand2 className="w-4 h-4 mr-2" />
          Looks Good — Generate
        </Button>
        <Button variant="outline" onClick={onEdit}>
          <Pencil className="w-4 h-4 mr-2" />
          Edit Manually
        </Button>
      </div>
    </div>
  );
}

// ─── Main BuildWizard ─────────────────────────────────────────────────────────

export default function BuildWizard() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("ai"); // "ai" | "manual"
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [codeProgress, setCodeProgress] = useState("");
  const [generationError, setGenerationError] = useState(/** @type {string|null} */ (null));

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    automation_type: "",
    technology_area: "",
    target_scope: "",
    risk_tier: "Medium",
    credential_need: "None",
    backout_approach: "",
    concurrency_risk: "None",
    testing_plan: "",
    observability_needs: "",
  });

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const switchToManual = (prefill) => {
    if (prefill) setFormData(prev => ({ ...prev, ...prefill }));
    setMode("manual");
    setStep(1);
  };

  // AI mode confirmed — step 2: generate code then save
  const handleAIComplete = async (analysisResult, description) => {
    setSaving(true);
    setGenerationError(null);
    setCodeProgress("Generating code and compliance artifacts…");

    const { formData: fd } = analysisResult;
    const requester = getRequesterInfo();

    let generated_code = "", metadata_schema = "", readme_content = "", backout_content = "";
    try {
      const artifacts = await generateCodeForProject(fd, description, (msg) => setCodeProgress(msg));
      generated_code  = artifacts.generated_code  || "";
      metadata_schema = artifacts.metadata_schema || "";
      readme_content  = artifacts.readme_content  || "";
      backout_content = artifacts.backout_content || "";
    } catch (err) {
      setSaving(false);
      setCodeProgress("");
      setGenerationError(/** @type {any} */ (err).message || "Code generation failed. Try again.");
      return;
    }

    const checks = runPolicyChecks(generated_code, fd);
    const score = getComplianceScore(checks);
    const checkResults = {};
    checks.forEach(c => { checkResults[c.id] = c.passed; });

    const project = await base44.entities.Project.create({
      ...fd,
      ...requester,
      status: "Draft",
      ai_generated: true,
      generated_code,
      metadata_schema,
      readme_content,
      backout_content,
      compliance_score: score,
      check_results: checkResults,
    });

    setSaving(false);
    navigate(`/Workspace?project=${project.id}`);
  };

  // Manual mode — classic template generation
  const handleCreate = async () => {
    setSaving(true);
    const requester = getRequesterInfo();
    const tmpl = STARTER_TEMPLATES[formData.automation_type] || STARTER_TEMPLATES["Python"];
    const generatedCode = generateCode(tmpl.main_code, formData);
    const metadataSchema = generateCode(tmpl.metadata_schema, formData);
    const readmeContent = generateCode(tmpl.readme_template, formData);
    const backoutContent = generateCode(tmpl.backout_template, formData);

    const checks = runPolicyChecks(generatedCode, formData);
    const score = getComplianceScore(checks);
    const checkResults = {};
    checks.forEach(c => { checkResults[c.id] = c.passed; });

    const project = await base44.entities.Project.create({
      ...formData,
      ...requester,
      status: "Draft",
      ai_generated: false,
      generated_code: generatedCode,
      metadata_schema: metadataSchema,
      readme_content: readmeContent,
      backout_content: backoutContent,
      compliance_score: score,
      check_results: checkResults,
    });

    setSaving(false);
    navigate(`/Workspace?project=${project.id}`);
  };

  const canProceed = () => {
    if (step === 1) {
      const nameErrors = validateName(formData.name);
      return formData.name && nameErrors !== null && nameErrors.length === 0
        && formData.automation_type && formData.technology_area;
    }
    if (step === 2) return formData.risk_tier && formData.target_scope;
    if (step === 3) return formData.backout_approach && formData.credential_need;
    if (step === 4) return formData.testing_plan;
    return true;
  };

  const renderManualStep = () => {
    switch (step) {
      case 1: {
        const nameErrors = validateName(formData.name);
        const nameValid = nameErrors !== null && nameErrors.length === 0;
        const nameTouched = formData.name.length > 0;
        return (
          <div className="space-y-5">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">Automation Name</Label>
              <p className="text-xs text-muted-foreground mb-1.5 mt-0.5">
                Format: <code className="font-mono bg-muted px-1 rounded">[domain]-[action]-[target]</code>
                {" "}e.g. <code className="font-mono bg-muted px-1 rounded">linux-patch-hosts</code>
              </p>
              <Input
                id="name"
                value={formData.name}
                onChange={e => update("name", e.target.value)}
                placeholder="e.g., linux-patch-hosts"
                className={cn(
                  "mt-0.5 font-mono",
                  nameTouched && nameValid && "border-success focus-visible:ring-success",
                  nameTouched && !nameValid && "border-destructive focus-visible:ring-destructive",
                )}
              />
              {nameTouched && (
                <div className="mt-2 space-y-1">
                  {nameValid ? (
                    <div className="flex items-center gap-1.5 text-xs text-success">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      Valid naming format
                    </div>
                  ) : (
                    nameErrors.map((err, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-destructive">
                        <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        {err}
                      </div>
                    ))
                  )}
                </div>
              )}
              {!nameTouched && (
                <p className="mt-1.5 text-[11px] text-muted-foreground/60">
                  Approved domains: {APPROVED_DOMAINS.join(" · ")}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="desc" className="text-sm font-medium">Description</Label>
              <Textarea id="desc" value={formData.description} onChange={e => update("description", e.target.value)} placeholder="What does this automation do?" className="mt-1.5" rows={3} />
            </div>
            <div>
              <Label className="text-sm font-medium">Automation Type</Label>
              <RadioGroup value={formData.automation_type} onValueChange={v => update("automation_type", v)} className="mt-2 grid grid-cols-2 gap-3">
                {AUTO_TYPES.map(t => (
                  <Label key={t} htmlFor={t} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.automation_type === t ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                    <RadioGroupItem value={t} id={t} />
                    <span className="text-sm font-medium">{t}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label className="text-sm font-medium">Technology Area</Label>
              <Select value={formData.technology_area} onValueChange={v => update("technology_area", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>
                  {TECH_AREAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      }
      case 2:
        return (
          <div className="space-y-5">
            <div>
              <Label htmlFor="scope" className="text-sm font-medium">Target Scope</Label>
              <Textarea id="scope" value={formData.target_scope} onChange={e => update("target_scope", e.target.value)} placeholder="Describe target systems, hostgroups, or environment" className="mt-1.5" rows={3} />
            </div>
            <div>
              <Label className="text-sm font-medium">Risk Tier</Label>
              <RadioGroup value={formData.risk_tier} onValueChange={v => update("risk_tier", v)} className="mt-2 grid grid-cols-2 gap-3">
                {RISK_TIERS.map(t => (
                  <Label key={t} htmlFor={`risk-${t}`} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.risk_tier === t ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                    <RadioGroupItem value={t} id={`risk-${t}`} />
                    <span className="text-sm font-medium">{t}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label className="text-sm font-medium">Credential Need</Label>
              <p className="text-xs text-muted-foreground mb-1.5">Type of credential required (never enter actual secret values)</p>
              <Select value={formData.credential_need} onValueChange={v => update("credential_need", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CRED_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-medium">Backout Approach</Label>
              <RadioGroup value={formData.backout_approach} onValueChange={v => update("backout_approach", v)} className="mt-2 space-y-2">
                {BACKOUT_APPROACHES.map(t => (
                  <Label key={t} htmlFor={`bo-${t}`} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.backout_approach === t ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                    <RadioGroupItem value={t} id={`bo-${t}`} />
                    <span className="text-sm font-medium">{t}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label className="text-sm font-medium">Concurrency Risk</Label>
              <p className="text-xs text-muted-foreground mb-1.5">Risk of conflicting concurrent executions</p>
              <Select value={formData.concurrency_risk} onValueChange={v => update("concurrency_risk", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONCURRENCY_LEVELS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-5">
            <div>
              <Label htmlFor="test" className="text-sm font-medium">Testing Evidence Plan</Label>
              <p className="text-xs text-muted-foreground mb-1.5">How will you demonstrate this was tested in representative conditions?</p>
              <Textarea id="test" value={formData.testing_plan} onChange={e => update("testing_plan", e.target.value)} placeholder="Describe test environment, parity to production, test cases planned…" className="mt-1.5" rows={4} />
            </div>
            <div>
              <Label htmlFor="obs" className="text-sm font-medium">Observability & Reporting Needs</Label>
              <Textarea id="obs" value={formData.observability_needs} onChange={e => update("observability_needs", e.target.value)} placeholder="What logging, metrics, or reporting does this automation need?" className="mt-1.5" rows={3} />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3">
                <Wand2 className="w-7 h-7 text-success" />
              </div>
              <h3 className="text-lg font-bold">Ready to Generate</h3>
              <p className="text-sm text-muted-foreground">Review your configuration before generating</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Name", formData.name],
                ["Type", formData.automation_type],
                ["Technology", formData.technology_area],
                ["Risk Tier", formData.risk_tier],
                ["Credential", formData.credential_need],
                ["Backout", formData.backout_approach],
                ["Concurrency", formData.concurrency_risk],
                ["Scope", formData.target_scope],
              ].map(([label, value]) => (
                <div key={label} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium mt-0.5 truncate">{value || "—"}</p>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (saving) {
    return (
      <div className="p-6 lg:p-10 max-w-3xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm font-medium">Creating your automation…</p>
          <p className="text-xs text-muted-foreground mt-1">{codeProgress || "Running Layer 4 policy checks"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Build Wizard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "ai"
            ? "Describe your automation in plain English — AI handles the rest"
            : `Configure your automation in ${STEPS.length} simple steps`}
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-8 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setMode("ai")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            mode === "ai" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="w-4 h-4" />
          AI Assist
        </button>
        <button
          onClick={() => setMode("manual")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            mode === "manual" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="w-4 h-4" />
          Manual
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === "ai" ? (
          <motion.div
            key="ai-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Automation Designer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIAssistPanel
                  onComplete={handleAIComplete}
                  onSwitchToManual={switchToManual}
                  generationError={generationError}
                />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="manual-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Steps indicator */}
            <div className="flex items-center mb-8 overflow-x-auto pb-2">
              {STEPS.map((s, i) => (
                <WizardStep key={i} step={i + 1} currentStep={step} totalSteps={STEPS.length} label={s.label} />
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{STEPS[step - 1].label}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderManualStep()}
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-between mt-8 pt-4 border-t">
                  <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  {step < STEPS.length ? (
                    <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={handleCreate} className="bg-success hover:bg-success/90 text-success-foreground">
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Automation
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
