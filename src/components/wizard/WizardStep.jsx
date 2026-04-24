import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export default function WizardStep({ step, currentStep, totalSteps, label }) {
  const isComplete = currentStep > step;
  const isCurrent = currentStep === step;

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
        isComplete && "bg-success text-success-foreground",
        isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
        !isComplete && !isCurrent && "bg-muted text-muted-foreground"
      )}>
        {isComplete ? <Check className="w-4 h-4" /> : step}
      </div>
      <span className={cn(
        "text-xs font-medium hidden sm:inline",
        isCurrent ? "text-foreground" : "text-muted-foreground"
      )}>
        {label}
      </span>
      {step < totalSteps && (
        <div className={cn(
          "h-px w-6 mx-1",
          isComplete ? "bg-success" : "bg-border"
        )} />
      )}
    </div>
  );
}