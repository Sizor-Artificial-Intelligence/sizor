import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  forwardRef,
} from "react";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import useToast from "~/hooks/useToast";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { BasicInfoTab, type ResponseMode } from "./specific-agent/BasicInfoTab";
import { QATab } from "./specific-agent/QATab";
import {
  AbilitiesTab,
  type AbilitiesState,
} from "./specific-agent/AbilitiesTab";
import {
  KnowledgeTab,
  type KnowledgeState,
} from "./specific-agent/KnowledgeTab";
import {
  RestrictionsTab,
  type RestrictionsState,
} from "./specific-agent/RestrictionsTab";

export type SpecificAgentTabId =
  | "basic"
  | "qa"
  | "abilities"
  | "knowledge"
  | "restrictions";

const TAB_LABELS: Record<SpecificAgentTabId, string> = {
  basic: "Información básica",
  qa: "Preguntas y respuestas",
  abilities: "Habilidades",
  knowledge: "Base de conocimiento",
  restrictions: "Restricciones y seguridad",
};

export interface SpecificAgentFormData {
  name: string;
  responseMode: ResponseMode;
  instructions: string;
  trainingRules: Array<{ trigger: string; response: string }>;
  abilities: AbilitiesState;
  knowledge: KnowledgeState;
  restrictions: RestrictionsState;
}

/** Datos del agente cargado para edición (incluye relaciones de getAgent) */
export interface SpecificAgentInitialData {
  name: string;
  instructions?: string | null;
  responseMode?: string | null;
  canAccessPortfolio?: boolean;
  canCollectFormData?: boolean;
  formId?: string | null;
  limitations?: string | null;
  escalationRules?: string | null;
  TrainingRules?: Array<{ trigger: string; response: string }>;
  TrainingFolders?: Array<{ folderId: string; folder?: { id: string; name: string } }>;
  TrainingFiles?: Array<{ fileId: string; file?: { id: string; name: string; fileName?: string; fileType?: string } }>;
}

interface SpecificAgentFormContentProps {
  initialName?: string;
  /** Datos del agente para pre-rellenar al editar */
  initialData?: SpecificAgentInitialData | null;
  availableForms?: Array<{ id: string; name: string }>;
  availableFolders?: Array<{ id: string; name: string; fullPath?: string }>;
  availableFiles?: Array<{
    id: string;
    name: string;
    fileName: string;
    fileType: string;
    fullPath?: string;
  }>;
  onSave?: (data: SpecificAgentFormData) => void;
  isSubmitting?: boolean;
}

export interface SpecificAgentFormContentRef {
  save: () => void;
}

export const SpecificAgentFormContent = forwardRef<
  SpecificAgentFormContentRef,
  SpecificAgentFormContentProps
>(function SpecificAgentFormContent({
  initialName = "",
  initialData,
  availableForms = [],
  availableFolders = [],
  availableFiles = [],
  onSave,
  isSubmitting = false,
}, ref) {
  const parsedData = useMemo(() => {
    if (!initialData) return null;
    let limitations: string[] = [];
    let escalationRules: string[] = [];
    try {
      if (initialData.limitations && initialData.limitations !== "[]") {
        const p = JSON.parse(initialData.limitations);
        limitations = Array.isArray(p) ? p.filter((x: unknown) => typeof x === "string") : [];
      }
    } catch {}
    try {
      if (initialData.escalationRules && initialData.escalationRules !== "[]") {
        const p = JSON.parse(initialData.escalationRules);
        escalationRules = Array.isArray(p) ? p.filter((x: unknown) => typeof x === "string") : [];
      }
    } catch {}
    return {
      name: initialData.name ?? "",
      responseMode: (initialData.responseMode as ResponseMode) ?? "instructions_only",
      instructions: initialData.instructions ?? "",
      trainingRules: (initialData.TrainingRules ?? []).map((r) => ({
        trigger: r.trigger ?? "",
        response: r.response ?? "",
      })),
      abilities: {
        canAccessPortfolio: !!initialData.canAccessPortfolio,
        canCollectFormData: !!initialData.canCollectFormData,
        formId: initialData.formId ?? "",
      },
      knowledge: {
        selectedFolders: (initialData.TrainingFolders ?? []).map((t) => t.folderId ?? t.folder?.id ?? "").filter(Boolean),
        selectedFiles: (initialData.TrainingFiles ?? []).map((t) => t.fileId ?? t.file?.id ?? "").filter(Boolean),
      },
      restrictions: { limitations, escalationRules },
    };
  }, [initialData]);

  const [activeTab, setActiveTab] = useState<SpecificAgentTabId>("basic");
  const [name, setName] = useState(parsedData?.name ?? initialName);
  const [responseMode, setResponseMode] =
    useState<ResponseMode>(parsedData?.responseMode ?? "instructions_only");
  const [instructions, setInstructions] = useState(parsedData?.instructions ?? "");
  const [trainingRules, setTrainingRules] = useState<
    Array<{ trigger: string; response: string }>
  >(parsedData?.trainingRules ?? []);
  const [abilities, setAbilities] = useState<AbilitiesState>(
    parsedData?.abilities ?? {
      canAccessPortfolio: false,
      canCollectFormData: false,
      formId: "",
    }
  );
  const [knowledge, setKnowledge] = useState<KnowledgeState>(
    parsedData?.knowledge ?? { selectedFolders: [], selectedFiles: [] }
  );
  const [restrictions, setRestrictions] = useState<RestrictionsState>(
    parsedData?.restrictions ?? { limitations: [], escalationRules: [] }
  );

  useEffect(() => {
    if (parsedData) {
      setName(parsedData.name);
      setResponseMode(parsedData.responseMode);
      setInstructions(parsedData.instructions);
      setTrainingRules(parsedData.trainingRules);
      setAbilities(parsedData.abilities);
      setKnowledge(parsedData.knowledge);
      setRestrictions(parsedData.restrictions);
    } else {
      setName(initialName);
    }
  }, [parsedData, initialName]);

  const tabIds = useMemo((): SpecificAgentTabId[] => {
    const hasQA = responseMode === "qa_only" || responseMode === "both";
    return hasQA
      ? ["basic", "qa", "abilities", "knowledge", "restrictions"]
      : ["basic", "abilities", "knowledge", "restrictions"];
  }, [responseMode]);

  const safeActiveTab = tabIds.includes(activeTab) ? activeTab : "basic";
  const currentIndex = tabIds.indexOf(safeActiveTab);
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= tabIds.length - 1;

  const setActiveTabSafe = (id: SpecificAgentTabId) => {
    if (tabIds.includes(id)) setActiveTab(id);
  };

  const goPrev = () => {
    if (!isFirst) setActiveTab(tabIds[currentIndex - 1]!);
  };

  const goNext = () => {
    if (!isLast) setActiveTab(tabIds[currentIndex + 1]!);
  };

  const MIN_INSTRUCTIONS_CHARS = 20;
  const MIN_QA_RULES = 3;

  const validateAndSave = useCallback(() => {
    // 1. Información básica
    const nameTrimmed = name.trim();
    if (nameTrimmed.length < 3) {
      setActiveTab("basic");
      useToast({
        icon: "error",
        title: "El nombre del agente debe tener al menos 3 caracteres",
      });
      return;
    }

    const needsInstructions =
      responseMode === "instructions_only" || responseMode === "both";
    if (needsInstructions) {
      const instTrimmed = instructions.trim();
      if (!instTrimmed) {
        setActiveTab("basic");
        useToast({
          icon: "error",
          title: "Las instrucciones del agente son obligatorias cuando el modo incluye instrucciones",
        });
        return;
      }
      if (instTrimmed.length < MIN_INSTRUCTIONS_CHARS) {
        setActiveTab("basic");
        useToast({
          icon: "error",
          title: `Las instrucciones deben tener al menos ${MIN_INSTRUCTIONS_CHARS} caracteres`,
        });
        return;
      }
    }

    // 2. Preguntas y respuestas (si existe el paso)
    const hasQa = responseMode === "qa_only" || responseMode === "both";
    if (hasQa) {
      const validRules = trainingRules.filter(
        (r) => r.trigger?.trim() && r.response?.trim()
      );
      if (validRules.length < MIN_QA_RULES) {
        setActiveTab("qa");
        useToast({
          icon: "error",
          title: `Debe agregar al menos ${MIN_QA_RULES} preguntas y respuestas`,
        });
        return;
      }
    }

    const data: SpecificAgentFormData = {
      name: nameTrimmed,
      responseMode,
      instructions: instructions.trim(),
      trainingRules,
      abilities,
      knowledge,
      restrictions,
    };
    onSave?.(data);
  }, [
    name,
    responseMode,
    instructions,
    trainingRules,
    abilities,
    knowledge,
    restrictions,
    onSave,
  ]);

  useImperativeHandle(ref, () => ({ save: validateAndSave }), [validateAndSave]);

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0">
      {/* Tracker: número + título por paso */}
      <div className="border-b border-border px-4 py-4 flex-shrink-0 bg-background">
        <div
          role="tablist"
          aria-label="Pasos del formulario"
          className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 max-w-2xl mx-auto"
        >
          {tabIds.map((tabId, index) => {
            const stepNumber = index + 1;
            const isActive = safeActiveTab === tabId;
            return (
              <React.Fragment key={tabId}>
                {index > 0 && (
                  <span
                    className={cn(
                      "w-4 h-px flex-shrink-0",
                      currentIndex >= index ? "bg-foreground/40" : "bg-border",
                    )}
                    aria-hidden
                  />
                )}
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Paso ${stepNumber}: ${TAB_LABELS[tabId]}`}
                  onClick={() => setActiveTabSafe(tabId)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex-shrink-0",
                    isActive
                      ? "bg-muted text-foreground ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {stepNumber}
                  </span>
                  <span className="hidden sm:inline">{TAB_LABELS[tabId]}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        className="flex-1 min-h-0 overflow-auto px-4 py-6 flex flex-col custom-scroll"
      >
        <div className="max-w-2xl mx-auto flex-1 flex flex-col">
          {safeActiveTab === "basic" && (
            <BasicInfoTab
              name={name}
              onNameChange={setName}
              responseMode={responseMode}
              onResponseModeChange={setResponseMode}
              instructions={instructions}
              onInstructionsChange={setInstructions}
            />
          )}
          {safeActiveTab === "qa" && (
            <QATab
              value={trainingRules}
              onChange={setTrainingRules}
            />
          )}
          {safeActiveTab === "abilities" && (
            <AbilitiesTab
              value={abilities}
              onChange={setAbilities}
              availableForms={availableForms}
            />
          )}
          {safeActiveTab === "knowledge" && (
            <KnowledgeTab
              value={knowledge}
              onChange={setKnowledge}
              availableFolders={availableFolders}
              availableFiles={availableFiles}
            />
          )}
          {safeActiveTab === "restrictions" && (
            <RestrictionsTab
              value={restrictions}
              onChange={setRestrictions}
            />
          )}

          {/* Atrás / Siguiente o Continuar al final de cada pestaña */}
          <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-border flex-shrink-0">
            <div className="w-28">
              {!isFirst ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={goPrev}
                  className="cursor-pointer !bg-transparent border-border text-foreground hover:!bg-muted hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" aria-hidden />
                  Atrás
                </Button>
              ) : null}
            </div>
            <span className="text-xs text-muted-foreground">
              Paso {currentIndex + 1} de {tabIds.length}
            </span>
            <div className="w-28 flex justify-end">
              {!isLast ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={goNext}
                  className="cursor-pointer bg-primary text-primary-foreground hover:opacity-90"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" aria-hidden />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={validateAndSave}
                  disabled={isSubmitting}
                  className="cursor-pointer bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-1" aria-hidden />
                  Guardar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
