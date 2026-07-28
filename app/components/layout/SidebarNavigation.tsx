import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  BarChart3,
  MessageCircle,
  User,
  Brain,
  Settings,
  FolderKey,
  SquarePen,
  Users,
  FolderOpen,
  Inbox,
  ChevronDown,
  ChevronRight,
  Briefcase,
  MessageSquare,
  Shield,
  Building2,
  Key,
  Folders,
  Cloudy,
  Zap,
} from "lucide-react";
import { Link, useMatches } from "react-router";
import usePath from "~/hooks/usePath";
import { useMessages } from "~/contexts/MessagesContext";
import { useSmartInbox } from "~/contexts/SmartInboxContext";
import { useRoutesSidebar } from "~/hooks/useRoutesSidebar";
import { useRequiredPayment } from "~/hooks/useRequiredPayment";
import { CATEGORY_ICONS } from "~/lib/data";

const ICONS = {
  User,
  MessageCircle,
  Brain,
  Settings,
  Folders,
  SquarePen,
  Users,
  FolderOpen,
  Inbox,
  BarChart3,
  Briefcase,
  MessageSquare,
  Shield,
  Building2,
  Key,
  Cloudy,
  Zap,
};

const IconItem: React.FC<{ icon: string; className?: string }> = ({
  icon,
  className,
}) => {
  const IconComponent = ICONS[icon as keyof typeof ICONS];
  if (!IconComponent) {
    return null;
  }
  return <IconComponent className={className} />;
};
interface SidebarNavigationProps {
  isCollapsed?: boolean;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  isCollapsed = false,
}) => {
  const matches = useMatches();
  const PATH = usePath();
  const { unreadMessages } = useMessages();
  const { unreadSmartInbox } = useSmartInbox();
  const menuItems = useRoutesSidebar();
  const validationPayment = useRequiredPayment();
  const requiredPayment = validationPayment.requiredPayment;
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [clickedCategory, setClickedCategory] = useState<string | null>(null);
  const [popoverPositions, setPopoverPositions] = useState<
    Record<string, { top: number; left: number }>
  >({});
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Separar items con y sin categoría
  const { itemsWithoutCategory, itemsByCategory, categoryOrder } =
    useMemo(() => {
      const withoutCategory: typeof menuItems = [];
      const byCategory: Record<string, typeof menuItems> = {};
      const categoryOrderMap = new Map<string, number>();

      menuItems?.forEach((item, index) => {
        if ((item as any).category) {
          const category = (item as any).category;
          if (!byCategory[category]) {
            byCategory[category] = [];
            categoryOrderMap.set(category, index);
          }
          byCategory[category].push(item);
        } else {
          withoutCategory.push(item);
        }
      });

      // Ordenar categorías según su primera aparición
      const sortedCategories = Array.from(categoryOrderMap.entries())
        .sort((a, b) => a[1] - b[1])
        .map(([category]) => category);

      return {
        itemsWithoutCategory: withoutCategory,
        itemsByCategory: byCategory,
        categoryOrder: sortedCategories,
      };
    }, [menuItems]);

  // Verificar si un item está activo
  const isItemActive = useCallback(
    (item: (typeof menuItems)[0]) => {
      const routes = item.nameRoute?.split("|") || [];
      return routes.some((route) => matches[matches.length - 1]?.id === route);
    },
    [matches],
  );

  // Toggle de categoría
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Verificar si alguna categoría tiene items activos (para auto-expandir)
  const hasActiveItemInCategory = useCallback(
    (items: typeof menuItems) => {
      return items.some((item) => isItemActive(item));
    },
    [isItemActive],
  );

  // Auto-expandir categorías que tienen items activos
  useEffect(() => {
    if (isCollapsed) return;

    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      Object.entries(itemsByCategory).forEach(([category, items]) => {
        if (hasActiveItemInCategory(items) && !newSet.has(category)) {
          newSet.add(category);
        }
      });
      return newSet;
    });
  }, [matches, itemsByCategory, isCollapsed, hasActiveItemInCategory]);

  // Cerrar popover al hacer click fuera
  useEffect(() => {
    if (!clickedCategory) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Verificar si el click fue fuera del popover y del botón
      const popover = document.querySelector(
        `[data-popover-category="${clickedCategory}"]`,
      );
      const button = buttonRefs.current[clickedCategory];

      if (
        popover &&
        !popover.contains(target) &&
        button &&
        !button.contains(target)
      ) {
        setClickedCategory(null);
        setPopoverPositions((prev) => {
          const newPositions = { ...prev };
          delete newPositions[clickedCategory];
          return newPositions;
        });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [clickedCategory]);

  // Renderizar un item individual
  const renderMenuItem = (item: (typeof menuItems)[0]) => {
    const active = isItemActive(item);
    const isMessages = item.key === "chat";
    const isSmartInbox = item.key === "smart-inbox";

    return (
      <Link
        to={`${PATH}/${item.to}${item.to ? "/" : ""}`}
        key={item.key}
        onClick={(e) => {
          if (requiredPayment && item?.key !== "dashboard") {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className={`
          relative group flex items-center rounded-lg ${
            requiredPayment && item?.key !== "dashboard"
              ? "cursor-not-allowed"
              : "cursor-pointer"
          } transition-all duration-200
          ${isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3"}
          ${
            active
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium shadow-sm border border-blue-200 dark:border-blue-800"
              : !requiredPayment
                ? "text-gray-700 dark:text-gray-300 dark:hover:border-blue-800 hover:bg-white hover:border-blue-100 border border-transparent dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                : ""
          }
        `}
        title={isCollapsed ? item.label : undefined}
      >
        {requiredPayment && item?.key !== "dashboard" && (
          <div className="absolute rounded-lg top-0 left-0 w-full h-full bg-black/50 z-50 flex items-center justify-center"></div>
        )}
        <span
          className={`transition-colors relative duration-200 ${
            active
              ? "text-blue-600 dark:text-blue-400"
              : !requiredPayment
                ? "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                : ""
          } ${!isCollapsed ? "mr-3" : ""}`}
        >
          <IconItem icon={item.icon} className="w-5 h-5" />
          {isMessages && unreadMessages > 0 && (
            <span className="absolute -top-2 right-2 bg-red-500 text-white rounded-full w-auto h-auto px-0.5 min-w-4 min-h-4 flex items-center justify-center text-[10px]">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </span>
          )}
          {isSmartInbox && unreadSmartInbox > 0 && (
            <span className="absolute -top-2 right-2 bg-red-500 text-white rounded-full w-auto h-auto px-0.5 min-w-4 min-h-4 flex items-center justify-center text-[10px]">
              {unreadSmartInbox > 99 ? "99+" : unreadSmartInbox}
            </span>
          )}
        </span>
        <div
          className={`transition-all duration-300 justify-between flex items-center w-full ease-in-out overflow-hidden ${
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          }`}
        >
          <span className="transition-colors duration-200 whitespace-nowrap">
            {item.label}
          </span>
          {active && (
            <div className="ml-auto w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
          )}
        </div>
      </Link>
    );
  };

  // Renderizar grupo de categoría
  const renderCategoryGroup = (category: string, items: typeof menuItems) => {
    const isExpanded = expandedCategories.has(category);
    const hasActive = hasActiveItemInCategory(items);
    const isHovered = hoveredCategory === category;
    const isClicked = clickedCategory === category;
    const shouldShowPopover = isCollapsed && (isHovered || isClicked);
    const popoverPosition = popoverPositions[category];

    const handleMouseEnter = (e: React.MouseEvent) => {
      if (isCollapsed) {
        const target = e.currentTarget as HTMLElement;
        const button = target.querySelector("button") || target;
        const rect = button.getBoundingClientRect();
        setPopoverPositions((prev) => ({
          ...prev,
          [category]: {
            top: rect.top,
            left: rect.right + 8, // 8px = ml-2
          },
        }));
        setHoveredCategory(category);
      }
    };

    const handleMouseLeave = () => {
      if (isCollapsed && !isClicked) {
        // Solo cerrar si no está abierto por click
        setHoveredCategory(null);
        setPopoverPositions((prev) => {
          const newPositions = { ...prev };
          delete newPositions[category];
          return newPositions;
        });
      }
    };

    return (
      <div
        key={category}
        className="space-y-1 relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          ref={(el) => {
            buttonRefs.current[category] = el;
          }}
          onClick={(e) => {
            if (isCollapsed) {
              // Cuando está colapsado, mostrar/ocultar el popover al hacer click
              e.stopPropagation();
              if (clickedCategory === category) {
                // Si ya está abierto, cerrarlo
                setClickedCategory(null);
                setPopoverPositions((prev) => {
                  const newPositions = { ...prev };
                  delete newPositions[category];
                  return newPositions;
                });
              } else {
                // Abrir el popover
                handleMouseEnter(e as any);
                setClickedCategory(category);
              }
            } else {
              // Cuando está expandido, toggle de la categoría
              toggleCategory(category);
            }
          }}
          onMouseEnter={(e) => {
            if (isCollapsed) {
              handleMouseEnter(e as any);
            }
          }}
          className={`
            w-full flex items-center rounded-lg transition-all duration-200 cursor-pointer
            ${isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3"}
            ${
              hasActive
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium shadow-sm border border-blue-200 dark:border-blue-800"
                : "text-gray-700 dark:text-gray-300 hover:bg-white hover:border-blue-100 border border-transparent dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
            }
          `}
          title={isCollapsed ? category : undefined}
        >
          {/* Icono siempre visible */}
          <span
            className={`transition-colors duration-200 ${
              hasActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400"
            } ${!isCollapsed ? "mr-3" : ""}`}
          >
            <IconItem
              icon={CATEGORY_ICONS[category] || "Briefcase"}
              className="w-5 h-5"
            />
          </span>
          {!isCollapsed && (
            <>
              <span className="mr-3 text-sm text-left font-semibold flex-1">
                {category}
              </span>
              <span
                className={`transition-colors duration-200 ${
                  hasActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </span>
            </>
          )}
        </button>
        {/* Subitems cuando está expandido (no colapsado) */}
        {!isCollapsed && isExpanded && (
          <div className="ml-4 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
            {items.map((item) => renderMenuItem(item))}
          </div>
        )}
        {/* Popover con subitems cuando está colapsado y se hace hover o click */}
        {shouldShowPopover && (
          <div
            data-popover-category={category}
            className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[200px]"
            style={
              popoverPosition
                ? {
                    top: `${popoverPosition.top}px`,
                    left: `${popoverPosition.left}px`,
                  }
                : {
                    top: "0px",
                    left: "0px",
                    opacity: 0,
                    pointerEvents: "none",
                  }
            }
            onMouseEnter={() => {
              setHoveredCategory(category);
            }}
            onMouseLeave={() => {
              if (!isClicked) {
                // Solo cerrar si no está abierto por click
                setHoveredCategory(null);
                setPopoverPositions((prev) => {
                  const newPositions = { ...prev };
                  delete newPositions[category];
                  return newPositions;
                });
              }
            }}
            onClick={(e) => {
              // Cerrar el popover al hacer click en un item
              setClickedCategory(null);
            }}
          >
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {category}
              </span>
            </div>
            <div className="space-y-1">
              {items.map((item) => {
                const active = isItemActive(item);
                const isMessages = item.key === "chat";
                const isSmartInbox = item.key === "smart-inbox";

                return (
                  <Link
                    to={`${PATH}/${item.to}${item.to ? "/" : ""}`}
                    key={item.key}
                    onClick={(e) => {
                      if (requiredPayment && item?.key !== "dashboard") {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                      setHoveredCategory(null);
                    }}
                    className={`
                      relative group flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                        requiredPayment && item?.key !== "dashboard"
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      }
                      ${
                        active
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }
                    `}
                  >
                    {requiredPayment && item?.key !== "dashboard" && (
                      <div className="absolute rounded-lg top-0 left-0 w-full h-full bg-black/50 z-50 flex items-center justify-center"></div>
                    )}
                    <span
                      className={`transition-colors relative duration-200 mr-3 ${
                        active
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <IconItem icon={item.icon} className="w-4 h-4" />
                      {isMessages && unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-auto h-auto px-0.5 min-w-3 min-h-3 flex items-center justify-center text-[9px]">
                          {unreadMessages > 99 ? "99+" : unreadMessages}
                        </span>
                      )}
                      {isSmartInbox && unreadSmartInbox > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-auto h-auto px-0.5 min-w-3 min-h-3 flex items-center justify-center text-[9px]">
                          {unreadSmartInbox > 99 ? "99+" : unreadSmartInbox}
                        </span>
                      )}
                    </span>
                    <span className="text-sm whitespace-nowrap">
                      {item.label}
                    </span>
                    {active && (
                      <div className="ml-auto w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <nav
      className={`flex-1 min-h-0 py-4 overflow-y-auto overflow-x-hidden custom-scroll pb-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent ${isCollapsed ? "px-2" : "px-4"}`}
    >
      <div className="space-y-1">
        {/* Items sin categoría */}
        {itemsWithoutCategory.map((item) => renderMenuItem(item))}

        {/* Grupos de categoría */}
        {categoryOrder.map((category) =>
          renderCategoryGroup(category, itemsByCategory[category]),
        )}
      </div>
    </nav>
  );
};

export default SidebarNavigation;
