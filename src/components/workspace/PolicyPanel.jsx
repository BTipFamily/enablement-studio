import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, Code2, RefreshCw, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import HealthBadge from "@/components/shared/HealthBadge";
import { AUTHOR_STANDARDS, getHealthStatus } from "@/lib/standards-data";

export default function PolicyPanel({ checkResults, score, onReEvaluate }) {
  const [expandedCheck, setExpandedCheck] = useState(null);

  const groupedChecks = {};
  checkResults.forEach(check => {
    if (!groupedChecks[check.standard]) groupedChecks[check.standard] = [];
    groupedChecks[check.standard].push(check);
  });

  const status = getHealthStatus(score);
  const failingCount = checkResults.filter(c => !c.passed).length;

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between gap-2 flex-shrink-0">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Policy Checks</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {checkResults.filter(c => c.passed).length}/{checkResults.length} passing
            {failingCount > 0 && <span className="text-destructive"> · {failingCount} failing</span>}
            <span className="text-muted-foreground/50"> · live</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <HealthBadge status={status} score={score} />
          <Button
            variant="ghost"
            size="icon"
            onClick={onReEvaluate}
            title="Re-evaluate checks"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Checks list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {Object.entries(groupedChecks).map(([stdSlug, checks]) => {
            const standard = AUTHOR_STANDARDS.find(s => s.slug === stdSlug);
            const allPassing = checks.every(c => c.passed);
            return (
              <div key={stdSlug}>
                <div className="flex items-center gap-2 mb-2">
                  {allPassing ? (
                    <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                  )}
                  <span className="text-xs font-semibold truncate">{standard?.name || stdSlug}</span>
                </div>

                <div className="space-y-1 ml-5">
                  {checks.map(check => (
                    <div key={check.id}>
                      <button
                        onClick={() => setExpandedCheck(expandedCheck === check.id ? null : check.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded text-xs transition-colors",
                          check.passed
                            ? "hover:bg-success/5"
                            : "bg-destructive/5 hover:bg-destructive/10"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {check.passed ? (
                            <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
                          ) : check.severity === "error" ? (
                            <XCircle className="w-3 h-3 text-destructive flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" />
                          )}
                          <span className={cn("truncate", check.passed ? "text-muted-foreground" : "font-medium")}>
                            {check.name}
                          </span>
                        </div>
                        {!check.passed && (
                          expandedCheck === check.id
                            ? <ChevronUp className="w-3 h-3 flex-shrink-0" />
                            : <ChevronDown className="w-3 h-3 flex-shrink-0" />
                        )}
                      </button>

                      {expandedCheck === check.id && !check.passed && (
                        <div className="ml-5 mt-1 mb-2 text-xs space-y-3 border-l-2 border-destructive/25 pl-3">

                          {/* Why it matters */}
                          <div>
                            <p className="font-semibold text-destructive/80 mb-1">Why it matters</p>
                            <p className="text-muted-foreground leading-relaxed">{check.description}</p>
                          </div>

                          {/* Violation context */}
                          {check.violations && (
                            <ViolationBlock violations={check.violations} />
                          )}

                          {/* How to fix */}
                          <div>
                            <p className="font-semibold text-primary mb-1">How to fix</p>
                            <p className="text-muted-foreground leading-relaxed">{check.fix}</p>
                          </div>

                          {/* Fix snippet */}
                          {check.fixSnippet && (
                            <div>
                              <p className="font-semibold text-primary mb-1.5 flex items-center gap-1">
                                <Code2 className="w-3 h-3" /> Fix example
                              </p>
                              <pre className="bg-muted border border-border rounded p-2.5 overflow-x-auto text-[10px] leading-relaxed whitespace-pre">
                                <code>{check.fixSnippet}</code>
                              </pre>
                            </div>
                          )}

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

function ViolationBlock({ violations }) {
  if (!violations) return null;

  if (violations.type === "offending" && violations.lines?.length > 0) {
    return (
      <div>
        <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1">
          <Code2 className="w-3 h-3" /> Non-compliant code detected
        </p>
        <pre className="bg-destructive/8 border border-destructive/25 rounded p-2 overflow-x-auto text-[10px] leading-relaxed">
          {violations.lines.map(l => (
            <div key={l.lineNum} className="flex gap-2 items-baseline">
              <span className="select-none text-muted-foreground/50 w-5 text-right flex-shrink-0">{l.lineNum}</span>
              <span className="text-destructive">{l.content}</span>
            </div>
          ))}
        </pre>
      </div>
    );
  }

  if (violations.type === "project") {
    return (
      <div>
        <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1">
          <FolderOpen className="w-3 h-3" /> Project field: <code className="font-mono">{violations.field}</code>
        </p>
        <pre className="bg-muted/60 border border-border rounded p-2 overflow-x-auto text-[10px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {violations.value || "(not set)"}
        </pre>
      </div>
    );
  }

  if (violations.type === "missing") {
    return (
      <div>
        <p className="font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
          <Code2 className="w-3 h-3" /> Required pattern not found in code
        </p>
        {violations.lines?.length > 0 && (
          <>
            <p className="text-muted-foreground/60 mb-1 text-[10px]">Related lines (check this area):</p>
            <pre className="bg-muted/40 border border-border/60 rounded p-2 overflow-x-auto text-[10px] leading-relaxed opacity-80">
              {violations.lines.map(l => (
                <div key={l.lineNum} className="flex gap-2 items-baseline">
                  <span className="select-none text-muted-foreground/50 w-5 text-right flex-shrink-0">{l.lineNum}</span>
                  <span>{l.content}</span>
                </div>
              ))}
            </pre>
          </>
        )}
        {!violations.lines?.length && (
          <p className="text-muted-foreground/60 text-[10px] italic">No matching keywords found — pattern is entirely absent</p>
        )}
      </div>
    );
  }

  return null;
}