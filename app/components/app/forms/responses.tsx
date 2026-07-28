import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  Eye,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import {
  Link,
  useLoaderData,
  useFetcher,
  useSearchParams,
  useNavigate,
} from "react-router";
import usePath from "~/hooks/usePath";
import useFullPath from "~/hooks/useFullPath";
import useToast from "~/hooks/useToast";
import type { Contact, Form, FormResponse } from "~/types/schema";
import { formatFullDate } from "~/lib/utils.functions";
import { useSmartInbox } from "~/contexts/SmartInboxContext";

interface LoaderData {
  form: Form;
  responses: FormResponse[];
  count?: number;
  totalPages?: number;
  currentPage?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  specificResponse?: FormResponse;
}

const FormResponsesPage: React.FC<{ isSmartInbox?: boolean }> = ({
  isSmartInbox = false,
}) => {
  const loaderData = useLoaderData<LoaderData>();
  const PATH = usePath();
  const FULL_PATH = useFullPath();
  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(loaderData.form);
  const [responses, setResponses] = useState<FormResponse[]>(
    loaderData.responses || []
  );
  const [count, setCount] = useState<number>(loaderData.count || 0);
  const [totalPages, setTotalPages] = useState<number>(
    loaderData.totalPages || 1
  );
  const [currentPage, setCurrentPage] = useState<number>(
    loaderData.currentPage || 1
  );
  const [hasNextPage, setHasNextPage] = useState<boolean>(
    loaderData.hasNextPage || false
  );
  const [hasPrevPage, setHasPrevPage] = useState<boolean>(
    loaderData.hasPrevPage || false
  );
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(
    null
  );
  const [showMessage, setshowMessage] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "read" | "unread">("all");
  const { unreadSmartInbox, setUnreadSmartInbox } = useSmartInbox();

  useEffect(() => {
    if (fetcher.data && fetcher.data.source === "form-responses") {
      setResponses(fetcher.data.responses || []);
      setCount(fetcher.data.count || 0);
      setTotalPages(fetcher.data.totalPages || 1);
      setCurrentPage(fetcher.data.currentPage || 1);
      setHasNextPage(fetcher.data.hasNextPage || false);
      setHasPrevPage(fetcher.data.hasPrevPage || false);
      setIsLoadingResponses(false);

      // Si hay una respuesta específica, abrir el modal automáticamente
      if (fetcher.data.specificResponse) {
        setSelectedResponse(fetcher.data.specificResponse);
        // Actualizar el contador de no leídos si la respuesta se marcó como leída
        if (fetcher.data.specificResponse.read) {
          setUnreadSmartInbox(Math.max(0, unreadSmartInbox - 1));
        }
      }
    }
  }, [fetcher.data, unreadSmartInbox, setUnreadSmartInbox]);

  // Manejar la carga inicial con parámetro id en la URL
  useEffect(() => {
    const responseId = searchParams.get("id");
    if (responseId && loaderData.specificResponse) {
      setSelectedResponse(loaderData.specificResponse);
      // Actualizar el contador de no leídos si la respuesta se marcó como leída
      if (loaderData.specificResponse.read) {
        setUnreadSmartInbox(Math.max(0, unreadSmartInbox - 1));
      }
    }
  }, [
    loaderData.specificResponse,
    searchParams,
    unreadSmartInbox,
    setUnreadSmartInbox,
  ]);

  const handlePageChange = (page: number) => {
    setIsLoadingResponses(true);
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("take", "10");
    if (activeTab !== "all") {
      params.set("filter", activeTab);
    }
    fetcher.load(`${FULL_PATH}?${params.toString()}`);
  };

  const handleTabChange = (tab: "all" | "read" | "unread") => {
    setActiveTab(tab);
    setIsLoadingResponses(true);
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("take", "10");
    if (tab !== "all") {
      params.set("filter", tab);
    }
    fetcher.load(`${FULL_PATH}?${params.toString()}`);
  };

  const getFilteredResponses = () => {
    if (activeTab === "all") return responses;
    if (activeTab === "read") return responses.filter((r) => r.read);
    if (activeTab === "unread") return responses.filter((r) => !r.read);
    return responses;
  };

  const getContactName = (contact?: Contact | null) => {
    if (!contact) return "Anónimo";
    return `${contact.name} ${contact.lastName || ""}`.trim();
  };

  const getResponseValue = (
    response: FormResponse,
    fieldId: string
  ): string => {
    const responseValue = response.FormResponseValue?.find(
      (rv) => rv.formField?.id === fieldId
    );
    return responseValue?.value || "-";
  };

  const handleMarkAsRead = (responseId: string) => {
    fetcher.submit(
      {
        action: `${FULL_PATH}?index`,
        responseId: responseId,
      },
      { method: "POST" }
    );
  };

  const handleCloseModal = () => {
    const responseId = searchParams.get("id");

    // Si estamos viendo una respuesta específica, limpiar el parámetro id y recargar
    if (responseId) {
      // Limpiar el parámetro id de la URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("id");

      // Navegar sin el parámetro id
      const newUrl = `${FULL_PATH}?${newParams.toString() || "index"}`;
      navigate(newUrl, { replace: true });

      // Recargar los datos normales
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("take", "10");
      if (activeTab !== "all") {
        params.set("filter", activeTab);
      }
      fetcher.load(`${PATH}?${params.toString()}`);
    }

    // Cerrar el modal
    setSelectedResponse(null);
  };

  useEffect(() => {
    if (fetcher.data && fetcher.data?.isRead) {
      let resId = fetcher.data?.responseId;
      let newArray = responses.map((response) => ({
        ...response,
        read: response.id === resId ? true : response.read,
      }));
      setResponses(newArray);
      setUnreadSmartInbox(unreadSmartInbox - 1);
      if (showMessage) {
        useToast({ icon: "success", title: "Respuesta marcada como leída" });
      }
    }
  }, [fetcher.data]);

  return (
    <div className="w-full bg-background dark:bg-transparent px-3 py-2 transition-colors duration-30 relative">
      <div className="mb-6 flex justify-between items-center py-2 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-4">
          {!isSmartInbox && (
            <Link
              to={`${PATH}/forms/`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          {!isSmartInbox ? (
            <div>
              <h1 className="text-2xl font-bold text-foreground truncate">
                Respuestas del formulario : {form.name}
              </h1>
              {form.description && (
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {form.description}
                </p>
              )}
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-foreground truncate">
                Inbox inteligente
              </h1>
            </div>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Mostrando{" "}
          <span className="font-medium text-foreground">
            {getFilteredResponses().length}
          </span>{" "}
          de <span className="font-medium text-foreground">{count}</span>{" "}
          respuesta
          {count !== 1 ? "s" : ""}
          {activeTab !== "all" && (
            <span className="ml-2 text-xs">
              (filtrado por: {activeTab === "read" ? "leídas" : "no leídas"})
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange("all")}
              className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "all"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              Todos ({count})
            </button>
            <button
              onClick={() => handleTabChange("unread")}
              className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "unread"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              No leídos ({responses.filter((r) => !r.read).length})
            </button>
            <button
              onClick={() => handleTabChange("read")}
              className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "read"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              Leídos ({responses.filter((r) => r.read).length})
            </button>
          </nav>
        </div>
      </div>

      <div className="mx-auto bg-card rounded-lg shadow-sm overflow-hidden border border-border">
        {getFilteredResponses().length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {activeTab === "all"
                ? "Aún no hay datos para mostrar."
                : activeTab === "read"
                  ? "No hay respuestas leídas para mostrar."
                  : "No hay respuestas sin leer para mostrar."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contacto
                  </th>
                  {!isSmartInbox ? (
                    form.FormField?.slice(0, 3).map((field) => (
                      <th
                        key={field.id}
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                      >
                        {field.label}
                      </th>
                    ))
                  ) : (
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Formulario
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Leída
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {getFilteredResponses().map((response) => (
                  <tr
                    key={response.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatFullDate(response.submittedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      <div className="flex items-center gap-2 w-auto">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <Link
                          to={`${PATH}/contacts/?search=${response?.contact?.senderId}`}
                          className="hover:bg-gray-200 p-1 rounded-lg transition-all duration-300"
                        >
                          {getContactName(response?.contact)}
                        </Link>
                      </div>
                    </td>
                    {!isSmartInbox ? (
                      form.FormField?.slice(0, 3).map((field) => (
                        <td
                          key={field.id}
                          className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate"
                        >
                          {getResponseValue(response, field.id)}
                        </td>
                      ))
                    ) : (
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                        {response.form?.name || "N/A"}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {response.read ? "Sí" : "No"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm gap-1 flex items-center">
                      <button
                        onClick={() => {
                          setshowMessage(false);
                          if (!response?.read) handleMarkAsRead(response.id);
                          setSelectedResponse(response);
                        }}
                        className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {!response.read && (
                        <button
                          onClick={() => {
                            setshowMessage(true);
                            handleMarkAsRead(response.id);
                          }}
                          className="cursor-pointer p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                          title="Marcar como leída"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPrevPage || isLoadingResponses}
                className="cursor-pointer flex items-center space-x-1 px-3 py-2 text-sm text-foreground border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoadingResponses}
                      className={`cursor-pointer px-3 py-2 text-sm border rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground border-primary"
                          : "text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage || isLoadingResponses}
                className="cursor-pointer flex items-center space-x-1 px-3 py-2 text-sm text-foreground border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoadingResponses && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-muted-foreground">
              Cargando respuestas...
            </p>
          </div>
        </div>
      )}

      {selectedResponse && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/50">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Detalles de la respuesta
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatFullDate(selectedResponse.submittedAt)}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto max-h-[calc(70vh-120px)]">
              <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Información del contacto
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nombre:</span>
                    <p className="text-foreground font-medium">
                      {getContactName(selectedResponse.contact)}
                    </p>
                  </div>
                  {selectedResponse.contact?.email && (
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="text-foreground font-medium">
                        {selectedResponse.contact.email}
                      </p>
                    </div>
                  )}
                  {selectedResponse.contact?.phone && (
                    <div>
                      <span className="text-muted-foreground">Teléfono:</span>
                      <p className="text-foreground font-medium">
                        {selectedResponse.contact.phone}
                      </p>
                    </div>
                  )}
                  {selectedResponse.ipAddress && (
                    <div>
                      <span className="text-muted-foreground">IP:</span>
                      <p className="text-foreground font-medium">
                        {selectedResponse.ipAddress}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Respuestas del formulario
                </h3>
                <div className="overflow-x-auto border border-border rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Campo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Respuesta
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {selectedResponse?.FormResponseValue?.map((field) => {
                        const value = getResponseValue(
                          selectedResponse,
                          field?.formField?.id || ""
                        );
                        return (
                          <tr
                            key={field.id}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm font-medium text-muted-foreground">
                              {field?.formField?.label || "N/A"}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">
                              {value || (
                                <span className="text-muted-foreground italic">
                                  Sin respuesta
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="cursor-pointer px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormResponsesPage;
