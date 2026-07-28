import {
  Camera,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui";
import useFullPath from "~/hooks/useFullPath";
import useToast from "~/hooks/useToast";
import { useUser } from "~/hooks/useUser";
import { countries } from "~/lib/data";

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fetcher = useFetcher();
  const user = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<any>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    countryCode: user?.countryCode || "",
    country: user?.country || "",
    password: "",
    avatar: user?.avatar || "",
  });
  const FULL_PATH = useFullPath();
  const [errors, setErrors] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>(
    user?.avatar || ""
  );

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "El nombre es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El correo es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Correo electrónico inválido";
    }

    if (formData.password && formData.password?.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo (solo PNG y JPG)
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      useToast({
        icon: "error",
        title: "Formato no válido. Solo se permiten archivos PNG y JPG",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validar tamaño (máx 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      useToast({
        icon: "error",
        title: "Archivo muy grande. El archivo no debe superar los 5MB",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Subir imagen
    setIsUploadingAvatar(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", file);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: uploadFormData,
      });

      const result = await response.json();

      if (result.success && result.url) {
        setFormData((prev: any) => ({ ...prev, avatar: result.url }));
      } else {
        throw new Error(result.error || "Error al subir la imagen");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      useToast({
        icon: "error",
        title: "Error al subir la imagen. Por favor, intenta nuevamente",
      });
      setAvatarPreview(user?.avatar || "");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      fetcher.submit({ ...formData } as any, {
        method: "POST",
        action: FULL_PATH,
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: "" }));
    }
    if (errors.server) {
      setErrors((prev: any) => ({ ...prev, server: "" }));
    }
  };

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find((c) => c.code === countryCode);
    setFormData((prev: any) => ({
      ...prev,
      countryCode,
      country: country?.name || "",
    }));
  };

  useEffect(() => {
    if (user?.avatar) {
      setAvatarPreview(user.avatar);
      setFormData((prev: any) => ({ ...prev, avatar: user.avatar }));
    }
  }, [user?.avatar]);

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success == true) {
        useToast({
          icon: "success",
          title: `Perfil actualizado correctamente`,
        });
        // Actualizar preview si el avatar cambió
        if (formData.avatar) {
          setAvatarPreview(formData.avatar);
        }
      } else {
        useToast({
          icon: "error",
          title: fetcher.data?.message || "Error al editar el perfil",
        });
      }
      setIsLoading(false);
    }
  }, [fetcher.data, formData.avatar]);

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Mi perfil
            </h2>
            <Button
              disabled={isLoading || isUploadingAvatar}
              className="cursor-pointer"
              onClick={handleSubmit}
            >
              {isLoading || isUploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            Modificar la información de mi perfil.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto de perfil */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Foto de perfil
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleAvatarChange}
                  disabled={isLoading || isUploadingAvatar}
                  className="hidden"
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading || isUploadingAvatar}
                    className="cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploadingAvatar ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Subiendo...</span>
                      </div>
                    ) : (
                      "Cambiar foto"
                    )}
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  Formatos permitidos: PNG, JPG (máx. 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Nombre y Apellido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="firstName"
                className="text-sm font-medium text-foreground flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Nombre *
              </label>
              <Input
                id="firstName"
                type="text"
                placeholder="Ingresa el nombre"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className={errors.firstName ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-destructive text-xs">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="lastName"
                className="text-sm font-medium text-foreground flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Apellido
              </label>
              <Input
                id="lastName"
                type="text"
                placeholder="Ingresa el apellido"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Correo electrónico *
            </label>
            <Input
              id="email"
              type="email"
              placeholder={"usuario@ejemplo.com"}
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={errors.email ? "border-destructive" : ""}
              disabled={true}
            />
            {errors.email && (
              <p className="text-destructive text-xs">{errors.email}</p>
            )}
          </div>

          {/* Teléfono con código de país */}
          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="text-sm font-medium text-foreground flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Teléfono
            </label>
            <div className="flex gap-3">
              <div className="relative">
                <Select
                  value={formData.countryCode}
                  onValueChange={(value) => handleCountryChange(value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country, index) => (
                      <SelectItem
                        key={`${country.code}-${country.abbr}-${index}`}
                        value={country.code}
                      >
                        {country.flag} {country.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Número de teléfono"
                  className="py-5"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Contraseña */}
          {!user?.isGoogle && (
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Contraseña (Solo si vas a cambiar la actual)
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs">{errors.password}</p>
              )}
            </div>
          )}

          {/* Error del servidor */}
          {errors.server && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive text-sm">{errors.server}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || isUploadingAvatar}
              className="flex-1 cursor-pointer"
            >
              {isLoading || isUploadingAvatar ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {isUploadingAvatar ? "Subiendo imagen..." : "Guardando..."}
                  </span>
                </div>
              ) : (
                <span>{"Guardar cambios"}</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
