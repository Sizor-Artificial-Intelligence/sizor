import { Loader2, Building2, LogOut } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useFetcher, useLoaderData, useNavigate } from "react-router";
import { APP_NAME } from "~/config/app";
import { NODE_ENV } from "~/config/env";
import { countries } from "~/lib/data";
import type { User } from "~/types/schema";

interface FormErrors extends Partial<FormData> {
  server?: string;
}

interface FormData {
  companyName: string;
}

export default function SignupCompany() {
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const user = useLoaderData<User>();

  useEffect(() => {
    const run = async () => {
      const countrySelected = countries.find(
        (obj) => obj?.name == user?.country
      );
      if (
        !(window as any).fbq ||
        NODE_ENV === "development" ||
        !countrySelected
      )
        return;

      const textToSha256Hex = async (value: string) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(value);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      };

      const removeDiacritics = (value: string) =>
        value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const onlyLetters = (value: string) => value.replace(/[^a-z]/g, "");

      const normalizeEmail = (email?: string) =>
        (email || "").trim().toLowerCase();

      const normalizeName = (name?: string) =>
        onlyLetters(removeDiacritics((name || "").toLowerCase()));

      const normalizePhone = (phone?: string, countryCode?: string) => {
        const digits = (phone || "").replace(/\D/g, "");
        const cc = (countryCode || "").replace(/\D/g, "");
        if (!digits && !cc) return "";
        return digits.startsWith(cc) ? digits : cc + digits.replace(/^0+/, "");
      };

      const em = await textToSha256Hex(normalizeEmail(user?.email));
      const fn = await textToSha256Hex(normalizeName(user?.firstName));
      const ln = await textToSha256Hex(normalizeName(user?.lastName || ""));
      const ph = await textToSha256Hex(
        normalizePhone(user?.phone, user?.countryCode)
      );

      (window as any).fbq("track", "CompleteRegistration", {
        country: countrySelected?.abbr,
        em,
        fn,
        ph,
        ln,
      });
    };
    run();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    if (!companyName.trim() || isLoading) return;
    setIsLoading(true);
    fetcher.submit(
      { companyName },
      { method: "POST", action: "/auth/signup/company/" }
    );
  };

  React.useEffect(() => {
    if (fetcher.data) {
      setIsLoading(false);
      if (fetcher.data.message) {
        setErrors((prev) => ({ ...prev, server: fetcher.data.message }));
      }
    }
  }, [fetcher.data]);

  const isFormValid = companyName.trim().length > 0;

  const handleLogout = () => {
    fetcher.submit(null, { method: "POST", action: "/auth/logout/" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
      <button
        onClick={handleLogout}
        className="absolute cursor-pointer top-4 right-4 z-20 flex items-center space-x-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 hover:border-gray-600/50 transition-all duration-300 text-sm"
        title="Cerrar sesión"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Cerrar sesión</span>
      </button>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div
        className={`w-full max-w-md relative z-10 transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div
          className={`text-center mb-8 transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 animate-bounce">
            <Building2 className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Completar registro
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Completa tu registro para empezar a usar{" "}
            <span className="text-blue-400 font-medium">{APP_NAME}</span>
          </p>
        </div>

        <div
          className={`space-y-6 transition-all duration-700 delay-400 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="relative group">
            <input
              type="text"
              placeholder="Nombre de la empresa"
              value={companyName}
              autoFocus
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 sm:py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 text-sm sm:text-base group-hover:border-gray-600/50 group-hover:bg-gray-800/70"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>

          {errors?.server && (
            <p className="text-red-400 text-xs mt-1 text-center">
              {errors?.server || ""}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
            className={`w-full cursor-pointer relative overflow-hidden rounded-xl font-medium py-3 sm:py-4 px-6 transition-all duration-300 text-sm sm:text-base transform ${
              isFormValid && !isLoading
                ? "bg-white text-black shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative flex items-center justify-center">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Procesando...</span>
                </div>
              ) : (
                <span>Continuar</span>
              )}
            </div>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
