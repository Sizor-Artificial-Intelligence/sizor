import { useEffect, useRef, useState } from "react";
import { FolderPlus, Upload, Edit } from "lucide-react";

type ContextMenuType = "empty" | "folder" | "file";

interface ContextMenuProps {
  x: number;
  y: number;
  type: ContextMenuType;
  onClose: () => void;
  onCreateFolder?: () => void;
  onUploadFile?: () => void;
  onRename?: () => void;
}

export default function ContextMenu({
  x,
  y,
  type,
  onClose,
  onCreateFolder,
  onUploadFile,
  onRename,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handleCreateFolder = () => {
    onCreateFolder?.();
    onClose();
  };

  const handleUploadFile = () => {
    onUploadFile?.();
    onClose();
  };

  const handleRename = () => {
    onRename?.();
    onClose();
  };

  // Ajustar posición para que no se salga de la pantalla
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      // Ajustar horizontalmente
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }
      if (adjustedX < 10) {
        adjustedX = 10;
      }

      // Ajustar verticalmente
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }
      if (adjustedY < 10) {
        adjustedY = 10;
      }

      setAdjustedPosition({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[200px]"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      {type === "empty" && (
        <>
          {onCreateFolder && (
            <button
              onClick={handleCreateFolder}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Crear carpeta</span>
            </button>
          )}
          {onUploadFile && (
            <button
              onClick={handleUploadFile}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Subir archivo</span>
            </button>
          )}
        </>
      )}
      {(type === "folder" || type === "file") && (
        <>
          {onRename && (
            <button
              onClick={handleRename}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>Cambiar nombre</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
