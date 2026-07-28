import { Plus, Upload, Loader2 } from "lucide-react";

interface ActionButtonsProps {
  onCreateFolder: () => void;
  onUploadFile: () => void;
  uploadingFile: boolean;
  creatingFolder: boolean;
}

export default function ActionButtons({
  onCreateFolder,
  onUploadFile,
  uploadingFile,
  creatingFolder,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onCreateFolder}
        disabled={creatingFolder}
        className="p-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        title="Crear carpeta"
      >
        {creatingFolder ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Plus className="w-5 h-5" />
        )}
      </button>
      <button
        onClick={onUploadFile}
        disabled={uploadingFile}
        className="p-2 rounded-lg bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        title="Subir archivo"
      >
        {uploadingFile ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Upload className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
