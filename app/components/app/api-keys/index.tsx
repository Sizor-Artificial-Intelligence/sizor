import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  SquarePen,
  Trash2,
  Lock,
  Unlock,
  X,
  Link2,
  Key,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import {
  useLoaderData,
  useFetcher,
  useRevalidator,
  useParams,
} from "react-router";
import { getFormatIsoDate } from "~/lib/utils.functions";
import useToast from "~/hooks/useToast";

export default function ApiKeysPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const apiKeys = useLoaderData() as any[];
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const params = useParams();
  const companyId = params.companyId;

  const [editingApiKey, setEditingApiKey] = useState<{
    id?: string;
    name: string;
    key: string;
  } | null>(null);
  const [managingLicenses, setManagingLicenses] = useState<{
    apiKeyId: string;
    apiKeyName: string;
  } | null>(null);
  const [licensesData, setLicensesData] = useState<any>(null);
  const [copiedApiKeyId, setCopiedApiKeyId] = useState<string | null>(null);
  const lastProcessedDataRef = useRef<any>(null);

  // Efecto para cerrar modales y recargar datos después de una acción exitosa
  useEffect(() => {
    // Solo procesar si el fetcher está idle (completado) y hay datos de éxito
    // y no hemos procesado estos datos antes
    if (
      fetcher.state === "idle" &&
      fetcher.data?.success &&
      fetcher.data !== lastProcessedDataRef.current
    ) {
      lastProcessedDataRef.current = fetcher.data;

      // Cerrar el modal de edición si está abierto
      setEditingApiKey(null);

      // Recargar datos
      revalidator.revalidate();
    }
  }, [fetcher.state, fetcher.data, revalidator]);

  useEffect(() => {
    if (managingLicenses) {
      loadLicensesData();
    }
  }, [managingLicenses]);

  const loadLicensesData = async () => {
    if (!managingLicenses || !companyId) return;

    try {
      const response = await fetch(
        `/app/${companyId}/api-keys/${managingLicenses.apiKeyId}/licenses`
      );
      if (response.ok) {
        const data = await response.json();
        setLicensesData(data);
      }
    } catch (error) {
      console.error("Error cargando licencias:", error);
    }
  };

  const filteredApiKeys = useMemo(() => {
    if (!searchTerm.trim()) return apiKeys || [];

    const term = searchTerm.toLowerCase();
    return (apiKeys || []).filter(
      (apiKey: any) =>
        apiKey?.name?.toLowerCase().includes(term) ||
        apiKey?.key?.toLowerCase().includes(term)
    );
  }, [searchTerm, apiKeys]);

  const handleCreate = () => {
    setEditingApiKey({
      name: "",
      key: "",
    });
  };

  const handleEdit = (apiKey: any) => {
    setEditingApiKey({
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key,
    });
  };

  const handleDelete = (apiKeyId: string) => {
    const formData = new FormData();
    formData.append("action", "delete");
    formData.append("apiKeyId", apiKeyId);
    fetcher.submit(formData, { method: "POST" });
  };

  const handleToggleStatus = (apiKey: any) => {
    const newActive = !apiKey.active;
    const formData = new FormData();
    formData.append("action", "toggleStatus");
    formData.append("apiKeyId", apiKey.id);
    formData.append("active", String(newActive));
    fetcher.submit(formData, { method: "POST" });
  };

  const handleManageLicenses = (apiKey: any) => {
    setManagingLicenses({
      apiKeyId: apiKey.id,
      apiKeyName: apiKey.name,
    });
  };

  const handleSave = () => {
    if (!editingApiKey) return;

    if (!editingApiKey.name || !editingApiKey.key) {
      useToast({ icon: "warning", title: "Nombre y API Key son requeridos" });
      return;
    }

    const formData = new FormData();
    formData.append("action", editingApiKey.id ? "update" : "create");
    if (editingApiKey.id) {
      formData.append("apiKeyId", editingApiKey.id);
    }
    formData.append("name", editingApiKey.name);
    formData.append("key", editingApiKey.key);
    fetcher.submit(formData, { method: "POST" });
  };

  const handleCancel = () => {
    setEditingApiKey(null);
  };

  const handleAddLicense = async (tenantId: string) => {
    if (!managingLicenses) return;

    const formData = new FormData();
    formData.append("action", "addLicense");
    formData.append("apiKeyId", managingLicenses.apiKeyId);
    formData.append("tenantId", tenantId);
    fetcher.submit(formData, { method: "POST" });
    setTimeout(() => {
      loadLicensesData();
    }, 500);
  };

  const handleRemoveLicense = async (tenantId: string) => {
    if (!managingLicenses) return;

    const formData = new FormData();
    formData.append("action", "removeLicense");
    formData.append("apiKeyId", managingLicenses.apiKeyId);
    formData.append("tenantId", tenantId);
    fetcher.submit(formData, { method: "POST" });
    setTimeout(() => {
      loadLicensesData();
    }, 500);
  };

  const getApiKeyPreview = (key: string) => {
    if (!key || key.length < 8) return key;
    return `${key.substring(0, 8)}...`;
  };

  const handleCopyApiKey = async (apiKey: string, apiKeyId: string) => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopiedApiKeyId(apiKeyId);
      setTimeout(() => {
        setCopiedApiKeyId(null);
      }, 2000);
    } catch (err) {
      console.error("Error copiando API Key:", err);
    }
  };

  return (
    <div className="w-full bg-background dark:bg-transparent px-3 py-2 transition-colors duration-300">
      <div className="mb-6 flex justify-between items-center py-2 border-b border-border flex-shrink-0">
        <h1 className="text-3xl font-bold text-foreground mb-2">API Keys</h1>
        <button
          onClick={handleCreate}
          className="cursor-pointer flex items-center space-x-2 px-3 py-2 text-sm text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-all duration-200 hover:shadow-md hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Crear API Key</span>
        </button>
      </div>

      <div className="mx-auto bg-card rounded-lg shadow-sm overflow-hidden border border-border">
        <div className="p-4 border-b border-border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar API Keys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 hover:border-input/80"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  API Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Licencias
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Último Uso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredApiKeys.map((apiKey: any, index: number) => (
                <tr
                  key={apiKey.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {apiKey?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground font-mono">
                        {getApiKeyPreview(apiKey?.key || "")}
                      </span>
                      <button
                        onClick={() =>
                          handleCopyApiKey(apiKey?.key || "", apiKey.id)
                        }
                        className="cursor-pointer text-muted-foreground hover:text-primary transition-colors p-1"
                        title="Copiar API Key"
                      >
                        {copiedApiKeyId === apiKey.id ? (
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {apiKey?.ApiKeyLicense?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {apiKey?.createdAt
                      ? getFormatIsoDate(apiKey.createdAt, true, false)
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {apiKey?.lastUsed
                      ? getFormatIsoDate(apiKey.lastUsed, true, false)
                      : "Nunca"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        apiKey?.active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {apiKey?.active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => handleManageLicenses(apiKey)}
                        className="cursor-pointer text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Gestionar licencias"
                        disabled={fetcher.state === "submitting"}
                      >
                        {fetcher.state === "submitting" ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Link2 className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(apiKey)}
                        className="cursor-pointer text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Editar"
                        disabled={fetcher.state === "submitting"}
                      >
                        {fetcher.state === "submitting" ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <SquarePen className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleToggleStatus(apiKey)}
                        className={`cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          apiKey?.active
                            ? "text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                            : "text-muted-foreground hover:text-green-600 dark:hover:text-green-400"
                        }`}
                        title={
                          apiKey?.active
                            ? "Desactivar API Key"
                            : "Activar API Key"
                        }
                        disabled={fetcher.state === "submitting"}
                      >
                        {fetcher.state === "submitting" ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : apiKey?.active ? (
                          <Lock className="w-5 h-5" />
                        ) : (
                          <Unlock className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(apiKey.id)}
                        className="cursor-pointer text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar"
                        disabled={fetcher.state === "submitting"}
                      >
                        {fetcher.state === "submitting" ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredApiKeys.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No se encontraron API Keys que coincidan con la búsqueda
          </div>
        )}
      </div>

      {editingApiKey && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground">
                {editingApiKey.id ? "Editar API Key" : "Crear API Key"}
              </h2>
              <button
                onClick={handleCancel}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editingApiKey.name}
                  onChange={(e) =>
                    setEditingApiKey({ ...editingApiKey, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                  placeholder="Nombre de la API Key"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  API Key (OpenAI)
                </label>
                <textarea
                  value={editingApiKey.key}
                  onChange={(e) =>
                    setEditingApiKey({ ...editingApiKey, key: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring font-mono text-sm"
                  placeholder="sk-..."
                  rows={3}
                />
              </div>
            </div>

            {fetcher.data && !fetcher.data.success && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-md text-sm">
                {fetcher.data.message || "Error al guardar"}
              </div>
            )}

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors cursor-pointer"
                disabled={fetcher.state === "submitting"}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={fetcher.state === "submitting"}
              >
                {fetcher.state === "submitting" && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {fetcher.state === "submitting" ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {managingLicenses && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg shadow-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Gestionar Licencias
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  API Key: {managingLicenses.apiKeyName}
                </p>
              </div>
              <button
                onClick={() => {
                  setManagingLicenses(null);
                  setLicensesData(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {licensesData ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Licencias Vinculadas ({licensesData.linked?.length || 0})
                  </h3>
                  {licensesData.linked && licensesData.linked.length > 0 ? (
                    <div className="border border-border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border">
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                              Cliente
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                              Email
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                              País
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {licensesData.linked.map((license: any) => (
                            <tr key={license.tenantId}>
                              <td className="px-4 py-2 text-sm text-foreground">
                                {license.name}
                              </td>
                              <td className="px-4 py-2 text-sm text-muted-foreground">
                                {license.email}
                              </td>
                              <td className="px-4 py-2 text-sm text-muted-foreground">
                                {license.country}
                              </td>
                              <td className="px-4 py-2">
                                <button
                                  onClick={() =>
                                    handleRemoveLicense(license.tenantId)
                                  }
                                  className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={fetcher.state === "submitting"}
                                >
                                  {fetcher.state === "submitting" && (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  )}
                                  Desvincular
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay licencias vinculadas
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Licencias Disponibles ({licensesData.available?.length || 0}
                    )
                  </h3>
                  {licensesData.available &&
                  licensesData.available.length > 0 ? (
                    <div className="border border-border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border">
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                              Cliente
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                              Email
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                              País
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {licensesData.available.map((license: any) => (
                            <tr key={license.tenantId}>
                              <td className="px-4 py-2 text-sm text-foreground">
                                {license.name}
                              </td>
                              <td className="px-4 py-2 text-sm text-muted-foreground">
                                {license.email}
                              </td>
                              <td className="px-4 py-2 text-sm text-muted-foreground">
                                {license.country}
                              </td>
                              <td className="px-4 py-2">
                                <button
                                  onClick={() =>
                                    handleAddLicense(license.tenantId)
                                  }
                                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={fetcher.state === "submitting"}
                                >
                                  {fetcher.state === "submitting" && (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  )}
                                  Vincular
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay licencias disponibles para vincular
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Cargando licencias...
              </div>
            )}

            {fetcher.data && !fetcher.data.success && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-md text-sm">
                {fetcher.data.message || "Error al procesar"}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setManagingLicenses(null);
                  setLicensesData(null);
                }}
                className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
