import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  SquarePen,
  Trash2,
  DollarSign,
  Coins,
  Lock,
  Unlock,
  X,
} from "lucide-react";
import {
  Link,
  useLoaderData,
  useNavigate,
  useFetcher,
  useRevalidator,
} from "react-router";
import usePath from "~/hooks/usePath";
import { formatNumberWithSeparators, formatPrice } from "~/lib/utils.functions";

export default function LicensesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const licenses = useLoaderData() as any;
  const navigate = useNavigate();
  const PATH = usePath();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  // Estado para modales
  const [editingLicense, setEditingLicense] = useState<{
    tenantId: string;
    type: "price" | "tokens" | null;
    currentValue: number;
  } | null>(null);
  const [editValue, setEditValue] = useState("");

  // Efecto para cerrar modal y recargar datos después de una acción exitosa
  useEffect(() => {
    if (fetcher.data?.success) {
      setEditingLicense(null);
      setEditValue("");
      revalidator.revalidate();
    }
  }, [fetcher.data, revalidator]);

  const filteredLicenses = useMemo(() => {
    if (!searchTerm.trim()) return licenses || [];

    const term = searchTerm.toLowerCase();
    return (licenses || []).filter(
      (license: any) =>
        license?.name?.toLowerCase().includes(term) ||
        license?.email?.toLowerCase().includes(term) ||
        license?.country?.toLowerCase().includes(term) ||
        license?.phone?.toLowerCase().includes(term)
    );
  }, [searchTerm, licenses]);

  const handleEditPrice = (license: any) => {
    setEditingLicense({
      tenantId: license.tenantId,
      type: "price",
      currentValue: license.price || 0,
    });
    setEditValue(String(license.price || 0));
  };

  const handleEditTokens = (license: any) => {
    setEditingLicense({
      tenantId: license.tenantId,
      type: "tokens",
      currentValue: license.tokens || 0,
    });
    setEditValue(String(license.tokens || 0));
  };

  const handleToggleStatus = (license: any) => {
    const newActive = !license.active;
    const formData = new FormData();
    formData.append("action", "toggleStatus");
    formData.append("tenantId", license.tenantId);
    formData.append("active", String(newActive));
    fetcher.submit(formData, { method: "POST" });
  };

  const handleSaveEdit = () => {
    if (!editingLicense) return;

    const value = parseFloat(editValue);
    if (isNaN(value) || value < 0) {
      alert(`El valor debe ser un número válido mayor o igual a 0`);
      return;
    }

    const formData = new FormData();
    formData.append(
      "action",
      editingLicense.type === "price" ? "updatePrice" : "updateTokens"
    );
    formData.append("tenantId", editingLicense.tenantId);
    formData.append(
      editingLicense.type === "price" ? "price" : "tokens",
      String(value)
    );
    fetcher.submit(formData, { method: "POST" });
  };

  const handleCancelEdit = () => {
    setEditingLicense(null);
    setEditValue("");
  };

  return (
    <div className="w-full bg-background dark:bg-transparent px-3 py-2 transition-colors duration-300">
      <div className="mb-6 flex justify-between items-center py-2 border-b border-border flex-shrink-0">
        <h1 className="text-3xl font-bold text-foreground mb-2">Licencias</h1>
        <Link
          to="add/"
          className="flex items-center space-x-2 px-3 py-2 text-sm text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-all duration-200 hover:shadow-md hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Crear licencia</span>
        </Link>
      </div>

      <div className="mx-auto bg-card rounded-lg shadow-sm overflow-hidden border border-border">
        {/* Buscador */}
        <div className="p-4 border-b border-border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar licencias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 hover:border-input/80"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  País
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tokens
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
              {filteredLicenses.map((license: any, index: number) => (
                <tr
                  key={license.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {license?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {license?.country}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {`${license?.countryCode || ""} ${license?.phone || ""}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {license?.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {formatPrice(license?.price || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {formatNumberWithSeparators(license?.tokens || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        license?.active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {license?.active ? "Activa" : "Bloqueada"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => handleEditPrice(license)}
                        className="cursor-pointer text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Cambiar precio"
                        disabled={fetcher.state === "submitting"}
                      >
                        <DollarSign className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEditTokens(license)}
                        className="cursor-pointer text-muted-foreground hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
                        title="Cambiar tokens"
                        disabled={fetcher.state === "submitting"}
                      >
                        <Coins className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(license)}
                        className={`cursor-pointer transition-colors ${
                          license?.active
                            ? "text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                            : "text-muted-foreground hover:text-green-600 dark:hover:text-green-400"
                        }`}
                        title={
                          license?.active
                            ? "Bloquear licencia"
                            : "Desbloquear licencia"
                        }
                        disabled={fetcher.state === "submitting"}
                      >
                        {license?.active ? (
                          <Lock className="w-5 h-5" />
                        ) : (
                          <Unlock className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLicenses.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No se encontraron licencias que coincidan con la búsqueda
          </div>
        )}
      </div>

      {/* Modal para editar precio/tokens */}
      {editingLicense && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground">
                {editingLicense.type === "price"
                  ? "Cambiar Precio"
                  : "Cambiar Tokens"}
              </h2>
              <button
                onClick={handleCancelEdit}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                {editingLicense.type === "price" ? "Precio" : "Tokens"}
              </label>
              <input
                type="number"
                min="0"
                step={editingLicense.type === "price" ? "0.01" : "1"}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                placeholder={`Ingrese ${editingLicense.type === "price" ? "el precio" : "los tokens"}`}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveEdit();
                  } else if (e.key === "Escape") {
                    handleCancelEdit();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Valor actual:{" "}
                {editingLicense.type === "price"
                  ? formatPrice(editingLicense.currentValue)
                  : formatNumberWithSeparators(editingLicense.currentValue)}
              </p>
            </div>

            {fetcher.data && !fetcher.data.success && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-md text-sm">
                {fetcher.data.message || "Error al actualizar"}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors cursor-pointer"
                disabled={fetcher.state === "submitting"}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors cursor-pointer"
                disabled={fetcher.state === "submitting"}
              >
                {fetcher.state === "submitting" ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
