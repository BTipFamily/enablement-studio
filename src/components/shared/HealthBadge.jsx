import React from "react";
import { cn } from "@/lib/utils";

const statusConfig = {
  green: { label: "Passing", bg: "bg-success/10", text: "text-success", border: "border-success/30", dot: "bg-success" },
  amber: { label: "Warnings", bg: "bg-warning/10", text: "text-warning", border: "border-warning/30", dot: "bg-warning" },
  red: { label: "Failing", bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30", dot: "bg-destructive" },
};

export default function HealthBadge({ status, score, className }) {
  const config = statusConfig[status] || statusConfig.red;
  
  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full border", config.bg, config.border, className)}>
      <div className={cn("w-2 h-2 rounded-full animate-pulse", config.dot)} />
      <span className={cn("text-xs font-semibold", config.text)}>
        {score !== undefined ? `${score}%` : config.label}
      </span>
    </div>
  );
}