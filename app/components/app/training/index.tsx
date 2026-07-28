import { useState, useRef, useEffect, useCallback } from "react";
import {
  useLoaderData,
  useNavigate,
  useRevalidator,
  useSearchParams,
  useFetcher,
  useNavigation,
} from "react-router";
import {
  Folder,
  FileText,
  Trash2,
  ChevronRight,
  Home,
  File,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  RefreshCw,
  AlertCircle,
  Brain,
} from "lucide-react";
import usePath from "~/hooks/usePath";
import useToast from "~/hooks/useToast";
import ContextMenu from "./ContextMenu";
import ActionButtons from "./ActionButtons";
import CreateFolderModal from "./CreateFolderModal";
import RenameModal from "./RenameModal";
import UploadQueue from "./UploadQueue";
import type { UploadItem, UploadStatus } from "./UploadQueue";
import { useWebSocket } from "~/hooks/useWebSocket";
import { useUser } from "~/hooks/useUser";

interface LoaderData {
  folders: Array<{
    id: string;
    name: string;
    createdAt: string;
  }>;
  files: Array<{
    id: string;
    name: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    createdAt: string;
    status: string;
  }>;
  breadcrumbs: Array<{ id: string; name: string }>;
  currentFolderId: string | null;
  pagination: {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export default function TrainingPage() {
  const { folders, files, breadcrumbs, currentFolderId, pagination } =
    useLoaderData<LoaderData>();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [retryingFile, setRetryingFile] = useState<string | null>(null);
  const [currentActionType, setCurrentActionType] = useState<string | null>(
    null
  );
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "empty" | "folder" | "file";
    folderId?: string;
    fileId?: string;
  } | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renamingItem, setRenamingItem] = useState<{
    type: "folder" | "file";
    id: string;
    currentName: string;
  } | null>(null);
  const [renameName, setRenameName] = useState("");
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [processingQueue, setProcessingQueue] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastProcessedResponseRef = useRef<string | null>(null);
  const lastProcessedUploadResponseRef = useRef<string | null>(null);
  const currentFileRef = useRef<File | null>(null);
  const uploadQueueRef = useRef<
    Map<string, { file: File; uploadFetcher: any }>
  >(new Map());
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const PATH = usePath();
  const fetcher = useFetcher();
  const uploadFetcher = useFetcher();
  const queueFetcher = useFetcher();
  const pendingQueueSaveRef = useRef<{
    itemId: string;
    resolve: (value: { success: boolean; error?: string }) => void;
    reject: (error: Error) => void;
  } | null>(null);
  const user = useUser();

  // Manejar mensaje de refreshLoaders
  const handleRefreshLoaders = useCallback(() => {
    revalidator.revalidate();
  }, []);

  useWebSocket({
    onRefreshLoaders: user?.id ? handleRefreshLoaders : undefined,
    userId: user?.id || undefined,
  });

  // Sincronizar searchInput con URL
  useEffect(() => {
    const search = searchParams.get("search") || "";
    setSearchInput(search);
  }, [searchParams]);

  // Debounce para búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentSearch = searchParams.get("search") || "";
      if (searchInput !== currentSearch) {
        const params = new URLSearchParams();
        if (searchInput.trim()) {
          params.set("search", searchInput.trim());
        }
        if (currentFolderId) {
          params.set("folderId", currentFolderId);
        }
        params.set("page", "1");
        navigate(`${PATH}/training?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput, searchParams, currentFolderId, PATH, navigate]);

  // Manejar click derecho en el contenedor (espacio vacío)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Solo manejar si no es click en una carpeta o archivo específico
      if (
        containerRef.current?.contains(target) &&
        !target.closest("[data-folder-id]") &&
        !target.closest("[data-file-id]")
      ) {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, type: "empty" });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("contextmenu", handleContextMenu);
    }

    return () => {
      if (container) {
        container.removeEventListener("contextmenu", handleContextMenu);
      }
    };
  }, []);

  // Manejar respuestas del uploadFetcher (subida de archivo a Firebase)
  useEffect(() => {
    if (!uploadFetcher.data) return;

    const uploadData = uploadFetcher.data as {
      success: boolean;
      error?: string;
      url?: string;
      filename?: string;
    };

    // Crear una clave única para esta respuesta
    const responseKey = `upload-${uploadData.success}-${uploadData.url || uploadData.error || ""}`;

    // Si ya procesamos esta respuesta, ignorarla
    if (lastProcessedUploadResponseRef.current === responseKey) {
      return;
    }

    // Marcar como procesada
    lastProcessedUploadResponseRef.current = responseKey;

    if (uploadData.success && uploadData.url) {
      // Obtener el archivo original del ref
      const originalFile = currentFileRef.current;
      if (!originalFile) {
        useToast({
          icon: "error",
          title: "Error: No se pudo obtener la información del archivo",
        });
        setCurrentActionType(null);
        currentFileRef.current = null;
        return;
      }

      // Guardar información del archivo antes de limpiar el ref
      const fileInfo = {
        name: originalFile.name,
        size: originalFile.size,
        type: originalFile.type,
      };

      // Determinar tipo de archivo
      const fileExtension = (
        fileInfo.name.split(".").pop()?.toLowerCase() || ""
      ).trim();
      const fileType =
        fileExtension === "pdf" || fileInfo.type.includes("pdf")
          ? "pdf"
          : "docx";

      // Una vez subido a Firebase, guardar en BD
      const formData = new FormData();
      formData.append("type", "uploadFile");
      formData.append("fileUrl", uploadData.url);
      formData.append("fileName", uploadData.filename || "");
      formData.append("originalFileName", fileInfo.name);
      formData.append("fileSize", String(fileInfo.size));
      formData.append("fileType", fileType);
      if (currentFolderId) {
        formData.append("folderId", currentFolderId);
      }

      // Limpiar el ref después de guardar la información
      currentFileRef.current = null;

      fetcher.submit(formData, { method: "POST" });
    } else {
      useToast({
        icon: "error",
        title: uploadData.error || "Error al subir el archivo",
      });
      setCurrentActionType(null);
      currentFileRef.current = null;
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [uploadFetcher.data, currentFolderId, fetcher]);

  // Manejar respuestas del queueFetcher (para archivos en cola)
  useEffect(() => {
    if (!queueFetcher.data || !pendingQueueSaveRef.current) return;

    const data = queueFetcher.data as {
      type?: string;
      success: boolean;
      error?: string;
    };

    if (data.type === "uploadFile" && pendingQueueSaveRef.current) {
      const { resolve } = pendingQueueSaveRef.current;
      resolve({
        success: data.success,
        error: data.error,
      });
      pendingQueueSaveRef.current = null;
    }
  }, [queueFetcher.data]);

  // Manejar respuestas del fetcher (con protección contra múltiples ejecuciones)
  useEffect(() => {
    if (!fetcher.data) return;

    const data = fetcher.data as {
      type?: string;
      success: boolean;
      error?: string;
      folder?: any;
      file?: any;
    };

    const type = data.type;
    if (!type) return;

    // Crear una clave única para esta respuesta
    const responseKey = `${type}-${data.success}-${JSON.stringify(data)}`;

    // Si ya procesamos esta respuesta, ignorarla
    if (lastProcessedResponseRef.current === responseKey) {
      return;
    }

    // Marcar como procesada
    lastProcessedResponseRef.current = responseKey;

    switch (type) {
      case "createFolder": {
        setIsCreatingFolder(false);
        setCurrentActionType(null);
        if (data.success) {
          useToast({
            icon: "success",
            title: "Carpeta creada exitosamente",
          });
          setNewFolderName("");
          revalidator.revalidate();
        } else {
          useToast({
            icon: "error",
            title: data.error || "Error al crear la carpeta",
          });
        }
        break;
      }

      case "uploadFile": {
        setCurrentActionType(null);
        if (data.success) {
          useToast({
            icon: "success",
            title: "Archivo subido exitosamente",
          });
          currentFileRef.current = null;
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          revalidator.revalidate();
        } else {
          useToast({
            icon: "error",
            title: data.error || "Error al guardar el archivo",
          });
          currentFileRef.current = null;
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
        break;
      }

      case "deleteFolder": {
        setDeletingFolder(null);
        setCurrentActionType(null);
        if (data.success) {
          useToast({
            icon: "success",
            title: "Carpeta eliminada exitosamente",
          });
          revalidator.revalidate();
        } else {
          useToast({
            icon: "error",
            title: data.error || "Error al eliminar la carpeta",
          });
        }
        break;
      }

      case "deleteFile": {
        setDeletingFile(null);
        setCurrentActionType(null);
        if (data.success) {
          useToast({
            icon: "success",
            title: "Archivo eliminado exitosamente",
          });
          revalidator.revalidate();
        } else {
          useToast({
            icon: "error",
            title: data.error || "Error al eliminar el archivo",
          });
        }
        break;
      }

      case "renameFolder": {
        setIsRenaming(false);
        setCurrentActionType(null);
        if (data.success) {
          useToast({
            icon: "success",
            title: "Carpeta renombrada exitosamente",
          });
          setRenamingItem(null);
          setRenameName("");
          revalidator.revalidate();
        } else {
          useToast({
            icon: "error",
            title: data.error || "Error al renombrar la carpeta",
          });
        }
        break;
      }

      case "renameFile": {
        setIsRenaming(false);
        setCurrentActionType(null);
        if (data.success) {
          useToast({
            icon: "success",
            title: "Archivo renombrado exitosamente",
          });
          setRenamingItem(null);
          setRenameName("");
          revalidator.revalidate();
        } else {
          useToast({
            icon: "error",
            title: data.error || "Error al renombrar el archivo",
          });
        }
        break;
      }

      case "retryProcessing": {
        setRetryingFile(null);
        setCurrentActionType(null);
        if (data.success) {
          useToast({
            icon: "success",
            title: "Archivo enviado a procesamiento nuevamente",
          });
          revalidator.revalidate();
        } else {
          useToast({
            icon: "error",
            title: data.error || "Error al reintentar el procesamiento",
          });
        }
        break;
      }
    }
  }, [fetcher.data, revalidator]);

  // Limpiar refs cuando los fetchers se resetean
  useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      lastProcessedResponseRef.current = null;
    }
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    if (uploadFetcher.state === "idle" && !uploadFetcher.data) {
      lastProcessedUploadResponseRef.current = null;
    }
  }, [uploadFetcher.state, uploadFetcher.data]);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      useToast({
        icon: "error",
        title: "El nombre de la carpeta es requerido",
      });
      return;
    }

    setIsCreatingFolder(true);
    setCurrentActionType("createFolder");

    const formData = new FormData();
    formData.append("type", "createFolder");
    formData.append("name", newFolderName.trim());
    if (currentFolderId) {
      formData.append("parentId", currentFolderId);
    }

    fetcher.submit(formData, { method: "POST" });
  };

  const validateFile = (file: File): string | null => {
    // Validar que el archivo tenga nombre
    if (!file.name || !file.name.trim()) {
      return "El archivo debe tener un nombre válido";
    }

    // Validar tipo de archivo por MIME type o extensión
    const fileExtension = (
      file.name.split(".").pop()?.toLowerCase() || ""
    ).trim();
    const allowedTypes = [
      "application/pdf",
      "application/x-pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const allowedExtensions = ["pdf", "docx"];

    const isValidType = allowedTypes.includes(file.type);
    const isValidExtension = allowedExtensions.includes(fileExtension);

    if (!isValidType && !isValidExtension) {
      return "Solo se permiten archivos PDF y Word (.docx)";
    }

    // Validar tamaño (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return "El archivo es demasiado grande (máximo 50MB)";
    }

    // Validar que el archivo tenga las propiedades necesarias
    if (!file || !file.name || typeof file.size !== "number") {
      return "Error: El archivo no es válido";
    }

    return null;
  };

  const processUploadQueue = async () => {
    if (processingQueue || uploadQueue.length === 0) return;

    const pendingItems = uploadQueue.filter(
      (item) => item.status === "pending"
    );
    if (pendingItems.length === 0) return;

    setProcessingQueue(true);

    // Procesar el primer archivo pendiente
    const itemToProcess = pendingItems[0];
    const itemId = itemToProcess.id;

    // Actualizar estado a "uploading"
    setUploadQueue((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, status: "uploading", progress: 0 }
          : item
      )
    );

    try {
      // Subir archivo a Firebase
      const uploadFormData = new FormData();
      uploadFormData.append("fileType", "training");
      uploadFormData.append("file", itemToProcess.file);

      const uploadResponse = await fetch("/api/upload-image", {
        method: "POST",
        body: uploadFormData,
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.success && uploadData.url) {
        // Actualizar progreso a 50% (subida completada)
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, status: "saving", progress: 50 }
              : item
          )
        );

        // Determinar tipo de archivo
        const fileExtension = (
          itemToProcess.file.name.split(".").pop()?.toLowerCase() || ""
        ).trim();
        const fileType =
          fileExtension === "pdf" || itemToProcess.file.type.includes("pdf")
            ? "pdf"
            : "docx";

        // Guardar en BD usando fetcher (maneja autenticación automáticamente)
        const saveFormData = new FormData();
        saveFormData.append("type", "uploadFile");
        saveFormData.append("fileUrl", uploadData.url);
        saveFormData.append("fileName", uploadData.filename || "");
        saveFormData.append("originalFileName", itemToProcess.file.name);
        saveFormData.append("fileSize", String(itemToProcess.file.size));
        saveFormData.append("fileType", fileType);
        if (currentFolderId) {
          saveFormData.append("folderId", currentFolderId);
        }

        // Usar fetcher para guardar en BD
        const saveUrl = currentFolderId
          ? `${PATH}/training?folderId=${currentFolderId}`
          : `${PATH}/training`;

        // Crear una promesa que espere la respuesta del fetcher
        const saveData = await new Promise<{
          success: boolean;
          error?: string;
        }>((resolve, reject) => {
          // Guardar referencia para el useEffect
          pendingQueueSaveRef.current = {
            itemId,
            resolve,
            reject,
          };

          // Enviar el formulario
          queueFetcher.submit(saveFormData, {
            method: "POST",
            action: saveUrl,
          });

          // Timeout después de 30 segundos
          setTimeout(() => {
            if (pendingQueueSaveRef.current?.itemId === itemId) {
              pendingQueueSaveRef.current = null;
              reject(new Error("Timeout esperando respuesta del servidor"));
            }
          }, 30000);
        });

        if (saveData.success) {
          // Actualizar a éxito
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === itemId
                ? { ...item, status: "success", progress: 100 }
                : item
            )
          );
          revalidator.revalidate();
        } else {
          // Error al guardar
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    status: "error",
                    error: saveData.error || "Error al guardar el archivo",
                  }
                : item
            )
          );
        }
      } else {
        // Error al subir
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  status: "error",
                  error: uploadData.error || "Error al subir el archivo",
                }
              : item
          )
        );
      }
    } catch (error) {
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status: "error",
                error:
                  error instanceof Error
                    ? error.message
                    : "Error desconocido al subir el archivo",
              }
            : item
        )
      );
    }

    setProcessingQueue(false);
    // El useEffect se encargará de procesar el siguiente archivo pendiente
  };

  const handleUploadFile = (event?: React.ChangeEvent<HTMLInputElement>) => {
    const files = event?.target.files;
    if (!files || files.length === 0) {
      fileInputRef.current?.click();
      return;
    }

    // Si es un solo archivo, usar el método anterior
    if (files.length === 1) {
      const file = files[0];
      const error = validateFile(file);

      if (error) {
        useToast({
          icon: "error",
          title: error,
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setCurrentActionType("uploadFile");
      currentFileRef.current = file;

      // Subir archivo a Firebase primero usando uploadFetcher
      const uploadFormData = new FormData();
      uploadFormData.append("fileType", "training");
      uploadFormData.append("file", file);

      uploadFetcher.submit(uploadFormData, {
        method: "POST",
        action: "/api/upload-image",
        encType: "multipart/form-data",
      });

      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Si son múltiples archivos, usar la cola
    const validFiles: UploadItem[] = [];
    const errors: string[] = [];

    // Validar todos los archivos
    Array.from(files).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
          file,
          status: "pending",
          progress: 0,
        });
      }
    });

    // Mostrar errores si hay
    if (errors.length > 0) {
      useToast({
        icon: "error",
        title: `Error en ${errors.length} archivo(s): ${errors.slice(0, 2).join(", ")}`,
      });
    }

    // Agregar archivos válidos a la cola
    if (validFiles.length > 0) {
      setUploadQueue((prev) => [...prev, ...validFiles]);
    }

    // Limpiar el input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Procesar cola cuando hay archivos pendientes
  useEffect(() => {
    if (processingQueue) return; // Ya hay un archivo siendo procesado

    const hasPending = uploadQueue.some((item) => item.status === "pending");
    if (hasPending) {
      // Pequeño delay para asegurar que el estado se haya actualizado
      const timer = setTimeout(() => {
        processUploadQueue();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadQueue.length, processingQueue]);

  const handleRemoveFromQueue = (id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRetryUpload = (id: string) => {
    setUploadQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: "pending", progress: 0, error: undefined }
          : item
      )
    );
  };

  const handleDeleteFolder = (folderId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta carpeta?")) {
      return;
    }

    setDeletingFolder(folderId);
    setCurrentActionType("deleteFolder");

    const formData = new FormData();
    formData.append("type", "deleteFolder");
    formData.append("folderId", folderId);

    fetcher.submit(formData, { method: "POST" });
  };

  const handleDeleteFile = (fileId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este archivo?")) {
      return;
    }

    setDeletingFile(fileId);
    setCurrentActionType("deleteFile");

    const formData = new FormData();
    formData.append("type", "deleteFile");
    formData.append("fileId", fileId);

    fetcher.submit(formData, { method: "POST" });
  };

  const handleRetryProcessing = (fileId: string) => {
    setRetryingFile(fileId);
    setCurrentActionType("retryProcessing");

    const formData = new FormData();
    formData.append("type", "retryProcessing");
    formData.append("fileId", fileId);

    fetcher.submit(formData, { method: "POST" });
  };

  const handleRenameFolder = (folderId: string, currentName: string) => {
    setRenamingItem({ type: "folder", id: folderId, currentName });
    setRenameName(currentName);
    setIsRenaming(true);
  };

  const handleRenameFile = (fileId: string, currentName: string) => {
    setRenamingItem({ type: "file", id: fileId, currentName });
    setRenameName(currentName);
    setIsRenaming(true);
  };

  const handleConfirmRename = () => {
    if (!renamingItem || !renameName.trim()) {
      useToast({
        icon: "error",
        title: "El nombre es requerido",
      });
      return;
    }

    setCurrentActionType(
      renamingItem.type === "folder" ? "renameFolder" : "renameFile"
    );

    const formData = new FormData();
    formData.append(
      "type",
      renamingItem.type === "folder" ? "renameFolder" : "renameFile"
    );
    formData.append(
      renamingItem.type === "folder" ? "folderId" : "fileId",
      renamingItem.id
    );
    formData.append("newName", renameName.trim());

    fetcher.submit(formData, { method: "POST" });
  };

  const handleContextMenuOnItem = (
    e: React.MouseEvent,
    type: "folder" | "file",
    id: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      ...(type === "folder" ? { folderId: id } : { fileId: id }),
    });
  };

  const handleFolderClick = (folderId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("folderId", folderId);
    params.set("page", "1");
    navigate(`${PATH}/training?${params.toString()}`);
  };

  const handleBreadcrumbClick = (folderId: string | null) => {
    const params = new URLSearchParams();
    if (searchInput.trim()) {
      params.set("search", searchInput.trim());
    }
    if (folderId) {
      params.set("folderId", folderId);
    }
    params.set("page", "1");
    navigate(`${PATH}/training?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams();
    if (value.trim()) {
      params.set("search", value.trim());
    }
    if (currentFolderId) {
      params.set("folderId", currentFolderId);
    }
    params.set("page", "1");
    navigate(`${PATH}/training?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    navigate(`${PATH}/training?${params.toString()}`);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === "pdf") {
      return <FileText className="w-8 h-8 text-red-500 dark:text-red-400" />;
    }
    return <File className="w-8 h-8 text-blue-500 dark:text-blue-400" />;
  };

  const isLoading = navigation.state === "loading";
  const isCreating =
    fetcher.state === "submitting" && currentActionType === "createFolder";
  const isUploading =
    uploadFetcher.state === "submitting" ||
    (fetcher.state === "submitting" && currentActionType === "uploadFile");
  const isDeletingFolder =
    fetcher.state === "submitting" && currentActionType === "deleteFolder";
  const isDeletingFile =
    fetcher.state === "submitting" && currentActionType === "deleteFile";

  return (
    <div ref={containerRef} className="p-6 max-w-7xl mx-auto">
      {/* Header con botones en la esquina superior derecha */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Entrenamiento
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona tus archivos y carpetas de entrenamiento
          </p>
        </div>
        <ActionButtons
          onCreateFolder={() => setIsCreatingFolder(true)}
          onUploadFile={() => handleUploadFile()}
          uploadingFile={isUploading}
          creatingFolder={isCreating}
        />
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar carpetas y archivos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Input oculto para subir archivos */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleUploadFile}
        className="hidden"
        disabled={isUploading || processingQueue}
      />

      {/* Breadcrumbs */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        {breadcrumbs?.length > 0 && (
          <button
            onClick={() => handleBreadcrumbClick(null)}
            className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Inicio</span>
          </button>
        )}
        {breadcrumbs.map((crumb) => (
          <div key={crumb.id} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
            <button
              onClick={() => handleBreadcrumbClick(crumb.id)}
              className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors cursor-pointer"
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          onClose={() => setContextMenu(null)}
          onCreateFolder={
            contextMenu.type === "empty"
              ? () => setIsCreatingFolder(true)
              : undefined
          }
          onUploadFile={
            contextMenu.type === "empty" ? () => handleUploadFile() : undefined
          }
          onRename={() => {
            if (contextMenu.type === "folder" && contextMenu.folderId) {
              const folder = folders.find((f) => f.id === contextMenu.folderId);
              if (folder) {
                handleRenameFolder(contextMenu.folderId, folder.name);
              }
            } else if (contextMenu.type === "file" && contextMenu.fileId) {
              const file = files.find((f) => f.id === contextMenu.fileId);
              if (file) {
                handleRenameFile(contextMenu.fileId, file.name);
              }
            }
          }}
        />
      )}

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreatingFolder}
        folderName={newFolderName}
        onFolderNameChange={setNewFolderName}
        onCreate={handleCreateFolder}
        onClose={() => {
          setIsCreatingFolder(false);
          setNewFolderName("");
        }}
        isLoading={isCreating}
      />

      {/* Rename Modal */}
      {renamingItem && (
        <RenameModal
          isOpen={isRenaming}
          currentName={renameName}
          originalName={renamingItem.currentName}
          onNameChange={setRenameName}
          onRename={handleConfirmRename}
          onClose={() => {
            setIsRenaming(false);
            setRenamingItem(null);
            setRenameName("");
          }}
          isLoading={
            fetcher.state === "submitting" &&
            (currentActionType === "renameFolder" ||
              currentActionType === "renameFile")
          }
          type={renamingItem.type}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Cargando...
          </span>
        </div>
      )}

      {/* Content Grid */}
      {!isLoading && folders.length === 0 && files.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {searchInput.trim()
              ? "No se encontraron resultados"
              : "Esta carpeta está vacía"}
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            {searchInput.trim()
              ? "Intenta con otros términos de búsqueda"
              : "Crea una carpeta o sube un archivo para comenzar"}
          </p>
        </div>
      ) : (
        !isLoading && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {/* Folders */}
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  data-folder-id={folder.id}
                  className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg dark:hover:shadow-gray-900/50 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer select-none transform hover:scale-105"
                  onDoubleClick={() => handleFolderClick(folder.id)}
                  onClick={() => handleFolderClick(folder.id)}
                  onContextMenu={(e) =>
                    handleContextMenuOnItem(e, "folder", folder.id)
                  }
                >
                  <div className="flex flex-col items-center text-center">
                    <Folder className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors" />
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate w-full group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {folder.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Carpeta
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                    disabled={deletingFolder === folder.id || isDeletingFolder}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {deletingFolder === folder.id || isDeletingFolder ? (
                      <Loader2 className="w-4 h-4 text-red-600 dark:text-red-400 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                  </button>
                </div>
              ))}

              {/* Files */}
              {files.map((file) => {
                const status = file.status || "ready";
                const isProcessing = status === "processing";
                const isError = status === "error";
                const isReady = status === "ready";

                return (
                  <div
                    key={file.id}
                    data-file-id={file.id}
                    className={`group relative bg-white dark:bg-gray-800 border rounded-lg p-4 transition-all select-none ${
                      isReady
                        ? "border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-900/50 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transform hover:scale-105 cursor-pointer"
                        : isProcessing
                          ? "border-blue-300 dark:border-blue-600 cursor-default"
                          : "border-red-300 dark:border-red-600 cursor-default"
                    }`}
                    onContextMenu={
                      isReady
                        ? (e) => handleContextMenuOnItem(e, "file", file.id)
                        : undefined
                    }
                  >
                    {/* Overlay para estado processing */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-blue-500/80 dark:bg-blue-600/80 rounded-lg flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                        <Brain className="w-8 h-8 text-white mb-2 animate-pulse" />
                        <p className="text-sm font-medium text-white text-center px-2">
                          La IA está analizando el archivo...
                        </p>
                      </div>
                    )}

                    {/* Overlay para estado error */}
                    {isError && (
                      <div className="absolute inset-0 bg-red-500/90 dark:bg-red-600/90 rounded-lg flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                        <AlertCircle className="w-8 h-8 text-white mb-2" />
                        <p className="text-sm font-medium text-white text-center px-2 mb-3">
                          La IA no pudo procesar el archivo
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetryProcessing(file.id);
                          }}
                          disabled={
                            retryingFile === file.id ||
                            (currentActionType === "retryProcessing" &&
                              fetcher.state === "submitting")
                          }
                          className="cursor-pointer px-4 py-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {retryingFile === file.id ||
                          (currentActionType === "retryProcessing" &&
                            fetcher.state === "submitting") ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Reintentando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              Reintentar
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col items-center text-center relative">
                      <div
                        className={`transition-colors ${
                          isReady
                            ? "group-hover:text-blue-600 dark:group-hover:text-blue-300"
                            : ""
                        } ${isProcessing ? "opacity-30" : ""} ${
                          isError ? "opacity-30" : ""
                        }`}
                      >
                        {getFileIcon(file.fileType)}
                      </div>
                      <p
                        className={`text-sm font-medium truncate w-full mt-2 transition-colors ${
                          isReady
                            ? "text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                            : "text-gray-900 dark:text-gray-100"
                        } ${isProcessing ? "opacity-30" : ""} ${
                          isError ? "opacity-30" : ""
                        }`}
                      >
                        {file.name}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isReady
                            ? "text-gray-500 dark:text-gray-400"
                            : "text-gray-500 dark:text-gray-400"
                        } ${isProcessing ? "opacity-30" : ""} ${
                          isError ? "opacity-30" : ""
                        }`}
                      >
                        {formatFileSize(file.fileSize)}
                      </p>
                    </div>
                    {isReady && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.id);
                        }}
                        disabled={deletingFile === file.id || isDeletingFile}
                        className="cursor-pointer absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all disabled:opacity-50"
                      >
                        {deletingFile === file.id || isDeletingFile ? (
                          <Loader2 className="w-4 h-4 text-red-600 dark:text-red-400 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || isLoading}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasMore || isLoading}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )
      )}

      {/* Upload Queue */}
      <UploadQueue
        items={uploadQueue}
        onRemove={handleRemoveFromQueue}
        onRetry={handleRetryUpload}
      />
    </div>
  );
}
