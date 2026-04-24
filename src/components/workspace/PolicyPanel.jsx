import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import HealthBadge from "@/components/shared/HealthBadge";
import { AUTHOR_STANDARDS, getHealthStatus } from "@/lib/standards-data";

export default function PolicyPanel({ checkResults, score }) {
  const [expandedCheck, setExpandedCheck] = useState(null);

  const groupedChecks = {};
  checkResults.forEach(check => {
    if (!groupedChecks[check.standard]) groupedChecks[check.standard] = [];
    groupedChecks[check.standard].push(check);
  });

  const status = getHealthStatus(score);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Policy Checks</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {checkResults.filter(c => c.passed).length}/{checkResults.length} passing
          </p>
        </div>
        <HealthBadge status={status} score={score} />
      </div>

      {/* Checks */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {Object.entries(groupedChecks).map(([stdSlug, checks]) => {
            const standard = AUTHOR_STANDARDS.find(s => s.slug === stdSlug);
            const allPassing = checks.every(c => c.passed);
            return (
              <div key={stdSlug}>
                <div className="flex items-center gap-2 mb-2">
                  {allPassing ? (
                    <CheckCircle className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-destructive" />
                  )}
                  <span className="text-xs font-semibold">{standard?.name || stdSlug}</span>
                </div>
                <div className="space-y-1 ml-5">
                  {checks.map(check => (
                    <div key={check.id}>
                      <button
                        onClick={() => setExpandedCheck(expandedCheck === check.id ? null : check.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded text-xs transition-colors",
                          check.passed ? "hover:bg-success/5" : "bg-destructive/5 hover:bg-destructive/10"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {check.passed ? (
                            <CheckCircle className="w-3 h-3 text-success" />
                          ) : check.severity === "error" ? (
                            <XCircle className="w-3 h-3 text-destructive" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-warning" />
                          )}
                          <span className={check.passed ? "text-muted-foreground" : "font-medium"}>{check.name}</span>
                        </div>
                        {!check.passed && (
                          expandedCheck === check.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                      {expandedCheck === check.id && !check.passed && (
                        <div className="ml-5 p-2 text-xs space-y-2 border-l-2 border-destructive/20">
                          <div>
                            <span className="font-medium text-destructive">Why it matters: </span>
                            <span className="text-muted-foreground">{check.description}</span>
                          </div>
                          <div>
                            <span className="font-medium text-primary">How to fix: </span>
                            <span className="text-muted-foreground">{check.fix}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {check.severity === "error" ? "Hard Gate" : "Recommendation"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}