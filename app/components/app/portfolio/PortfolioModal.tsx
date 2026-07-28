import { useState, useRef } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import type { Portfolio } from "~/types/schema";
import { Button } from "~/components/ui";

interface PortfolioModalProps {
  item: Portfolio | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PortfolioModal({
  item,
  onClose,
  onSuccess,
}: PortfolioModalProps) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [price, setPrice] = useState(item?.price?.toString() || "");
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || "");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    item?.imageUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setError("Por favor, selecciona una imagen válida (JPEG o PNG)");
      return;
    }

    // Validar tamaño (máx 10MB)
    const maxSize = 5 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("La imagen no puede superar los 5MB");
      return;
    }

    setSelectedImage(file);

    // Crear URL de previsualización
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Limpiar el input file
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setImageUrl("");
  };

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("El nombre es requerido");
      return;
    }

    setIsSaving(true);

    try {
      let finalImageUrl = imageUrl;

      // Si hay una imagen seleccionada, subirla primero
      if (selectedImage) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("image", selectedImage);

        const uploadResponse = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();

        if (uploadResult.success) {
          finalImageUrl = uploadResult.url;
        } else {
          throw new Error(uploadResult.error || "Error al subir la imagen");
        }
        setIsUploading(false);
      }

      // Guardar el item
      const formData = new FormData();
      formData.append("_action", item ? "update" : "create");
      if (item) {
        formData.append("itemId", item.id);
      }
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      if (price) {
        formData.append("price", price);
      }
      if (finalImageUrl) {
        formData.append("imageUrl", finalImageUrl);
      }

      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: formData,
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error saving item:", error);
      setError(error.message || "Error al guardar el item");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {item ? "Editar Item" : "Nuevo Item"}
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Nombre del item"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Descripción
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Descripción del item"
            />
          </div>

          {/* Precio */}
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Precio
            </label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
              min="0"
              autoComplete="off"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="0.00"
            />
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Imagen
            </label>

            {/* Input file oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Previsualización de imagen */}
            {imagePreviewUrl ? (
              <div className="relative inline-block">
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="max-h-48 rounded-lg border border-gray-300 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                  title="Eliminar imagen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAttachmentClick}
                className="cursor-pointer flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Seleccionar imagen
                </span>
              </button>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isSaving || isUploading}
            >
              Cancelar
            </button>
            <Button
              variant={"default"}
              type="submit"
              className="cursor-pointer flex-1 px-4 py-2"
              disabled={isSaving || isUploading}
            >
              {isSaving || isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {isUploading ? "Subiendo imagen..." : "Guardando..."}
                  </span>
                </>
              ) : (
                <span>{item ? "Actualizar" : "Crear"}</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
