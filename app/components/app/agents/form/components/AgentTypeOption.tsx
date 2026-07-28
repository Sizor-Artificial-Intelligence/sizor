import React from "react";
import { cn } from "~/lib/utils";

interface AgentTypeOptionProps {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  icon?: React.ReactNode;
}

export function AgentTypeOption({
  title,
  description,
  selected,
  onSelect,
  icon,
}: AgentTypeOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-primary bg-muted"
          : "border-border bg-muted/50 hover:border-primary/50 hover:bg-muted",
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground">
            {icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <span
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
            selected ? "border-primary bg-primary" : "border-muted-foreground/50",
          )}
        >
          {selected && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground" aria-hidden />
          )}
        </span>
      </div>
    </button>
  );
}
