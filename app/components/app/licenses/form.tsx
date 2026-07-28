import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle,
  Key,
  Settings,
  FileText,
  CheckCircle2,
  Loader2,
  Building2,
  DollarSign,
  Brain,
} from "lucide-react";
import { useFetcher, useNavigate } from "react-router";
import { countries } from "~/lib/data";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "~/components/ui";
import { Button } from "~/components/ui";
import usePath from "~/hooks/usePath";
import useToast from "~/hooks/useToast";
import { MIN_TOKENS_BUY, MAX_TOKENS_BUY } from "~/config/app";

interface FormData {
  // Información del usuario
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  phone: string;
  countryCode: string;
  country: string;
  useGoogleLogin: boolean;
  password: string;
  confirmPassword: string;

  // Configuración de licencia
  baseTokens: string;
  price: string;
  maxContacts: string;
  contactsUnlimited: boolean;
  maxUsers: string;
  usersUnlimited: boolean;
  maxAgents: string;
  agentsUnlimited: boolean;

  // Políticas
  acceptedPolicy: boolean;
}

interface FormErrors extends Partial<Omit<FormData, "acceptedPolicy">> {
  acceptedPolicy?: string;
  server?: string;
}

const STEPS = [
  { id: 1, name: "Información del Usuario", icon: User },
  { id: 2, name: "Configuración de Licencia", icon: Settings },
  { id: 3, name: "Términos y Condiciones", icon: FileText },
];

export default function FormLicense() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    companyName: "",
    phone: "",
    countryCode: "+57",
    country: "Colombia",
    useGoogleLogin: false,
    password: "",
    confirmPassword: "",
    baseTokens: `${MIN_TOKENS_BUY}`,
    price: "",
    maxContacts: "1000",
    contactsUnlimited: false,
    maxUsers: "1",
    usersUnlimited: false,
    maxAgents: "5",
    agentsUnlimited: false,
    acceptedPolicy: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const PATH = usePath();

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (errors.server) {
      setErrors((prev) => ({ ...prev, server: "" }));
    }
  };

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find((c) => c.code === countryCode);
    setFormData((prev) => ({
      ...prev,
      countryCode,
      country: country?.name || "",
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = "El nombre es requerido";
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = "El apellido es requerido";
      }
      if (!formData.email.trim()) {
        newErrors.email = "El correo es requerido";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Correo electrónico inválido";
      }
      if (!formData.companyName.trim()) {
        newErrors.companyName = "El nombre de la empresa es requerido";
      }
      if (!formData.phone.trim()) {
        newErrors.phone = "El teléfono es requerido";
      }
      if (!formData.useGoogleLogin) {
        if (!formData.password) {
          newErrors.password = "La contraseña es requerida";
        } else if (formData.password.length < 8) {
          newErrors.password = "La contraseña debe tener al menos 8 caracteres";
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Las contraseñas no coinciden";
        }
      }
    } else if (step === 2) {
      if (!formData.baseTokens.trim()) {
        newErrors.baseTokens = "Los tokens base son requeridos";
      } else if (
        isNaN(Number(formData.baseTokens)) ||
        Number(formData.baseTokens) < 0
      ) {
        newErrors.baseTokens = "Los tokens deben ser un número válido";
      } else if (Number(formData.baseTokens) < MIN_TOKENS_BUY) {
        newErrors.baseTokens = `El mínimo de tokens permitido es ${MIN_TOKENS_BUY.toLocaleString()}`;
      } else if (Number(formData.baseTokens) > MAX_TOKENS_BUY) {
        newErrors.baseTokens = `El máximo de tokens permitido es ${MAX_TOKENS_BUY.toLocaleString()}`;
      }
      if (
        !formData.contactsUnlimited &&
        (!formData.maxContacts.trim() ||
          isNaN(Number(formData.maxContacts)) ||
          Number(formData.maxContacts) < 0)
      ) {
        newErrors.maxContacts =
          "El límite de contactos debe ser un número válido";
      }
      if (!formData.price.trim()) {
        newErrors.price = "El precio es requerido";
      } else if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
        newErrors.price = "El precio debe ser un número válido";
      }
      if (
        !formData.usersUnlimited &&
        (!formData.maxUsers.trim() ||
          isNaN(Number(formData.maxUsers)) ||
          Number(formData.maxUsers) < 0)
      ) {
        newErrors.maxUsers = "El límite de usuarios debe ser un número válido";
      }
      if (
        !formData.agentsUnlimited &&
        (!formData.maxAgents.trim() ||
          isNaN(Number(formData.maxAgents)) ||
          Number(formData.maxAgents) < 0)
      ) {
        newErrors.maxAgents = "El límite de agentes debe ser un número válido";
      }
    } else if (step === 3) {
      if (!formData.acceptedPolicy) {
        newErrors.acceptedPolicy = "Debes aceptar los términos y condiciones";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (validateStep(3)) {
      setIsLoading(true);
      const submitData = {
        ...formData,
        baseTokens: Number(formData.baseTokens),
        price: Number(formData.price),
        maxContacts: formData.contactsUnlimited
          ? null
          : Number(formData.maxContacts),
        maxUsers: formData.usersUnlimited ? null : Number(formData.maxUsers),
        maxAgents: formData.agentsUnlimited ? null : Number(formData.maxAgents),
        password: formData.useGoogleLogin ? null : formData.password,
      };

      fetcher.submit(submitData as any, {
        method: "POST",
        action: `${PATH}/licenses/add`,
      });
    }
  };

  React.useEffect(() => {
    if (fetcher.data) {
      setIsLoading(false);
      if (fetcher.data.success === false || fetcher.data.status === "error") {
        setErrors((prev) => ({
          ...prev,
          server:
            fetcher.data?.message || "Ocurrió un error al crear la licencia",
        }));
      } else if (
        fetcher.data.success === true ||
        fetcher.data.status === "success"
      ) {
        useToast({
          icon: "success",
          title: "Licencia creada exitosamente",
        });
        navigate(`${PATH}/licenses`);
      }
    }
  }, [fetcher.data, PATH, navigate]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Nombre *</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className={`w-full px-3 py-2.5 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 ${
                    errors.firstName
                      ? "border-destructive"
                      : "border-input hover:border-input/80"
                  }`}
                  placeholder="Ingresa el nombre"
                />
                {errors.firstName && (
                  <div className="flex items-center space-x-1 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.firstName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Apellido *</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className={`w-full px-3 py-2.5 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 ${
                    errors.lastName
                      ? "border-destructive"
                      : "border-input hover:border-input/80"
                  }`}
                  placeholder="Ingresa el apellido"
                />
                {errors.lastName && (
                  <div className="flex items-center space-x-1 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.lastName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Correo electrónico *</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
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
                <Building2 className="w-4 h-4" />
                <span>Nombre de la empresa *</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) =>
                  handleInputChange("companyName", e.target.value)
                }
                className={`w-full px-3 py-2.5 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 ${
                  errors.companyName
                    ? "border-destructive"
                    : "border-input hover:border-input/80"
                }`}
                placeholder="Ingresa el nombre de la empresa"
              />
              {errors.companyName && (
                <div className="flex items-center space-x-1 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.companyName}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Teléfono *</span>
              </label>
              <div className="flex gap-2">
                <Select
                  value={formData.countryCode}
                  onValueChange={handleCountryChange}
                >
                  <SelectTrigger className="w-32 cursor-pointer">
                    <SelectValue />
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
                  value={formData.phone}
                  onChange={(e) =>
                    handleInputChange(
                      "phone",
                      e.target.value.replace(/[^0-9]/g, "")
                    )
                  }
                  className={`flex-1 px-3 py-2.5 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 ${
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

            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                  <Key className="w-4 h-4" />
                  <span>Iniciar sesión con Google</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    handleInputChange(
                      "useGoogleLogin",
                      !formData.useGoogleLogin
                    );
                    if (!formData.useGoogleLogin) {
                      handleInputChange("password", "");
                      handleInputChange("confirmPassword", "");
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.useGoogleLogin ? "bg-primary" : "bg-muted"
                  } cursor-pointer`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.useGoogleLogin
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Si activas esta opción, el usuario podrá iniciar sesión usando
                su cuenta de Google y no se requerirá contraseña.
              </p>
            </div>

            {!formData.useGoogleLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                    <Key className="w-4 h-4" />
                    <span>Contraseña *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      className={`w-full px-3 py-2.5 pr-10 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 ${
                        errors.password
                          ? "border-destructive"
                          : "border-input hover:border-input/80"
                      }`}
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="flex items-center space-x-1 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.password}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                    <Key className="w-4 h-4" />
                    <span>Confirmar contraseña *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      className={`w-full px-3 py-2.5 pr-10 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 ${
                        errors.confirmPassword
                          ? "border-destructive"
                          : "border-input hover:border-input/80"
                      }`}
                      placeholder="Confirma tu contraseña"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <div className="flex items-center space-x-1 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.confirmPassword}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tokens para la licencia *{" "}
                </label>
                <input
                  type="number"
                  value={formData.baseTokens}
                  onChange={(e) =>
                    handleInputChange("baseTokens", e.target.value)
                  }
                  className={`w-full px-3 py-2.5 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 ${
                    errors.baseTokens
                      ? "border-destructive"
                      : "border-input hover:border-input/80"
                  }`}
                  placeholder={`Mínimo ${MIN_TOKENS_BUY.toLocaleString()}`}
                  min={MIN_TOKENS_BUY}
                  max={MAX_TOKENS_BUY}
                />
                {errors.baseTokens && (
                  <div className="flex items-center space-x-1 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.baseTokens}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Precio de la licencia *</span>
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 ${
                    errors.price
                      ? "border-destructive"
                      : "border-input hover:border-input/80"
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                {errors.price && (
                  <div className="flex items-center space-x-1 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.price}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Límite de contactos
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleInputChange(
                      "contactsUnlimited",
                      !formData.contactsUnlimited
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.contactsUnlimited ? "bg-primary" : "bg-muted"
                  } cursor-pointer`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.contactsUnlimited
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {formData.contactsUnlimited ? "Ilimitado" : "Establecer límite"}
              </p>
              {!formData.contactsUnlimited && (
                <input
                  type="number"
                  value={formData.maxContacts}
                  onChange={(e) =>
                    handleInputChange("maxContacts", e.target.value)
                  }
                  className={`w-full px-3 py-2.5 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 ${
                    errors.maxContacts
                      ? "border-destructive"
                      : "border-input hover:border-input/80"
                  }`}
                  placeholder="1000"
                  min="0"
                />
              )}
              {errors.maxContacts && (
                <div className="flex items-center space-x-1 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.maxContacts}</span>
                </div>
              )}
            </div>

            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Límite de usuarios
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleInputChange(
                      "usersUnlimited",
                      !formData.usersUnlimited
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.usersUnlimited ? "bg-primary" : "bg-muted"
                  } cursor-pointer`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.usersUnlimited
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {formData.usersUnlimited ? "Ilimitado" : "Establecer límite"}
              </p>
              {!formData.usersUnlimited && (
                <input
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) =>
                    handleInputChange("maxUsers", e.target.value)
                  }
                  className={`w-full px-3 py-2.5 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 ${
                    errors.maxUsers
                      ? "border-destructive"
                      : "border-input hover:border-input/80"
                  }`}
                  placeholder="1"
                  min="0"
                />
              )}
              {errors.maxUsers && (
                <div className="flex items-center space-x-1 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.maxUsers}</span>
                </div>
              )}
            </div>

            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                  <span>Límite de agentes</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleInputChange(
                      "agentsUnlimited",
                      !formData.agentsUnlimited
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.agentsUnlimited ? "bg-primary" : "bg-muted"
                  } cursor-pointer`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.agentsUnlimited
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {formData.agentsUnlimited ? "Ilimitado" : "Establecer límite"}
              </p>
              {!formData.agentsUnlimited && (
                <input
                  type="number"
                  value={formData.maxAgents}
                  onChange={(e) =>
                    handleInputChange("maxAgents", e.target.value)
                  }
                  className={`w-full px-3 py-2.5 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 ${
                    errors.maxAgents
                      ? "border-destructive"
                      : "border-input hover:border-input/80"
                  }`}
                  placeholder="5"
                  min="0"
                />
              )}
              {errors.maxAgents && (
                <div className="flex items-center space-x-1 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.maxAgents}</span>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="p-6 bg-muted/30 rounded-lg border border-border text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Términos y Condiciones
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Para crear esta licencia, debes aceptar nuestros términos y
                condiciones de uso.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-3 p-4 border border-border rounded-lg">
                <input
                  type="checkbox"
                  id="policy"
                  checked={formData.acceptedPolicy}
                  onChange={(e) =>
                    handleInputChange("acceptedPolicy", e.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring cursor-pointer"
                />
                <label
                  htmlFor="policy"
                  className="flex-1 text-sm text-foreground cursor-pointer"
                >
                  Acepto los{" "}
                  <a
                    href="/terms-and-conditions-resale-licenses"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    términos y condiciones de reventa de licencias
                  </a>{" "}
                  y la{" "}
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    política de privacidad
                  </a>
                  . *
                </label>
              </div>
              {errors.acceptedPolicy && (
                <div className="flex items-center space-x-1 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.acceptedPolicy}</span>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const currentStepData = STEPS[currentStep - 1];

  return (
    <div className="w-full bg-background dark:bg-transparent px-3 py-2 transition-colors duration-300">
      <div className="mb-6 py-2 border-b border-border flex-shrink-0">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Crear Nueva Licencia
        </h1>
        <p className="text-sm text-muted-foreground">
          Completa el formulario paso a paso para crear una nueva licencia
        </p>
      </div>

      <div className="mx-auto bg-card rounded-lg shadow-sm border border-border max-w-3xl">
        {/* Progress Steps */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium text-center ${
                        isActive
                          ? "text-foreground"
                          : isCompleted
                            ? "text-primary"
                            : "text-muted-foreground"
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {errors.server && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center space-x-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span>{errors.server}</span>
            </div>
          )}

          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isLoading}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </Button>

          <div className="text-sm text-muted-foreground">
            Paso {currentStep} de {STEPS.length}
          </div>

          {currentStep < STEPS.length ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !formData.acceptedPolicy}
              className="flex items-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
