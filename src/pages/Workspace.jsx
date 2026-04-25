import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { 
  Save, Download, Shield, Package, 
  ChevronLeft, Loader2, FolderOpen, RefreshCw, Settings2,
  PanelRightClose, PanelRightOpen, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import CodeEditor from "@/components/workspace/CodeEditor";
import PolicyPanel from "@/components/workspace/PolicyPanel";
import EvidencePack from "@/components/workspace/EvidencePack";
import HealthBadge from "@/components/shared/HealthBadge";
import { runPolicyChecks, getComplianceScore, getHealthStatus } from "@/lib/standards-data";

export default function Workspace() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("project");
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("main");
  const [rightPanel, setRightPanel] = useState("policy");
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const editorPanelRef = useRef(null);
  const rightPanelRef = useRef(null);
  const [localProject, setLocalProject] = useState(null);
  const [checkResults, setCheckResults] = useState([]);
  const [score, setScore] = useState(0);

  // Load all projects for selector
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date", 50),
  });

  // Load selected project
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => base44.entities.Project.filter({ id: projectId }),
    enabled: !!projectId,
    select: (data) => data?.[0],
  });

  useEffect(() => {
    if (project) {
      setLocalProject(project);
      const results = runPolicyChecks(project.generated_code, project);
      setCheckResults(results);
      setScore(getComplianceScore(results));
    }
  }, [project]);

  const handleReEvaluate = useCallback(() => {
    if (!localProject) return;
    const results = runPolicyChecks(localProject.generated_code, localProject);
    setCheckResults(results);
    setScore(getComplianceScore(results));
    toast({ title: "Checks updated", description: `${results.filter(r => r.passed).length}/${results.length} passing` });
  }, [localProject, toast]);

  const handleCodeChange = useCallback((tabId, value) => {
    setLocalProject(prev => {
      if (!prev) return prev;
      const fieldMap = { main: "generated_code", metadata: "metadata_schema", readme: "readme_content", backout: "backout_content" };
      const updated = { ...prev, [fieldMap[tabId]]: value };
      
      // Re-run checks
      const results = runPolicyChecks(updated.generated_code, updated);
      setCheckResults(results);
      setScore(getComplianceScore(results));
      
      return updated;
    });
  }, []);

  const handlePropertyChange = useCallback((field, value) => {
    setLocalProject(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      const results = runPolicyChecks(updated.generated_code, updated);
      setCheckResults(results);
      setScore(getComplianceScore(results));
      return updated;
    });
  }, []);

  const handleSave = async () => {
    if (!localProject) return;
    setSaving(true);
    const checkMap = {};
    checkResults.forEach(c => { checkMap[c.id] = c.passed; });
    
    await base44.entities.Project.update(localProject.id, {
      generated_code: localProject.generated_code,
      metadata_schema: localProject.metadata_schema,
      readme_content: localProject.readme_content,
      backout_content: localProject.backout_content,
      compliance_score: score,
      check_results: checkMap,
    });
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    setSaving(false);
    toast({ title: "Saved", description: "Project saved successfully" });
  };

  const handleExport = () => {
    if (!localProject) return;
    const files = {
      [`main${getExtension(localProject.automation_type)}`]: localProject.generated_code,
      "metadata.json": localProject.metadata_schema,
      "README.md": localProject.readme_content,
      "backout.md": localProject.backout_content,
    };
    
    // Create individual downloads
    Object.entries(files).forEach(([name, content]) => {
      if (!content) return;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    });
    toast({ title: "Exported", description: "Files downloaded" });
  };

  if (!projectId) {
    return (
      <div className="p-6 lg:p-10 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Workspace</h1>
        <p className="text-sm text-muted-foreground mb-6">Select a project to open in the workspace</p>
        
        {projects.length === 0 ? (
          <Card className="p-8 text-center">
            <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No projects yet. Use the Build Wizard to create one.</p>
            <Button onClick={() => navigate("/BuildWizard")} className="mt-4">Start Build Wizard</Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/Workspace?project=${p.id}`)}
                className="w-full flex items-center justify-between p-4 rounded-lg border hover:border-primary/30 hover:bg-muted/50 transition-all text-left"
              >
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.automation_type} · {p.technology_area}</p>
                </div>
                <div className="flex items-center gap-2">
                  {p.compliance_score !== undefined && (
                    <HealthBadge status={getHealthStatus(p.compliance_score)} score={p.compliance_score} />
                  )}
                  <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="border-b px-4 py-2 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/Workspace")} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-sm font-semibold">{localProject?.name}</h2>
            <p className="text-xs text-muted-foreground">{localProject?.automation_type} · {localProject?.technology_area}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HealthBadge status={getHealthStatus(score)} score={score} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (editorCollapsed) {
                editorPanelRef.current?.expand();
                setEditorCollapsed(false);
              } else {
                editorPanelRef.current?.collapse();
                setEditorCollapsed(true);
              }
            }}
            title={editorCollapsed ? "Show editor" : "Hide editor"}
            className="h-8 w-8 text-muted-foreground"
          >
            {editorCollapsed
              ? <PanelLeftOpen className="w-4 h-4" />
              : <PanelLeftClose className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (panelCollapsed) {
                rightPanelRef.current?.expand();
                setPanelCollapsed(false);
              } else {
                rightPanelRef.current?.collapse();
                setPanelCollapsed(true);
              }
            }}
            title={panelCollapsed ? "Show policy panel" : "Hide policy panel"}
            className="h-8 w-8 text-muted-foreground"
          >
            {panelCollapsed
              ? <PanelRightOpen className="w-4 h-4" />
              : <PanelRightClose className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="text-xs h-8">
            <Download className="w-3 h-3 mr-1.5" /> Export
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs h-8">
            {saving ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Save className="w-3 h-3 mr-1.5" />}
            Save
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">

          {/* Editor panel */}
          <Panel
            ref={editorPanelRef}
            defaultSize={65}
            minSize={20}
            collapsible
            collapsedSize={0}
            onCollapse={() => setEditorCollapsed(true)}
            onExpand={() => setEditorCollapsed(false)}
          >
            <div className="h-full overflow-hidden">
              <CodeEditor
                project={localProject}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onCodeChange={handleCodeChange}
              />
            </div>
          </Panel>

          {/* Drag handle */}
          <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary/40 transition-colors cursor-col-resize flex-shrink-0" />

          {/* Right panel */}
          <Panel
            ref={rightPanelRef}
            defaultSize={35}
            minSize={20}
            collapsible
            collapsedSize={0}
            onCollapse={() => setPanelCollapsed(true)}
            onExpand={() => setPanelCollapsed(false)}
          >
            <div className="h-full bg-card flex flex-col overflow-hidden">
              <Tabs value={rightPanel} onValueChange={setRightPanel} className="flex flex-col h-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 px-2 h-10 flex-shrink-0">
                  <TabsTrigger value="policy" className="gap-1.5 text-xs data-[state=active]:bg-background">
                    <Shield className="w-3 h-3" /> Policy
                  </TabsTrigger>
                  <TabsTrigger value="evidence" className="gap-1.5 text-xs data-[state=active]:bg-background">
                    <Package className="w-3 h-3" /> Evidence
                  </TabsTrigger>
                  <TabsTrigger value="properties" className="gap-1.5 text-xs data-[state=active]:bg-background">
                    <Settings2 className="w-3 h-3" /> Properties
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="policy" className="flex-1 mt-0 min-h-0">
                  <PolicyPanel checkResults={checkResults} score={score} onReEvaluate={handleReEvaluate} />
                </TabsContent>
                <TabsContent value="evidence" className="flex-1 mt-0 overflow-auto min-h-0">
                  <EvidencePack project={localProject} checkResults={checkResults} />
                </TabsContent>
                <TabsContent value="properties" className="flex-1 mt-0 overflow-auto min-h-0">
                  <ProjectProperties project={localProject} onChange={handlePropertyChange} />
                </TabsContent>
              </Tabs>
            </div>
          </Panel>

        </PanelGroup>
      </div>
    </div>
  );
}

function getExtension(type) {
  switch(type) {
    case "Python": return ".py";
    case "Ansible Playbook": return ".yml";
    case "PowerShell": return ".ps1";
    case "Bash": return ".sh";
    default: return ".txt";
  }
}

function ProjectProperties({ project, onChange }) {
  if (!project) return null;
  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-muted-foreground">
        Changes here re-run policy checks immediately and are saved with the project.
      </p>

      <div className="space-y-1.5">
        <Label className="text-xs">Project Name</Label>
        <Input
          value={project.name || ""}
          onChange={e => onChange("name", e.target.value)}
          className="h-8 text-xs font-mono"
          placeholder="domain-action-target"
        />
        <p className="text-[10px] text-muted-foreground">Format: domain-action-target (e.g. linux-apply-ntp-config)</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Automation Type</Label>
        <Select value={project.automation_type || ""} onValueChange={v => onChange("automation_type", v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {["Configuration", "Operational", "SLA Related", "Troubleshooting", "Approvals Needed", "One Time Only", "Legacy"].map(t => (
              <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Risk Classification</Label>
        <Select value={project.risk_tier || ""} onValueChange={v => onChange("risk_tier", v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Standard" className="text-xs">Standard</SelectItem>
            <SelectItem value="High-Risk" className="text-xs">High-Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Compliance Status</Label>
        <Select value={project.compliance_status || ""} onValueChange={v => onChange("compliance_status", v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Compliant" className="text-xs">Compliant</SelectItem>
            <SelectItem value="Non-Compliant" className="text-xs">Non-Compliant</SelectItem>
            <SelectItem value="Legacy" className="text-xs">Legacy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Technology Area</Label>
        <Input
          value={project.technology_area || ""}
          onChange={e => onChange("technology_area", e.target.value)}
          className="h-8 text-xs"
          placeholder="e.g. Linux, Windows, Network"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Testing Plan</Label>
        <Textarea
          value={project.testing_plan || ""}
          onChange={e => onChange("testing_plan", e.target.value)}
          className="text-xs resize-none min-h-[120px]"
          placeholder="Describe non-prod environment, parity dimensions, quality gates, end-to-end test evidence..."
        />
        <p className="text-[10px] text-muted-foreground">Drives Tested Before Production policy checks</p>
      </div>
    </div>
  );
}