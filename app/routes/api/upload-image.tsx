import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const fileType = formData.get("fileType") as string | null; // "image" o "training"

    // Determinar el campo del archivo según el tipo
    const fileField = fileType === "training" ? "file" : "image";
    const file = formData.get(fileField) as File;

    if (!file) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `No ${fileType === "training" ? "file" : "image"} file provided`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validar que el archivo tenga nombre
    if (!file.name || !file.name.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "El archivo debe tener un nombre válido",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validar tipo de archivo según el contexto
    if (fileType === "training") {
      // Validar tipos de archivo para entrenamiento (PDF y Word)
      const fileExtension = (
        file.name?.split(".").pop()?.toLowerCase() || ""
      ).trim();
      const validTrainingTypes = [
        "application/pdf",
        "application/x-pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const validExtensions = ["pdf", "docx"];

      // Validar por tipo MIME o por extensión
      const isValidType = validTrainingTypes.includes(file.type);
      const isValidExtension = validExtensions.includes(fileExtension);

      if (!isValidType && !isValidExtension) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid file type. Only PDF and Word (.docx) are allowed.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Validar tamaño para archivos de entrenamiento (máx 50MB)
      const maxTrainingSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxTrainingSize) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "File size exceeds 50MB limit",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // Validar tipos de imagen (comportamiento original)
      const validImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validImageTypes.includes(file.type)) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Validar tamaño para imágenes (máx 10MB)
      const maxImageSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxImageSize) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "File size exceeds 10MB limit",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext =
      file.name?.split(".").pop() || (fileType === "training" ? "pdf" : "jpg");
    const folderPath =
      fileType === "training" ? "training-files" : "chat-images";
    const filename = `${folderPath}/${timestamp}-${randomStr}.${ext}`;

    // Convertir el archivo a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Firebase Storage usando REST API
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o?uploadType=media&name=${encodeURIComponent(filename)}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.error("Firebase Storage upload error:", errorData);
      throw new Error("Failed to upload to Firebase Storage");
    }

    const uploadData = await uploadResponse.json();

    // Generar URL pública
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(filename)}?alt=media`;

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        filename: uploadData.name,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
