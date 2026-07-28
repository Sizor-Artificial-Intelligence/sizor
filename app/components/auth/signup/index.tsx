import React, { useState, useMemo } from "react";
import { Eye, EyeOff, Loader2, ChevronDown, Search } from "lucide-react";
import { APP_NAME } from "~/config/app";
import { Link, useFetcher } from "react-router";
import { countries } from "~/lib/data";
import { VITE_GOOGLE_CLIENT_ID } from "~/config/env";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  country: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors extends Partial<FormData> {
  server?: string;
}

const RegisterForm = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "+57",
    country: "Colombia",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryDropdownRef = React.useRef<HTMLDivElement>(null);
  const fetch = useFetcher();

  // Cerrar dropdown al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        countryDropdownOpen &&
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(e.target as Node)
      ) {
        setCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [countryDropdownOpen]);

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

  const handleCountryChange = (countryAbbr: string) => {
    const country = countries.find((c) => c.abbr === countryAbbr);
    if (country) {
      setFormData((prev) => ({
        ...prev,
        countryCode: country.code,
        country: country.name,
      }));
    }
  };

  const selectedCountry = useMemo(
    () =>
      countries.find((c) => c.name === formData.country) ??
      countries.find((c) => c.code === formData.countryCode) ??
      countries[3], // Colombia por defecto
    [formData.country, formData.countryCode]
  );

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countries;
    const q = countrySearch.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    return countries.filter(
      (c) =>
        c.name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").includes(q) ||
        c.code.includes(countrySearch) ||
        c.abbr.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "El nombre es requerido";
    if (!formData.lastName.trim())
      newErrors.lastName = "El apellido es requerido";
    if (!formData.email.trim()) newErrors.email = "El correo es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Correo electrónico inválido";
    }
    if (!formData.phone.trim()) newErrors.phone = "El celular es requerido";
    if (!formData.password) newErrors.password = "La contraseña es requerida";
    else if (formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setIsLoading(true);
      fetch.submit({ ...formData } as any, {
        method: "POST",
        action: "/auth/register/",
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
        // Si hay redirección, el registro fue exitoso
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
            width: 400,
          });
        }
      } catch (error) {
        console.error("Error al inicializar Google Sign-In:", error);
        // Mostrar el botón de fallback si Google falla
        const fallbackButton = document.querySelector(
          'button[onclick="handleGoogleSignIn"]',
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
      formData.append("actionType", "signup");

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


  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Crear cuenta</h1>
          <p className="text-gray-400 text-sm">
            Crea tu cuenta para empezar a usar {APP_NAME}
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                placeholder="Nombres"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
              {errors.firstName && (
                <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <input
                type="text"
                placeholder="Apellidos"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
              {errors.lastName && (
                <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="relative" ref={countryDropdownRef}>
              <button
                type="button"
                onClick={() => setCountryDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer text-sm min-w-[140px] hover:bg-gray-700"
              >
                <span className="text-base">{selectedCountry?.flag}</span>
                <span className="flex-1 text-left truncate">
                  {selectedCountry?.name}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${countryDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {countryDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 max-h-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Buscar país..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1 py-1">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country) => (
                        <button
                          key={country.abbr}
                          type="button"
                          onClick={() => {
                            handleCountryChange(country.abbr);
                            setCountryDropdownOpen(false);
                            setCountrySearch("");
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                            selectedCountry?.abbr === country.abbr
                              ? "bg-blue-500/20 text-white"
                              : "text-gray-300 hover:bg-gray-700"
                          }`}
                        >
                          <span className="text-lg">{country.flag}</span>
                          <span className="flex-1">{country.name}</span>
                          <span className="text-gray-500 text-xs">
                            {country.code}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="px-4 py-6 text-center text-gray-500 text-sm">
                        No se encontraron países
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1">
              <input
                type="tel"
                placeholder="Número de teléfono"
                value={formData.phone}
                onChange={(e) =>
                  handleInputChange("phone", e.target.value.replace(/\D/g, ""))
                }
                inputMode="numeric"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
              {errors.phone && (
                <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

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

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirmar contraseña"
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

          {/* <div className="text-xs text-gray-400 text-center mt-4">
            Al crear una cuenta, usted acepta nuestra{" "}
            <a href="#" className="text-white underline hover:text-gray-300">
              Términos de uso
            </a>{" "}
            y{" "}
            <a href="#" className="text-white underline hover:text-gray-300">
              Política de privacidad
            </a>
          </div> */}


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
                <span>Procesando...</span>
              </div>
            ) : (
              "Crear cuenta"
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
                    <span>Autenticando con Google...</span>
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
            ¿Ya tiene una cuenta?
            <div className="mt-3">
              <Link to="/auth/login/">
                <button className="w-full cursor-pointer bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 text-sm">
                  Iniciar sesión
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
