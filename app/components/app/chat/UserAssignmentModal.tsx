import React, { useState, useEffect } from "react";
import { X, User, Check, Loader2 } from "lucide-react";
import type { User as UserType } from "~/types/schema";
import { executeSQL } from "~/lib/utils.functions";
import usePath from "~/hooks/usePath";
import { useCompany } from "~/hooks/useCompany";

interface UserAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: UserType | null) => void;
  selectedUser: UserType | null;
}

const UserAssignmentModal: React.FC<UserAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
  selectedUser,
}) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const PATH = usePath();
  const company = useCompany();
  const companyId = company?.id;

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen && companyId) {
      fetchUsers();
    }
  }, [isOpen, companyId]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

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
      } else {
        setError("No se pudieron cargar los usuarios");
        setUsers([]);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Error al cargar los usuarios");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: UserType) => {
    setLoading(true);
    onSelectUser(user);
  };

  const handleRemoveSelection = () => {
    onSelectUser(null);
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
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Asignar Usuario
              </h2>
              <p className="text-sm text-muted-foreground">
                Elige un usuario para asignar este contacto
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

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Cargando usuarios...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Error al cargar usuarios
              </h3>
              <p className="text-muted-foreground text-center mb-4">{error}</p>
              <button
                onClick={fetchUsers}
                className="cursor-pointer px-4 py-2 text-sm text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No hay usuarios disponibles
              </h3>
              <p className="text-muted-foreground text-center">
                No se encontraron usuarios en esta empresa.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedUser && (
                <button
                  onClick={handleRemoveSelection}
                  className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <X className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-500 font-medium">
                      Sin usuario asignado
                    </span>
                  </div>
                </button>
              )}

              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                    selectedUser?.id === user.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-foreground">
                          {user.firstName} {user.lastName || ""}
                        </h3>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-muted-foreground">
                              Email:
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {user.email || "No especificado"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-muted-foreground">
                              Teléfono:
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {user.phone || "No especificado"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {selectedUser?.id === user.id && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {users.length > 0 && (
              <span>
                {users.length} usuario{users.length !== 1 ? "s" : ""} disponible
                {users.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserAssignmentModal;
