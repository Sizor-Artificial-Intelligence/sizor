import React, { useEffect, useRef } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  MessageSquare,
  FileText,
  Users,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useSearchParams,
  useRevalidator,
} from "react-router";
import useToast from "~/hooks/useToast";
import { getFormatIsoDate } from "~/lib/utils.functions";
import usePath from "~/hooks/usePath";
import { useNotifications } from "~/contexts/NotificationsContext";
import type { Notification } from "~/types/schema";

const NotificationsPage: React.FC = () => {
  const loaderData = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const notifications: Notification[] = loaderData?.notifications || [];
  const pagination = loaderData?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  };

  const fetcher = useFetcher();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const PATH = usePath();
  const { decrementNotifications, resetNotifications, setUnreadNotifications } =
    useNotifications();
  const currentPage = pagination.currentPage;
  const lastFetcherState = useRef<string>("idle");

  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      lastFetcherState.current !== "idle" &&
      fetcher.data
    ) {
      if (fetcher.data.success) {
        useToast({ title: fetcher.data.message, icon: "success" });
        revalidator.revalidate();
      } else if (fetcher.data.message) {
        useToast({ title: fetcher.data.message, icon: "error" });
      }
    }
    lastFetcherState.current = fetcher.state;
  }, [fetcher.state, fetcher.data, revalidator]);

  useEffect(() => {
    if (
      notifications.length === 0 &&
      currentPage > 1 &&
      pagination.totalCount > 0
    ) {
      setSearchParams({ page: (currentPage - 1).toString() });
    }
  }, [
    notifications.length,
    currentPage,
    pagination.totalCount,
    setSearchParams,
  ]);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const totalPages = pagination.totalPages;
    const current = currentPage;
    const delta = 2; // Número de páginas a mostrar a cada lado de la actual
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(totalPages - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const handleMarkAsRead = (notificationId: string) => {
    const formData = new FormData();
    formData.append("_action", "markAsRead");
    formData.append("notificationId", notificationId);
    fetcher.submit(formData, { method: "POST" });
    // Decrementar contador de notificaciones no leídas
    decrementNotifications();
  };

  const handleMarkAllAsRead = () => {
    const formData = new FormData();
    formData.append("_action", "markAllAsRead");
    fetcher.submit(formData, { method: "POST" });
    // Resetear contador de notificaciones no leídas
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    setUnreadNotifications(0);
  };

  const handleDelete = (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId);
    const formData = new FormData();
    formData.append("notificationId", notificationId);
    fetcher.submit(formData, { method: "DELETE" });
    // Si la notificación no estaba leída, decrementar contador
    if (notification && !notification.isRead) {
      decrementNotifications();
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.path) {
      navigate(`${PATH}/${notification.path?.split("app/")[1]}`);
    }
  };

  const getNotificationIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("formulario")) return FileText;
    if (lowerTitle.includes("cita") || lowerTitle.includes("agenda"))
      return Calendar;
    if (lowerTitle.includes("chat") || lowerTitle.includes("mensaje"))
      return MessageSquare;
    if (lowerTitle.includes("usuario")) return Users;
    return Info;
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const startIndex = (currentPage - 1) * pagination.limit;
  const endIndex = startIndex + pagination.limit;

  return (
    <div className="h-full">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Notificaciones
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Mantente al día con las actualizaciones de tu cuenta
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                disabled={fetcher.state !== "idle"}
              >
                <CheckCheck className="w-4 h-4" />
                Marcar todas como leídas
              </button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
                <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  No hay notificaciones
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Cuando recibas notificaciones, aparecerán aquí
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2 h-[calc(85vh-200px)] overflow-y-auto custom-scroll">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.title);
                return (
                  <div
                    key={notification.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md ${
                      notification.isRead
                        ? "border-gray-200 dark:border-gray-700"
                        : "border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10"
                    }`}
                  >
                    <div className="p-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg flex-shrink-0 ${
                            notification.isRead
                              ? "bg-gray-100 dark:bg-gray-700"
                              : "bg-blue-100 dark:bg-blue-900/30"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 ${
                              notification.isRead
                                ? "text-gray-600 dark:text-gray-400"
                                : "text-blue-600 dark:text-blue-400"
                            }`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="flex-1">
                              <h3
                                className={`font-semibold text-sm mb-0.5 ${
                                  notification.isRead
                                    ? "text-gray-900 dark:text-white"
                                    : "text-blue-900 dark:text-blue-100"
                                }`}
                              >
                                {notification.title}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {getFormatIsoDate(notification.createdAt)}
                            </span>
                            <div className="flex items-center gap-1">
                              {notification.path && (
                                <button
                                  onClick={() =>
                                    handleNotificationClick(notification)
                                  }
                                  className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200 px-2 py-1"
                                >
                                  Ver
                                </button>
                              )}
                              {!notification.isRead && (
                                <button
                                  onClick={() =>
                                    handleMarkAsRead(notification.id)
                                  }
                                  className="cursor-pointer p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all duration-200"
                                  title="Marcar como leída"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notification.id)}
                                className="cursor-pointer p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-200"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {startIndex + 1} -{" "}
                  {Math.min(endIndex, pagination.totalCount)} de{" "}
                  {pagination.totalCount} notificaciones
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentPage === 1
                        ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => {
                      if (page === "...") {
                        return (
                          <span
                            key={`dots-${index}`}
                            className="px-2 text-gray-500 dark:text-gray-400"
                          >
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page as number)}
                          className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentPage === pagination.totalPages
                        ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
