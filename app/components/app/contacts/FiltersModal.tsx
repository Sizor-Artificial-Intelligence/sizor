import React, { useState } from "react";
import { X, Filter, Mail, Phone } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui";

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}

const FiltersModal: React.FC<FiltersModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
}) => {
  const [filters, setFilters] = useState({
    origin: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    hasEmail: false,
    hasPhone: false,
    sentiment: "",
    leadTemperature: "",
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      origin: "",
      status: "",
      dateFrom: "",
      dateTo: "",
      hasEmail: false,
      hasPhone: false,
      sentiment: "",
      leadTemperature: "",
    };
    setFilters(clearedFilters);
    onApplyFilters(clearedFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Filtros de Contactos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors duration-200 cursor-pointer"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Origen
            </label>
            <Select
              value={filters.origin}
              onValueChange={(value) => handleFilterChange("origin", value)}
            >
              <SelectTrigger className="w-full cursor-pointer px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring">
                <SelectValue placeholder="Todos los orígenes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Estado
            </label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger className="w-full cursor-pointer px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Fecha de creación
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    handleFilterChange("dateFrom", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
            </div>
          </div>

          {/* Sentimiento */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Sentimiento
            </label>
            <Select
              value={filters.sentiment}
              onValueChange={(value) => handleFilterChange("sentiment", value)}
            >
              <SelectTrigger className="w-full cursor-pointer px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring">
                <SelectValue placeholder="Todos los sentimientos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="happy">Feliz</SelectItem>
                <SelectItem value="sad">Triste</SelectItem>
                <SelectItem value="frustrated">Frustrado</SelectItem>
                <SelectItem value="angry">Enojado</SelectItem>
                <SelectItem value="calm">Calmado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calentamiento del Lead */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Calentamiento del Lead
            </label>
            <Select
              value={filters.leadTemperature}
              onValueChange={(value) => handleFilterChange("leadTemperature", value)}
            >
              <SelectTrigger className="w-full cursor-pointer px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring">
                <SelectValue placeholder="Todos los calentamientos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cold">Frío</SelectItem>
                <SelectItem value="warm">Tibio</SelectItem>
                <SelectItem value="hot">Caliente</SelectItem>
                <SelectItem value="very_hot">Muy Caliente</SelectItem>
                <SelectItem value="very_cold">Muy Frío</SelectItem>
                <SelectItem value="not_applicable">No Aplicable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Filtros adicionales
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={filters.hasEmail}
                  onChange={(e) =>
                    handleFilterChange("hasEmail", e.target.checked)
                  }
                  className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring focus:ring-2"
                />
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    Solo contactos con email
                  </span>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={filters.hasPhone}
                  onChange={(e) =>
                    handleFilterChange("hasPhone", e.target.checked)
                  }
                  className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring focus:ring-2"
                />
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    Solo contactos con teléfono
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
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

export default FiltersModal;
