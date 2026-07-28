import { getPrismaTenant } from "~/data/database.server";
import { getEscapedValue, getDateTime } from "~/lib/utils.functions";
import { sendMessageToQueue } from "./utils.server";
import { getTenantId, requireUserSession } from "./auth.server";

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/x-pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTENSIONS = ["pdf", "docx"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Obtener breadcrumbs (ruta de navegación) de una carpeta
export async function getFolderBreadcrumbs(
  request: Request,
  companyId: string,
  folderId: string | null
): Promise<Array<{ id: string; name: string }>> {
  const prisma = await getPrismaTenant(request);
  const breadcrumbs: Array<{ id: string; name: string }> = [];

  if (!folderId) {
    return breadcrumbs;
  }

  let currentFolderId: string | null = folderId;

  while (currentFolderId) {
    const folder: any = await prisma.trainingFolder.findFirst({
      where: {
        id: currentFolderId,
        companyId,
        active: true,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
      },
    });

    if (!folder) {
      break;
    }

    breadcrumbs.unshift({ id: folder.id, name: folder.name });
    currentFolderId = folder.parentId;
  }

  return breadcrumbs;
}

// Obtener contenido de una carpeta (subcarpetas y archivos)
export async function getFolderContent(
  request: Request,
  companyId: string,
  folderId: string | null = null,
  page: number = 1,
  perPage: number = 20,
  search?: string
) {
  try {
    const prisma = await getPrismaTenant(request);
    const skip = (page - 1) * perPage;

    // Construir filtros de búsqueda
    const folderWhere: any = {
      companyId,
      parentId: folderId,
      active: true,
    };

    const fileWhere: any = {
      companyId,
      folderId: folderId,
      active: true,
    };

    if (search && search.trim()) {
      folderWhere.name = {
        contains: search.trim(),
      };
      fileWhere.name = {
        contains: search.trim(),
      };
    }

    // Obtener todos los elementos (carpetas y archivos) sin paginación individual
    const [allFolders, allFiles, totalFolders, totalFiles] = await Promise.all([
      prisma.trainingFolder.findMany({
        where: folderWhere,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.trainingFile.findMany({
        where: fileWhere,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.trainingFolder.count({
        where: folderWhere,
      }),
      prisma.trainingFile.count({
        where: fileWhere,
      }),
    ]);

    // Combinar y ordenar por fecha de creación (más reciente primero)
    const allItems = [
      ...allFolders.map((folder) => ({
        type: "folder" as const,
        id: folder.id,
        name: folder.name,
        createdAt: folder.createdAt,
        data: folder,
      })),
      ...allFiles.map((file) => ({
        type: "file" as const,
        id: file.id,
        name: file.name,
        createdAt: file.createdAt,
        data: file,
      })),
    ].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Más reciente primero
    });

    // Aplicar paginación al resultado combinado
    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / perPage);
    const paginatedItems = allItems.slice(skip, skip + perPage);

    // Separar en carpetas y archivos
    const folders = paginatedItems
      .filter((item) => item.type === "folder")
      .map((item) => item.data);
    const files = paginatedItems
      .filter((item) => item.type === "file")
      .map((item) => item.data);

    const breadcrumbs = await getFolderBreadcrumbs(
      request,
      companyId,
      folderId
    );

    return {
      folders,
      files,
      breadcrumbs,
      currentFolderId: folderId,
      pagination: {
        page,
        perPage,
        totalItems,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  } catch (error) {
    console.error("Error obteniendo contenido de carpeta", {
      companyId,
      folderId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Crear una nueva carpeta
export async function createFolder(
  request: Request,
  companyId: string,
  name: string,
  parentId: string | null = null
) {
  try {
    const prisma = await getPrismaTenant(request);
    const sanitizedName = getEscapedValue(name.trim());

    if (!sanitizedName || sanitizedName.length < 1) {
      throw new Error("El nombre de la carpeta es requerido");
    }

    if (sanitizedName.length > 255) {
      throw new Error("El nombre de la carpeta es demasiado largo");
    }

    // Verificar que no exista una carpeta con el mismo nombre en el mismo nivel
    const existingFolder = await prisma.trainingFolder.findFirst({
      where: {
        companyId,
        parentId: parentId,
        name: sanitizedName,
        active: true,
      },
    });

    if (existingFolder) {
      throw new Error("Ya existe una carpeta con ese nombre en esta ubicación");
    }

    // Si tiene parentId, verificar que existe y pertenece a la compañía
    if (parentId) {
      const parentFolder = await prisma.trainingFolder.findFirst({
        where: {
          id: parentId,
          companyId,
          active: true,
        },
      });

      if (!parentFolder) {
        throw new Error("La carpeta padre no existe");
      }
    }

    const folder = await prisma.trainingFolder.create({
      data: {
        companyId,
        name: sanitizedName,
        parentId: parentId,
        active: true,
        createdAt: getDateTime(),
        updatedAt: getDateTime(),
      },
    });

    return folder;
  } catch (error) {
    console.error("Error creando carpeta", {
      companyId,
      name,
      parentId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Guardar información de archivo ya subido a Firebase
export async function uploadFileFromUrl(
  request: Request,
  companyId: string,
  fileData: {
    fileUrl: string;
    fileName: string;
    originalFileName: string;
    fileSize: number;
    fileType: "pdf" | "docx";
  },
  folderId: string | null = null
) {
  try {
    const prisma = await getPrismaTenant(request);

    // Validar que la URL existe
    if (!fileData.fileUrl || !fileData.fileUrl.trim()) {
      throw new Error("La URL del archivo es requerida");
    }

    // Validar que el nombre original existe
    if (!fileData.originalFileName || !fileData.originalFileName.trim()) {
      throw new Error("El nombre del archivo es requerido");
    }

    // Si tiene folderId, verificar que existe y pertenece a la compañía
    if (folderId) {
      const folder = await prisma.trainingFolder.findFirst({
        where: {
          id: folderId,
          companyId,
          active: true,
        },
      });

      if (!folder) {
        throw new Error("La carpeta no existe");
      }
    }

    // Extraer el nombre del archivo de la URL de Firebase si no se proporciona
    let fileName = fileData.fileName;
    if (!fileName) {
      const urlParts = fileData.fileUrl.split("/");
      fileName =
        urlParts[urlParts.length - 1]?.split("?")[0] ||
        fileData.originalFileName;
    }

    // Guardar información en base de datos
    const trainingFile = await prisma.trainingFile.create({
      data: {
        companyId,
        folderId: folderId,
        name: getEscapedValue(fileData.originalFileName),
        fileName: fileName,
        fileType: fileData.fileType,
        fileSize: fileData.fileSize,
        fileUrl: fileData.fileUrl,
        active: true,
        status: "processing",
        createdAt: getDateTime(),
        updatedAt: getDateTime(),
      },
    });

    const userId = await requireUserSession(request);
    const tenantId = await getTenantId(request);
    await sendMessageToQueue("TRAINING_FILE", tenantId, {
      fileUrl: trainingFile.fileUrl,
      extension: trainingFile.fileType,
      userId,
      action: "create",
    });

    return trainingFile;
  } catch (error) {
    console.error("Error guardando archivo", {
      companyId,
      folderId,
      fileName: fileData.originalFileName,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Eliminar una carpeta (elimina recursivamente todo su contenido)
export async function deleteFolder(
  request: Request,
  companyId: string,
  folderId: string
) {
  try {
    const prisma = await getPrismaTenant(request);

    // Verificar que la carpeta existe y pertenece a la compañía
    const folder = await prisma.trainingFolder.findFirst({
      where: {
        id: folderId,
        companyId,
        active: true,
      },
      include: {
        children: {
          where: { active: true },
        },
        files: {
          where: { active: true },
        },
      },
    });

    if (!folder) {
      throw new Error("La carpeta no existe");
    }

    // Eliminar recursivamente todos los archivos dentro de la carpeta
    if (folder.files.length > 0) {
      await prisma.trainingFile.updateMany({
        where: {
          id: {
            in: folder.files.map((file) => file.id),
          },
          companyId,
          active: true,
        },
        data: {
          active: false,
          updatedAt: getDateTime(),
        },
      });
    }

    // Eliminar recursivamente todas las subcarpetas
    if (folder.children.length > 0) {
      for (const childFolder of folder.children) {
        await deleteFolder(request, companyId, childFolder.id);
      }
    }

    // Finalmente, marcar la carpeta como inactiva (soft delete)
    await prisma.trainingFolder.update({
      where: { id: folderId },
      data: {
        active: false,
        updatedAt: getDateTime(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error eliminando carpeta", {
      companyId,
      folderId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Eliminar un archivo
export async function deleteFile(
  request: Request,
  companyId: string,
  fileId: string
) {
  try {
    const prisma = await getPrismaTenant(request);

    // Verificar que el archivo existe y pertenece a la compañía
    const file = await prisma.trainingFile.findFirst({
      where: {
        id: fileId,
        companyId,
        active: true,
      },
    });

    if (!file) {
      throw new Error("El archivo no existe");
    }

    // Marcar como inactivo (soft delete)
    await prisma.trainingFile.update({
      where: { id: fileId },
      data: {
        active: false,
        updatedAt: getDateTime(),
      },
    });

    // Eliminar embeddings
    const tenantId = await getTenantId(request);
    const userId = await requireUserSession(request);
    await sendMessageToQueue("TRAINING_FILE", tenantId, {
      fileUrl: file.fileUrl,
      extension: file.fileType,
      userId,
      action: "delete",
    });

    return { success: true };
  } catch (error) {
    console.error("Error eliminando archivo", {
      companyId,
      fileId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Renombrar una carpeta
export async function renameFolder(
  request: Request,
  companyId: string,
  folderId: string,
  newName: string
) {
  try {
    const prisma = await getPrismaTenant(request);
    const sanitizedName = getEscapedValue(newName.trim());

    if (!sanitizedName || sanitizedName.length < 1) {
      throw new Error("El nombre de la carpeta es requerido");
    }

    if (sanitizedName.length > 255) {
      throw new Error("El nombre de la carpeta es demasiado largo");
    }

    // Verificar que la carpeta existe y pertenece a la compañía
    const folder = await prisma.trainingFolder.findFirst({
      where: {
        id: folderId,
        companyId,
        active: true,
      },
    });

    if (!folder) {
      throw new Error("La carpeta no existe");
    }

    // Verificar que no exista otra carpeta con el mismo nombre en el mismo nivel
    const existingFolder = await prisma.trainingFolder.findFirst({
      where: {
        companyId,
        parentId: folder.parentId,
        name: sanitizedName,
        active: true,
        id: {
          not: folderId,
        },
      },
    });

    if (existingFolder) {
      throw new Error("Ya existe una carpeta con ese nombre en esta ubicación");
    }

    // Actualizar el nombre
    const updatedFolder = await prisma.trainingFolder.update({
      where: { id: folderId },
      data: {
        name: sanitizedName,
        updatedAt: getDateTime(),
      },
    });

    return updatedFolder;
  } catch (error) {
    console.error("Error renombrando carpeta", {
      companyId,
      folderId,
      newName,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Renombrar un archivo
export async function renameFile(
  request: Request,
  companyId: string,
  fileId: string,
  newName: string
) {
  try {
    const prisma = await getPrismaTenant(request);
    const sanitizedName = getEscapedValue(newName.trim());

    if (!sanitizedName || sanitizedName.length < 1) {
      throw new Error("El nombre del archivo es requerido");
    }

    if (sanitizedName.length > 255) {
      throw new Error("El nombre del archivo es demasiado largo");
    }

    // Verificar que el archivo existe y pertenece a la compañía
    const file = await prisma.trainingFile.findFirst({
      where: {
        id: fileId,
        companyId,
        active: true,
      },
    });

    if (!file) {
      throw new Error("El archivo no existe");
    }

    // Verificar que no exista otro archivo con el mismo nombre en la misma carpeta
    const existingFile = await prisma.trainingFile.findFirst({
      where: {
        companyId,
        folderId: file.folderId,
        name: sanitizedName,
        active: true,
        id: {
          not: fileId,
        },
      },
    });

    if (existingFile) {
      throw new Error("Ya existe un archivo con ese nombre en esta ubicación");
    }

    // Actualizar el nombre
    const updatedFile = await prisma.trainingFile.update({
      where: { id: fileId },
      data: {
        name: sanitizedName,
        updatedAt: getDateTime(),
      },
    });

    return updatedFile;
  } catch (error) {
    console.error("Error renombrando archivo", {
      companyId,
      fileId,
      newName,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Reintentar procesamiento de un archivo
export async function retryProcessing(
  request: Request,
  companyId: string,
  fileId: string
) {
  try {
    const prisma = await getPrismaTenant(request);

    // Verificar que el archivo existe y pertenece a la compañía
    const file = await prisma.trainingFile.findFirst({
      where: {
        id: fileId,
        companyId,
        active: true,
      },
    });

    if (!file) {
      throw new Error("El archivo no existe");
    }

    // Solo permitir reintentar si el archivo está en estado error
    if (file.status !== "error") {
      throw new Error("Solo se pueden reintentar archivos con estado de error");
    }

    const userId = await requireUserSession(request);
    const tenantId = await getTenantId(request);
    await sendMessageToQueue("TRAINING_FILE", tenantId, {
      fileUrl: file.fileUrl,
      extension: file.fileType,
      userId,
      action: "create",
    });

    const updatedFile = await prisma.trainingFile.update({
      where: { id: fileId },
      data: {
        status: "processing",
        updatedAt: getDateTime(),
      },
    });

    return updatedFile;
  } catch (error) {
    console.error("Error reintentando procesamiento", {
      companyId,
      fileId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Obtener todas las carpetas de entrenamiento de forma plana
export async function getAllTrainingFolders(
  request: Request,
  companyId: string
) {
  try {
    const prisma = await getPrismaTenant(request);
    const folders = await prisma.trainingFolder.findMany({
      where: {
        companyId,
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Crear un mapa de carpetas por ID para acceso rápido
    const folderMap = new Map(folders.map((f) => [f.id, f]));

    // Función para construir la ruta completa de forma iterativa
    const buildFullPath = (folderId: string | null): string => {
      if (!folderId) return "";

      const folder = folderMap.get(folderId);
      if (!folder) return "";

      const pathParts: string[] = [];
      let currentFolder: typeof folder | undefined = folder;

      while (currentFolder) {
        pathParts.unshift(currentFolder.name);
        currentFolder = currentFolder.parentId
          ? folderMap.get(currentFolder.parentId)
          : undefined;
      }

      return pathParts.join(" / ");
    };

    // Construir rutas completas para todas las carpetas
    const foldersWithPath = folders.map((folder) => {
      const fullPath = buildFullPath(folder.id);
      return {
        ...folder,
        fullPath,
      };
    });

    return foldersWithPath;
  } catch (error) {
    console.error("Error obteniendo todas las carpetas", {
      companyId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Obtener todos los archivos de entrenamiento de forma plana
export async function getAllTrainingFiles(
  request: Request,
  companyId: string
) {
  try {
    const prisma = await getPrismaTenant(request);
    const files = await prisma.trainingFile.findMany({
      where: {
        companyId,
        active: true,
        status: "ready", // Solo archivos procesados correctamente
      },
      orderBy: {
        name: "asc",
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Construir nombres con ruta completa
    const filesWithPath = files.map((file) => {
      const folderName = file.folder?.name || "Raíz";
      return {
        ...file,
        fullPath: file.folder ? `${folderName} / ${file.name}` : file.name,
      };
    });

    return filesWithPath;
  } catch (error) {
    console.error("Error obteniendo todos los archivos", {
      companyId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}