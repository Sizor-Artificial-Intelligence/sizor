import React, { useEffect, useRef, useState } from "react";
import { Link, useFetcher, useNavigate, useParams } from "react-router";
import { ArrowLeft, Save, ChevronRight, Pencil } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  AgentTypeSelector,
  type AgentType,
} from "./components/AgentTypeSelector";
import { AgentNameStep } from "./components/AgentNameStep";
import { MultiagentFormContent } from "./components/MultiagentFormContent";
import {
  SpecificAgentFormContent,
  type SpecificAgentFormContentRef,
} from "./components/SpecificAgentFormContent";
import useToast from "~/hooks/useToast";
import type { Agent, Form } from "~/types/schema";
import usePath from "~/hooks/usePath";

interface FormAgentProps {
  editAgent?: Agent;
  isEditing?: boolean;
  availableForms?: Form[];
  subAgentCandidates?: Array<{ id: string; name: string }>;
  availableFolders?: Array<{
    id: string;
    name: string;
    fullPath?: string;
  }>;
  availableFiles?: Array<{
    id: string;
    name: string;
    fileName: string;
    fileType: string;
    fullPath?: string;
  }>;
}

type Step = 1 | 2 | 3;

const HEADER_TITLE_CREATE = "Creación de agente";
const HEADER_TITLE_EDIT = "Edición de agente";

export default function FormAgent(props: FormAgentProps) {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const params = useParams();
  const companyId = params.companyId;
  const agentId = params.id;
  const isEditing = !!props.isEditing && !!props.editAgent;
  const PATH = usePath();

  const initialStep = isEditing ? (3 as Step) : (1 as Step);
  const initialAgentType: AgentType | null = isEditing
    ? props.editAgent!.isMultiAgent
      ? "multiagent"
      : "specific"
    : null;
  const initialAgentName = isEditing ? props.editAgent!.name : "";
  const initialMultiagentState = isEditing
    ? {
        subAgentIds: (props.editAgent!.SubAgentsAsMain ?? [])
          .map((s) => s.subAgentId ?? (s as any).subAgent?.id ?? "")
          .filter(Boolean),
      }
    : { subAgentIds: [] };

  const [step, setStep] = useState<Step>(initialStep);
  const [agentType, setAgentType] = useState<AgentType | null>(
    initialAgentType,
  );
  const [agentName, setAgentName] = useState(initialAgentName);
  const [multiagentState, setMultiagentState] = useState<{
    subAgentIds: string[];
  }>(initialMultiagentState);
  const specificFormRef = useRef<SpecificAgentFormContentRef>(null);
  const multiagentNameInputRef = useRef<HTMLInputElement>(null);
  const [isEditingHeaderName, setIsEditingHeaderName] = useState(false);

  const isSubmitting =
    fetcher.state === "submitting" || fetcher.state === "loading";
  const canContinueFromName = agentName.trim().length >= 3;

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      const data = fetcher.data as { status?: string; message?: string };
      if (data.status === "success") {
        useToast({
          icon: "success",
          title:
            data.message ||
            (isEditing
              ? "Agente actualizado correctamente"
              : "Agente creado correctamente"),
        });
        navigate(`${PATH}/agents/`, { relative: "path" });
      } else if (data.status === "error") {
        useToast({
          icon: "error",
          title:
            data.message ||
            (isEditing
              ? "Error al actualizar el agente"
              : "Error al crear el agente"),
        });
      }
    }
  }, [fetcher.data, fetcher.state, navigate, isEditing]);

  const handleBack = () => {
    navigate(`${PATH}/agents/`, { relative: "path" });
  };

  const getMultiagentAction = () =>
    isEditing && agentId
      ? `/app/${companyId}/agents/${agentId}/edit`
      : `/app/${companyId}/agents/add`;

  const getSpecificAction = () =>
    isEditing && agentId
      ? `/app/${companyId}/agents/${agentId}/edit`
      : `/app/${companyId}/agents/add`;

  const handleMultiagentSave = () => {
    if (multiagentState.subAgentIds.length < 2) {
      useToast({
        icon: "error",
        title: "Agrega al menos 2 subagentes para guardar el multiagente",
      });
      return;
    }
    const payload: Record<string, string> = {
      agentType: "multiagent",
      name: agentName.trim(),
      subAgentIds: JSON.stringify(multiagentState.subAgentIds),
    };
    fetcher.submit(payload, {
      method: "post",
      action: getMultiagentAction(),
    });
  };

  const handleSave = () => {
    if (agentType === "specific") {
      specificFormRef.current?.save();
    } else if (agentType === "multiagent") {
      handleMultiagentSave();
    }
  };

  const canShowSave =
    step === 3 && (agentType === "specific" || agentType === "multiagent");

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col absolute top-0 left-0 z-50 overflow-hidden">
      {isSubmitting && (
        <div
          className="absolute inset-0 bg-black/60 dark:bg-black/60 z-[60] flex items-center justify-center"
          aria-hidden
        >
          <div className="flex flex-col items-center gap-3 text-foreground">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            <span className="text-sm font-medium">Guardando agente...</span>
          </div>
        </div>
      )}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="w-10 flex-shrink-0 flex items-center justify-start">
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            asChild={step === 1}
            type="button"
            onClick={step !== 1 ? handleBack : undefined}
          >
            {isEditing || step === 1 ? (
              <Link to=".." relative="path">
                <ArrowLeft className="h-5 w-5" aria-hidden />
                <span className="sr-only">Volver</span>
              </Link>
            ) : (
              <>
                <ArrowLeft className="h-5 w-5" aria-hidden />
                <span className="sr-only">Paso anterior</span>
              </>
            )}
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center px-2 min-w-0">
          {step === 3 && agentType === "multiagent" ? (
            isEditingHeaderName ? (
              <input
                ref={multiagentNameInputRef}
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                onBlur={() => setIsEditingHeaderName(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setIsEditingHeaderName(false);
                  }
                }}
                className="w-full max-w-[280px] bg-muted border border-border rounded-lg px-3 py-1.5 text-base font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-center"
                placeholder="Nombre del multiagente"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsEditingHeaderName(true);
                  setTimeout(() => multiagentNameInputRef.current?.focus(), 0);
                }}
                className="flex items-center justify-center gap-2 w-full max-w-[280px] text-base font-semibold text-foreground truncate hover:bg-muted rounded-lg py-1.5 px-2 transition-colors cursor-pointer group"
              >
                <span className="truncate">
                  {agentName.trim() || "Nombre del multiagente"}
                </span>
                <Pencil
                  className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-hidden
                />
              </button>
            )
          ) : (
            <h1 className="text-center text-base font-semibold text-foreground truncate w-full">
              {isEditing ? HEADER_TITLE_EDIT : HEADER_TITLE_CREATE}
            </h1>
          )}
        </div>
        <div className="w-24 flex-shrink-0 flex items-center justify-end">
          {canShowSave && (
            <Button
              type="button"
              onClick={handleSave}
              disabled={
                isSubmitting ||
                (agentType === "multiagent" &&
                  multiagentState.subAgentIds.length < 2)
              }
              className="bg-primary text-primary-foreground hover:opacity-90 cursor-pointer text-sm px-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Guardando...
                </span>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" aria-hidden />
                  Guardar
                </>
              )}
            </Button>
          )}
        </div>
      </header>
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {step === 1 && (
          <div className="flex-1 min-h-0 overflow-auto">
            <AgentTypeSelector value={agentType} onChange={setAgentType} />
            {agentType && (
              <div className="px-4 pb-8 max-w-2xl mx-auto">
                <Button
                  type="button"
                  className="w-full bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
                  onClick={() => setStep(2)}
                >
                  Continuar
                  <ChevronRight className="h-4 w-4 ml-2" aria-hidden />
                </Button>
              </div>
            )}
          </div>
        )}
        {step === 2 && (
          <div className="flex-1 min-h-0 overflow-auto">
            <AgentNameStep value={agentName} onChange={setAgentName} />
            <div className="px-4 pb-8 max-w-2xl mx-auto mt-6">
              <Button
                type="button"
                className="w-full bg-primary text-primary-foreground hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setStep(3)}
                disabled={!canContinueFromName}
              >
                Continuar
                <ChevronRight className="h-4 w-4 ml-2" aria-hidden />
              </Button>
            </div>
          </div>
        )}
        {step === 3 && agentType && (
          <>
            {agentType === "multiagent" && (
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <MultiagentFormContent
                  agentName={agentName}
                  availableAgents={props.subAgentCandidates ?? []}
                  value={multiagentState}
                  onChange={setMultiagentState}
                  onSave={handleMultiagentSave}
                  isSubmitting={isSubmitting}
                />
              </div>
            )}
            {agentType === "specific" && (
              <div className="flex-1 min-h-0 flex flex-col min-w-0">
                <SpecificAgentFormContent
                  ref={specificFormRef}
                  initialName={agentName}
                  initialData={
                    isEditing && props.editAgent
                      ? (props.editAgent as any)
                      : undefined
                  }
                  availableForms={props.availableForms ?? []}
                  availableFolders={props.availableFolders ?? []}
                  availableFiles={props.availableFiles ?? []}
                  isSubmitting={isSubmitting}
                  onSave={(data) => {
                    const validRules = data.trainingRules.filter(
                      (r) => r.trigger?.trim() && r.response?.trim(),
                    );
                    const instructions =
                      data.responseMode === "qa_only" &&
                      !data.instructions.trim()
                        ? "Responde únicamente según las reglas específicas definidas. Si no hay regla que aplique, indica que no tienes esa información."
                        : data.instructions.trim();
                    const agentPayload: Record<string, string | boolean> = {
                      name: data.name,
                      instructions,
                      responseMode: data.responseMode,
                      canManageAppointments:
                        isEditing && props.editAgent?.canManageAppointments
                          ? true
                          : false,
                      trainingRules: JSON.stringify(
                        validRules.map((r) => ({
                          trigger: r.trigger.trim(),
                          response: r.response.trim(),
                        })),
                      ),
                      canAccessPortfolio: data.abilities.canAccessPortfolio,
                      canCollectFormData: data.abilities.canCollectFormData,
                      formId: data.abilities.canCollectFormData
                        ? data.abilities.formId || ""
                        : "",
                      limitations: JSON.stringify(
                        (data.restrictions.limitations || []).filter(
                          (l) => l.trim() !== "",
                        ),
                      ),
                      escalationRules: JSON.stringify(
                        (data.restrictions.escalationRules || []).filter(
                          (r) => r.trim() !== "",
                        ),
                      ),
                      trainingFolders: JSON.stringify(
                        data.knowledge.selectedFolders || [],
                      ),
                      trainingFiles: JSON.stringify(
                        data.knowledge.selectedFiles || [],
                      ),
                    };
                    fetcher.submit(agentPayload, {
                      method: "post",
                      action: getSpecificAction(),
                    });
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
