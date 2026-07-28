import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUserSession } from "~/data/auth.server";
import {
  getFolderContent,
  createFolder,
  uploadFileFromUrl,
  deleteFolder,
  deleteFile,
  renameFolder,
  renameFile,
  retryProcessing,
} from "~/data/training.server";
import TrainingPage from "~/components/app/training";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserSession(request);
  const { companyId } = params;

  if (!companyId) {
    throw new Response("Company ID is required", { status: 400 });
  }

  const url = new URL(request.url);
  const folderId = url.searchParams.get("folderId") || null;
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("search") || undefined;

  const content = await getFolderContent(
    request,
    companyId,
    folderId,
    page,
    20,
    search
  );

  return Response.json(content);
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserSession(request);
  const { companyId } = params;

  if (!companyId) {
    throw new Response("Company ID is required", { status: 400 });
  }

  const formData = await request.formData();
  const type = formData.get("type") as string;

  try {
    switch (type) {
      case "createFolder": {
        const name = formData.get("name") as string;
        const parentId = formData.get("parentId") as string | null;

        if (!name) {
          return Response.json(
            {
              type: "createFolder",
              success: false,
              error: "El nombre de la carpeta es requerido",
            },
            { status: 400 }
          );
        }

        const folder = await createFolder(
          request,
          companyId,
          name,
          parentId || null
        );

        return Response.json({ type: "createFolder", success: true, folder });
      }

      case "uploadFile": {
        const fileUrl = formData.get("fileUrl") as string;
        const fileName = formData.get("fileName") as string;
        const originalFileName = formData.get("originalFileName") as string;
        const fileSize = formData.get("fileSize") as string;
        const fileType = formData.get("fileType") as string;
        const folderId = formData.get("folderId") as string | null;

        if (!fileUrl || !originalFileName) {
          return Response.json(
            {
              type: "uploadFile",
              success: false,
              error: "Faltan datos del archivo",
            },
            { status: 400 }
          );
        }

        const uploadedFile = await uploadFileFromUrl(
          request,
          companyId,
          {
            fileUrl,
            fileName: fileName || "",
            originalFileName,
            fileSize: parseInt(fileSize) || 0,
            fileType: fileType === "pdf" ? "pdf" : "docx",
          },
          folderId || null
        );

        return Response.json({
          type: "uploadFile",
          success: true,
          file: uploadedFile,
        });
      }

      case "deleteFolder": {
        const folderId = formData.get("folderId") as string;

        if (!folderId) {
          return Response.json(
            {
              type: "deleteFolder",
              success: false,
              error: "ID de carpeta es requerido",
            },
            { status: 400 }
          );
        }

        await deleteFolder(request, companyId, folderId);

        return Response.json({ type: "deleteFolder", success: true });
      }

      case "deleteFile": {
        const fileId = formData.get("fileId") as string;

        if (!fileId) {
          return Response.json(
            {
              type: "deleteFile",
              success: false,
              error: "ID de archivo es requerido",
            },
            { status: 400 }
          );
        }

        await deleteFile(request, companyId, fileId);

        return Response.json({ type: "deleteFile", success: true });
      }

      case "renameFolder": {
        const folderId = formData.get("folderId") as string;
        const newName = formData.get("newName") as string;

        if (!folderId || !newName) {
          return Response.json(
            {
              type: "renameFolder",
              success: false,
              error: "ID de carpeta y nuevo nombre son requeridos",
            },
            { status: 400 }
          );
        }

        const folder = await renameFolder(request, companyId, folderId, newName);

        return Response.json({ type: "renameFolder", success: true, folder });
      }

      case "renameFile": {
        const fileId = formData.get("fileId") as string;
        const newName = formData.get("newName") as string;

        if (!fileId || !newName) {
          return Response.json(
            {
              type: "renameFile",
              success: false,
              error: "ID de archivo y nuevo nombre son requeridos",
            },
            { status: 400 }
          );
        }

        const file = await renameFile(request, companyId, fileId, newName);

        return Response.json({ type: "renameFile", success: true, file });
      }

      case "retryProcessing": {
        const fileId = formData.get("fileId") as string;

        if (!fileId) {
          return Response.json(
            {
              type: "retryProcessing",
              success: false,
              error: "ID de archivo es requerido",
            },
            { status: 400 }
          );
        }

        const file = await retryProcessing(request, companyId, fileId);

        return Response.json({
          type: "retryProcessing",
          success: true,
          file,
        });
      }

      default:
        return Response.json(
          {
            type: type || "unknown",
            success: false,
            error: "Acción no válida",
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Training action error:", error);
    return Response.json(
      {
        type: type || "unknown",
        success: false,
        error: error.message || "Error al procesar la acción",
      },
      { status: 500 }
    );
  }
}

export default TrainingPage;
