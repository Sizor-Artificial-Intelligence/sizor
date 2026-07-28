import React from "react";
import { Input } from "~/components/ui/input";

interface AgentNameStepProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AgentNameStep({
  value,
  onChange,
  placeholder = "Ej: Soporte, Ventas, Asistente general…",
}: AgentNameStepProps) {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Nombre del agente
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Elige un nombre que identifique claramente a este agente.
      </p>
      <div className="space-y-2">
        <label htmlFor="agent-name" className="text-sm font-medium text-foreground block">
          Nombre
        </label>
        <Input
          id="agent-name"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-input border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
          autoFocus
        />
      </div>
    </div>
  );
}
