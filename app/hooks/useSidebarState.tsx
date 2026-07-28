import { useState, useEffect } from "react";

export function useSidebarState() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      try {
        const saved = localStorage.getItem("sidebar-collapsed");
        const result = saved ? JSON.parse(saved) : false;
        setIsSidebarCollapsed(result);
      } catch (error) {
        setIsSidebarCollapsed(false);
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(
          "sidebar-collapsed",
          JSON.stringify(isSidebarCollapsed)
        );
      } catch (error) {}
    }
  }, [isSidebarCollapsed, isInitialized]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return {
    isSidebarCollapsed,
    toggleSidebar,
    setIsSidebarCollapsed,
    isInitialized,
  };
}
