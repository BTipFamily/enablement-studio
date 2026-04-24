import React from "react";
import { cn } from "@/lib/utils";
import { Shield, Settings, CheckCircle, FileText, BookOpen } from "lucide-react";

const categoryConfig = {
  "Author Standard": { icon: Shield, bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  "Platform Enforcement": { icon: Settings, bg: "bg-chart-2/10", text: "text-chart-2", border: "border-chart-2/20" },
  "Approval Gate": { icon: CheckCircle, bg: "bg-warning/10", text: "text-warning", border: "border-warning/20" },
  "Template Requirement": { icon: FileText, bg: "bg-chart-5/10", text: "text-chart-5", border: "border-chart-5/20" },
  "Guidance": { icon: BookOpen, bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
};

export default function CategoryBadge({ category, className }) {
  const config = categoryConfig[category] || categoryConfig["Guidance"];
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border",
      config.bg, config.text, config.border, className
    )}>
      <Icon className="w-3 h-3" />
      {category}
    </span>
  );
}