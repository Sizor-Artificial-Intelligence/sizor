import React from "react";
import { ImageIcon, FileEdit } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export interface AbilitiesState {
  canAccessPortfolio: boolean;
  canCollectFormData: boolean;
  formId: string;
}

interface AbilitiesTabProps {
  value: AbilitiesState;
  onChange: (v: AbilitiesState) => void;
  availableForms?: Array<{ id: string; name: string }>;
}

const ABILITIES = [
  {
    id: "canAccessPortfolio",
    title: "Acceso a Portafolio",
    description:
      "El agente podrá consultar tu catálogo de productos o servicios: precios, descripciones, imágenes. Los usuarios podrán preguntar por productos específicos y recibir la información.",
    icon: ImageIcon,
  },
  {
    id: "canCollectFormData",
    title: "Recolección de Datos",
    description:
      "El agente recolectará información del usuario para llenar un formulario. Útil para cotizaciones, registros, encuestas o cuando necesites que el usuario proporcione datos estructurados.",
    icon: FileEdit,
  },
] as const;

export function AbilitiesTab({
  value,
  onChange,
  availableForms = [],
}: AbilitiesTabProps) {
  const toggleAbility = (key: "canAccessPortfolio" | "canCollectFormData", checked: boolean) => {
    onChange({
      ...value,
      [key]: checked,
      ...(key === "canCollectFormData" && !checked ? { formId: "" } : {}),
    });
  };

  const setFormId = (formId: string) => {
    onChange({ ...value, formId });
  };

  const baseCls =
    "rounded-xl border-2 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const checkedCls = "border-primary bg-muted";
  const uncheckedCls = "border-border bg-muted/50 hover:border-primary/50";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Activa las habilidades que quieres que tenga el agente.
      </p>

      <div className="space-y-3">
        {ABILITIES.map((ab) => {
          const isChecked =
            ab.id === "canAccessPortfolio"
              ? value.canAccessPortfolio
              : value.canCollectFormData;
          const Icon = ab.icon;

          return (
            <div key={ab.id}>
              <button
                type="button"
                onClick={() =>
                  toggleAbility(ab.id as "canAccessPortfolio" | "canCollectFormData", !isChecked)
                }
                className={cn(
                  "w-full text-left p-4 flex items-start gap-4",
                  baseCls,
                  isChecked ? checkedCls : uncheckedCls
                )}
              >
                <span className="flex h-10 w-10 shrink-0 rounded-lg bg-muted items-center justify-center text-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground mb-1">{ab.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {ab.description}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 relative h-6 w-10 rounded-full transition-colors flex items-center",
                    isChecked ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0.5 h-5 w-5 rounded-full bg-primary-foreground transition-transform",
                      isChecked ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </span>
              </button>

              {ab.id === "canCollectFormData" && value.canCollectFormData && (
                <div className="mt-3 ml-14 pl-4 border-l-2 border-border">
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Formulario
                  </label>
                  <Select
                    value={value.formId || ""}
                    onValueChange={setFormId}
                  >
                    <SelectTrigger
                      className="w-full max-w-xs bg-input border-border text-foreground [&>span]:text-foreground [&>span]:placeholder:text-muted-foreground"
                    >
                      <SelectValue placeholder="Seleccionar formulario..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableForms.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          No hay formularios disponibles
                        </div>
                      ) : (
                        availableForms.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {availableForms.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Crea un formulario primero en la sección correspondiente.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
