import React, { useState } from "react";
import { X, Upload, FileText, Download } from "lucide-react";
import * as XLSX from "xlsx";
import type { QARule } from "./QATab";
import { cn } from "~/lib/utils";
import useToast from "~/hooks/useToast";

interface QAImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rules: QARule[]) => void;
}

const TRIGGER_HEADERS = ["pregunta", "trigger", "disparador", "palabras clave"];
const RESPONSE_HEADERS = ["respuesta", "response", "mensaje"];

function normalizeHeader(h: string): string {
  return String(h ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const n = normalizeHeader(headers[i]);
    if (aliases.some((a) => n.includes(a) || a.includes(n))) return i;
  }
  return -1;
}

export function QAImportExcelModal({
  isOpen,
  onClose,
  onImport,
}: QAImportExcelModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClose = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    onClose();
  };

  const downloadTemplate = () => {
    const templateData = [
      { Pregunta: "horarios de atención", Respuesta: "Atendemos de lunes a viernes de 9:00 a 18:00." },
      { Pregunta: "precio del servicio", Respuesta: "El precio básico es $50. Para más opciones contacta a ventas." },
      { Pregunta: "cómo comprar", Respuesta: "Puedes comprar desde nuestra web o en tienda física." },
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws["!cols"] = [{ wch: 25 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, ws, "Preguntas y Respuestas");
    XLSX.writeFile(wb, "plantilla_preguntas_respuestas.xlsx");
  };

  const processFile = async (file: File): Promise<QARule[]> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

    if (jsonData.length < 2) return [];

    const rawHeaders = (jsonData[0] ?? []).map((h) => String(h ?? ""));
    const headers = rawHeaders.map(normalizeHeader);

    let triggerIdx = findColumnIndex(rawHeaders, TRIGGER_HEADERS);
    let responseIdx = findColumnIndex(rawHeaders, RESPONSE_HEADERS);

    if (triggerIdx < 0) triggerIdx = 0;
    if (responseIdx < 0) responseIdx = 1;

    const valid: QARule[] = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as unknown[];
      if (!Array.isArray(row)) continue;
      const trigger = String(row[triggerIdx] ?? "").trim();
      const response = String(row[responseIdx] ?? "").trim();
      if (trigger && response) {
        valid.push({ trigger, response });
      }
    }
    return valid;
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    try {
      const rules = await processFile(selectedFile);
      onImport(rules);
      handleClose();
    } catch (err) {
      console.error(err);
      useToast({
        icon: "error",
        title: "Error al procesar el archivo. Verifica que tenga las columnas Pregunta y Respuesta.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (file: File) => {
    const ext = file.name.toLowerCase().split(".").pop();
    if (["xlsx", "xls", "csv"].includes(ext ?? "")) {
      setSelectedFile(file);
    } else {
      useToast({
        icon: "error",
        title: "Formato no soportado. Usa XLSX, XLS o CSV.",
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="rounded-xl border border-border bg-card shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Subir Excel</h2>
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer p-1 rounded hover:bg-muted text-muted-foreground"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 border-border">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Descarga la plantilla</p>
                <p className="text-xs text-muted-foreground">Formato: Pregunta, Respuesta</p>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md text-foreground hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Descargar
            </button>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
              dragActive ? "border-primary/50 bg-muted" : "border-border hover:border-primary/40"
            )}
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInput}
              className="hidden"
              id="qa-excel-input"
            />
            <label htmlFor="qa-excel-input" className="cursor-pointer block">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-foreground">
                Arrastra el archivo aquí o{" "}
                <span className="text-foreground underline">selecciona</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">XLSX, XLS, CSV</p>
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-sm text-foreground truncate flex-1">{selectedFile.name}</p>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Quitar
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!selectedFile || isProcessing}
            className="cursor-pointer px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Importando..." : "Importar"}
          </button>
        </div>
      </div>
    </div>
  );
}
