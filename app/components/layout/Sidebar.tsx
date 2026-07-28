import React from "react";
import SidebarHeader from "./SidebarHeader";
import SidebarNavigation from "./SidebarNavigation";
import SidebarBottom from "./SidebarBottom";
import CompanySwitcher from "./CompanySwitcher";

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  onClose: () => void;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed,
  isMobile,
  onClose,
  onToggleCollapse,
}) => {
  const [expandedMenus, setExpandedMenus] = React.useState<{
    [key: string]: boolean;
  }>({});

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-50 bg-gray-100  dark:bg-gray-900 border-gray-300 dark:border-gray-700 flex flex-col shadow-lg
        lg:translate-x-0 lg:static lg:inset-0 lg:shadow-none
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        ${isCollapsed ? "w-16" : "w-64"}
      `}
      style={{
        transition:
          "transform 400ms cubic-bezier(0.4, 0, 0.2, 1), width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        willChange: "transform, width",
      }}
    >
      {/* Header and Navigation - Main content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden dark:border-r dark:border-gray-700">
        <div
          className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ease-out ${
            isOpen || !isMobile
              ? "translate-x-0 opacity-100"
              : "-translate-x-4 opacity-0"
          }`}
          style={{
            transition:
              "transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            transitionDelay: isOpen ? "100ms" : "0ms",
          }}
        >
          <SidebarHeader
            isMobile={isMobile}
            isCollapsed={isCollapsed}
            onClose={onClose}
            onToggleCollapse={onToggleCollapse}
          />

          <CompanySwitcher isCollapsed={isCollapsed} />

          <SidebarNavigation isCollapsed={isCollapsed} />
        </div>

        <div
          className={`transition-all duration-300 ease-out overflow-hidden ${
            isCollapsed ? "max-h-0 opacity-0" : "max-h-screen opacity-100"
          }`}
          style={{
            transition:
              "max-height 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* <QuickAccessSection
            isExpanded={expandedMenus["quick-access"] || false}
            onToggle={() => toggleMenu("quick-access")}
          /> */}
        </div>
      </div>

      {/* SidebarBottom - Always at the bottom */}
      <div
        className={`transition-all duration-300 ease-out ${
          isOpen || !isMobile
            ? "translate-x-0 opacity-100"
            : "-translate-x-4 opacity-0"
        }`}
        style={{
          transition:
            "transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          transitionDelay: isOpen ? "150ms" : "0ms",
        }}
      >
        <SidebarBottom isCollapsed={isCollapsed} />
      </div>
    </div>
  );
};

export default Sidebar;
