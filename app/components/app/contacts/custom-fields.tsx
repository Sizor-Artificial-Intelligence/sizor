import {
  ArrowUpDown,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "react-router";
import useFullPath from "~/hooks/useFullPath";
import useToast from "~/hooks/useToast";
import { formatFullDate } from "~/lib/utils.functions";
import type { CustomField } from "~/types/schema";

interface CustomFieldFormData {
  name: string;
  fieldType: string;
  isRequired: boolean;
  options?: string;
}

const CustomFieldForm: React.FC<{
  field?: CustomField;
  onClose: () => void;
  onSubmit: (data: CustomFieldFormData) => void;
  isLoading: boolean;
}> = ({ field, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<CustomFieldFormData>({
    name: field?.name || "",
    fieldType: field?.fieldType || "text",
    isRequired: field?.isRequired || false,
    options: field?.options || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const fieldTypes = [
    { value: "text", label: "Texto" },
    { value: "number", label: "Número" },
    { value: "date", label: "Fecha" },
    { value: "boolean", label: "Sí/No" },
    { value: "select", label: "Lista desplegable" },
    { value: "textarea", label: "Texto largo" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            {field ? "Editar Campo" : "Nuevo Campo"}
          </h3>
          <button
            onClick={onClose}
            className="cursor-pointer p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nombre del Campo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ej: Cargo, Empresa, Fecha de Nacimiento"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tipo de Campo *
            </label>
            <select
              value={formData.fieldType}
              onChange={(e) =>
                setFormData({ ...formData, fieldType: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              {fieldTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {formData.fieldType === "select" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Opciones (una por línea) *
              </label>
              <textarea
                value={formData.options}
                onChange={(e) =>
                  setFormData({ ...formData, options: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                rows={4}
                required={formData.fieldType === "select"}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Escribe cada opción en una línea separada
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRequired"
              checked={formData.isRequired}
              onChange={(e) =>
                setFormData({ ...formData, isRequired: e.target.checked })
              }
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
            />
            <label htmlFor="isRequired" className="text-sm text-foreground">
              Campo requerido
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Guardando..." : field ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function CustomFieldsPage() {
  const loaderData = useLoaderData<any>();
  const customFields = loaderData?.customFields || [];
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const FULL_PATH = useFullPath();
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);

  const isLoading = navigation.state === "submitting";

  const handleCreateField = (data: CustomFieldFormData) => {
    const formData = new FormData();
    formData.append("_action", "create");
    formData.append("name", data.name);
    formData.append("fieldType", data.fieldType);
    formData.append("isRequired", data.isRequired.toString());
    if (data.options) {
      formData.append("options", data.options);
    }
    fetcher.submit(formData, { method: "POST", action: `${FULL_PATH}?index` });
    setShowForm(false);
  };

  const handleUpdateField = (data: CustomFieldFormData) => {
    if (!editingField) return;

    const formData = new FormData();
    formData.append("_action", "update");
    formData.append("fieldId", editingField.id);
    formData.append("name", data.name);
    formData.append("fieldType", data.fieldType);
    formData.append("isRequired", data.isRequired.toString());
    if (data.options) {
      formData.append("options", data.options);
    }
    fetcher.submit(formData, { method: "POST", action: `${FULL_PATH}?index` });
    setEditingField(null);
  };

  const handleDeleteField = (fieldId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este campo?")) {
      const formData = new FormData();
      formData.append("_action", "delete");
      formData.append("fieldId", fieldId);
      fetcher.submit(formData, {
        method: "POST",
        action: `${FULL_PATH}?index`,
      });
    }
  };

  const handleToggleActive = (fieldId: string) => {
    const formData = new FormData();
    formData.append("_action", "toggle-active");
    formData.append("fieldId", fieldId);
    fetcher.submit(formData, { method: "POST", action: `${FULL_PATH}?index` });
  };

  const handleMoveField = (fieldId: string, direction: "up" | "down") => {
    const currentIndex = customFields.findIndex(
      (field: any) => field.id === fieldId
    );
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= customFields.length) return;

    const newFields = [...customFields];
    [newFields[currentIndex], newFields[newIndex]] = [
      newFields[newIndex],
      newFields[currentIndex],
    ];

    const fieldIds = newFields.map((field) => field.id);

    const formData = new FormData();
    formData.append("_action", "reorder");
    formData.append("fieldIds", JSON.stringify(fieldIds));
    fetcher.submit(formData, { method: "POST", action: `${FULL_PATH}?index` });
  };

  const getFieldTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      text: "Texto",
      number: "Número",
      date: "Fecha",
      boolean: "Sí/No",
      select: "Lista desplegable",
      textarea: "Texto largo",
    };
    return types[type] || type;
  };

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data?.success) {
        useToast({ icon: "success", title: fetcher.data?.message });
      } else {
        useToast({ icon: "error", title: fetcher.data?.message });
      }
    }
  }, [fetcher.data]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Campos Personalizados
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra los campos personalizados para tus contactos
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="cursor-pointer flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Campo</span>
        </button>
      </div>

      {customFields.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No hay campos personalizados
          </h3>
          <p className="text-muted-foreground mb-6">
            Crea tu primer campo personalizado para capturar información
            adicional de tus contactos.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="cursor-pointer flex items-center space-x-2 px-6 py-3 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Campo</span>
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Orden
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Nombre del Campo
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Tipo
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Requerido
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Estado
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    En Uso
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Fecha de Creación
                  </th>
                  <th className="text-right p-4 font-medium text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {customFields.map((field: any, index: number) => (
                  <tr
                    key={field.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleMoveField(field.id, "up")}
                          disabled={index === 0}
                          className="cursor-pointer p-1 hover:bg-accent rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowUpDown className="w-3 h-3 rotate-180" />
                        </button>
                        <span className="text-sm font-medium">
                          {field.order}
                        </span>
                        <button
                          onClick={() => handleMoveField(field.id, "down")}
                          disabled={index === customFields.length - 1}
                          className="cursor-pointer p-1 hover:bg-accent rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-foreground">
                        {field.name}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {getFieldTypeLabel(field.fieldType)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          field.isRequired
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }`}
                      >
                        {field.isRequired ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(field.id)}
                        className={`cursor-pointer inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          field.active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800"
                        }`}
                      >
                        {field.active ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                        <span>{field.active ? "Activo" : "Inactivo"}</span>
                      </button>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {field._count.ContactCustomFieldValue} contacto
                        {field._count.ContactCustomFieldValue !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatFullDate(field?.createdAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setEditingField(field)}
                          className="cursor-pointer p-2 hover:bg-accent rounded-lg transition-colors"
                          title="Editar campo"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="cursor-pointer p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                          title="Eliminar campo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <CustomFieldForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateField}
          isLoading={isLoading}
        />
      )}

      {editingField && (
        <CustomFieldForm
          field={editingField}
          onClose={() => setEditingField(null)}
          onSubmit={handleUpdateField}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
