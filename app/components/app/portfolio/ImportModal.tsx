import React, { useState } from "react";
import {
  X,
  Upload,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import * as XLSX from "xlsx";
import { formatPrice } from "~/lib/utils.functions";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (validItems: any[]) => void;
}

interface PortfolioData {
  NOMBRE: string;
  DESCRIPCION?: string;
  PRECIO?: string;
}

interface ValidatedItem {
  data: PortfolioData;
  isValid: boolean;
  errors: string[];
  rowIndex: number;
}

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validatedItems, setValidatedItems] = useState<ValidatedItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClose = () => {
    setSelectedFile(null);
    setValidatedItems([]);
    setShowPreview(false);
    setIsProcessing(false);
    onClose();
  };

  const downloadTemplate = () => {
    // Crear datos de ejemplo para la plantilla
    const templateData = [
      {
        NOMBRE: "Auriculares con tecnología de IA",
        DESCRIPCION: "Auriculares inteligentes con tecnología de IA",
        PRECIO: "299.99",
      },
      {
        NOMBRE: "Teclado de respuesta inteligente",
        DESCRIPCION: "Teclado inteligente con tecnología de IA",
        PRECIO: "149.99",
      },
      {
        NOMBRE: "Lámpara de escritorio automatizada",
        DESCRIPCION: "Esta es una lámpara de escritorio automatizada",
        PRECIO: "79.99",
      },
    ];

    // Crear workbook y worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Ajustar el ancho de las columnas
    const colWidths = [
      { wch: 20 }, // NOMBRE
      { wch: 40 }, // DESCRIPCION
      { wch: 15 }, // PRECIO
    ];
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Portfolio");
    XLSX.writeFile(wb, "plantilla_portfolio.xlsx");
  };

  const validateItem = (
    item: PortfolioData,
    rowIndex: number
  ): ValidatedItem => {
    const errors: string[] = [];

    // Validar NOMBRE (obligatorio)
    if (!item.NOMBRE || !item.NOMBRE.trim()) {
      errors.push("El nombre es requerido");
    } else if (item.NOMBRE.trim().length > 100) {
      errors.push("El nombre no puede exceder 100 caracteres");
    }

    // Validar DESCRIPCION (opcional pero si está presente debe tener límite)
    if (item.DESCRIPCION && item.DESCRIPCION.trim().length > 500) {
      errors.push("La descripción no puede exceder 500 caracteres");
    }

    // Validar PRECIO (opcional pero si está presente debe ser un número válido)
    if (item.PRECIO && item.PRECIO.trim()) {
      const priceValue = item.PRECIO.trim().replace(/[^\d]/g, ""); // Remover caracteres no numéricos
      if (priceValue === "") {
        errors.push("El precio debe contener al menos un número válido");
      } else {
        const numericPrice = parseFloat(priceValue);
        if (isNaN(numericPrice)) {
          errors.push("El precio debe ser un número válido");
        } else if (numericPrice < 0) {
          errors.push("El precio no puede ser negativo");
        } else if (numericPrice > 999999999) {
          errors.push("El precio no puede exceder 999,999,999");
        }
      }
    }

    return {
      data: item,
      isValid: errors.length === 0,
      errors,
      rowIndex: rowIndex + 2, // +2 porque Excel empieza en 1 y la primera fila es el header
    };
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error("El archivo debe contener al menos una fila de datos");
      }

      // Obtener headers
      const headers = jsonData[0] as string[];
      const requiredHeaders = ["NOMBRE"];
      const missingHeaders = requiredHeaders.filter(
        (header) => !headers.includes(header)
      );

      if (missingHeaders.length > 0) {
        throw new Error(
          `Faltan las siguientes columnas obligatorias: ${missingHeaders.join(", ")}`
        );
      }

      // Procesar datos
      const items: PortfolioData[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        const item: any = {};

        headers.forEach((header, index) => {
          item[header as keyof PortfolioData] = row[index] || "";
        });

        items.push(item);
      }

      // Validar cada item
      const validatedItems = items.map((item, index) =>
        validateItem(item, index)
      );

      setValidatedItems(validatedItems);
      setShowPreview(true);
    } catch (error) {
      console.error("Error processing file:", error);
      alert(
        `Error al procesar el archivo: ${error instanceof Error ? error.message : "Error desconocido"}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setValidatedItems([]);
    setShowPreview(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (selectedFile && !showPreview) {
      processFile(selectedFile);
    } else if (showPreview && onSubmit) {
      const validItems = validatedItems
        .filter((item) => item.isValid)
        .map((item) => {
          const priceValue =
            item.data.PRECIO?.trim().replace(/[^\d]/g, "") || "0";
          const numericPrice = parseFloat(priceValue) || 0;

          return {
            name: item.data.NOMBRE.trim(),
            description: item.data.DESCRIPCION?.trim() || null,
            price: numericPrice > 0 ? numericPrice : null,
          };
        });

      onSubmit(validItems);
    }
  };

  const validItemsCount = validatedItems.filter((item) => item.isValid).length;
  const invalidItemsCount = validatedItems.filter(
    (item) => !item.isValid
  ).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`bg-card border border-border rounded-lg shadow-xl w-full ${
          showPreview ? "max-w-6xl max-h-[90vh]" : "max-w-md"
        } transition-all duration-300`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {showPreview
                ? "Vista Previa de Importación"
                : "Importar Portafolio"}
            </h2>
            {showPreview && (
              <p className="text-sm text-muted-foreground mt-1">
                Revisa los datos antes de importar
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="cursor-pointer p-1 hover:bg-accent rounded-md transition-colors duration-200"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className={showPreview ? "p-0" : "p-6"}>
          {!showPreview ? (
            <div className="space-y-4">
              {/* Template Download */}
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Descarga la plantilla
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Usa nuestro formato para evitar errores
                    </p>
                  </div>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="cursor-pointer flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar</span>
                </button>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 mb-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="cursor-pointer flex flex-col items-center space-y-3"
                >
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Arrastra tu archivo aquí o{" "}
                      <span className="text-primary hover:underline">
                        haz clic para seleccionar
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos soportados: CSV, XLSX, XLS
                    </p>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              {/* Summary */}
              <div className="p-6 border-b border-border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        {validItemsCount} Válidos
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Se importarán
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        {invalidItemsCount} Inválidos
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300">
                        Se omitirán
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {validatedItems.length} Total
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Items procesados
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Errores
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {validatedItems.map((item, index) => (
                      <tr
                        key={index}
                        className={`${
                          item.isValid
                            ? "bg-green-50/50 dark:bg-green-950/10"
                            : "bg-red-50/50 dark:bg-red-950/10"
                        }`}
                      >
                        <td className="p-3">
                          {item.isValid ? (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                Válido
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                Inválido
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-sm text-foreground">
                          {item.data.NOMBRE}
                        </td>
                        <td className="p-3 text-sm text-foreground max-w-xs">
                          <div className="truncate">
                            {item.data.DESCRIPCION || "-"}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-foreground">
                          {item.data.PRECIO
                            ? formatPrice(item.data.PRECIO || (0 as any))
                            : "-"}
                        </td>
                        <td className="p-3">
                          {item.errors.length > 0 ? (
                            <div className="space-y-1">
                              {item.errors.map((error, errorIndex) => (
                                <div
                                  key={errorIndex}
                                  className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded"
                                >
                                  {error}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-green-600 dark:text-green-400">
                              Sin errores
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Selected File */}
          {selectedFile && !showPreview && (
            <div className="p-6 pt-0">
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg border border-border">
                <FileText className="w-5 h-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          {showPreview && (
            <div className="text-sm text-muted-foreground">
              Solo se importarán los {validItemsCount} items válidos
            </div>
          )}
          <div className="flex items-center space-x-3 ml-auto">
            {showPreview && (
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Volver
              </button>
            )}
            <button
              onClick={handleClose}
              className="cursor-pointer px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                !selectedFile ||
                isProcessing ||
                (showPreview && validItemsCount === 0)
              }
              className="cursor-pointer px-4 py-2 text-sm text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : showPreview ? (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Importar {validItemsCount} Items</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Procesar Archivo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
