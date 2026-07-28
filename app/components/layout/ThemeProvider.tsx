import React, { useState, useEffect } from "react";
import { useTheme } from "~/hooks/useTheme";
import { ThemeLoader } from "~/components/ui";

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { isLoading, isDark } = useTheme();
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    // Solo mostrar el loader en la carga inicial, no durante la navegación
    const isInitialLoad = !sessionStorage.getItem("hasLoaded");

    if (isInitialLoad) {
      sessionStorage.setItem("hasLoaded", "true");

      // Ocultar el loader después de que el tema se cargue
      if (!isLoading) {
        const timer = setTimeout(() => {
          setShowLoader(false);
        }, 300); // Pequeño retardo para asegurar una transición suave

        return () => clearTimeout(timer);
      }
    } else {
      // Si no es la carga inicial, no mostrar el loader en absoluto
      setShowLoader(false);
    }
  }, [isLoading]);

  // Mostrar el loader solo durante la detección inicial del tema en la carga de la página
  if (showLoader && isLoading) {
    return <ThemeLoader isDark={isDark} />;
  }

  return <>{children}</>;
};

export default ThemeProvider;
