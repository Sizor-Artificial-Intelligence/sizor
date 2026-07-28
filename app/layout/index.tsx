import React, { useEffect, useState } from "react";
import {
  Sidebar,
  AppHeader,
  ContentArea,
  ThemeProvider,
  MessagesSync,
  NotificationsSync,
  SmartInboxSync,
} from "../components/layout";
import { useSidebarState } from "~/hooks/useSidebarState";
import { useDynamicTitle } from "~/hooks/useDynamicTitle";
import { NavigationProgress } from "../components/ui";
import { Toaster } from "sonner";
import { TokensProvider } from "~/contexts/TokensContext";
import { MessagesProvider } from "~/contexts/MessagesContext";
import { SmartInboxProvider } from "~/contexts/SmartInboxContext";
import { NotificationsProvider } from "~/contexts/NotificationsContext";
import { useRequiredPayment } from "~/hooks/useRequiredPayment";
import usePath from "~/hooks/usePath";
import { useMatches, useNavigate } from "react-router";
import { ROUTES } from "~/lib/data";
import useToast from "~/hooks/useToast";
import CountryRequired from "~/components/layout/CountryRequired";
import { useUser } from "~/hooks/useUser";
import { useLicense } from "~/hooks/useLicense";

interface LayoutAppProps {
  children?: React.ReactNode;
  initialUnreadMessages?: number;
  initialUnreadSmartInbox?: number;
  initialUnreadNotifications?: number;
}

// Componente interno que maneja el título dinámico
const DynamicTitleHandler: React.FC = () => {
  useDynamicTitle();
  return null;
};

const LayoutApp: React.FC<LayoutAppProps> = ({
  children,
  initialUnreadMessages = 0,
  initialUnreadSmartInbox = 0,
  initialUnreadNotifications = 0,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isSidebarCollapsed, toggleSidebar } = useSidebarState();
  const [isMounted, setIsMounted] = useState(false);
  const validationPayment = useRequiredPayment();
  const requiredPayment = validationPayment.requiredPayment;
  const subscriptionMonthly = validationPayment.subscriptionMonthly;
  const PATH = usePath();
  const matches = useMatches();
  const currentRoute = matches[matches.length - 1]?.pathname;
  const navigate = useNavigate();
  const license = useLicense();
  const user = useUser();
  const [selectedCountry, setSelectedCountry] = useState<any>(
    user?.country || "Colombia"
  );
  const [selectedCountryCode, setselectedCountryCode] = useState<any>(
    user?.countryCode || "+57"
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Validar que esté al día con los pagos y restringir ruta
  useEffect(() => {
    if (requiredPayment) {
      let partsUrl = currentRoute?.split(PATH);
      partsUrl = partsUrl?.[partsUrl[0] ? 0 : 1]?.split("/");
      let routeTo = partsUrl[0] || partsUrl[1] || "";
      if (routeTo) {
        const existRoute = ROUTES?.find((route) => route.to === routeTo);
        if (existRoute) {
          navigate(`${PATH}/`);
          setTimeout(() => {
            useToast({
              icon: "error",
              title: license?.isSon
                ? `Tu licencia ha sido bloqueada, contacta a ${license?.nameParent} para más información.`
                : "Para continuar usando la aplicación, debes realizar el pago del plan.",
            });
          }, 200);
        }
      }
    }
  }, [requiredPayment, currentRoute, PATH]);

  const handleInviteMembers = () => {
    console.log("Invite members clicked");
  };

  const handleToggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      toggleSidebar();
    }
  };

  return (
    <ThemeProvider>
      <TokensProvider>
        <MessagesProvider initialValue={initialUnreadMessages}>
          <SmartInboxProvider initialValue={initialUnreadSmartInbox}>
            <NotificationsProvider initialValue={initialUnreadNotifications}>
              {/* Manejar título dinámico basado en mensajes sin leer */}
              <DynamicTitleHandler />
              {/* Sincronizar mensajes, notificaciones y smart inbox en tiempo real */}
              <MessagesSync />
              <NotificationsSync />
              <SmartInboxSync />
              <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
                {/* Validar si el usuario tiene un país seleccionado */}
                <CountryRequired
                  selectedCountry={selectedCountry}
                  setSelectedCountry={setSelectedCountry}
                  selectedCountryCode={selectedCountryCode}
                  setSelectedCountryCode={setselectedCountryCode}
                  show={!user?.country || !user?.countryCode || !user?.phone}
                />

                {/* Barra de progreso personalizada */}
                <NavigationProgress
                  variant="custom"
                  color="#3b82f6"
                  height={4}
                  showGlow={true}
                />

                <Sidebar
                  isOpen={isSidebarOpen}
                  isCollapsed={isSidebarCollapsed}
                  isMobile={isMobile}
                  onClose={() => setIsSidebarOpen(false)}
                  onToggleCollapse={toggleSidebar}
                />

                <div
                  className={`
            fixed inset-0 bg-black/20 dark:bg-black/40 z-40 lg:hidden transition-all duration-400 ease-out
            ${isSidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"}
          `}
                  onClick={() => setIsSidebarOpen(false)}
                  style={{
                    transition:
                      "opacity 400ms cubic-bezier(0.4, 0, 0.2, 1), visibility 400ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />

                <div className="flex-1 flex flex-col overflow-hidden">
                  <AppHeader
                    isMobile={isMobile}
                    onMenuClick={handleToggleSidebar}
                    onInviteMembers={handleInviteMembers}
                  />

                  <ContentArea>{children}</ContentArea>
                </div>
              </div>
            </NotificationsProvider>
          </SmartInboxProvider>
        </MessagesProvider>
      </TokensProvider>
    </ThemeProvider>
  );
};

export default LayoutApp;
