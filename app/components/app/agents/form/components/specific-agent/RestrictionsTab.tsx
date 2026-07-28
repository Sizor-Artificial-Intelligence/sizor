import React, { useState, useRef, useEffect } from "react";
import { AlertTriangle, UserPlus, Trash2, Shield, X } from "lucide-react";
import { Textarea } from "~/components/ui/textarea";

export interface RestrictionsState {
  limitations: string[];
  escalationRules: string[];
}

interface RestrictionsTabProps {
  value: RestrictionsState;
  onChange: (v: RestrictionsState) => void;
  forceTheme?: "dark";
}

function parseItems(text: string): string[] {
  return text
    .split(/[,;\n]+/)
    .map((s) => s)
    .filter((s) => s.trim() !== "");
}

const textareaCls =
  "rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background text-sm px-3 py-2.5 resize-y min-h-[80px]";

function TextareaListSection({
  title,
  description,
  icon: Icon,
  items,
  onChange,
  placeholder,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [rawText, setRawText] = useState(() => items.join(", "));
  const lastChangeFromTypingRef = useRef(false);

  useEffect(() => {
    if (lastChangeFromTypingRef.current) {
      lastChangeFromTypingRef.current = false;
      return;
    }
    setRawText(items.join(", "));
  }, [items]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    const next = parseItems(val);
    lastChangeFromTypingRef.current = true;
    onChange(next);
  };

  const removeItem = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange(next);
    setRawText(next.join(", "));
  };

  const parsed = parseItems(rawText);

  return (
    <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 rounded-lg bg-muted items-center justify-center text-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>

      <Textarea
        value={rawText}
        onChange={handleTextChange}
        placeholder={placeholder}
        className={textareaCls}
        rows={3}
      />

      {parsed.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {parsed.map((item, index) => (
            <span
              key={`${index}-${item}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-foreground text-sm border border-border"
            >
              <span className="truncate max-w-[200px]">{item}</span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="shrink-0 p-0.5 rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-red-500 cursor-pointer transition-colors"
                aria-label="Quitar"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function RestrictionsTab({
  value,
  onChange,
}: RestrictionsTabProps) {
  const limitations = value.limitations ?? [];
  const escalationRules = value.escalationRules ?? [];

  const setLimitations = (items: string[]) => {
    onChange({ ...value, limitations: items });
  };

  const setEscalationRules = (items: string[]) => {
    onChange({ ...value, escalationRules: items });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Shield className="h-5 w-5 shrink-0" />
        <p className="text-sm">
          Define limitaciones del agente y cuándo debe escalar la conversación a un humano. Escribe cada ítem separado por comas.
        </p>
      </div>

      <div className="space-y-4">
        <TextareaListSection
          title="Límites del Agente"
          description="Qué NO puede hacer el agente. Separa cada limitación con comas (o punto y coma / nueva línea)."
          icon={AlertTriangle}
          items={limitations}
          onChange={setLimitations}
          placeholder="Ej: No puede acceder a información financiera, No puede dar consejos legales, No puede modificar pedidos"
        />

        <TextareaListSection
          title="Escalar a un Humano"
          description="Situaciones en las que el agente debe transferir la conversación a una persona. Separa con comas."
          icon={UserPlus}
          items={escalationRules}
          onChange={setEscalationRules}
          placeholder="Ej: Si el cliente está molesto, Si pregunta por información confidencial, Si solicita hablar con supervisor"
        />
      </div>
    </div>
  );
}
