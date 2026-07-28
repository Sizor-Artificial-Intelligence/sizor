import React, { useEffect, useState } from "react";
import { Eye, FileText, Loader2, Plus, SquarePen, Trash2 } from "lucide-react";
import { Link, useFetcher, useLoaderData } from "react-router";
import type { Form } from "~/types/schema";
import useFullPath from "~/hooks/useFullPath";
import useToast from "~/hooks/useToast";

const FormsPage: React.FC = () => {
  const forms = useLoaderData<Form[]>();
  const FULL_PATH = useFullPath();
  const fetcher = useFetcher();
  const [loading, setloading] = useState(false);
  const [idToDelete, setidToDelete] = useState<any>(null);

  const deleteForm = (id: string) => {
    setloading(true);
    setidToDelete(id);
    fetcher.submit(
      {
        action: "DELETE",
        id,
      },
      { method: "POST", action: `${FULL_PATH}?index` }
    );
  };

  useEffect(() => {
    if (fetcher.data && fetcher.data.success == "success") {
      useToast({
        icon: "success",
        title: "Formulario eliminado correctamente",
      });
      setloading(false);
    }
    if (fetcher.data && fetcher.data.success == "error") {
      useToast({
        icon: "error",
        title: fetcher.data.message || "Error al eliminar el formulario",
      });
      setloading(false);
    }
  }, [fetcher.data]);

  return (
    <div className="w-full bg-background dark:bg-transparent px-3 py-2 transition-colors duration-300">
      <div className="mb-6 flex justify-between items-center py-2 border-b border-border flex-shrink-0">
        <h1 className="text-3xl font-bold text-foreground mb-2">Formularios</h1>
        <Link
          to={"add/"}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-all duration-200 hover:shadow-md hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Crear formulario</span>
        </Link>
      </div>
      <div className="mx-auto bg-card rounded-lg shadow-sm overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Campos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {forms.map((form) => (
                <tr
                  key={form.id}
                  className={"hover:bg-muted/50 transition-colors"}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {form?.name || ""}
                  </td>
                  <td className="px-6 py-4 truncate whitespace-nowrap text-sm text-muted-foreground">
                    {form?.description || ""}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {form?.FormField?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <div className="flex gap-3 items-center">
                      <Link
                        to={`${form.id}/responses/`}
                        className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                        title="Ver respuestas"
                      >
                        <FileText className="w-5 h-5" />
                      </Link>
                      <Link
                        to={`${form.id}/edit/`}
                        className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                        title="Editar formulario"
                      >
                        <SquarePen className="w-5 h-5" />
                      </Link>
                      <button
                        disabled={loading && idToDelete == form.id}
                        onClick={() => deleteForm(form.id)}
                        className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {loading && idToDelete == form.id ? (
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
      </div>
    </div>
  );
};

export default FormsPage;
