import { X, CheckCircle2, AlertCircle, Loader2, FileText } from "lucide-react";

export type UploadStatus = "pending" | "uploading" | "saving" | "success" | "error";

export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
}

interface UploadQueueProps {
  items: UploadItem[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

export default function UploadQueue({
  items,
  onRemove,
  onRetry,
}: UploadQueueProps) {
  if (items.length === 0) return null;

  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case "pending":
        return <FileText className="w-4 h-4 text-gray-400" />;
      case "uploading":
      case "saving":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status: UploadStatus) => {
    switch (status) {
      case "pending":
        return "En cola";
      case "uploading":
        return "Subiendo...";
      case "saving":
        return "Guardando...";
      case "success":
        return "Completado";
      case "error":
        return "Error";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Subiendo archivos ({items.length})
          </h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(item.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatFileSize(item.file.size)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {getStatusText(item.status)}
                    </span>
                    {(item.status === "uploading" || item.status === "saving") && (
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {item.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {item.error}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center gap-1">
                  {item.status === "error" && (
                    <button
                      onClick={() => onRetry(item.id)}
                      className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors cursor-pointer"
                      title="Reintentar"
                    >
                      <Loader2 className="w-4 h-4" />
                    </button>
                  )}
                  {(item.status === "success" || item.status === "error") && (
                    <button
                      onClick={() => onRemove(item.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
                      title="Cerrar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

