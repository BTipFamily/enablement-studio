import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ClipboardPaste, PlayCircle, RotateCcw, ScanSearch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import PolicyPanel from "@/components/workspace/PolicyPanel";
import HealthBadge from "@/components/shared/HealthBadge";
import { runPolicyChecks, getComplianceScore, getHealthStatus } from "@/lib/standards-data";

const LANGUAGES = ["Python", "Ansible Playbook", "PowerShell", "Bash", "YAML", "Other"];

const RISK_TIERS = ["Low", "Medium", "High", "Critical"];
const AUTO_TYPES = ["Python", "Ansible Playbook", "PowerShell", "Bash", "Configuration", "Provisioning", "Service Operation", "Troubleshooting"];

const PLACEHOLDER = {
  Python: `#!/usr/bin/env python3
# Paste your Python automation script here...

def validate_inputs(params):
    # Input validation
    pass

def backout(pre_state):
    # Rollback logic
    pass

def execute(params, dry_run=False):
    # Main execution logic
    pass
`,
  "Ansible Playbook": `---
# Paste your Ansible playbook here...

- name: "your-automation-name"
  hosts: "{{ target_hosts }}"
  tasks:
    - name: example task
      ansible.builtin.debug:
        msg: "implement tasks here"
`,
  PowerShell: `# Paste your PowerShell script here...

function Invoke-Main {
    # Main execution logic
}

exit (Invoke-Main)
`,
  Bash: `#!/usr/bin/env bash
# Paste your Bash script here...

set -euo pipefail

main() {
    # Main execution logic
}

main "$@"
`,
  YAML: `# Paste your YAML automation definition here...
`,
  Other: `# Paste your automation code here...
`,
};

export default function Validator() {
  const [language, setLanguage] = useState("Python");
  const [code, setCode] = useState("");
  const [metaOpen, setMetaOpen] = useState(false);
  const [meta, setMeta] = useState({
    name: "",
    automation_type: "",
    risk_tier: "",
    testing_plan: "",
  });
  const [results, setResults] = useState(null);
  const [score, setScore] = useState(0);
  const [hasRun, setHasRun] = useState(false);

  const updateMeta = (field, value) => setMeta(prev => ({ ...prev, [field]: value }));

  const handleValidate = useCallback(() => {
    const project = {
      name: meta.name || undefined,
      automation_type: meta.automation_type || language,
      risk_tier: meta.risk_tier || undefined,
      testing_plan: meta.testing_plan || undefined,
    };
    const checks = runPolicyChecks(code, project);
    const s = getComplianceScore(checks);
    setResults(checks);
    setScore(s);
    setHasRun(true);
  }, [code, language, meta]);

  const handleReset = () => {
    setCode("");
    setResults(null);
    setScore(0);
    setHasRun(false);
    setMeta({ name: "", automation_type: "", risk_tier: "", testing_plan: "" });
  };

  const errorCount = results ? results.filter(c => !c.passed && c.severity === "error").length : 0;
  const warnCount = results ? results.filter(c => !c.passed && c.severity === "warning").length : 0;

  return (
    <div className="h-screen flex flex-col">
      {/* Header bar */}
      <div className="border-b px-6 py-3 flex items-center justify-between bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <ScanSearch className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-base font-bold">Code Validator</h1>
            <p className="text-xs text-muted-foreground">Paste existing automation to score it against the 7 Author Standards</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasRun && (
            <div className="flex items-center gap-2 mr-2">
              <HealthBadge status={getHealthStatus(score)} score={score} />
              {errorCount > 0 && (
                <Badge variant="destructive" className="text-[10px]">{errorCount} error{errorCount !== 1 ? "s" : ""}</Badge>
              )}
              {warnCount > 0 && (
                <Badge variant="outline" className="text-[10px] border-warning text-warning">{warnCount} warning{warnCount !== 1 ? "s" : ""}</Badge>
              )}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleReset} className="text-xs h-8 gap-1.5">
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
          <Button size="sm" onClick={handleValidate} disabled={!code.trim()} className="text-xs h-8 gap-1.5">
            <PlayCircle className="w-3.5 h-3.5" /> Validate
          </Button>
        </div>
      </div>

      {/* Main two-panel layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        {/* Left: code input */}
        <ResizablePanel defaultSize={60} minSize={25} className="flex flex-col overflow-hidden">
          {/* Language picker + metadata toggle */}
          <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Language</Label>
              <Select value={language} onValueChange={v => { setLanguage(v); if (!code) setCode(""); }}>
                <SelectTrigger className="h-7 text-xs w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={() => setMetaOpen(o => !o)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {metaOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Metadata <span className="text-muted-foreground/50">(improves scoring)</span>
            </button>
          </div>

          {/* Metadata accordion */}
          <AnimatePresence initial={false}>
            {metaOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-b bg-muted/20"
              >
                <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <Label className="text-xs font-medium">Automation Name</Label>
                    <p className="text-[10px] text-muted-foreground mb-1">Checks naming pattern [domain]-[action]-[target]</p>
                    <Input
                      value={meta.name}
                      onChange={e => updateMeta("name", e.target.value)}
                      placeholder="e.g. linux-patch-hosts"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Risk Tier</Label>
                    <p className="text-[10px] text-muted-foreground mb-1">Used for classification checks</p>
                    <Select value={meta.risk_tier} onValueChange={v => updateMeta("risk_tier", v)}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {RISK_TIERS.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Automation Type</Label>
                    <p className="text-[10px] text-muted-foreground mb-1">Classification dimension</p>
                    <Select value={meta.automation_type} onValueChange={v => updateMeta("automation_type", v)}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {AUTO_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Testing Plan Summary</Label>
                    <p className="text-[10px] text-muted-foreground mb-1">Enables testing evidence checks</p>
                    <Input
                      value={meta.testing_plan}
                      onChange={e => updateMeta("testing_plan", e.target.value)}
                      placeholder="e.g. Tested in staging with parity to prod..."
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Code area */}
          <div className="flex-1 relative overflow-hidden">
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={PLACEHOLDER[language]}
              spellCheck={false}
              className="w-full h-full resize-none bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed p-4 focus:outline-none placeholder:text-slate-600"
            />
            {!code && (
              <div className="absolute bottom-4 right-4 pointer-events-none">
                <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Paste your code
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: results panel */}
        <ResizablePanel defaultSize={40} minSize={20} className="bg-card flex flex-col overflow-hidden">
          {!hasRun ? (
            <EmptyState onValidate={handleValidate} hasCode={!!code.trim()} />
          ) : (
            <PolicyPanel
              checkResults={results}
              score={score}
              onReEvaluate={handleValidate}
            />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function EmptyState({ onValidate, hasCode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <ScanSearch className="w-7 h-7 text-primary" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold">Ready to validate</h3>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-56">
          Paste your automation code on the left, then click Validate to score it against all 7 Author Standards.
        </p>
      </div>
      <div className="space-y-2 text-left w-full max-w-64">
        {[
          "Safe Execution",
          "Idempotency & Re-runnable Behavior",
          "Tested Before Production",
          "Automatic Backout & Recovery",
          "Observability, Logging & Reportability",
          "Secured by Design",
          "Naming, Metadata & Classification",
        ].map((std, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground/60 flex-shrink-0">
              {i + 1}
            </div>
            {std}
          </div>
        ))}
      </div>
      <Button
        size="sm"
        onClick={onValidate}
        disabled={!hasCode}
        className="mt-2 gap-1.5 text-xs"
      >
        <PlayCircle className="w-3.5 h-3.5" /> Validate Code
      </Button>
    </div>
  );
}
