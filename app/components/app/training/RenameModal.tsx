import { useEffect, useState, useRef } from "react";

interface RenameModalProps {
  isOpen: boolean;
  currentName: string;
  originalName: string;
  onNameChange: (name: string) => void;
  onRename: () => void;
  onClose: () => void;
  isLoading?: boolean;
  type: "folder" | "file";
}

export default function RenameModal({
  isOpen,
  currentName,
  originalName,
  onNameChange,
  onRename,
  onClose,
  isLoading = false,
  type,
}: RenameModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Pequeño delay para que el DOM se actualice antes de la animación
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Esperar a que termine la animación de salida antes de desmontar
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Seleccionar todo el texto cuando el modal esté completamente visible
  useEffect(() => {
    if (isAnimating && inputRef.current) {
      // Pequeño delay para asegurar que el input esté enfocado
      setTimeout(() => {
        inputRef.current?.select();
      }, 50);
    }
  }, [isAnimating]);

  if (!shouldRender) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className={`fixed inset-0 bg-black/20 dark:bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-200 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl transition-all duration-200 ${
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Cambiar nombre de {type === "folder" ? "carpeta" : "archivo"}
        </h2>
        <input
          ref={inputRef}
          type="text"
          value={currentName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={`Nombre del ${type === "folder" ? "carpeta" : "archivo"}`}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onRename();
            } else if (e.key === "Escape") {
              onClose();
            }
          }}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onRename}
            disabled={
              !currentName.trim() ||
              isLoading ||
              currentName.trim() === originalName.trim()
            }
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Guardando...</span>
              </>
            ) : (
              "Guardar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

