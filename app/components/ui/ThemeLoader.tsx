import React from "react";

interface ThemeLoaderProps {
  isDark?: boolean;
}

const ThemeLoader: React.FC<ThemeLoaderProps> = ({ isDark = false }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
      <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
    </div>
  );
};

export default ThemeLoader;
