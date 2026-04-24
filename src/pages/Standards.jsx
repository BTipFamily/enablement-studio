import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, Eye, Wrench, ChevronRight, CheckCircle, XCircle, 
  AlertTriangle, BookOpen, Settings, FileText, ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AUTHOR_STANDARDS, NON_AUTHOR_ITEMS } from "@/lib/standards-data";
import CategoryBadge from "@/components/shared/CategoryBadge";

function StandardDetail({ standard }) {
  const [viewMode, setViewMode] = useState("what");

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
              <p className="text-sm font-medium">{standard.standard_statement}</p>
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
          {/* Templates */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-chart-5" />
              Templates & Patterns
            </h3>
            <div className="space-y-2">
              {standard.template_references.map((ref, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-chart-5/5 border border-chart-5/10">
                  <FileText className="w-4 h-4 text-chart-5 flex-shrink-0" />
                  <span className="text-sm font-mono">{ref}</span>
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
    </motion.div>
  );
}

export default function Standards() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialStandard = urlParams.get("standard");
  const [selectedSlug, setSelectedSlug] = useState(initialStandard || AUTHOR_STANDARDS[0].slug);
  const [showNonAuthor, setShowNonAuthor] = useState(false);

  const selectedStandard = AUTHOR_STANDARDS.find(s => s.slug === selectedSlug) || AUTHOR_STANDARDS[0];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Standards Registry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          7 consolidated author standards — what you must build into your automation
        </p>
      </div>

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
              <StandardDetail standard={selectedStandard} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}