import React, { useState, useEffect } from "react";
import { X, Bot, Check, Loader2 } from "lucide-react";
import type { Agent } from "~/types/schema";
import { executeSQL } from "~/lib/utils.functions";
import usePath from "~/hooks/usePath";
import { useCompany } from "~/hooks/useCompany";

interface AgentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAgent: (agent: Agent | null) => void;
  selectedAgent: Agent | null;
}

const AgentSelectionModal: React.FC<AgentSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectAgent,
  selectedAgent,
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const PATH = usePath();
  const company = useCompany();
  const companyId = company?.id;

  useEffect(() => {
    if (isOpen && companyId) {
      fetchAgents();
    }
  }, [isOpen, companyId]);

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);

    try {
      const sql = `
        SELECT * FROM Agent 
        WHERE companyId = '${companyId}' 
        AND active = 1 
        ORDER BY name ASC
      `;

      const result = await executeSQL(PATH, sql, true);

      if (result && result.runScript && result.response) {
        setAgents(result.response);
      } else {
        setError("No se pudieron cargar los agentes");
        setAgents([]);
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
      setError("Error al cargar los agentes");
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAgent = (agent: Agent) => {
    setLoading(true);
    onSelectAgent(agent);
  };

  const handleRemoveSelection = () => {
    onSelectAgent(null);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Seleccionar Agente
              </h2>
              <p className="text-sm text-muted-foreground">
                Elige un agente para manejar las conversaciones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors duration-200 cursor-pointer"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Cargando agentes...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Error al cargar agentes
              </h3>
              <p className="text-muted-foreground text-center mb-4">{error}</p>
              <button
                onClick={fetchAgents}
                className="cursor-pointer px-4 py-2 text-sm text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No hay agentes disponibles
              </h3>
              <p className="text-muted-foreground text-center">
                No se encontraron agentes activos para esta empresa.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedAgent && (
                <button
                  onClick={handleRemoveSelection}
                  className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <X className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-500 font-medium">
                      Sin agente asignado
                    </span>
                  </div>
                </button>
              )}

              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent)}
                  className={`w-full p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                    selectedAgent?.id === agent.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-foreground">
                          {agent.name}
                        </h3>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-muted-foreground">
                              Gestión de citas:
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                agent.canManageAppointments
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              {agent.canManageAppointments ? "Sí" : "No"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-muted-foreground">
                              Recopilar datos:
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                agent.canCollectFormData
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              {agent.canCollectFormData ? "Sí" : "No"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {selectedAgent?.id === agent.id && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {agents.length > 0 && (
              <span>
                {agents.length} agente{agents.length !== 1 ? "s" : ""}{" "}
                disponible{agents.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentSelectionModal;
