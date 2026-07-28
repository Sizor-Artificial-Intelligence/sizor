import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "~/hooks/useTheme";

interface ThemeToggleProps {
  isMobile?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isMobile = false }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        cursor-pointer rounded-lg transition-all duration-200 flex items-center group hover:shadow-sm
        ${
          isDark
            ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
            : "bg-gray-700 text-white hover:bg-gray-200"
        }
        ${isMobile ? "p-2" : "px-3 py-2"}
      `}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? (
        <Sun
          className={`w-4 h-4 group-hover:scale-110 transition-transform duration-200 ${!isMobile ? "mr-2" : ""}`}
        />
      ) : (
        <Moon
          className={`w-4 h-4 group-hover:scale-110 transition-transform duration-200 ${!isMobile ? "mr-2" : ""}`}
        />
      )}
      {!isMobile && (
        <span className="text-sm font-medium">
          {isDark ? "Claro" : "Oscuro"}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
