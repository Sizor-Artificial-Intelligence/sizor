import React, { useMemo, useState } from "react";
import { Folder, File, Search, X, Check } from "lucide-react";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

export interface KnowledgeState {
  selectedFolders: string[];
  selectedFiles: string[];
}

interface FolderItem {
  id: string;
  name: string;
  fullPath?: string;
}

interface FileItem {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  fullPath?: string;
}

interface KnowledgeTabProps {
  value: KnowledgeState;
  onChange: (v: KnowledgeState) => void;
  availableFolders?: FolderItem[];
  availableFiles?: FileItem[];
}

const inputCls =
  "rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background text-sm pl-9 pr-3 py-2";

function KnowledgeSection({
  title,
  icon: Icon,
  items,
  selectedIds,
  onToggle,
  search,
  onSearchChange,
  showResults,
  onShowResults,
  emptyMessage,
  searchPlaceholder,
}: {
  title: string;
  icon: React.ElementType;
  items: Array<{ id: string; name: string; fullPath?: string; fileType?: string }>;
  selectedIds: string[];
  onToggle: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  showResults: boolean;
  onShowResults: (v: boolean) => void;
  emptyMessage: string;
  searchPlaceholder: string;
}) {
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.fullPath && i.fullPath.toLowerCase().includes(q)) ||
        (i.fileType && i.fileType.toLowerCase().includes(q))
    );
  }, [search, items]);

  const selectedData = useMemo(
    () => items.filter((i) => selectedIds.includes(i.id)),
    [items, selectedIds]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h4 className="font-semibold text-foreground">{title}</h4>
        {selectedData.length > 0 && (
          <span className="text-xs text-muted-foreground">
            ({selectedData.length} seleccionada
            {selectedData.length !== 1 ? "s" : ""})
          </span>
        )}
      </div>

      {selectedData.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedData.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-foreground text-sm border border-border"
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[180px]">
                {item.name}
                {item.fileType && (
                  <span className="text-muted-foreground ml-1">
                    ({item.fileType.toUpperCase()})
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(item.id);
                }}
                className="shrink-0 p-0.5 rounded hover:bg-muted-foreground/20 cursor-pointer"
                aria-label="Quitar"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
      ) : (
        <div className="relative" data-knowledge-search>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onShowResults(true);
            }}
            onFocus={() => onShowResults(true)}
            onBlur={() => setTimeout(() => onShowResults(false), 150)}
            className={inputCls}
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                onShowResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {showResults && filtered.length > 0 && (
            <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-popover shadow-xl max-h-48 overflow-y-auto">
              {filtered.slice(0, 15).map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggle(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted transition-colors cursor-pointer",
                      isSelected && "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{item.name}</p>
                        {item.fullPath && item.fullPath !== item.name && (
                          <p className="text-xs text-muted-foreground truncate">
                            {item.fullPath}
                          </p>
                        )}
                        {"fileType" in item && item.fileType && (
                          <p className="text-xs text-muted-foreground">
                            {item.fileType.toUpperCase()}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-foreground shrink-0" />
                    )}
                  </button>
                );
              })}
              {filtered.length > 15 && (
                <p className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
                  Mostrando 15 de {filtered.length}. Busca para filtrar.
                </p>
              )}
            </div>
          )}

          {showResults && search.trim() && filtered.length === 0 && (
            <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-popover p-4 text-center text-sm text-muted-foreground">
              No se encontraron resultados para &quot;{search}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function KnowledgeTab({
  value,
  onChange,
  availableFolders = [],
  availableFiles = [],
}: KnowledgeTabProps) {
  const [folderSearch, setFolderSearch] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [showFolderResults, setShowFolderResults] = useState(false);
  const [showFileResults, setShowFileResults] = useState(false);

  const toggleFolder = (id: string) => {
    const current = value.selectedFolders || [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    onChange({ ...value, selectedFolders: next });
  };

  const toggleFile = (id: string) => {
    const current = value.selectedFiles || [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    onChange({ ...value, selectedFiles: next });
  };

  const foldersWithPath = useMemo(
    () =>
      availableFolders.map((f) => ({
        id: f.id,
        name: f.name,
        fullPath: f.fullPath,
      })),
    [availableFolders]
  );

  const filesWithPath = useMemo(
    () =>
      availableFiles.map((f) => ({
        id: f.id,
        name: f.name,
        fullPath: f.fullPath,
        fileType: f.fileType,
      })),
    [availableFiles]
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Selecciona las carpetas y archivos que el agente podrá consultar para
        responder. El contenido se usará para enriquecer sus respuestas.
      </p>

      <div className="space-y-6">
        <KnowledgeSection
          title="Carpetas"
          icon={Folder}
          items={foldersWithPath}
          selectedIds={value.selectedFolders ?? []}
          onToggle={toggleFolder}
          search={folderSearch}
          onSearchChange={setFolderSearch}
          showResults={showFolderResults}
          onShowResults={setShowFolderResults}
          emptyMessage="No hay carpetas disponibles. Créalas en la sección de Entrenamiento."
          searchPlaceholder={`Buscar entre ${availableFolders.length} carpetas...`}
        />

        <KnowledgeSection
          title="Archivos"
          icon={File}
          items={filesWithPath}
          selectedIds={value.selectedFiles ?? []}
          onToggle={toggleFile}
          search={fileSearch}
          onSearchChange={setFileSearch}
          showResults={showFileResults}
          onShowResults={setShowFileResults}
          emptyMessage="No hay archivos disponibles. Súbelos en la sección de Entrenamiento."
          searchPlaceholder={`Buscar entre ${availableFiles.length} archivos...`}
        />
      </div>
    </div>
  );
}
