import {
  APP_COST,
  APP_NAME,
  LICENSE_PRICE,
  MAX_TOKENS_BUY,
  MIN_TOKENS_BUY,
  TOKEN_PRICE,
} from "~/config/app";
import { useState, useEffect, useRef } from "react";
import { Loader2, LogOut } from "lucide-react";
import { useFetcher } from "react-router";
import type { Company } from "~/types/schema";
import useToast from "~/hooks/useToast";
import { VITE_DOMAIN } from "~/config/env";
import {
  formatFullDate,
  formatNumberWithSeparators,
  getDateInDays,
} from "~/lib/utils.functions";
import axios from "axios";

function HelpButton({
  tooltipId,
  content,
  activeTooltip,
  setActiveTooltip,
  reuse = false,
  company = null,
}: {
  tooltipId: string;
  content: string;
  activeTooltip: string | null;
  setActiveTooltip: (id: string | null) => void;
  reuse?: boolean;
  company?: Company | null;
}) {
  return (
    <div className="relative inline-block">
      <button
        type="button"
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 transition-colors ${reuse ? "dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-300 dark:hover:text-gray-100" : ""}`}
        onMouseEnter={() => setActiveTooltip(tooltipId)}
        onMouseLeave={() => setActiveTooltip(null)}
        onClick={() =>
          setActiveTooltip(activeTooltip === tooltipId ? null : tooltipId)
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <path d="M12 17h.01"></path>
        </svg>
      </button>
      {activeTooltip === tooltipId && (
        <div
          className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg ${reuse ? "dark:bg-gray-800" : ""}`}
          style={{ zIndex: 999999 }}
        >
          <div className="text-left">{content}</div>
          <div
            className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 ${reuse ? "dark:border-t-gray-800" : ""}`}
          ></div>
        </div>
      )}
    </div>
  );
}

export default function SignupPlan({
  reuse = false,
  isFree = false,
  isPremium = false,
  onChangePlan,
  company = null,
  isEnterprise = false,
  hasPremium = false,
  hasEnterprise = false,
}: {
  reuse?: boolean;
  isFree?: boolean;
  isPremium?: boolean;
  onChangePlan?: (data: any) => void;
  company?: Company | null;
  isEnterprise?: boolean;
  hasPremium?: boolean;
  hasEnterprise?: boolean;
}) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>("tokens");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [tokenAmount, setTokenAmount] = useState(MIN_TOKENS_BUY);
  const [licenseAmount, setLicenseAmount] = useState(3);
  const [formattedTokenAmount, setFormattedTokenAmount] = useState(
    MIN_TOKENS_BUY.toLocaleString("es-ES")
  );
  const [isTokenIncrease, setIsTokenIncrease] = useState(false);
  const [tokenIncreaseType, setTokenIncreaseType] = useState<
    "one-time" | "permanent"
  >("one-time");
  const [customSubdomain, setCustomSubdomain] = useState("");
  const [subdomainError, setSubdomainError] = useState("");
  const [isValidatingSubdomain, setIsValidatingSubdomain] = useState(false);
  const subdomainValidationTimeout = useRef<NodeJS.Timeout | null>(null);
  const fetcher = useFetcher();
  const [showTokenModalAnimation, setShowTokenModalAnimation] = useState(false);
  const [showLicenseModalAnimation, setShowLicenseModalAnimation] =
    useState(false);

  // Manejar respuestas del fetcher cuando no es reusable
  useEffect(() => {
    if (!reuse && fetcher.data) {
      setIsLoading(false);
      if (fetcher.data?.success === false) {
        useToast({
          icon: "error",
          title: fetcher.data?.message || "Ocurrió un error inesperado",
        });
      } else if (fetcher.data?.success === true) {
        if (fetcher.data?.url) {
          window.location.href = fetcher.data.url;
        }
      }
    }
  }, [fetcher.data, reuse]);

  // Manejar respuestas del fetcher cuando es reusable
  useEffect(() => {
    if (reuse && fetcher.data) {
      setIsLoading(false);
      if (fetcher.data?.success === false) {
        useToast({
          icon: "error",
          title: fetcher.data?.message || "Ocurrió un error inesperado",
        });
      } else if (fetcher.data?.success === true) {
        if (fetcher.data?.url) {
          window.location.href = fetcher.data.url;
        }
      }
    }
  }, [fetcher.data, reuse]);

  // Resetear animación del modal de tokens cuando se cierra
  useEffect(() => {
    if (!showTokenModal) {
      setShowTokenModalAnimation(false);
    }
  }, [showTokenModal]);

  // Resetear animación del modal de licencias cuando se cierra
  useEffect(() => {
    if (!showLicenseModal) {
      setShowLicenseModalAnimation(false);
    }
  }, [showLicenseModal]);

  // Prevenir scroll del body cuando los modales están abiertos
  useEffect(() => {
    if (showTokenModal || showLicenseModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showTokenModal, showLicenseModal]);

  // Validar subdominio
  const validateSubdomain = (subdomain: string): string => {
    if (!subdomain.trim()) {
      return "El subdominio es requerido";
    }

    // Verificar longitud
    if (subdomain.length < 3) {
      return "El subdominio debe tener al menos 3 caracteres";
    }

    if (subdomain.length > 63) {
      return "El subdominio no puede tener más de 63 caracteres";
    }

    // Verificar que solo contenga caracteres válidos (letras, números y guiones)
    const validPattern = /^[a-zA-Z0-9-]+$/;
    if (!validPattern.test(subdomain)) {
      return "El subdominio solo puede contener letras, números y guiones";
    }

    // No puede empezar o terminar con guión
    if (subdomain.startsWith("-") || subdomain.endsWith("-")) {
      return "El subdominio no puede empezar o terminar con guión";
    }

    // No puede contener guiones consecutivos
    if (subdomain.includes("--")) {
      return "El subdominio no puede contener guiones consecutivos";
    }

    // Verificar que no sea solo números
    if (/^\d+$/.test(subdomain)) {
      return "El subdominio no puede ser solo números";
    }

    // Verificar que no contenga puntos
    if (subdomain.includes(".")) {
      return "El subdominio no puede contener puntos";
    }

    // Lista de subdominios reservados
    const reservedSubdomains = [
      "www",
      "api",
      "admin",
      "mail",
      "email",
      "ftp",
      "localhost",
      "root",
      "support",
      "help",
      "blog",
      "news",
      "shop",
      "store",
      "app",
      "mobile",
      "test",
      "staging",
      "dev",
      "development",
      "prod",
      "production",
    ];

    if (reservedSubdomains.includes(subdomain.toLowerCase())) {
      return "Este subdominio está reservado, por favor elige otro";
    }

    return "";
  };

  // Validar subdominio de forma asíncrona
  const validateSubdomainAsync = async (subdomain: string) => {
    if (!subdomain.trim()) {
      setSubdomainError("");
      return;
    }

    // Primero validar formato
    const formatError = validateSubdomain(subdomain);
    if (formatError) {
      setSubdomainError(formatError);
      return;
    }

    // Si el formato es válido, verificar disponibilidad
    setIsValidatingSubdomain(true);
    setSubdomainError("");

    try {
      const exists = await axios.post(`/api/exists-subdomain`, {
        subdomain,
      });
      if (exists.data?.exists) {
        setSubdomainError(
          "Este subdominio ya está en uso, por favor elige otro"
        );
      } else {
        setSubdomainError(""); // Subdominio disponible
      }
    } catch (error) {
      console.error("Error al validar subdominio:", error);
      setSubdomainError("Error al verificar la disponibilidad del subdominio");
    } finally {
      setIsValidatingSubdomain(false);
    }
  };

  // Manejar cambios en el input del subdominio
  const handleSubdomainChange = (value: string) => {
    // Convertir a minúsculas y limpiar
    const cleanValue = value.toLowerCase().trim();
    setCustomSubdomain(cleanValue);

    // Validar formato inmediatamente
    const formatError = validateSubdomain(cleanValue);
    if (formatError) {
      setSubdomainError(formatError);
      return;
    }

    // Si el formato es válido, validar disponibilidad con debounce
    if (subdomainValidationTimeout.current) {
      clearTimeout(subdomainValidationTimeout.current);
    }

    subdomainValidationTimeout.current = setTimeout(() => {
      validateSubdomainAsync(cleanValue);
    }, 500); // Esperar 500ms después del último cambio
  };

  const selectPlan = (plan: "gratis" | "premium" | "enterprise") => {
    setSelectedPlan(plan);
    setIsLoading(true);

    if (plan === "gratis") {
      setSelectedPlan("gratis");
      setIsLoading(true);
      fetcher.submit(
        { plan: "GRATIS" },
        { method: "POST", action: "/auth/signup/plan/" }
      );
    } else if (plan === "premium") {
      setTimeout(() => {
        setIsLoading(false);
        setIsTokenIncrease(false);
        setShowTokenModal(true);
        // Trigger animation after modal is shown
        setTimeout(() => setShowTokenModalAnimation(true), 10);
      }, 1000);
    } else if (plan === "enterprise") {
      setTimeout(() => {
        setIsLoading(false);
        setShowLicenseModal(true);
        // Trigger animation after modal is shown
        setTimeout(() => setShowLicenseModalAnimation(true), 10);
      }, 1000);
    }
  };

  const calculateTokenPrice = (tokens: number) => {
    return (tokens * TOKEN_PRICE).toFixed(2);
  };

  const calculateTotalPrice = (tokens: number) => {
    const tokenCost = tokens * TOKEN_PRICE;
    let appCost = 0; // Costo fijo de la aplicación
    if (!reuse || (reuse && isFree) || hasPremium) {
      appCost = APP_COST;
      if (isTokenIncrease) appCost = 0;
    }
    return (tokenCost + appCost).toFixed(2);
  };

  const calculateLicensePrice = (licenses: number) => {
    return (licenses * LICENSE_PRICE).toFixed(2);
  };

  const calculateEnterpriseTotalPrice = (licenses: number) => {
    const licenseCost = licenses * LICENSE_PRICE;
    let appCost = APP_COST; // Costo fijo de la aplicación
    return (licenseCost + appCost).toFixed(2);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("es-ES");
  };

  const parseFormattedNumber = (str: string) => {
    return parseInt(str.replace(/,/g, "")) || 0;
  };

  const handleTokenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Remover cualquier carácter que no sea número o coma
    const cleanValue = value.replace(/[^\d,]/g, "");

    // Permitir escribir libremente sin validación inmediata
    if (cleanValue === "") {
      setFormattedTokenAmount("");
      setTokenAmount(0);
    } else {
      // Formatear el número mientras se escribe
      const numericValue = parseFormattedNumber(cleanValue);
      setTokenAmount(numericValue);
      setFormattedTokenAmount(formatNumber(numericValue));
    }
  };

  const handleTokenInputBlur = () => {
    // Validar y ajustar cuando se pierde el foco
    if (!formattedTokenAmount || tokenAmount === 0) {
      // Si está vacío, establecer el mínimo
      setTokenAmount(MIN_TOKENS_BUY);
      setFormattedTokenAmount(formatNumber(MIN_TOKENS_BUY));
    } else if (tokenAmount < MIN_TOKENS_BUY) {
      // Si es menor al mínimo, establecer el mínimo
      setTokenAmount(MIN_TOKENS_BUY);
      setFormattedTokenAmount(formatNumber(MIN_TOKENS_BUY));
    } else if (tokenAmount > MAX_TOKENS_BUY) {
      // Si es mayor al máximo, establecer el máximo
      setTokenAmount(MAX_TOKENS_BUY);
      setFormattedTokenAmount(formatNumber(MAX_TOKENS_BUY));
    }
  };

  const handleTokenConfirm = () => {
    if (tokenAmount < MIN_TOKENS_BUY) {
      setTokenAmount(MIN_TOKENS_BUY);
      setFormattedTokenAmount(formatNumber(MIN_TOKENS_BUY));
      useToast({
        icon: "error",
        title: `El número de créditos debe ser mayor o igual a ${MIN_TOKENS_BUY.toLocaleString("es-ES")}`,
      });
      return;
    }
    if (tokenAmount > MAX_TOKENS_BUY) {
      setTokenAmount(MAX_TOKENS_BUY);
      setFormattedTokenAmount(formatNumber(MAX_TOKENS_BUY));
      useToast({
        icon: "error",
        title: `El número de créditos debe ser menor o igual a ${MAX_TOKENS_BUY.toLocaleString("es-ES")}`,
      });
      return;
    }
    handleCloseTokenModal();
    setSelectedPlan("premium");
    setIsLoading(true);

    const planData = {
      plan: "PREMIUM",
      price: calculateTotalPrice(tokenAmount),
      tokens: tokenAmount,
      ...(isTokenIncrease && {
        isTokenIncrease: true,
        tokenIncreaseType,
        currentTokens: company?.plan?.maxTokens || 0,
      }),
    };

    if (reuse) {
      // Si es reutilizable, usar la función onChangePlan
      onChangePlan?.(planData);
    } else {
      // Si no es reutilizable, enviar directamente con fetcher
      fetcher.submit(planData, {
        method: "POST",
        action: "/auth/signup/plan/",
      });
    }
  };

  const handleLicenseConfirm = async () => {
    // Validar cantidad de licencias
    if (licenseAmount < 3) {
      setLicenseAmount(3);
      return;
    }
    if (licenseAmount > 100) {
      setLicenseAmount(100);
      return;
    }

    // Validar formato del subdominio
    const subdomainValidationError = validateSubdomain(customSubdomain);
    if (subdomainValidationError) {
      setSubdomainError(subdomainValidationError);
      return;
    }

    // Validar disponibilidad del subdominio
    setIsValidatingSubdomain(true);
    try {
      const exists = await axios.post(`/api/exists-subdomain`, {
        subdomain: customSubdomain,
      });
      if (exists.data?.exists) {
        setSubdomainError(
          "Este subdominio ya está en uso, por favor elige otro"
        );
        setIsValidatingSubdomain(false);
        return;
      }
    } catch (error) {
      console.error("Error al validar subdominio:", error);
      setSubdomainError("Error al verificar la disponibilidad del subdominio");
      setIsValidatingSubdomain(false);
      return;
    }
    setIsValidatingSubdomain(false);

    // Si todo está válido, proceder
    handleCloseLicenseModal();
    setSelectedPlan("enterprise");
    setIsLoading(true);

    if (reuse) {
      onChangePlan?.({
        plan: "ENTERPRISE",
        price: calculateEnterpriseTotalPrice(licenseAmount),
        licenses: licenseAmount,
        subdomain: customSubdomain,
      });
    } else {
      fetcher.submit(
        {
          plan: "ENTERPRISE",
          price: calculateEnterpriseTotalPrice(licenseAmount),
          licenses: licenseAmount,
          subdomain: customSubdomain,
        },
        { method: "POST", action: "/auth/signup/plan/" }
      );
    }
  };

  const handleTokenIncrease = () => {
    setIsTokenIncrease(true);
    setTokenAmount(MIN_TOKENS_BUY);
    setFormattedTokenAmount(formatNumber(MIN_TOKENS_BUY));
    setTokenIncreaseType("one-time");
    setShowTokenModal(true);
    setTimeout(() => setShowTokenModalAnimation(true), 10);
  };

  const handleCloseTokenModal = () => {
    setShowTokenModalAnimation(false);
    setTimeout(() => {
      setShowTokenModal(false);
    }, 300);
  };

  const handleCloseLicenseModal = () => {
    setShowLicenseModalAnimation(false);
    setTimeout(() => {
      setShowLicenseModal(false);
    }, 300);
  };

  const handleLogout = () => {
    fetcher.submit(null, { method: "POST", action: "/auth/logout/" });
  };

  return (
    <div
      className={`min-h-screen bg-white flex items-center justify-center p-4 ${reuse ? "dark:bg-gray-900" : ""}`}
    >
      {!reuse && (
        <button
          onClick={handleLogout}
          className="absolute cursor-pointer top-4 right-4 z-20 flex items-center space-x-2 px-4 py-2 bg-gray-100 backdrop-blur-sm border border-gray-400/50 rounded-lg text-red-500  hover:bg-gray-300/50 transition-all duration-300 text-sm"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      )}
      <section className="relative overflow-hidden py-12 text-center">
        <div className="container">
          <h1
            className={`text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl ${reuse ? "dark:text-blue-500" : ""}`}
          >
            Planes y precios
          </h1>
          <div className="mx-auto mt-4 max-w-[45rem] space-y-2">
            <p
              className={`text-muted-foreground text-xl md:text-2xl ${reuse ? "dark:text-gray-300" : ""}`}
            >
              Empieza a usar {APP_NAME} con todo tu equipo. Selecciona un plan
              para disfrutar de todas las funciones.
            </p>
          </div>
          <div className="relative mt-3 overflow-hidden md:mt-8 lg:mt-12 z-10">
            <div className="bg-linear-to-r from-primary to-primary/80 absolute inset-0 hidden rounded-3xl md:block">
              <svg
                width="32"
                height="32"
                className="text-foreground/[0.05] h-full w-full"
              >
                <defs>
                  <pattern
                    id="plus-pattern-:S1:"
                    x="0"
                    y="0"
                    width="16"
                    height="16"
                    patternUnits="userSpaceOnUse"
                  >
                    <line
                      x1="8"
                      y1="5"
                      x2="8"
                      y2="11"
                      stroke="currentColor"
                      strokeWidth="1"
                    ></line>
                    <line
                      x1="5"
                      y1="8"
                      x2="11"
                      y2="8"
                      stroke="currentColor"
                      strokeWidth="1"
                    ></line>
                  </pattern>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill="url(#plus-pattern-:S1:)"
                ></rect>
              </svg>
            </div>
            <div
              className={`md:divide-background/20 relative space-y-6 md:grid ${hasPremium && !hasEnterprise ? "md:grid-cols-2" : hasEnterprise ? "md:grid-cols-1" : "md:grid-cols-2"} md:space-y-0 md:divide-x md:p-6 lg:p-8 ${reuse ? "dark:divide-gray-500 dark:bg-gray-700" : ""}`}
            >
              {!hasPremium && (
                <div
                  className={`flex flex-col gap-6 rounded-xl p-6 sm:rounded-2xl md:rounded-none lg:p-8 bg-background max-md:border md:bg-transparent relative ${isFree && reuse ? "ring-2 ring-blue-500 ring-offset-2" : ""} ${reuse ? "dark:bg-gray-800 dark:border-gray-600" : ""}`}
                >
                  {isFree && reuse && !hasPremium && !hasEnterprise && (
                    <div className="absolute -top-2 left-1/2 z-[1000] transform -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Plan Actual
                    </div>
                  )}
                  <h3
                    className={`font-mono text-sm tracking-widest text-foreground/70 md:text-background/70 ${reuse ? "dark:text-gray-300" : ""}`}
                  >
                    GRATIS
                  </h3>
                  <div>
                    <p
                      className={`text-5xl font-semibold tracking-tight text-foreground md:text-background ${reuse ? "dark:text-gray-100" : ""}`}
                    >
                      $0
                    </p>
                    <p
                      className={`mt-2 text-xl font-medium text-foreground/70 md:text-background/70 ${reuse ? "dark:text-gray-300" : ""}`}
                    >
                      Gratis para todos
                    </p>
                  </div>
                  <ul
                    className={`space-y-3 text-sm text-foreground/70 md:text-background/70 ${reuse ? "dark:text-gray-300" : ""}`}
                  >
                    <li className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-check size-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                      <span>1 Red social</span>
                      <HelpButton
                        tooltipId="red-social-gratis"
                        content="Una red social es una plataforma como WhatsApp, Instagram, Facebook, etc. donde puedes conectar tu cuenta para que los agentes de IA puedan responder mensajes automáticamente."
                        activeTooltip={activeTooltip}
                        setActiveTooltip={setActiveTooltip}
                        reuse={reuse}
                      />
                    </li>
                    <li className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-check size-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                      <span>7 Contactos</span>
                      <HelpButton
                        tooltipId="contactos-gratis"
                        content="Los contactos son las personas o cuentas con las que tus agentes de IA pueden interactuar. Por ejemplo, clientes que te escriben por WhatsApp o seguidores en Instagram."
                        activeTooltip={activeTooltip}
                        setActiveTooltip={setActiveTooltip}
                        reuse={reuse}
                      />
                    </li>
                    <li className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-check size-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                      <span>1 Agente</span>
                      <HelpButton
                        tooltipId="agente-gratis"
                        content="Un agente es un asistente de IA que puedes personalizar para responder automáticamente a tus clientes. Puedes configurar su personalidad, conocimientos y respuestas."
                        activeTooltip={activeTooltip}
                        setActiveTooltip={setActiveTooltip}
                        reuse={reuse}
                      />
                    </li>
                    <li className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-check size-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                      <span>10.000 créditos</span>
                      <HelpButton
                        tooltipId="tokens-gratis"
                        content="Los créditos son unidades de procesamiento que usa la IA para generar respuestas. Cada mensaje que envía tu agente consume créditos. 10,000 créditos equivalen aproximadamente a 7,500 palabras o 15-20 páginas de texto."
                        activeTooltip={activeTooltip}
                        setActiveTooltip={setActiveTooltip}
                        reuse={reuse}
                      />
                    </li>
                  </ul>
                  <div className="flex flex-1 items-end">
                    {!reuse && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => selectPlan("gratis")}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([className*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-10 rounded-md px-6 has-[&gt;svg]:px-4 group border-foreground/20 relative w-full after:from-border after:via-border after:absolute after:inset-0 after:bg-linear-to-t after:to-transparent after:content-[''] after:group-hover:opacity-100 isolate after:z-[-1] md:border-background/40 md:text-background md:bg-transparent md:after:opacity-0"
                      >
                        {isLoading && selectedPlan === "gratis" ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        ) : (
                          <>
                            Empezar gratis
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-chevron-right ml-1 size-4 transition-transform group-hover:translate-x-0.5"
                              aria-hidden="true"
                            >
                              <path d="m9 18 6-6-6-6"></path>
                            </svg>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
              {hasPremium && !isFree ? (
                <div
                  className={`flex flex-col gap-6 justify-center items-center rounded-xl p-6 sm:rounded-2xl md:rounded-none lg:p-8 max-md:from-primary max-md:to-primary/80 max-md:bg-linear-to-r md:bg-transparent ${isPremium && reuse ? "ring-2 ring-blue-500 ring-offset-2" : ""} ${reuse ? "dark:bg-gray-800 dark:border-gray-600" : ""}`}
                >
                  <h3>No disponible</h3>
                </div>
              ) : null}
              <div
                className={`flex flex-col gap-6 rounded-xl p-6 sm:rounded-2xl md:rounded-none lg:p-8 max-md:from-primary max-md:to-primary/80 max-md:bg-linear-to-r md:bg-transparent ${isPremium && reuse ? "ring-2 ring-blue-500 ring-offset-2" : ""} ${reuse ? "dark:bg-gray-800 dark:border-gray-600" : ""}`}
              >
                {isPremium && reuse && !hasEnterprise && !hasPremium && (
                  <div className="absolute z-[1000] top-5 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Plan Actual
                  </div>
                )}
                <h3
                  className={`font-mono text-sm tracking-widest text-background/70 md:text-background/70 ${reuse ? "dark:text-gray-300" : ""}`}
                >
                  PREMIUM
                </h3>
                <div>
                  <p
                    className={`text-5xl font-semibold tracking-tight text-background md:text-background ${reuse ? "dark:text-gray-100" : ""}`}
                  >
                    {reuse && isPremium ? "$ " + company?.plan?.price : "---"}
                  </p>
                  <p
                    className={`mt-2 text-xl font-medium text-background/70 md:text-background/70 ${reuse ? "dark:text-gray-300" : ""}`}
                  >
                    Mensual
                  </p>
                </div>
                <ul
                  className={`space-y-3 text-sm text-background/70 md:text-background/70 ${reuse ? "dark:text-gray-300" : ""}`}
                >
                  <li className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check size-4 shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                    <span>Todas las redes sociales</span>
                    <HelpButton
                      tooltipId="redes-premium"
                      content="Conecta múltiples plataformas: WhatsApp, Instagram, Facebook. Tus agentes pueden responder en todas ellas simultáneamente."
                      activeTooltip={activeTooltip}
                      setActiveTooltip={setActiveTooltip}
                      reuse={reuse}
                    />
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check size-4 shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                    <span>Contactos ilimitados</span>
                    <HelpButton
                      tooltipId="contactos-premium"
                      content="Sin límite en el número de personas con las que tus agentes pueden interactuar."
                      activeTooltip={activeTooltip}
                      setActiveTooltip={setActiveTooltip}
                      reuse={reuse}
                    />
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check size-4 shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                    <span>Agentes ilimitados</span>
                    <HelpButton
                      tooltipId="agentes-premium"
                      content="Crea tantos agentes como necesites, cada uno con personalidades y conocimientos diferentes."
                      activeTooltip={activeTooltip}
                      setActiveTooltip={setActiveTooltip}
                      reuse={reuse}
                    />
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check size-4 shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                    <span>Cantidad de créditos a elección</span>
                    <HelpButton
                      tooltipId="tokens-premium"
                      content="Puedes elegir cuántos créditos necesitas cada mes según tu volumen de conversaciones. Desde 10,000 hasta 1,000,000+ créditos disponibles."
                      activeTooltip={activeTooltip}
                      setActiveTooltip={setActiveTooltip}
                      reuse={reuse}
                    />
                  </li>
                </ul>
                <div className="flex flex-1 items-end">
                  {(() => {
                    const shouldShowButton = !isPremium && !isEnterprise;
                    return shouldShowButton;
                  })() && (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => selectPlan("premium")}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([className*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 h-10 rounded-md px-6 has-[&gt;svg]:px-4 group border-foreground/20 relative w-full after:from-border after:via-border after:absolute after:inset-0 after:bg-linear-to-t after:to-transparent after:content-[''] after:group-hover:opacity-100 isolate after:z-[-1] md:border-background/40 md:after:opacity-0 md:bg-background md:text-primary hover:md:bg-background/90"
                    >
                      {isLoading && selectedPlan === "premium" ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      ) : (
                        <>
                          {isFree ? "Mejorar a Premium" : "Seleccionar"}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-chevron-right ml-1 size-4 transition-transform group-hover:translate-x-0.5"
                            aria-hidden="true"
                          >
                            <path d="m9 18 6-6-6-6"></path>
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                  {isPremium && (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleTokenIncrease}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([className*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 h-10 rounded-md px-6 has-[&gt;svg]:px-4 group border-foreground/20 relative w-full after:from-border after:via-border after:absolute after:inset-0 after:bg-linear-to-t after:to-transparent after:content-[''] after:group-hover:opacity-100 isolate after:z-[-1] md:border-background/40 md:after:opacity-0 md:bg-background md:text-primary hover:md:bg-background/90"
                    >
                      {isLoading && selectedPlan === "premium" ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      ) : (
                        <>
                          Aumentar créditos
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-chevron-right ml-1 size-4 transition-transform group-hover:translate-x-0.5"
                            aria-hidden="true"
                          >
                            <path d="m9 18 6-6-6-6"></path>
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              {/* {!hasEnterprise && (
                <div
                  className={`flex relative flex-col gap-6 rounded-xl p-6 sm:rounded-2xl md:rounded-none lg:p-8 bg-background max-md:border md:bg-transparent ${isEnterprise && reuse ? "ring-2 ring-blue-500 ring-offset-2" : ""} ${reuse ? "dark:bg-gray-800 dark:border-gray-600" : ""}`}
                >
                  {isEnterprise && reuse && !hasPremium && !hasEnterprise && (
                    <div className="absolute z-[1000] top-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Plan Actual
                    </div>
                  )}
                  <h3
                    className={`font-mono text-sm tracking-widest text-foreground/70 md:text-background/70 ${reuse ? "dark:text-gray-300" : ""}`}
                  >
                    ENTERPRISE
                  </h3>
                  <div>
                    <p
                      className={`mt-2 text-xl font-medium text-foreground/70 md:text-background/70 ${reuse ? "dark:text-gray-300" : ""}`}
                    >
                      Precio personalizado
                    </p>
                  </div>
                  <ul
                    className={`space-y-3 text-sm text-foreground/70 md:text-background/70 ${reuse ? "dark:text-gray-300" : ""}`}
                  >
                    <li className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-check size-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                      <span>Todas las redes sociales</span>
                      <HelpButton
                        tooltipId="redes-enterprise"
                        content="Acceso completo a todas las plataformas sociales disponibles y futuras integraciones. Soporte para APIs personalizadas."
                        activeTooltip={activeTooltip}
                        setActiveTooltip={setActiveTooltip}
                        reuse={reuse}
                      />
                    </li>
                    <li className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-check size-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                      <span>Contactos ilimitados</span>
                      <HelpButton
                        tooltipId="contactos-enterprise"
                        content="Sin restricciones en el número de contactos."
                        activeTooltip={activeTooltip}
                        setActiveTooltip={setActiveTooltip}
                        reuse={reuse}
                      />
                    </li>
                    <li className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-check size-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                      <span>Agentes ilimitados</span>
                      <HelpButton
                        tooltipId="agentes-enterprise"
                        content="Crea equipos completos de agentes especializados para diferentes departamentos, idiomas y funciones."
                        activeTooltip={activeTooltip}
                        setActiveTooltip={setActiveTooltip}
                        reuse={reuse}
                      />
                    </li>
                    <li className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-check size-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                      <span>Créditos ilimitados</span>
                      <HelpButton
                        tooltipId="integracion-enterprise"
                        content="Puedes conectar tu API de OpenAI para usar tus propios créditos sin límites."
                        activeTooltip={activeTooltip}
                        setActiveTooltip={setActiveTooltip}
                        reuse={reuse}
                      />
                    </li>
                    <li className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-check size-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                      <span>Creación de licencias</span>
                      <HelpButton
                        tooltipId="licencias-enterprise"
                        content={`Crea y revende licencias de ${APP_NAME} a tus propios clientes. Ideal para agencias, consultores o empresas que quieren monetizar la plataforma.`}
                        activeTooltip={activeTooltip}
                        setActiveTooltip={setActiveTooltip}
                        reuse={reuse}
                      />
                    </li>
                    <li className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-check size-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                      <span>Asistencia personalizada</span>
                      <HelpButton
                        tooltipId="asistencia-enterprise"
                        content="Soporte técnico dedicado 24/7, consultoría personalizada, capacitación para tu equipo y desarrollo de funcionalidades específicas."
                        activeTooltip={activeTooltip}
                        setActiveTooltip={setActiveTooltip}
                        reuse={reuse}
                      />
                    </li>
                  </ul>
                  <div className="flex flex-1 items-end">
                    {!isEnterprise && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => selectPlan("enterprise")}
                        className="inline-flex dark:text-white cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([className*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-10 rounded-md px-6 has-[&gt;svg]:px-4 group border-foreground/20 relative w-full after:from-border after:via-border after:absolute after:inset-0 after:bg-linear-to-t after:to-transparent after:content-[''] after:group-hover:opacity-100 isolate after:z-[-1] md:border-background/40 md:text-background md:bg-transparent md:after:opacity-0"
                      >
                        {isLoading && selectedPlan === "enterprise" ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        ) : (
                          <>
                            Seleccionar
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-chevron-right ml-1 size-4 transition-transform group-hover:translate-x-0.5"
                              aria-hidden="true"
                            >
                              <path d="m9 18 6-6-6-6"></path>
                            </svg>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )} */}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h2
              className={`text-3xl font-semibold tracking-tight text-center mb-12 ${reuse ? "dark:text-gray-100" : ""}`}
            >
              Preguntas Frecuentes
            </h2>
            <div className="space-y-4">
              <div
                className={`bg-gray-50 rounded-lg border border-gray-200 ${reuse ? "dark:bg-gray-800 dark:border-gray-600" : ""}`}
              >
                <button
                  className={`w-full cursor-pointer px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors ${reuse ? "dark:hover:bg-gray-700" : ""}`}
                  onClick={() =>
                    setExpandedFAQ(expandedFAQ === "tokens" ? null : "tokens")
                  }
                >
                  <h3
                    className={`text-lg font-semibold ${reuse ? "dark:text-gray-100" : ""}`}
                  >
                    ¿Qué son los créditos y cómo se consumen?
                  </h3>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      expandedFAQ === "tokens" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expandedFAQ === "tokens" && (
                  <div className="px-6 pb-4">
                    <p
                      className={`text-gray-700 text-justify ${reuse ? "dark:text-gray-300" : ""}`}
                    >
                      Los créditos son unidades que usa la IA para procesar y
                      generar respuestas. Cada mensaje que envía tu agente
                      consume créditos. Un crédito equivale aproximadamente a 0.75
                      palabras. Por ejemplo, una respuesta de 100 palabras
                      consume unos 130 créditos.
                    </p>
                  </div>
                )}
              </div>

              <div
                className={`bg-gray-50 rounded-lg border border-gray-200 ${reuse ? "dark:bg-gray-800 dark:border-gray-600" : ""}`}
              >
                <button
                  className={`w-full cursor-pointer px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors ${reuse ? "dark:hover:bg-gray-700" : ""}`}
                  onClick={() =>
                    setExpandedFAQ(expandedFAQ === "agentes" ? null : "agentes")
                  }
                >
                  <h3
                    className={`text-lg font-semibold ${reuse ? "dark:text-gray-100" : ""}`}
                  >
                    ¿Cómo funcionan los agentes de IA?
                  </h3>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      expandedFAQ === "agentes" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expandedFAQ === "agentes" && (
                  <div className="px-6 pb-4">
                    <p
                      className={`text-gray-700 text-justify ${reuse ? "dark:text-gray-300" : ""}`}
                    >
                      Los agentes son asistentes virtuales que puedes
                      personalizar con diferentes personalidades, conocimientos
                      y respuestas. Puedes entrenarlos con información
                      específica de tu empresa para que respondan como un
                      miembro de tu equipo.
                    </p>
                  </div>
                )}
              </div>

              <div
                className={`bg-gray-50 rounded-lg border border-gray-200 ${reuse ? "dark:bg-gray-800 dark:border-gray-600" : ""}`}
              >
                <button
                  className={`w-full cursor-pointer hover:cursor-pointer px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors ${reuse ? "dark:hover:bg-gray-700" : ""}`}
                  onClick={() =>
                    setExpandedFAQ(expandedFAQ === "redes" ? null : "redes")
                  }
                >
                  <h3
                    className={`text-lg font-semibold ${reuse ? "dark:text-gray-100" : ""}`}
                  >
                    ¿Qué redes sociales están disponibles?
                  </h3>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      expandedFAQ === "redes" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expandedFAQ === "redes" && (
                  <div className="px-6 pb-4">
                    <p
                      className={`text-gray-700 text-justify ${reuse ? "dark:text-gray-300" : ""}`}
                    >
                      Actualmente soportamos WhatsApp, Instagram y Facebook.
                      Estamos trabajando en integrar más plataformas como
                      TikTok, YouTube y Discord.
                    </p>
                  </div>
                )}
              </div>

              <div
                className={`bg-gray-50 rounded-lg border border-gray-200 ${reuse ? "dark:bg-gray-800 dark:border-gray-600" : ""}`}
              >
                <button
                  className={`w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors ${reuse ? "dark:hover:bg-gray-700" : ""}`}
                  onClick={() =>
                    setExpandedFAQ(expandedFAQ === "planes" ? null : "planes")
                  }
                >
                  <h3
                    className={`text-lg font-semibold ${reuse ? "dark:text-gray-100" : ""}`}
                  >
                    ¿Puedo cambiar de plan en cualquier momento?
                  </h3>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      expandedFAQ === "planes" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expandedFAQ === "planes" && (
                  <div className="px-6 pb-4">
                    <p
                      className={`text-gray-700 text-justify ${reuse ? "dark:text-gray-300" : ""}`}
                    >
                      Sí, puedes actualizar tu plan en cualquier momento. Los
                      cambios se aplican inmediatamente y solo pagas la
                      diferencia.
                    </p>
                  </div>
                )}
              </div>

              <div
                className={`bg-gray-50 rounded-lg border border-gray-200 ${reuse ? "dark:bg-gray-800 dark:border-gray-600" : ""}`}
              >
                <button
                  className={`w-full cursor-pointer px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors ${reuse ? "dark:hover:bg-gray-700" : ""}`}
                  onClick={() =>
                    setExpandedFAQ(
                      expandedFAQ === "integracion" ? null : "integracion"
                    )
                  }
                >
                  <h3
                    className={`text-lg font-semibold ${reuse ? "dark:text-gray-100" : ""}`}
                  >
                    ¿Qué incluye la integración para créditos ilimitados?
                  </h3>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      expandedFAQ === "integracion" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expandedFAQ === "integracion" && (
                  <div className="px-6 pb-4">
                    <p
                      className={`text-gray-700 text-justify ${reuse ? "dark:text-gray-300" : ""}`}
                    >
                      Te permite conectar tu propia infraestructura de IA con
                      OpenAI para usar tus propios créditos sin límites. Ideal
                      para empresas con alto volumen de conversaciones.
                    </p>
                  </div>
                )}
              </div>

              <div
                className={`bg-gray-50 rounded-lg border border-gray-200 ${reuse ? "dark:bg-gray-800 dark:border-gray-600" : ""}`}
              >
                <button
                  className={`w-full cursor-pointer px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors ${reuse ? "dark:hover:bg-gray-700" : ""}`}
                  onClick={() =>
                    setExpandedFAQ(
                      expandedFAQ === "licencias" ? null : "licencias"
                    )
                  }
                >
                  <h3
                    className={`text-lg font-semibold ${reuse ? "dark:text-gray-100" : ""}`}
                  >
                    ¿Cómo funciona la creación de licencias para reventa?
                  </h3>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      expandedFAQ === "licencias" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expandedFAQ === "licencias" && (
                  <div className="px-6 pb-4">
                    <p
                      className={`text-gray-700 text-justify ${reuse ? "dark:text-gray-300" : ""}`}
                    >
                      Puedes crear sub-licencias de {APP_NAME} para revender a
                      tus clientes. Esto incluye acceso completo a la plataforma
                      con tu marca, precios personalizados y gestión de
                      clientes. Perfecto para agencias y consultores.
                    </p>
                  </div>
                )}
              </div>

              <div
                className={`bg-gray-50 rounded-lg border border-gray-200 ${reuse ? "dark:bg-gray-800 dark:border-gray-600" : ""}`}
              >
                <button
                  className={`w-full cursor-pointer px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors ${reuse ? "dark:hover:bg-gray-700" : ""}`}
                  onClick={() =>
                    setExpandedFAQ(
                      expandedFAQ === "asistencia" ? null : "asistencia"
                    )
                  }
                >
                  <h3
                    className={`text-lg font-semibold ${reuse ? "dark:text-gray-100" : ""}`}
                  >
                    ¿Qué tipo de asistencia personalizada ofrecen?
                  </h3>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      expandedFAQ === "asistencia" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expandedFAQ === "asistencia" && (
                  <div className="px-6 pb-4">
                    <p
                      className={`text-gray-700 text-justify ${reuse ? "dark:text-gray-300" : ""}`}
                    >
                      Incluye soporte técnico 24/7, consultoría para optimizar
                      tus agentes, capacitación para tu equipo, desarrollo de
                      funcionalidades específicas y migración de datos desde
                      otras plataformas.
                    </p>
                  </div>
                )}
              </div>

              <div
                className={`bg-gray-50 rounded-lg border border-gray-200 ${reuse ? "dark:bg-gray-800 dark:border-gray-600" : ""}`}
              >
                <button
                  className={`w-full cursor-pointer px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors ${reuse ? "dark:hover:bg-gray-700" : ""}`}
                  onClick={() =>
                    setExpandedFAQ(
                      expandedFAQ === "seguridad" ? null : "seguridad"
                    )
                  }
                >
                  <h3
                    className={`text-lg font-semibold ${reuse ? "dark:text-gray-100" : ""}`}
                  >
                    ¿Es seguro conectar mis redes sociales?
                  </h3>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      expandedFAQ === "seguridad" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expandedFAQ === "seguridad" && (
                  <div className="px-6 pb-4">
                    <p
                      className={`text-gray-700 text-justify ${reuse ? "dark:text-gray-300" : ""}`}
                    >
                      Sí, utilizamos conexiones seguras y encriptadas. Solo
                      accedemos a los permisos necesarios para enviar y recibir
                      mensajes. Nunca almacenamos contraseñas y puedes revocar
                      el acceso en cualquier momento.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="absolute -inset-40 z-[-1] [mask-image:radial-gradient(circle_at_center,black_0%,black_20%,transparent_75%)]">
            <svg
              width="32"
              height="32"
              className="text-foreground/[0.05] size-full"
            >
              <defs>
                <pattern
                  id="plus-pattern-:S2:"
                  x="0"
                  y="0"
                  width="16"
                  height="16"
                  patternUnits="userSpaceOnUse"
                >
                  <line
                    x1="8"
                    y1="5"
                    x2="8"
                    y2="11"
                    stroke="currentColor"
                    strokeWidth="1"
                  ></line>
                  <line
                    x1="5"
                    y1="8"
                    x2="11"
                    y2="8"
                    stroke="currentColor"
                    strokeWidth="1"
                  ></line>
                </pattern>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="url(#plus-pattern-:S2:)"
              ></rect>
            </svg>
          </div>
        </div>
      </section>

      {/* Modal para selección de tokens (Premium) */}
      {showTokenModal && (
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 transition-opacity duration-300 ${
            showTokenModalAnimation ? "opacity-100" : "opacity-0"
          }`}
          onClick={handleCloseTokenModal}
        >
          <div
            className={`bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border transform transition-all duration-300 flex flex-col max-h-[95vh] sm:max-h-[90vh] ${
              showTokenModalAnimation
                ? "scale-100 opacity-100"
                : "scale-95 opacity-0"
            } ${reuse ? "dark:bg-gray-800 dark:border-gray-700" : "border-gray-200"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header fijo */}
            <div
              className={`bg-gray-900 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-shrink-0 ${reuse ? "dark:bg-blue-800" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    {isTokenIncrease ? "Aumentar Créditos" : "Plan Premium"}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {isTokenIncrease
                      ? "Agrega créditos adicionales a tu plan actual"
                      : "Personaliza tu cantidad de créditos mensuales"}
                  </p>
                </div>
                <button
                  onClick={handleCloseTokenModal}
                  className="cursor-pointer text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 flex-shrink-0"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido scrolleable */}
            <div className="overflow-y-auto flex-1">
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="mb-6 sm:mb-8">
                  <label
                    className={`block text-lg font-semibold text-gray-900 mb-3 ${reuse ? "dark:text-gray-100" : ""}`}
                  >
                    {isTokenIncrease
                      ? "Cantidad de créditos adicionales"
                      : "Cantidad de créditos mensuales"}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formattedTokenAmount}
                      onChange={handleTokenInputChange}
                      onBlur={handleTokenInputBlur}
                      onFocus={(e) => e.target.select()}
                      className={`w-full px-4 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${reuse ? "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:border-blue-400" : "border-gray-300 bg-gray-50"}`}
                      placeholder="15,000"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span
                        className={`text-sm font-medium ${reuse ? "dark:text-gray-400" : "text-gray-500"}`}
                      >
                        créditos
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p
                      className={`text-sm ${reuse ? "dark:text-gray-400" : "text-gray-500"}`}
                    >
                      Mínimo: {formatNumberWithSeparators(MIN_TOKENS_BUY)}{" "}
                      créditos
                    </p>
                    <p
                      className={`text-sm ${reuse ? "dark:text-gray-400" : "text-gray-500"}`}
                    >
                      Máximo: {formatNumberWithSeparators(MAX_TOKENS_BUY)}
                    </p>
                  </div>
                </div>

                {/* Sección de tipo de aumento - solo se muestra cuando es aumento de tokens */}
                {isTokenIncrease && (
                  <div className="mb-6 sm:mb-8">
                    <label
                      className={`block text-lg font-semibold text-gray-900 mb-4 ${reuse ? "dark:text-gray-100" : ""}`}
                    >
                      Tipo de aumento
                    </label>
                    <div className="space-y-3">
                      <div
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                          tokenIncreaseType === "one-time"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
                        }`}
                        onClick={() => setTokenIncreaseType("one-time")}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            checked={tokenIncreaseType === "one-time"}
                            onChange={() => setTokenIncreaseType("one-time")}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div>
                            <h4
                              className={`font-semibold ${reuse ? "dark:text-gray-200" : "text-gray-900"}`}
                            >
                              Solo esta vez
                            </h4>
                            <p
                              className={`text-sm ${reuse ? "dark:text-gray-400" : "text-gray-600"}`}
                            >
                              Agrega tokens solo para este mes. El próximo mes
                              volverás a tu plan normal. Estos tokens vencerán
                              en {formatFullDate(getDateInDays(30))}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                          tokenIncreaseType === "permanent"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
                        }`}
                        onClick={() => setTokenIncreaseType("permanent")}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            checked={tokenIncreaseType === "permanent"}
                            onChange={() => setTokenIncreaseType("permanent")}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div>
                            <h4
                              className={`font-semibold ${reuse ? "dark:text-gray-200" : "text-gray-900"}`}
                            >
                              Permanente
                            </h4>
                            <p
                              className={`text-sm ${reuse ? "dark:text-gray-400" : "text-gray-600"}`}
                            >
                              Agrega estos tokens a tu plan mensual de forma
                              permanente.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resumen de precio */}
                <div
                  className={`bg-blue-50 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border ${reuse ? "dark:bg-gray-700 dark:border-gray-600" : "border-blue-200"}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-lg font-semibold ${reuse ? "dark:text-gray-200" : "text-gray-700"}`}
                    >
                      {isTokenIncrease ? "Total a pagar" : "Total mensual"}
                    </span>
                    <span className="text-3xl font-bold text-blue-600">
                      ${calculateTotalPrice(tokenAmount)}
                    </span>
                  </div>
                  <div
                    className={`text-sm ${reuse ? "dark:text-gray-400" : "text-gray-600"}`}
                  >
                    <div className="flex justify-between items-center">
                      <span>
                        {isTokenIncrease
                          ? "Tokens adicionales"
                          : tokenAmount.toLocaleString() + " tokens"}
                      </span>
                      <span>× ${TOKEN_PRICE}</span>
                    </div>
                    {!isTokenIncrease && (
                      <div className="flex justify-between items-center mt-1">
                        <span>Uso de la aplicación</span>
                        <span>$5.00</span>
                      </div>
                    )}
                    {isTokenIncrease && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs">
                          {tokenIncreaseType === "one-time"
                            ? "Pago único"
                            : "Agregado al plan mensual"}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-blue-200 dark:border-gray-500 mt-2 pt-2">
                      <div className="flex justify-between items-center font-medium">
                        <span
                          className={
                            reuse ? "dark:text-gray-300" : "text-gray-700"
                          }
                        >
                          {isTokenIncrease ? "Total a pagar" : "Total"}
                        </span>
                        <span className="text-blue-600">
                          ${calculateTotalPrice(tokenAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={handleCloseTokenModal}
                    className={`cursor-pointer flex-1 px-6 py-3 border-2 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-300 ${reuse ? "dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-gray-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleTokenConfirm}
                    className="dark:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer flex-1 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                  >
                    {isTokenIncrease ? "Confirmar Aumento" : "Confirmar Plan"}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer fijo */}
            <div
              className={`px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-t ${reuse ? "dark:border-gray-700 dark:bg-gray-800/50" : "bg-gray-50 border-gray-200"}`}
            >
              <p
                className={`text-xs text-center ${reuse ? "dark:text-gray-400" : "text-gray-500"}`}
              >
                {isTokenIncrease
                  ? tokenIncreaseType === "one-time"
                    ? "💡 Los tokens adicionales solo se aplicarán este mes"
                    : "💡 Los tokens se agregarán permanentemente a tu plan mensual"
                  : "💡 Los tokens se renuevan automáticamente cada mes"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal para selección de licencias (Enterprise) */}
      {showLicenseModal && (
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 transition-opacity duration-300 ${
            showLicenseModalAnimation ? "opacity-100" : "opacity-0"
          }`}
          onClick={handleCloseLicenseModal}
        >
          <div
            className={`bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border transform transition-all duration-300 flex flex-col max-h-[95vh] sm:max-h-[90vh] ${
              showLicenseModalAnimation
                ? "scale-100 opacity-100"
                : "scale-95 opacity-0"
            } ${reuse ? "dark:bg-gray-800 dark:border-gray-700" : "border-gray-200"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header fijo */}
            <div
              className={`bg-gray-900 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-shrink-0 ${reuse ? "dark:bg-blue-800" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Plan Enterprise
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Configura tu cantidad de licencias empresariales
                  </p>
                </div>
                <button
                  onClick={handleCloseLicenseModal}
                  className="text-white/80 cursor-pointer hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 flex-shrink-0"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido scrolleable */}
            <div className="overflow-y-auto flex-1">
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {/* Columna izquierda - Configuración */}
                  <div className="space-y-6">
                    <div>
                      <label
                        className={`block text-lg font-semibold text-gray-900 mb-3 ${reuse ? "dark:text-gray-100" : ""}`}
                      >
                        Cantidad de licencias mensuales
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="3"
                          max="100"
                          value={licenseAmount}
                          onChange={(e) =>
                            setLicenseAmount(parseInt(e.target.value) || 3)
                          }
                          className={`w-full px-3 sm:px-4 py-3 sm:py-4 text-base sm:text-lg border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${reuse ? "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:border-blue-400" : "border-gray-300 bg-gray-50"}`}
                          placeholder="3"
                        />
                        <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                          <span
                            className={`text-sm font-medium ${reuse ? "dark:text-gray-400" : "text-gray-500"}`}
                          >
                            licencias
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <p
                          className={`text-sm ${reuse ? "dark:text-gray-400" : "text-gray-500"}`}
                        >
                          Mínimo: 3 licencias
                        </p>
                        <p
                          className={`text-sm ${reuse ? "dark:text-gray-400" : "text-gray-500"}`}
                        >
                          Máximo: 100 licencias
                        </p>
                      </div>
                    </div>

                    {/* Input del subdominio personalizado */}
                    <div className="mb-8">
                      <label
                        className={`block text-lg font-semibold text-gray-900 mb-3 ${reuse ? "dark:text-gray-100" : ""}`}
                      >
                        Subdominio personalizado
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={customSubdomain}
                          onChange={(e) =>
                            handleSubdomainChange(e.target.value)
                          }
                          className={`w-full px-3 sm:px-4 py-3 sm:py-4 text-base sm:text-lg border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                            subdomainError
                              ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                              : isValidatingSubdomain
                                ? "border-yellow-500 focus:ring-yellow-500/20 focus:border-yellow-500"
                                : "focus:ring-blue-500/20 focus:border-blue-500"
                          } ${reuse ? "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:border-blue-400" : "border-gray-300 bg-gray-50"}`}
                          placeholder="mi-empresa"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                          {isValidatingSubdomain && (
                            <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                          )}
                          <span
                            className={`text-sm font-medium ${reuse ? "dark:text-gray-400" : "text-gray-500"}`}
                          >
                            .{VITE_DOMAIN}
                          </span>
                        </div>
                      </div>

                      {/* Error de validación */}
                      {subdomainError && (
                        <p className="text-red-500 text-sm mt-2 flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {subdomainError}
                        </p>
                      )}

                      {/* Mensaje de éxito cuando el subdominio está disponible */}
                      {!subdomainError &&
                        customSubdomain.trim() &&
                        !isValidatingSubdomain &&
                        validateSubdomain(customSubdomain) === "" && (
                          <p className="text-green-500 text-sm mt-2 flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            ¡Subdominio disponible!
                          </p>
                        )}
                    </div>
                  </div>

                  {/* Columna derecha - Información y resumen */}
                  <div className="space-y-6">
                    {/* Explicación del subdominio */}
                    <div
                      className={`p-4 rounded-lg ${reuse ? "dark:bg-gray-700 dark:border-gray-600" : "bg-blue-50 border border-blue-200"}`}
                    >
                      <div className="flex items-start">
                        <svg
                          className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${reuse ? "dark:text-blue-400" : "text-blue-600"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <h4
                            className={`font-semibold text-sm mb-2 ${reuse ? "dark:text-gray-200" : "text-blue-800"}`}
                          >
                            ¿Qué es el subdominio personalizado?
                          </h4>
                          <p
                            className={`text-sm ${reuse ? "dark:text-gray-300" : "text-blue-700"} mb-2`}
                          >
                            Tu subdominio será la dirección web donde tus
                            usuarios accederán a {APP_NAME}. Por ejemplo:{" "}
                            <strong>
                              {customSubdomain || "mi-empresa"}.{VITE_DOMAIN}
                            </strong>
                          </p>
                          <p
                            className={`text-sm ${reuse ? "dark:text-gray-300" : "text-blue-700"}`}
                          >
                            <strong>Importante:</strong> Todas las licencias que
                            crees estarán asociadas a este subdominio. Tus
                            usuarios deberán acceder a través de esta URL para
                            usar sus licencias.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Resumen de precio */}
                    <div
                      className={`bg-blue-50 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border ${reuse ? "dark:bg-gray-700 dark:border-gray-600" : "border-blue-200"}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-lg font-semibold ${reuse ? "dark:text-gray-200" : "text-gray-700"}`}
                        >
                          Total mensual
                        </span>
                        <span className="text-3xl font-bold text-blue-600">
                          ${calculateEnterpriseTotalPrice(licenseAmount)}
                        </span>
                      </div>
                      <div
                        className={`text-sm ${reuse ? "dark:text-gray-400" : "text-gray-600"}`}
                      >
                        <div className="flex justify-between items-center">
                          <span>
                            {licenseAmount} licencia
                            {licenseAmount !== 1 ? "s" : ""}
                          </span>
                          <span>× ${LICENSE_PRICE}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span>Uso de la aplicación</span>
                          <span>$5.00</span>
                        </div>
                        <div className="border-t border-blue-200 dark:border-gray-500 mt-2 pt-2">
                          <div className="flex justify-between items-center font-medium">
                            <span
                              className={
                                reuse ? "dark:text-gray-300" : "text-gray-700"
                              }
                            >
                              Total
                            </span>
                            <span className="text-blue-600">
                              ${calculateEnterpriseTotalPrice(licenseAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div
                      className={`bg-gray-100 rounded-xl p-3 sm:p-4 mb-6 sm:mb-8 border ${reuse ? "dark:bg-gray-700/50 dark:border-gray-600" : "border-gray-300"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-gray-600 mt-0.5">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4
                            className={`font-semibold text-sm ${reuse ? "dark:text-gray-200" : "text-gray-800"}`}
                          >
                            Incluye todo lo del Plan Premium
                          </h4>
                          <p
                            className={`text-xs mt-1 ${reuse ? "dark:text-gray-400" : "text-gray-600"}`}
                          >
                            Tokens ilimitados, creación de licencias, asistencia
                            24/7 y más
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={handleCloseLicenseModal}
                    className={`cursor-pointer flex-1 px-6 py-3 border-2 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-300 ${reuse ? "dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-gray-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleLicenseConfirm}
                    disabled={
                      !!subdomainError ||
                      !customSubdomain.trim() ||
                      isValidatingSubdomain
                    }
                    className={`flex-1 px-6 py-3 font-semibold rounded-xl transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      !!subdomainError ||
                      !customSubdomain.trim() ||
                      isValidatingSubdomain
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                        : "dark:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer bg-gray-900 text-white hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] focus:ring-gray-900"
                    }`}
                  >
                    {isValidatingSubdomain ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Validando...
                      </div>
                    ) : (
                      "Confirmar Plan"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer fijo */}
            <div
              className={`px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-t ${reuse ? "dark:border-gray-700 dark:bg-gray-800/50" : "bg-gray-50 border-gray-200"}`}
            >
              <p
                className={`text-xs text-center ${reuse ? "dark:text-gray-400" : "text-gray-500"}`}
              >
                🚀 Plan ideal para empresas y agencias
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
