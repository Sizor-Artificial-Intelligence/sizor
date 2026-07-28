import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  Save,
  X,
  AlertCircle,
} from "lucide-react";
import useEscapeKey from "~/hooks/useEscapeKey";
import { countries } from "~/lib/data";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "~/components/ui";

interface ContactFormProps {
  onClose: () => void;
  onSubmit: (contactData: any) => void;
  isOpen: boolean;
  loadingForm: boolean;
  setloadingForm: (loading: boolean) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({
  onClose,
  onSubmit,
  isOpen,
  loadingForm,
  setloadingForm,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "",
    address: "",
    gender: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleEscape = () => {
    if (isOpen) {
      onClose();
    }
  };

  useEscapeKey(handleEscape);

  const handleInputChange = (value: string, name: string) => {
    // For phone input, only allow numbers
    if (name === "phone") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    if (
      formData.phone &&
      !/^[0-9]{7,15}$/.test(formData.phone.replace(/\s/g, ""))
    ) {
      newErrors.phone = "El teléfono debe contener solo números (7-15 dígitos)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setloadingForm(true);

    try {
      const cleanData = {
        ...formData,
        name: formData.name.trim(),
        lastName: formData.lastName?.trim() || null,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        countryCode: formData.countryCode || null,
        address: formData.address?.trim() || null,
        gender: formData.gender || null,
      };

      onSubmit(cleanData);

      // Reset form data
      setFormData({
        name: "",
        lastName: "",
        email: "",
        phone: "",
        countryCode: "",
        address: "",
        gender: "",
      });
      setErrors({});
    } catch (error) {
      console.error("Error creating contact:", error);
    } finally {
      setloadingForm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto overflow-x-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Crear Contacto
              </h2>
              <p className="text-sm text-muted-foreground">
                Agrega un nuevo contacto a tu lista
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-x-hidden"
        >
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Nombre *</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => handleInputChange(e.target.value, "name")}
                className={`w-full px-3 py-2.5 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 ${
                  errors.name
                    ? "border-destructive"
                    : "border-input hover:border-input/80"
                }`}
                placeholder="Ingresa el nombre"
              />
              {errors.name && (
                <div className="flex items-center space-x-1 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                <UserCheck className="w-4 h-4" />
                <span>Apellido</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange(e.target.value, "lastName")}
                className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 hover:border-input/80"
                placeholder="Ingresa el apellido"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => handleInputChange(e.target.value, "email")}
                className={`w-full px-3 py-2.5 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 ${
                  errors.email
                    ? "border-destructive"
                    : "border-input hover:border-input/80"
                }`}
                placeholder="ejemplo@correo.com"
              />
              {errors.email && (
                <div className="flex items-center space-x-1 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Teléfono</span>
              </label>
              <div className="flex gap-2 min-w-0">
                <Select
                  name="countryCode"
                  value={formData.countryCode}
                  onValueChange={(value) =>
                    handleInputChange(value, "countryCode")
                  }
                >
                  <SelectTrigger className="w-24 cursor-pointer px-2 py-2.5 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 hover:border-input/80 text-sm">
                    <SelectValue placeholder="País" />
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
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange(e.target.value, "phone")}
                  className={`flex-1 min-w-0 px-3 py-2.5 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 ${
                    errors.phone
                      ? "border-destructive"
                      : "border-input hover:border-input/80"
                  }`}
                  placeholder="1234567890"
                />
              </div>
              {errors.phone && (
                <div className="flex items-center space-x-1 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Género</span>
              </label>
              <Select
                name="gender"
                value={formData.gender}
                onValueChange={(value) => handleInputChange(value, "gender")}
              >
                <SelectTrigger className="w-full cursor-pointer px-3 py-2.5 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 hover:border-input/80">
                  <SelectValue placeholder="Selecciona género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Femenino">Femenino</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Dirección</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={(e) => handleInputChange(e.target.value, "address")}
                rows={3}
                className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 hover:border-input/80 resize-none"
                placeholder="Ingresa la dirección completa"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2 text-sm font-medium text-foreground border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loadingForm}
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
            >
              {loadingForm ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Contacto</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;
