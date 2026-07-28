import React, { useState, useRef } from "react";
import { Plus, Trash2, FileSpreadsheet } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import useToast from "~/hooks/useToast";
import { QAImportExcelModal } from "./QAImportExcelModal";

export interface QARule {
  trigger: string;
  response: string;
}

interface QATabProps {
  value: QARule[];
  onChange: (rules: QARule[]) => void;
}

const inputCls =
  "rounded-md bg-input border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring text-sm px-2.5 py-1.5";

export function QATab({ value, onChange }: QATabProps) {
  const rules = value ?? [];
  const [newTrigger, setNewTrigger] = useState("");
  const [newResponse, setNewResponse] = useState("");
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const triggerRef = useRef<HTMLInputElement>(null);

  const handleExcelImport = (imported: QARule[]) => {
    onChange([...rules, ...imported]);
    setIsExcelModalOpen(false);
    if (imported.length > 0) {
      useToast({
        icon: "success",
        title: `Se importaron ${imported.length} pregunta${imported.length !== 1 ? "s" : ""} y respuesta${imported.length !== 1 ? "s" : ""}.`,
      });
    }
  };

  const addFromForm = () => {
    const t = newTrigger.trim();
    const r = newResponse.trim();
    if (!t || !r) return;
    onChange([...rules, { trigger: t, response: r }]);
    setNewTrigger("");
    setNewResponse("");
    triggerRef.current?.focus();
  };

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  const updateRule = (
    index: number,
    field: "trigger" | "response",
    val: string,
  ) => {
    onChange(rules.map((r, i) => (i === index ? { ...r, [field]: val } : r)));
  };

  const handleKeyDown = (e: React.KeyboardEvent, index?: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (index === undefined) addFromForm();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-white/80">
          Escribe la pregunta y la respuesta, luego haz clic en + o Enter.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsExcelModalOpen(true)}
          className="cursor-pointer text-xs h-7 px-2 !bg-transparent border-border text-foreground hover:!bg-muted"
        >
          <FileSpreadsheet className="h-3 w-3 mr-1" aria-hidden />
          Subir Excel
        </Button>
      </div>

      <QAImportExcelModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImport={handleExcelImport}
      />

      {/* Barra rápida: agregar en un solo paso */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <Input
          ref={triggerRef}
          value={newTrigger}
          onChange={(e) => setNewTrigger(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e)}
          placeholder="Pregunta o palabras clave..."
          className={cn(inputCls, "flex-1 min-w-0")}
        />
        <Input
          value={newResponse}
          onChange={(e) => setNewResponse(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e)}
          placeholder="Respuesta..."
          className={cn(inputCls, "flex-1 min-w-0")}
        />
        <Button
          type="button"
          size="sm"
          onClick={addFromForm}
          disabled={!newTrigger.trim() || !newResponse.trim()}
          className="cursor-pointer bg-white text-black hover:bg-white/90 h-8 px-3 shrink-0 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {/* Lista compacta */}
      <div className="space-y-1.5">
        {rules.length === 0 ? (
          <p className="text-xs text-white/50 py-2">
            Sin entradas. Usa los campos de arriba para agregar.
          </p>
        ) : (
          rules.map((rule, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md bg-white/5 border border-white/15 px-2 py-1.5 hover:border-white/25 group"
            >
              <Input
                value={rule.trigger}
                onChange={(e) => updateRule(index, "trigger", e.target.value)}
                placeholder="Pregunta"
                className={cn(
                  inputCls,
                  "flex-1 min-w-0 h-7 text-xs border-0 bg-transparent focus-visible:ring-1",
                )}
              />
              <span className="text-white/30 shrink-0">→</span>
              <Input
                value={rule.response}
                onChange={(e) => updateRule(index, "response", e.target.value)}
                placeholder="Respuesta"
                className={cn(
                  inputCls,
                  "flex-1 min-w-0 h-7 text-xs border-0 bg-transparent focus-visible:ring-1",
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRule(index)}
                className="h-6 w-6 shrink-0 text-white/50 hover:text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Eliminar"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
