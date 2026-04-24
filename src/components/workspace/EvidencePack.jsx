import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, FileText, Database, ShieldAlert, Tag } from "lucide-react";
import { AUTHOR_STANDARDS } from "@/lib/standards-data";

export default function EvidencePack({ project, checkResults }) {
  if (!project) return null;

  const sections = [
    {
      title: "Classification & Metadata",
      icon: Tag,
      items: [
        { label: "Name", value: project.name },
        { label: "Type", value: project.automation_type },
        { label: "Technology", value: project.technology_area },
        { label: "Risk Tier", value: project.risk_tier },
        { label: "Status", value: project.status },
      ]
    },
    {
      title: "Structured Output Contract",
      icon: Database,
      items: [
        { label: "Format", value: "JSON structured output" },
        { label: "Fields", value: "run_id, timestamp, action, target, status, details" },
        { label: "Summary", value: "run_id, overall_status, start_time, end_time, total_actions" },
      ]
    },
    {
      title: "Test Evidence References",
      icon: FileText,
      items: [
        { label: "Testing Plan", value: project.testing_plan || "Not defined" },
        { label: "Environment Parity", value: project.testing_plan ? "Defined in plan" : "Not defined" },
      ]
    },
    {
      title: "Backout Evidence",
      icon: ShieldAlert,
      items: [
        { label: "Approach", value: project.backout_approach },
        { label: "Documentation", value: project.backout_content ? "Generated" : "Missing" },
      ]
    },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold">Evidence Pack</h3>
        <p className="text-xs text-muted-foreground">Structured artifact for approval and audit</p>
      </div>

      {sections.map((section, i) => (
        <Card key={i} className="bg-muted/30">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-2">
              <section.icon className="w-3.5 h-3.5 text-primary" />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {section.items.map((item, j) => (
              <div key={j} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-right max-w-[60%] truncate">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Standards Compliance Summary */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-primary" />
            Standards Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-1.5">
          {AUTHOR_STANDARDS.map(std => {
            const stdChecks = checkResults.filter(c => c.standard === std.slug);
            const passing = stdChecks.filter(c => c.passed).length;
            const total = stdChecks.length;
            const allPass = passing === total;
            return (
              <div key={std.slug} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  {allPass ? (
                    <CheckCircle className="w-3 h-3 text-success" />
                  ) : (
                    <XCircle className="w-3 h-3 text-destructive" />
                  )}
                  <span className="text-muted-foreground">{std.name}</span>
                </div>
                <Badge variant={allPass ? "secondary" : "destructive"} className="text-[10px]">
                  {passing}/{total}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}