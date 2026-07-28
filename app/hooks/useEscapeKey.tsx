import { useEffect } from "react";

export default function useEscapeKey(callback: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        callback(); // Llama a la función cuando se presiona "ESC"
      }
    };

    // Añadir el event listener cuando el componente se monta
    document.addEventListener("keydown", handleKeyDown);

    // Limpiar el event listener cuando el componente se desmonte
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [callback]);
}
