import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, Eye, Wrench, ChevronRight, CheckCircle, XCircle, 
  AlertTriangle, BookOpen, Settings, FileText, ChevronDown, ChevronUp,
  RefreshCw, GitBranch, Clock, AlertCircle, CheckCircle2, Copy, Check, FileCode
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AUTHOR_STANDARDS, NON_AUTHOR_ITEMS } from "@/lib/standards-data";
import { useStandardsSync } from "@/hooks/use-standards-sync";
import CategoryBadge from "@/components/shared/CategoryBadge";
import { REFERENCE_EXAMPLES } from "@/lib/reference-examples";

function StandardDetail({ standard, enriched }) {
  const [viewMode, setViewMode] = useState("what");
  const [openExample, setOpenExample] = useState(null);
  const [copied, setCopied] = useState(false);

  const examples = REFERENCE_EXAMPLES[standard.slug] || [];

  const handleCopy = async () => {
    if (!openExample?.content) return;
    try {
      await navigator.clipboard.writeText(openExample.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — no-op
    }
  };

  // Use repo-fetched standard statement if available, fall back to static
  const standardStatement = enriched?.standard_statement || standard.standard_statement;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold">{standard.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">Layer {standard.classification_layer} · {standard.applies_to}</p>
          </div>
          <div className="flex items-center gap-2">
            <CategoryBadge category={standard.category} />
            <Badge variant="secondary">{standard.status}</Badge>
            {enriched && (
              <Badge variant="outline" className="text-[10px] gap-1 text-success border-success/30">
                <CheckCircle2 className="w-3 h-3" />
                Repo synced
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm leading-relaxed">{standard.purpose}</p>
      </div>

      {/* WHAT vs HOW toggle */}
      <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
        <TabsList className="w-full grid grid-cols-2 max-w-xs">
          <TabsTrigger value="what" className="gap-2">
            <Eye className="w-3.5 h-3.5" /> WHAT
          </TabsTrigger>
          <TabsTrigger value="how" className="gap-2">
            <Wrench className="w-3.5 h-3.5" /> HOW
          </TabsTrigger>
        </TabsList>

        <TabsContent value="what" className="mt-4 space-y-5">
          {/* Standard Statement */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-primary mb-1">STANDARD STATEMENT</p>
              <p className="text-sm font-medium">{standardStatement}</p>
            </CardContent>
          </Card>

          {/* Author Obligations */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              What You Must Build
            </h3>
            <div className="space-y-2">
              {standard.author_obligations.map((ob, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{ob}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Approval Gates */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              What Will Block Production
            </h3>
            <div className="space-y-2">
              {standard.approval_gate_requirements.map((req, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-warning/5 border border-warning/10">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Controls */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-chart-2" />
              What The Platform Handles
            </h3>
            <div className="space-y-2">
              {standard.platform_controls.map((ctrl, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-chart-2/5 border border-chart-2/10">
                  <Settings className="w-4 h-4 text-chart-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{ctrl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Review Checklist */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Review Checklist
            </h3>
            <div className="space-y-1.5">
              {standard.review_checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 text-sm">
                  <div className="w-4 h-4 rounded border-2 border-muted-foreground/30 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="how" className="mt-4 space-y-5">
          {/* Reference Implementations — clickable, copy-able code examples */}
          {examples.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-chart-5" />
                Reference Implementations
              </h3>
              <p className="text-xs text-muted-foreground mb-3">Click any example to view and copy</p>
              <div className="space-y-2">
                {examples.map(example => (
                  <button
                    key={example.id}
                    onClick={() => setOpenExample(example)}
                    className="w-full text-left p-3 rounded-lg border border-chart-5/20 bg-chart-5/5 hover:border-chart-5/50 hover:bg-chart-5/10 transition-all flex items-start gap-3 group"
                  >
                    <FileCode className="w-4 h-4 text-chart-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{example.title}</span>
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">{example.language}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{example.description}</p>
                      <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">{example.filename}</p>
                    </div>
                    <Copy className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground flex-shrink-0 mt-1 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Named Template References */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Named Template References
            </h3>
            <div className="space-y-2">
              {standard.template_references.map((ref, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-mono text-muted-foreground">{ref}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Anti-Patterns */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              Anti-Patterns (What NOT to Do)
            </h3>
            <div className="space-y-2">
              {standard.anti_patterns.map((ap, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                  <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{ap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Related Standards */}
          {standard.related_standards?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Related Standards</h3>
              <div className="flex flex-wrap gap-2">
                {standard.related_standards.map(slug => {
                  const related = AUTHOR_STANDARDS.find(s => s.slug === slug);
                  return related ? (
                    <Badge key={slug} variant="outline" className="text-xs">{related.name}</Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Code Viewer Sheet */}
      <Sheet open={!!openExample} onOpenChange={() => { setOpenExample(null); setCopied(false); }}>
        <SheetContent side="right" className="w-[92vw] sm:w-[680px] sm:max-w-[680px] flex flex-col p-0 gap-0">
          <SheetHeader className="p-5 border-b flex-shrink-0">
            <SheetTitle className="text-base leading-snug pr-8">{openExample?.title}</SheetTitle>
            <SheetDescription className="text-xs mt-1 leading-snug">{openExample?.description}</SheetDescription>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline" className="font-mono text-[10px] px-2">{openExample?.language}</Badge>
              <Badge variant="outline" className="font-mono text-[10px] px-2">{openExample?.filename}</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="ml-auto h-7 text-xs gap-1.5"
              >
                {copied
                  ? <><Check className="w-3 h-3 text-green-500" />Copied!</>
                  : <><Copy className="w-3 h-3" />Copy</>}
              </Button>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <pre className="p-5 text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
              <code>{openExample?.content}</code>
            </pre>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}

export default function Standards() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialStandard = urlParams.get("standard");
  const [selectedSlug, setSelectedSlug] = useState(initialStandard || AUTHOR_STANDARDS[0].slug);
  const [showNonAuthor, setShowNonAuthor] = useState(false);
  const [showRepoConfig, setShowRepoConfig] = useState(false);

  const {
    config,
    setConfig,
    saveConfig,
    sync,
    syncing,
    lastSyncedAt,
    syncError,
    enrichedStandards,
    isConfigured,
  } = useStandardsSync();

  const selectedStandard = AUTHOR_STANDARDS.find(s => s.slug === selectedSlug) || AUTHOR_STANDARDS[0];

  const formatSyncTime = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Standards Registry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            7 consolidated author standards — what you must build into your automation
          </p>
        </div>
        {/* Sync status badge */}
        <div className="flex items-center gap-2">
          {enrichedStandards && (
            <Badge variant="outline" className="text-[10px] gap-1 text-success border-success/30">
              <CheckCircle2 className="w-3 h-3" />
              Repo synced
            </Badge>
          )}
          {lastSyncedAt && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatSyncTime(lastSyncedAt)}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRepoConfig(!showRepoConfig)}
            className="h-8 text-xs gap-1.5"
          >
            <GitBranch className="w-3.5 h-3.5" />
            Repo source
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={sync}
            disabled={syncing || !isConfigured}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync now"}
          </Button>
        </div>
      </div>

      {/* Repo configuration panel */}
      <AnimatePresence>
        {showRepoConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <Card className="border-primary/20 bg-primary/3">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-primary" />
                      Standards Repository Source
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Point this app to the Git repository containing your layer4-standards Markdown files.
                      The app will auto-fetch updated content and use it in policy descriptions.
                    </p>
                  </div>
                </div>

                {syncError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-xs text-destructive">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {syncError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Provider</Label>
                    <select
                      value={config.provider}
                      onChange={e => setConfig({ provider: e.target.value })}
                      className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="github">GitHub</option>
                      <option value="azuredevops">Azure DevOps</option>
                      <option value="gitlab">GitLab</option>
                      <option value="raw">Raw URL</option>
                    </select>
                  </div>

                  {config.provider === "github" && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs">GitHub Owner / Org</Label>
                        <Input
                          value={config.githubOwner}
                          onChange={e => setConfig({ githubOwner: e.target.value })}
                          placeholder="e.g. my-org"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Repository Name</Label>
                        <Input
                          value={config.githubRepo}
                          onChange={e => setConfig({ githubRepo: e.target.value })}
                          placeholder="e.g. 13731_Automation_Framework"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Branch</Label>
                        <Input
                          value={config.githubBranch}
                          onChange={e => setConfig({ githubBranch: e.target.value })}
                          placeholder="main"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Standards Folder Path</Label>
                        <Input
                          value={config.githubFolderPath}
                          onChange={e => setConfig({ githubFolderPath: e.target.value })}
                          placeholder="layer4-standards"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Personal Access Token (private repos)</Label>
                        <Input
                          type="password"
                          value={config.githubToken}
                          onChange={e => setConfig({ githubToken: e.target.value })}
                          placeholder="ghp_… (stored in browser only)"
                          className="h-9 text-sm"
                        />
                      </div>
                    </>
                  )}

                  {config.provider === "gitlab" && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs">GitLab Project ID</Label>
                        <Input
                          value={config.gitlabProjectId}
                          onChange={e => setConfig({ gitlabProjectId: e.target.value })}
                          placeholder="e.g. 12345678"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Branch</Label>
                        <Input
                          value={config.gitlabBranch}
                          onChange={e => setConfig({ gitlabBranch: e.target.value })}
                          placeholder="main"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Standards Folder Path</Label>
                        <Input
                          value={config.gitlabFolderPath}
                          onChange={e => setConfig({ gitlabFolderPath: e.target.value })}
                          placeholder="layer4-standards"
                          className="h-9 text-sm"
                        />
                      </div>
                    </>
                  )}

                  {config.provider === "azuredevops" && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Organization</Label>
                        <Input
                          value={config.adoOrganization}
                          onChange={e => setConfig({ adoOrganization: e.target.value })}
                          placeholder="e.g. my-org"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Project</Label>
                        <Input
                          value={config.adoProject}
                          onChange={e => setConfig({ adoProject: e.target.value })}
                          placeholder="e.g. Automation Framework"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Repository Name</Label>
                        <Input
                          value={config.adoRepo}
                          onChange={e => setConfig({ adoRepo: e.target.value })}
                          placeholder="e.g. 13731_Automation_Framework"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Branch</Label>
                        <Input
                          value={config.adoBranch}
                          onChange={e => setConfig({ adoBranch: e.target.value })}
                          placeholder="main"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Standards Folder Path</Label>
                        <Input
                          value={config.adoFolderPath}
                          onChange={e => setConfig({ adoFolderPath: e.target.value })}
                          placeholder="layer4-standards"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Personal Access Token</Label>
                        <Input
                          type="password"
                          value={config.adoToken}
                          onChange={e => setConfig({ adoToken: e.target.value })}
                          placeholder="ADO PAT (stored in browser only)"
                          className="h-9 text-sm"
                        />
                      </div>
                    </>
                  )}

                  {config.provider === "raw" && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">Base URL (files will be appended)</Label>
                      <Input
                        value={config.rawBaseUrl}
                        onChange={e => setConfig({ rawBaseUrl: e.target.value })}
                        placeholder="https://example.com/standards"
                        className="h-9 text-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => { saveConfig(); setShowRepoConfig(false); }}
                    className="text-xs h-8"
                  >
                    Save & Close
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { saveConfig(); sync(); }}
                    disabled={syncing || !isConfigured}
                    className="text-xs h-8 gap-1.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
                    Save & Sync
                  </Button>
                  <p className="text-xs text-muted-foreground ml-1">
                    Cached for 4 hours · auto-refreshed on each visit when stale
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Standards list */}
        <div className="lg:col-span-4 space-y-4">
          <div className="space-y-1.5">
            {AUTHOR_STANDARDS.map((std, i) => (
              <button
                key={std.slug}
                onClick={() => setSelectedSlug(std.slug)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                  selectedSlug === std.slug 
                    ? "bg-primary/10 border border-primary/20" 
                    : "hover:bg-muted/50 border border-transparent"
                }`}
              >
                <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${
                  selectedSlug === std.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${selectedSlug === std.slug ? "text-primary" : ""}`}>
                    {std.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{std.author_obligations.length} obligations</p>
                </div>
                <ChevronRight className={`w-4 h-4 flex-shrink-0 ${selectedSlug === std.slug ? "text-primary" : "text-muted-foreground/50"}`} />
              </button>
            ))}
          </div>

          <Separator />

          {/* Non-Author Items */}
          <button
            onClick={() => setShowNonAuthor(!showNonAuthor)}
            className="w-full flex items-center justify-between p-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="font-medium">What's NOT an Author Standard</span>
            {showNonAuthor ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          <AnimatePresence>
            {showNonAuthor && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4"
              >
                <div className="p-3 rounded-lg bg-chart-2/5 border border-chart-2/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-3.5 h-3.5 text-chart-2" />
                    <p className="text-xs font-semibold text-chart-2">Platform Enforcement</p>
                  </div>
                  <ul className="space-y-1">
                    {NON_AUTHOR_ITEMS.platform_enforcement.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground">• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-chart-5/5 border border-chart-5/10">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-chart-5" />
                    <p className="text-xs font-semibold text-chart-5">Template Requirements</p>
                  </div>
                  <ul className="space-y-1">
                    {NON_AUTHOR_ITEMS.template_requirements.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground">• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs font-semibold">Guidance (Not Mandatory)</p>
                  </div>
                  <ul className="space-y-1">
                    {NON_AUTHOR_ITEMS.guidance.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground">• {item}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Standard detail */}
        <div className="lg:col-span-8">
          <Card>
            <CardContent className="p-6">
              <StandardDetail
                standard={selectedStandard}
                enriched={enrichedStandards?.[selectedStandard.slug] ?? null}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}