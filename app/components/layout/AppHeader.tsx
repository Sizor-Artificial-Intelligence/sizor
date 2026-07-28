import React, { useState } from "react";
import { Bell, Menu, UserPlus, LogOut, ChevronDown } from "lucide-react";
import { useUser } from "~/hooks/useUser";
import { Form, Link } from "react-router";
import { ThemeToggle } from "~/components/ui";
import { useNotifications } from "~/contexts/NotificationsContext";
import usePath from "~/hooks/usePath";

interface AppHeaderProps {
  isMobile: boolean;
  onMenuClick: () => void;
  onInviteMembers?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  isMobile,
  onMenuClick,
  onInviteMembers,
}) => {
  const user = useUser();
  const PATH = usePath();
  const { unreadNotifications } = useNotifications();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSearchExpanded) {
        const target = event.target as Element;
        if (!target.closest(".search-container")) {
          setIsSearchExpanded(false);
        }
      }
    };

    if (isSearchExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchExpanded]);
  return (
    <header className="bg-gray-900 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-2 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {isMobile && (
            <button
              onClick={onMenuClick}
              className="p-2 cursor-pointer rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <Menu className="w-5 h-5 text-white dark:text-gray-300" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle isMobile={isMobile} />

          {/* Notifications Button */}
          <Link
            to={`${PATH}/notifications`}
            className="relative p-2 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            title="Notificaciones"
          >
            <Bell className="w-5 h-5 text-white dark:text-gray-300" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-auto h-auto px-1 min-w-5 min-h-5 flex items-center justify-center text-xs font-medium">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </Link>

          {/* Invite Button - Responsive */}
          {/* <button
            onClick={onInviteMembers}
            className={`cursor-pointer bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 flex items-center group hover:shadow-sm ${
              isMobile ? "p-2" : "px-4 py-2"
            }`}
            title={isMobile ? "Invitar miembros" : undefined}
          >
            <UserPlus
              className={`w-4 h-4 group-hover:scale-110 transition-transform duration-200 ${!isMobile ? "mr-2" : ""}`}
            />
            {!isMobile && "Invitar miembros"}
          </button> */}

          {isMobile ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex cursor-pointer items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                  <img
                    src={user?.avatar}
                    alt="avatar"
                    className="w-full h-full rounded-full"
                  />
                </div>
                <ChevronDown className="w-4 h-4 text-white dark:text-gray-300" />
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm">
                          <img
                            src={user?.avatar}
                            alt="avatar"
                            className="w-full h-full rounded-full"
                          />
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {user?.firstName || ""} {user?.lastName || ""}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {user?.isSuperAdmin ? "Administrador" : "Usuario"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      <div className="px-4 py-2">
                        <ThemeToggle isMobile={false} />
                      </div>
                      <Form method="post" action="/auth/logout">
                        <button
                          type="submit"
                          className="w-full cursor-pointer flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 group"
                        >
                          <LogOut className="w-4 h-4 mr-3 text-gray-600 dark:text-gray-400 group-hover:text-red-600 transition-colors duration-200" />
                          Cerrar sesión
                        </button>
                      </Form>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3 pl-3 border-l border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                <img
                  src={user?.avatar}
                  alt="avatar"
                  className="w-full h-full rounded-full"
                />
              </div>
              <div className="text-sm">
                <div className="font-medium text-white dark:text-gray-100">
                  {user?.firstName || ""} {user?.lastName || ""}
                </div>
                <div className="text-gray-400 dark:text-gray-400 text-xs">
                  {user?.isSuperAdmin ? "Administrador" : "Usuario"}
                </div>
              </div>
              <Form method="post" action="/auth/logout">
                <button
                  type="submit"
                  className="p-2 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 group"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4 text-gray-300 dark:text-gray-400 group-hover:text-red-600 transition-colors duration-200" />
                </button>
              </Form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
