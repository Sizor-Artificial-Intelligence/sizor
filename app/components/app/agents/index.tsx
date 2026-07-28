import React, { useEffect, useState } from "react";
import {
  Plus,
  Bot,
  Calendar,
  FileText,
  ImageIcon,
  Trash2,
  Loader2,
  SquarePenIcon,
} from "lucide-react";
import { Link, useFetcher, useLoaderData, useNavigate } from "react-router";
import type { Agent } from "~/types/schema";
import { useCompany } from "~/hooks/useCompany";
import useToast from "~/hooks/useToast";
import { Button } from "~/components/ui/button";
import useFullPath from "~/hooks/useFullPath";
import { useLicense } from "~/hooks/useLicense";

const AgentsPage: React.FC = () => {
  const agents = useLoaderData<Agent[]>();
  const navigate = useNavigate();
  const company = useCompany();
  const fetcher = useFetcher();
  const [loading, setloading] = useState(false);
  const FULL_PATH = useFullPath();
  const [idToDelete, setIdToDelete] = useState("");
  const license = useLicense();

  function deleteAgent(id: string) {
    setloading(true);
    fetcher.submit({ id }, { method: "DELETE", action: `${FULL_PATH}?index` });
  }

  useEffect(() => {
    if (fetcher.data?.status === "success") {
      useToast({
        icon: "success",
        title: fetcher.data?.message,
      });
      setloading(false);
    }
    if (fetcher.data?.status === "error") {
      useToast({
        icon: "error",
        title: fetcher.data?.message,
      });
      setloading(false);
    }
  }, [fetcher.data]);

  return (
    <div className="w-full bg-background dark:bg-transparent px-3 py-2 transition-colors duration-300">
      <div className="mb-6 flex justify-between items-center py-2 border-b border-border flex-shrink-0">
        <h1 className="text-3xl font-bold text-foreground mb-2">Agentes</h1>
        <Link
          to={"add/"}
          onClick={(e) => {
            if (company?.plan?.isFree && company?.plan?.agentsUsed > 0) {
              useToast({
                icon: "error",
                title: "Para crear más agentes, debes tener un plan premium",
              });
              e?.preventDefault();
              e?.stopPropagation();
            }
            if (
              license?.isSon &&
              company &&
              !company?.plan?.agentsUnlimited &&
              (company?.plan?.agentsUsed || 0) >=
                (company?.plan?.maxAgents || 0)
            ) {
              useToast({
                icon: "error",
                title:
                  "No tienes suficientes agentes disponibles. Has alcanzado el límite de agentes para tu plan",
              });
              e?.preventDefault();
              e?.stopPropagation();
            }
            navigate("add/");
          }}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-all duration-200 hover:shadow-md hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Crear agente</span>
        </Link>
      </div>
      <div className="mx-auto bg-card rounded-lg shadow-sm overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nombre del Agente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Habilidades
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Fecha de Creación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {agents && agents.length > 0 ? (
                agents.map((agent) => {
                  return (
                    <tr
                      onClick={() => navigate(`${agent.id}/edit/`)}
                      key={agent.id}
                      className={`hover:bg-muted/50 transition-colors cursor-pointer`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        <div className="flex items-center space-x-2">
                          <Bot className="w-4 h-4 text-primary" />
                          <span>{agent.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <div className="flex flex-wrap gap-1">
                          {agent.canManageAppointments && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              <Calendar className="w-3 h-3 mr-1" />
                              Gestionar citas
                            </span>
                          )}
                          {agent.canCollectFormData && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              <FileText className="w-3 h-3 mr-1" />
                              Recolectar datos
                            </span>
                          )}
                          {agent.canAccessPortfolio && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <ImageIcon className="w-3 h-3 mr-1" />
                              Acceder a portafolio
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            agent.active
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }`}
                        >
                          {agent.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {agent.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-2 text-sm text-muted-foreground">
                        <Button
                          variant="outline"
                          size="icon"
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setIdToDelete(agent.id);
                            deleteAgent(agent.id);
                          }}
                        >
                          {loading && idToDelete === agent.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="cursor-pointer"
                        >
                          <SquarePenIcon className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                      <div className="rounded-full bg-muted/50 p-6">
                        <Bot className="w-16 h-16 text-muted-foreground/50" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-foreground">
                          No hay agentes creados
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          Comienza creando tu primer agente para automatizar la
                          gestión de citas, recopilación de datos y más.
                        </p>
                      </div>
                      <Link
                        to={"add/"}
                        onClick={(e) => {
                          if (
                            company?.plan?.isFree &&
                            company?.plan?.agentsUsed > 0
                          ) {
                            useToast({
                              icon: "error",
                              title:
                                "Para crear más agentes, debes tener un plan premium",
                            });
                            e?.preventDefault();
                            e?.stopPropagation();
                          }
                          if (
                            license?.isSon &&
                            company &&
                            !company?.plan?.agentsUnlimited &&
                            (company?.plan?.agentsUsed || 0) >=
                              (company?.plan?.maxAgents || 0)
                          ) {
                            useToast({
                              icon: "error",
                              title:
                                "No tienes suficientes agentes disponibles. Has alcanzado el límite de agentes para tu plan",
                            });
                            e?.preventDefault();
                            e?.stopPropagation();
                          }
                        }}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-all duration-200 hover:shadow-md hover:scale-105"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Crear primer agente</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgentsPage;
