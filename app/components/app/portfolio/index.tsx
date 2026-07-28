import { useState, useEffect } from "react";
import {
  useLoaderData,
  useNavigate,
  useRevalidator,
  useSearchParams,
} from "react-router";
import {
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Upload,
} from "lucide-react";
import usePath from "~/hooks/usePath";
import PortfolioModal from "./PortfolioModal";
import ImportModal from "./ImportModal";
import { formatPrice } from "~/lib/utils.functions";
import useToast from "~/hooks/useToast";

interface LoaderData {
  items: any[];
  total: number;
  page: number;
  totalPages: number;
}

export default function PortfolioPage() {
  const { items, page, totalPages } = useLoaderData<LoaderData>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const PATH = usePath();
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  useEffect(() => {
    setSearchInput(searchParams.get("search") || "");
  }, [searchParams]);

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este item?")) {
      return;
    }

    setDeletingItem(itemId);

    try {
      const formData = new FormData();
      formData.append("_action", "delete");
      formData.append("itemId", itemId);

      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: formData,
      });
      revalidator.revalidate();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Error al eliminar el item");
    } finally {
      setDeletingItem(null);
    }
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams();
    if (value.trim()) {
      params.set("search", value.trim());
    }
    params.set("page", "1");
    navigate(`${PATH}/portfolio?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    navigate(`${PATH}/portfolio?page=1`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set("page", newPage.toString());
    const search = searchParams.get("search");
    if (search) {
      params.set("search", search);
    }
    navigate(`${PATH}/portfolio?${params.toString()}`);
  };

  const handleImportItems = async (validItems: any[]) => {
    setIsLoadingItems(true);
    setIsImportModalOpen(false);
    const formData = new FormData();
    formData.append("_action", "import");
    formData.append("items", JSON.stringify(validItems));
    const response = await fetch(window.location.pathname, {
      method: "POST",
      body: formData,
    });
    revalidator.revalidate();
    setIsLoadingItems(false);
    if (response.ok) {
      useToast({
        title: "Items importados correctamente",
        icon: "success",
      });
    } else {
      useToast({ title: "Error al importar items", icon: "error" });
    }
  };

  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-10rem)] overflow-hidden custom-scroll">
        <div className="flex-shrink-0 px-6 pt-6 pb-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Portafolio
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Gestiona los items de tu portafolio
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleOpenImportModal}
                className="flex cursor-pointer items-center space-x-2 px-3 py-2 text-sm text-foreground border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Importar</span>
              </button>
              <button
                onClick={handleCreate}
                className="flex dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 cursor-pointer items-center space-x-2 px-3 py-2 text-sm text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-all duration-200 hover:shadow-md hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Nuevo Item
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(searchInput);
                }
              }}
              className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoadingItems ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  {searchParams.get("search")
                    ? "No se encontraron resultados"
                    : "No hay items en el portafolio"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {searchParams.get("search")
                    ? "Intenta con otros términos de búsqueda"
                    : "Comienza agregando tu primer item"}
                </p>
                {!searchParams.get("search") && (
                  <button
                    onClick={handleCreate}
                    className="inline-flex dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 cursor-pointer items-center space-x-2 px-3 py-2 text-sm text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-all duration-200 hover:shadow-md hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Item
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pb-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 dark:text-gray-500 text-3xl">
                          📦
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 line-clamp-1">
                      {item.name}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 min-h-[2rem]">
                        {item.description}
                      </p>
                    )}

                    {item.price && (
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">
                        {formatPrice(item.price)}
                      </p>
                    )}

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleEdit(item)}
                        className="cursor-pointer flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors text-xs"
                        disabled={deletingItem === item.id}
                      >
                        <Edit className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="cursor-pointer flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        disabled={deletingItem === item.id}
                      >
                        {deletingItem === item.id ? (
                          <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isModalOpen && (
          <PortfolioModal
            item={editingItem}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => {
              setIsModalOpen(false);
              revalidator.revalidate();
            }}
          />
        )}

        {isImportModalOpen && (
          <ImportModal
            isOpen={isImportModalOpen}
            onClose={handleCloseImportModal}
            onSubmit={handleImportItems}
          />
        )}
      </div>
      {/* Footer Fijo con Paginación */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 px-6 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-center items-center gap-3">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[100px] text-center">
              Página {page} de {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
