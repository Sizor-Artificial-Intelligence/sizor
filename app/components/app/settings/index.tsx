import React, { useEffect, useState } from "react";
import { Bell, Bot, Loader2, Save } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs } from "~/components/ui/tabs";
import { useCompany } from "~/hooks/useCompany";
import { useFetcher } from "react-router";
import useFullPath from "~/hooks/useFullPath";
import useToast from "~/hooks/useToast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui";

interface NotificationSettings {
  notificationMethod: "app" | "email" | "both";
  formSubmission: boolean;
  appointmentCreated: boolean;
  appointmentModified: boolean;
  appointmentCancelled: boolean;
  chatAssignedToHuman: boolean;
}

interface AISettings {
  SETT_IA_RESPONSE: boolean;
}

export default function SettingsPage() {
  const company = useCompany();
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      notificationMethod: company?.NOTT_METHOD || "email",
      formSubmission: company?.NOTT_FORM_SUBMISSION || true,
      appointmentCreated: company?.NOTT_APPOINTMENT_CREATED || true,
      appointmentModified: company?.NOTT_APPOINTMENT_MODIFIED || true,
      appointmentCancelled: company?.NOTT_APPOINTMENT_CANCELLED || true,
      chatAssignedToHuman: company?.NOTT_CHAT_ASSIGNED_TO_HUMAN || true,
    });
  const fetcher = useFetcher();
  const FULL_PATH = useFullPath();
  const [isLoading, setIsLoading] = useState(false);

  const [aiSettings, setAiSettings] = useState<AISettings>({
    SETT_IA_RESPONSE: company?.SETT_IA_RESPONSE == true,
  });

  const tabs = [
    {
      id: "notifications",
      label: "Notificaciones",
      icon: <Bell className="size-4" />,
    },
    {
      id: "ai",
      label: "Inteligencia Artificial",
      icon: <Bot className="size-4" />,
    },
  ];

  const handleSave = () => {
    setIsLoading(true);
    const settings = {
      notifications: JSON.stringify(notificationSettings),
      settings: JSON.stringify(aiSettings),
    };
    fetcher.submit(settings as any, {
      method: "POST",
      action: FULL_PATH,
    });
  };

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.status === "success") {
        useToast({
          icon: "success",
          title:
            fetcher.data?.message ||
            "Configuraciones actualizadas correctamente",
        });
      } else {
        useToast({
          icon: "error",
          title:
            fetcher.data?.message || "Error al actualizar las configuraciones",
        });
      }
      setIsLoading(false);
    }
  }, [fetcher.data]);

  const handleNotificationMethodChange = (value: string) => {
    setNotificationSettings((prev) => ({
      ...prev,
      notificationMethod: value as "app" | "email" | "both",
    }));
  };

  const handleNotificationToggle = (
    key: keyof Omit<NotificationSettings, "notificationMethod">
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAIToggle = (key: keyof AISettings) => {
    setAiSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderTabContent = (activeTab: string) => {
    switch (activeTab) {
      case "notifications":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Método de notificación */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  ¿Dónde quieres recibir las notificaciones?
                </label>
                <Select
                  value={notificationSettings.notificationMethod}
                  onValueChange={(value) =>
                    handleNotificationMethodChange(value)
                  }
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Selecciona un método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="app">Solo en la app</SelectItem>
                    <SelectItem value="email" disabled>
                      Solo por correo (próximamente)
                    </SelectItem>
                    <SelectItem value="both" disabled>
                      En ambos lugares (próximamente)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Checkboxes de notificaciones específicas */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Activar notificaciones para casos específicos:
                </label>

                <div className="space-y-3">
                  {[
                    {
                      key: "formSubmission" as const,
                      label: "Cuando se llenen los datos de un formulario",
                    },
                    // {
                    //   key: "appointmentCreated" as const,
                    //   label: "Cuando se cree una cita",
                    // },
                    // {
                    //   key: "appointmentModified" as const,
                    //   label: "Cuando se modifique una cita",
                    // },
                    // {
                    //   key: "appointmentCancelled" as const,
                    //   label: "Cuando se cancele una cita",
                    // },
                    {
                      key: "chatAssignedToHuman" as const,
                      label: "Cuando la IA asigne el chat a un humano",
                    },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={notificationSettings[key]}
                        onChange={() => handleNotificationToggle(key)}
                        className="size-4 text-primary bg-background border-input rounded focus:ring-ring focus:ring-2 focus:ring-offset-0"
                      />
                      <span className="text-sm text-foreground">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "ai":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Inteligencia Artificial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  {
                    key: "SETT_IA_RESPONSE" as const,
                    label: "Los nuevos chats responderlos con IA",
                    description:
                      "Permite que la IA responda automáticamente a los nuevos chats",
                  },
                ].map(({ key, label, description }) => (
                  <div key={key} className="space-y-2">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiSettings[key]}
                        onChange={() => handleAIToggle(key)}
                        className="mt-0.5 size-4 text-primary bg-background border-input rounded focus:ring-ring focus:ring-2 focus:ring-offset-0"
                      />
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-foreground">
                          {label}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Configuraciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Personaliza tu experiencia con las configuraciones de la aplicación
          </p>
        </div>
        <Button
          onClick={handleSave}
          className="cursor-pointer flex items-center gap-2"
          disabled={isLoading}
        >
          <Save className="size-4" />
          {isLoading ? "Guardando..." : "Guardar cambios"}
          {isLoading && <Loader2 className="size-4 animate-spin" />}
        </Button>
      </div>

      <Tabs tabs={tabs} defaultTab="notifications">
        {renderTabContent}
      </Tabs>
    </div>
  );
}
