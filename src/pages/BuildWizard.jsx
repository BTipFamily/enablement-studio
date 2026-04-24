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
import { ArrowLeft, ArrowRight, Wand2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WizardStep from "@/components/wizard/WizardStep";
import { STARTER_TEMPLATES, runPolicyChecks, getComplianceScore } from "@/lib/standards-data";

const STEPS = [
  { label: "Basics", key: "basics" },
  { label: "Scope & Risk", key: "scope" },
  { label: "Safety", key: "safety" },
  { label: "Testing", key: "testing" },
  { label: "Review", key: "review" },
];

const TECH_AREAS = ["Linux", "Windows", "Network", "Firewall", "Database", "Middleware", "Observability", "Big Data", "Virtualization", "AIX", "Storage", "Mainframe"];
const AUTO_TYPES = ["Python", "Ansible Playbook", "PowerShell", "Bash"];
const RISK_TIERS = ["Low", "Medium", "High", "Critical"];
const CRED_TYPES = ["None", "Service Account", "Vault Secret", "API Token", "Certificate"];
const BACKOUT_APPROACHES = ["Automatic Rollback", "Manual Rollback", "Snapshot Restore", "Configuration Backup", "No Backout Required"];
const CONCURRENCY_LEVELS = ["None", "Low", "Medium", "High"];

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

export default function BuildWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
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

  const canProceed = () => {
    if (step === 1) return formData.name && formData.automation_type && formData.technology_area;
    if (step === 2) return formData.risk_tier && formData.target_scope;
    if (step === 3) return formData.backout_approach && formData.credential_need;
    if (step === 4) return formData.testing_plan;
    return true;
  };

  const handleCreate = async () => {
    setSaving(true);
    const tmpl = STARTER_TEMPLATES[formData.automation_type];
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
      status: "Draft",
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

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">Automation Name</Label>
              <Input id="name" value={formData.name} onChange={e => update("name", e.target.value)} placeholder="e.g., linux-patch-deployment" className="mt-1.5" />
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
              <Textarea id="test" value={formData.testing_plan} onChange={e => update("testing_plan", e.target.value)} placeholder="Describe test environment, parity to production, test cases planned..." className="mt-1.5" rows={4} />
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
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Build Wizard</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your automation in {STEPS.length} simple steps</p>
      </div>

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
              {renderStep()}
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
              <Button onClick={handleCreate} disabled={saving} className="bg-success hover:bg-success/90 text-success-foreground">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Generate Automation
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}