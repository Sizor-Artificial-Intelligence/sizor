import React, { useState, useRef } from "react";
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { APP_NAME } from "~/config/app";
import { Link, useFetcher } from "react-router";

interface FormData {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors extends Partial<FormData> {
  server?: string;
}

type Step = "email" | "code" | "password" | "success";

const ForgotPasswordPage = () => {
  const [currentStep, setCurrentStep] = useState<Step>("email");
  const [formData, setFormData] = useState<FormData>({
    email: "",
    code: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fetch = useFetcher();
  const currentStepRef = useRef<Step>(currentStep);

  // Actualizar el ref cuando cambie el currentStep
  React.useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (errors.server) {
      setErrors((prev) => ({ ...prev, server: "" }));
    }
  };

  const validateEmail = () => {
    const newErrors: FormErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "El correo es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Correo electrónico inválido";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCode = () => {
    const newErrors: FormErrors = {};
    if (!formData.code.trim()) {
      newErrors.code = "El código es requerido";
    } else if (formData.code.length !== 6) {
      newErrors.code = "El código debe tener 6 dígitos";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors: FormErrors = {};
    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSubmit = () => {
    if (validateEmail()) {
      setIsLoading(true);
      currentStepRef.current = "email";
      fetch.submit(
        { email: formData.email },
        {
          method: "POST",
          action: "/auth/forgot-password/send-code/",
        }
      );
    }
  };

  const handleCodeSubmit = () => {
    if (validateCode()) {
      setIsLoading(true);
      currentStepRef.current = "code";
      fetch.submit(
        { email: formData.email, code: formData.code },
        {
          method: "POST",
          action: "/auth/forgot-password/verify-code/",
        }
      );
    }
  };

  const handlePasswordSubmit = () => {
    if (validatePassword()) {
      setIsLoading(true);
      currentStepRef.current = "password";
      fetch.submit(
        {
          email: formData.email,
          code: formData.code,
          password: formData.password,
        },
        {
          method: "POST",
          action: "/auth/forgot-password/reset-password/",
        }
      );
    }
  };

  // Manejar respuestas del servidor
  React.useEffect(() => {
    if (fetch.data) {
      setIsLoading(false);

      if (fetch.data.success) {
        switch (currentStepRef.current) {
          case "email":
            setCurrentStep("code");
            setSuccessMessage("Código enviado a tu correo electrónico");
            break;
          case "code":
            setCurrentStep("password");
            setSuccessMessage("Código verificado correctamente");
            break;
          case "password":
            setCurrentStep("success");
            setSuccessMessage("Contraseña actualizada exitosamente");
            break;
        }
      } else if (fetch.data.message) {
        setErrors((prev) => ({ ...prev, server: fetch.data.message }));
      }
    }
  }, [fetch.data]);

  const goBack = () => {
    if (currentStep === "code") {
      setCurrentStep("email");
      setFormData((prev) => ({ ...prev, code: "" }));
    } else if (currentStep === "password") {
      setCurrentStep("code");
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    }
    setErrors({});
    setSuccessMessage("");
  };

  const renderEmailStep = () => (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Recuperar contraseña
        </h1>
        <p className="text-gray-400 text-sm">
          Ingresa tu correo electrónico para recibir un código de verificación
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        {errors.server && (
          <p className="text-red-400 text-xs text-center mt-1">
            {errors.server}
          </p>
        )}

        <button
          onClick={handleEmailSubmit}
          disabled={isLoading}
          className="w-full cursor-pointer bg-white hover:bg-gray-200 text-black font-medium py-3 px-6 rounded-lg transition-all duration-200 text-sm"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            "Enviar código"
          )}
        </button>

        <div className="text-center text-gray-400 text-sm mt-6">
          ¿Recordaste tu contraseña?
          <div className="mt-3">
            <Link to="/auth/login/">
              <button className="w-full cursor-pointer bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 text-sm">
                Iniciar sesión
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );

  const renderCodeStep = () => (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Verificar código</h1>
        <p className="text-gray-400 text-sm">
          Ingresa el código de 6 dígitos que enviamos a {formData.email}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Código de verificación"
            value={formData.code}
            onChange={(e) =>
              handleInputChange(
                "code",
                e.target.value.replace(/\D/g, "").slice(0, 6)
              )
            }
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl tracking-widest"
            maxLength={6}
          />
          {errors.code && (
            <p className="text-red-400 text-xs mt-1">{errors.code}</p>
          )}
        </div>

        {errors.server && (
          <p className="text-red-400 text-xs text-center mt-1">
            {errors.server}
          </p>
        )}

        <button
          onClick={handleCodeSubmit}
          disabled={isLoading}
          className="w-full cursor-pointer bg-white hover:bg-gray-200 text-black font-medium py-3 px-6 rounded-lg transition-all duration-200 text-sm"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            "Verificar código"
          )}
        </button>

        <div className="text-center">
          <button
            onClick={handleEmailSubmit}
            disabled={isLoading}
            className="text-white cursor-pointer text-sm underline hover:text-gray-300"
          >
            Reenviar código
          </button>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={goBack}
            className="flex items-center text-gray-400 cursor-pointer hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cambiar correo electrónico
          </button>
        </div>
      </div>
    </>
  );

  const renderPasswordStep = () => (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Nueva contraseña</h1>
        <p className="text-gray-400 text-sm">
          Crea una nueva contraseña segura para tu cuenta
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nueva contraseña"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
          {errors.password && (
            <p className="text-red-400 text-xs mt-1">{errors.password}</p>
          )}
        </div>

        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirmar nueva contraseña"
            value={formData.confirmPassword}
            onChange={(e) =>
              handleInputChange("confirmPassword", e.target.value)
            }
            className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
          {errors.confirmPassword && (
            <p className="text-red-400 text-xs mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {errors.server && (
          <p className="text-red-400 text-xs text-center mt-1">
            {errors.server}
          </p>
        )}

        <button
          onClick={handlePasswordSubmit}
          disabled={isLoading}
          className="w-full cursor-pointer bg-white hover:bg-gray-200 text-black font-medium py-3 px-6 rounded-lg transition-all duration-200 text-sm"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            "Actualizar contraseña"
          )}
        </button>

        <div className="flex items-center justify-center">
          <button
            onClick={goBack}
            className="flex items-center text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al código
          </button>
        </div>
      </div>
    </>
  );

  const renderSuccessStep = () => (
    <>
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          ¡Contraseña actualizada!
        </h1>
        <p className="text-gray-400 text-sm">
          Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar
          sesión con tu nueva contraseña.
        </p>
      </div>

      <div className="space-y-4">
        <Link to="/auth/login/">
          <button className="w-full cursor-pointer bg-white hover:bg-gray-200 text-black font-medium py-3 px-6 rounded-lg transition-all duration-200 text-sm">
            Iniciar sesión
          </button>
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {successMessage && currentStep !== "success" && (
          <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-green-400 text-sm text-center">
              {successMessage}
            </p>
          </div>
        )}

        {currentStep === "email" && renderEmailStep()}
        {currentStep === "code" && renderCodeStep()}
        {currentStep === "password" && renderPasswordStep()}
        {currentStep === "success" && renderSuccessStep()}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
