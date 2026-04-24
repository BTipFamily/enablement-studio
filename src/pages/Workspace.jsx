import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, Download, Shield, Package, 
  ChevronLeft, Loader2, FolderOpen
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
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
  const [saving, setSaving] = useState(false);
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
      <div className="flex-1 flex overflow-hidden">
        {/* Code editor */}
        <div className="flex-1 border-r">
          <CodeEditor
            project={localProject}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onCodeChange={handleCodeChange}
          />
        </div>

        {/* Right panel */}
        <div className="w-80 flex-shrink-0 bg-card flex flex-col">
          <Tabs value={rightPanel} onValueChange={setRightPanel} className="flex flex-col h-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 px-2 h-10">
              <TabsTrigger value="policy" className="gap-1.5 text-xs data-[state=active]:bg-background">
                <Shield className="w-3 h-3" /> Policy
              </TabsTrigger>
              <TabsTrigger value="evidence" className="gap-1.5 text-xs data-[state=active]:bg-background">
                <Package className="w-3 h-3" /> Evidence
              </TabsTrigger>
            </TabsList>
            <TabsContent value="policy" className="flex-1 mt-0">
              <PolicyPanel checkResults={checkResults} score={score} />
            </TabsContent>
            <TabsContent value="evidence" className="flex-1 mt-0 overflow-auto">
              <EvidencePack project={localProject} checkResults={checkResults} />
            </TabsContent>
          </Tabs>
        </div>
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