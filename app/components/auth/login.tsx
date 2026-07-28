import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { APP_NAME } from "~/config/app";
import { VITE_GOOGLE_CLIENT_ID } from "~/config/env";
import { Link, useFetcher, useSearchParams } from "react-router";
import useToast from "~/hooks/useToast";

interface FormData {
  email: string;
  password: string;
}

interface FormErrors extends Partial<FormData> {
  server?: string;
}

const LoginForm = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const fetch = useFetcher();
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    // Limpiar error del servidor cuando el usuario empiece a escribir
    if (errors.server) {
      setErrors((prev) => ({ ...prev, server: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "El correo es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Correo electrónico inválido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setIsLoading(true);
      fetch.submit(formData as any, {
        method: "POST",
        action: "/auth/login/",
      });
    }
  };

  // Manejar la respuesta del fetcher
  React.useEffect(() => {
    if (fetch.data) {
      setIsLoading(false);
      if (fetch.data.message) {
        // Si hay un mensaje de error, mostrarlo
        setErrors((prev) => ({ ...prev, server: fetch.data.message }));
      } else if (fetch.data.redirect) {
        // Si hay redirección, el login fue exitoso
        window.location.href = fetch.data.redirect;
      }
    }
  }, [fetch.data]);

  // Manejar el estado de carga del fetcher (especialmente para Google OAuth)
  React.useEffect(() => {
    if (fetch.state === "loading") {
      setIsLoading(true);
    } else if (fetch.state === "idle" && fetch.data) {
      // Solo desactivar el loading cuando tenemos una respuesta
      setIsLoading(false);
    }
  }, [fetch.state, fetch.data]);

  // Inicializar Google Sign-In cuando el componente se monte
  React.useEffect(() => {
    const initGoogleSignIn = async () => {
      try {
        if (!window.google) {
          await loadGoogleScript();
        }

        // Inicializar Google Identity Services
        window.google.accounts.id.initialize({
          client_id: VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
        });

        // Renderizar el botón de Google
        const buttonContainer = document.getElementById("google-signin-button");
        if (buttonContainer) {
          window.google.accounts.id.renderButton(buttonContainer, {
            theme: "outline",
            size: "large",
            type: "standard",
            shape: "rectangular",
            text: "continue_with",
            width: "100%",
          });
        }
      } catch (error) {
        console.error("Error al inicializar Google Sign-In:", error);
        // Mostrar el botón de fallback si Google falla
        const fallbackButton = document.querySelector(
          'button[onclick="handleGoogleSignIn"]'
        ) as HTMLButtonElement;
        if (fallbackButton) {
          fallbackButton.style.display = "block";
        }
      }
    };

    initGoogleSignIn();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Método de fallback para cuando Google no se puede cargar
      if (!window.google) {
        await loadGoogleScript();
      }

      // Mostrar el popup de Google como fallback
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log("Google Sign-In no se pudo mostrar");
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error("Error al inicializar Google Sign-In:", error);
      setErrors((prev) => ({
        ...prev,
        server: "Error al conectar con Google",
      }));
      setIsLoading(false);
    }
  };

  const handleGoogleCallback = async (response: any) => {
    try {
      setIsLoading(true); // Activar el precargador
      const formData = new FormData();
      formData.append("idToken", response.credential);
      formData.append("actionType", "login");

      fetch.submit(formData, {
        method: "POST",
        action: "/auth/google",
      });
    } catch (error) {
      console.error("Error en callback de Google:", error);
      setErrors((prev) => ({
        ...prev,
        server: "Error al procesar la autenticación de Google",
      }));
      setIsLoading(false);
    }
  };

  const loadGoogleScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Error al cargar Google Script"));
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    if (error) {
      if (error === "no-companies") {
        setErrors((prev) => ({
          ...prev,
          server: "El usuario no tiene empresas asociadas",
        }));
      }
      setIsLoading(false);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Iniciar sesión</h1>
          <p className="text-gray-400 text-sm">
            Ingresa a tu cuenta de {APP_NAME}
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

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
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

          <div className="flex justify-end">
            <Link
              to="/auth/forgot-password/"
              className="text-white text-sm underline hover:text-gray-300"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {errors.server && (
            <p className="text-red-400 text-xs text-center mt-1">
              {errors.server}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full cursor-pointer bg-white hover:bg-gray-200 text-black font-medium py-3 px-6 rounded-lg transition-all duration-200 text-sm mt-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Iniciando sesión...</span>
              </div>
            ) : (
              "Iniciar sesión"
            )}
          </button>

          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative bg-black px-4 text-gray-400 text-xs">
              o continuar con
            </div>
          </div>

          <div className="flex gap-4 justify-center relative">
            {/* Botón de Google renderizado dinámicamente */}
            <div id="google-signin-button" className="w-full relative">
              {/* Overlay de carga para Google OAuth */}
              {isLoading && (
                <div className="absolute inset-0 bg-gray-800 bg-opacity-75 rounded-lg flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-white text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Iniciando sesión con Google...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Botón de fallback */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-12 h-12 cursor-pointer bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ display: "none" }} // Ocultar por defecto, se mostrará si Google no se puede cargar
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285f4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34a853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#fbbc05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#ea4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
            </button>
          </div>

          <div className="text-center text-gray-400 text-sm mt-6">
            ¿No tienes una cuenta?
            <div className="mt-3">
              <Link to="/auth/register/">
                <button className="w-full cursor-pointer bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 text-sm">
                  Crear cuenta
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
