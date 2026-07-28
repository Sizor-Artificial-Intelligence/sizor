import React from "react";
import { X, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { APP_NAME } from "~/config/app";
import { useLicense } from "~/hooks/useLicense";
import { Link } from "react-router";
import usePath from "~/hooks/usePath";

interface SidebarHeaderProps {
  isMobile: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse?: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isMobile,
  isCollapsed,
  onClose,
  onToggleCollapse,
}) => {
  const license = useLicense();
  const PATH = usePath();
  return (
    <div
      className={`flex items-center bg-gray-900 h-[56px] border-b border-r border-gray-800 dark:border-gray-700 ${isCollapsed ? "px-3 justify-center" : "px-6"}`}
    >
      <div className="flex items-center space-x-2 w-[80%]">
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          }`}
        >
          {license?.nameEnterprise || license?.isSon ? (
            // Diseño Enterprise
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-white truncate dark:text-gray-100 font-bold text-sm whitespace-nowrap">
                  {license?.nameEnterprise || license?.nameParent}
                </span>
              </div>
              <span className="text-gray-300 dark:text-gray-400 text-xs whitespace-nowrap">
                Powered by {APP_NAME}
              </span>
            </div>
          ) : (
            // Diseño Normal
            <div className="flex items-center space-x-2">
              <Link to={`${PATH}/`} className="text-sm whitespace-nowrap">
                <img
                  src="/images/logo-letters-white.png"
                  alt="Sizor"
                  className="w-[100px]"
                />
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center">
        {!isMobile && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-colors duration-200"
            title={isCollapsed ? "Extraer menú" : "Contraer menú"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-white dark:text-gray-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-white dark:text-gray-400" />
            )}
          </button>
        )}

        {isMobile && !isCollapsed && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SidebarHeader;
