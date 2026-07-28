import { useCompany } from "~/hooks/useCompany";
import { Button } from "~/components/ui";
import {
  Calendar,
  CalendarDays,
  Clock,
  Users,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { APP_NAME } from "~/config/app";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTheme } from "~/hooks/useTheme";

export default function CalendarPage() {
  const company = useCompany();
  const isConnected = company?.conectedWithCalendar;
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDark } = useTheme();

  const handleConnectGoogleCalendar = async () => {
    setIsConnecting(true);
    try {
      // Redirigir a la ruta de autenticación con el companyId
      navigate(`/auth/google-calendar?companyId=${company?.id}`);
    } catch (error) {
      console.error("Error connecting to Google Calendar:", error);
      setIsConnecting(false);
    }
  };

  const handleRefreshCalendar = async () => {
    setIsRefreshing(true);
    try {
      // Recargar la página para refrescar el calendario
      window.location.reload();
    } catch (error) {
      console.error("Error refreshing calendar:", error);
      setIsRefreshing(false);
    }
  };

  // Función para generar la URL del calendario con el tema correcto
  const getCalendarUrl = () => {
    const baseUrl = `https://calendar.google.com/calendar/embed?src=${company?.googleCalendarEmail}&ctz=America/Bogota&mode=MONTH&showTabs=1&showCalendars=1&showTz=0&hl=es`;
    const bgColor = isDark ? "1f2937" : "ffffff";
    const textColor = isDark ? "f9fafb" : "000000";
    const color = isDark ? "3b82f6" : "1a73e8";

    return `${baseUrl}&bgcolor=%23${bgColor}&color=%23${color}&textcolor=%23${textColor}`;
  };

  // Manejar parámetros de URL para mostrar mensajes
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="max-w-md text-center space-y-6">
          {/* Mensajes de éxito y error */}
          {success === "connected" && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-200 text-sm">
                ¡Google Calendar conectado exitosamente!
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">
                {error === "access_denied" &&
                  "Acceso denegado. Por favor, intenta de nuevo."}
                {error === "no_code" &&
                  "Error en la autenticación. Por favor, intenta de nuevo."}
                {error === "auth_failed" &&
                  "Error al conectar con Google Calendar. Por favor, intenta de nuevo."}
                {!["access_denied", "no_code", "auth_failed"].includes(error) &&
                  "Error desconocido. Por favor, intenta de nuevo."}
              </p>
            </div>
          )}
          <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Calendar className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Conecta tu Google Calendar
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Gestiona tus eventos, citas y reuniones directamente desde{" "}
              {APP_NAME}
            </p>
          </div>

          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
              <CalendarDays className="w-4 h-4 text-green-500 dark:text-green-400" />
              <span>Visualiza todos tus eventos en un solo lugar</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
              <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span>Programa citas automáticamente con tus contactos</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
              <Users className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              <span>Sincroniza con tu equipo y clientes</span>
            </div>
          </div>

          <Button
            className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleConnectGoogleCalendar}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4 mr-2" />
            )}
            {isConnecting ? "Conectando..." : "Conectar Google Calendar"}
          </Button>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Al conectar tu cuenta, podrás gestionar tus eventos y citas de forma
            integrada
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Calendario
          </h1>
          {company?.googleCalendarName && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {company.googleCalendarName}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshCalendar}
            disabled={isRefreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Actualizar</span>
          </Button>
          <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
            <span>Conectado</span>
          </div>
        </div>
      </div>

      {/* Calendario embebido */}
      <div className="w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden">
          <iframe
            src={getCalendarUrl()}
            style={{ border: 0 }}
            width="100%"
            height="600"
            frameBorder="0"
            scrolling="no"
            className="w-full h-[600px]"
            key={isDark ? "dark" : "light"} // Forzar recarga cuando cambie el tema
          ></iframe>
        </div>
      </div>
    </div>
  );
}
