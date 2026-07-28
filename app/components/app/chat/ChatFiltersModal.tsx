import React, { useState, useEffect } from "react";
import {
  X,
  Filter,
  MessageSquare,
  User,
  Users,
  Check,
  Loader2,
} from "lucide-react";
import { executeSQL } from "~/lib/utils.functions";
import usePath from "~/hooks/usePath";
import { useCompany } from "~/hooks/useCompany";
import type { User as UserType } from "~/types/schema";

interface ChatFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ChatFilters) => void;
  currentFilters: ChatFilters;
}

export interface ChatFilters {
  channels: string[];
  assignmentType: "all" | "my" | "specific";
  specificUsers: string[];
}

const ChatFiltersModal: React.FC<ChatFiltersModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
}) => {
  const [filters, setFilters] = useState<ChatFilters>(currentFilters);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const PATH = usePath();
  const company = useCompany();
  const companyId = company?.id;

  const availableChannels = [
    {
      value: "Whatsapp",
      label: "WhatsApp",
      icon: (
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
          </svg>
        </div>
      ),
    },
    {
      value: "Facebook",
      label: "Facebook",
      icon: (
        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </div>
      ),
    },
    {
      value: "Instagram",
      label: "Instagram",
      icon: (
        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </div>
      ),
    },
  ];

  useEffect(() => {
    if (isOpen && companyId) {
      fetchUsers();
    }
  }, [isOpen, companyId]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const sql = `
        SELECT u.* FROM User u
        INNER JOIN UserCompany uc ON u.id = uc.userId
        WHERE uc.companyId = '${companyId}'
        ORDER BY u.firstName ASC, u.lastName ASC
      `;

      const result = await executeSQL(PATH, sql, true);

      if (result && result.runScript && result.response) {
        setUsers(result.response);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleFilterChange = (key: keyof ChatFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleChannelToggle = (channel: string) => {
    setFilters((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const handleUserToggle = (userId: string) => {
    setFilters((prev) => ({
      ...prev,
      specificUsers: prev.specificUsers.includes(userId)
        ? prev.specificUsers.filter((id) => id !== userId)
        : [...prev.specificUsers, userId],
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters: ChatFilters = {
      channels: [],
      assignmentType: "all",
      specificUsers: [],
    };
    setFilters(clearedFilters);
    onApplyFilters(clearedFilters);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Filtros de Chat
              </h2>
              <p className="text-sm text-muted-foreground">
                Filtra conversaciones por canal y asignación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors duration-200 cursor-pointer"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Canal
            </label>
            <div className="grid grid-cols-2 gap-3">
              {availableChannels.map((channel) => (
                <button
                  key={channel.value}
                  onClick={() => handleChannelToggle(channel.value)}
                  className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                    filters.channels.includes(channel.value)
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {channel.icon}
                    <span className="text-sm font-medium text-foreground">
                      {channel.label}
                    </span>
                    {filters.channels.includes(channel.value) && (
                      <Check className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              <User className="w-4 h-4 inline mr-2" />
              Asignación
            </label>
            <div className="space-y-3">
              <button
                onClick={() => handleFilterChange("assignmentType", "all")}
                className={`w-full p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                  filters.assignmentType === "all"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Todas las conversaciones
                  </span>
                  {filters.assignmentType === "all" && (
                    <Check className="w-4 h-4 text-primary ml-auto" />
                  )}
                </div>
              </button>

              <button
                onClick={() => handleFilterChange("assignmentType", "my")}
                className={`w-full p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                  filters.assignmentType === "my"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Mis asignaciones
                  </span>
                  {filters.assignmentType === "my" && (
                    <Check className="w-4 h-4 text-primary ml-auto" />
                  )}
                </div>
              </button>

              <button
                onClick={() => handleFilterChange("assignmentType", "specific")}
                className={`w-full p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                  filters.assignmentType === "specific"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Usuarios específicos
                  </span>
                  {filters.assignmentType === "specific" && (
                    <Check className="w-4 h-4 text-primary ml-auto" />
                  )}
                </div>
              </button>
            </div>

            {filters.assignmentType === "specific" && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium text-foreground mb-3">
                  Seleccionar usuarios:
                </h4>
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 text-primary animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">
                      Cargando usuarios...
                    </span>
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay usuarios disponibles
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserToggle(user.id)}
                        className={`w-full p-2 rounded-md border transition-all duration-200 cursor-pointer ${
                          filters.specificUsers.includes(user.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-accent/50"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm text-foreground">
                            {user.firstName} {user.lastName || ""}
                          </span>
                          {filters.specificUsers.includes(user.id) && (
                            <Check className="w-4 h-4 text-primary ml-auto" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
          >
            Limpiar filtros
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-foreground border border-border rounded-md hover:bg-accent transition-colors duration-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 text-sm text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors duration-200 cursor-pointer"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatFiltersModal;
