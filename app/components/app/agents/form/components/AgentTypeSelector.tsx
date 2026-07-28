import React from "react";
import { Users, Bot } from "lucide-react";
import { AgentTypeOption } from "./AgentTypeOption";

export type AgentType = "multiagent" | "specific";

interface AgentTypeSelectorProps {
  value: AgentType | null;
  onChange: (type: AgentType) => void;
}

const OPTIONS: Array<{
  type: AgentType;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    type: "multiagent",
    title: "Multiagente",
    description:
      "Varios agentes especializados trabajando en un solo flujo. El sistema enruta al usuario al agente correcto según el tema (soporte, ventas, consultas generales, etc.). Ideal para equipos que quieren una única entrada con respuestas especializadas.",
    icon: <Users className="w-5 h-5" />,
  },
  {
    type: "specific",
    title: "Agente específico",
    description:
      "Un solo agente con un propósito e instrucciones definidas. Ideal cuando necesitas un asistente enfocado en una sola función: atención al cliente, ventas, información de productos, o un rol concreto sin enrutar a otros agentes.",
    icon: <Bot className="w-5 h-5" />,
  },
];

export function AgentTypeSelector({ value, onChange }: AgentTypeSelectorProps) {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-foreground mb-2">
        ¿Cómo quieres crear tu agente?
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Elige el tipo de agente que mejor se adapte a lo que necesitas. Esta
        decisión no podrá cambiarse después.
      </p>

      <div className="space-y-4">
        {OPTIONS.map((opt) => (
          <AgentTypeOption
            key={opt.type}
            title={opt.title}
            description={opt.description}
            selected={value === opt.type}
            onSelect={() => onChange(opt.type)}
            icon={opt.icon}
          />
        ))}
      </div>

      <p className="mt-6 text-xs text-amber-600 dark:text-amber-400/90 flex items-start gap-2">
        <span className="flex-shrink-0 mt-0.5" aria-hidden>
          ⚠
        </span>
        <span>
          Una vez elegida la opción y guardado el agente, no podrás cambiar el
          tipo (multiagente o agente específico) más adelante.
        </span>
      </p>
    </div>
  );
}
