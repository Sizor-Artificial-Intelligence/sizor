import {
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle,
  Circle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { APP_NAME } from "~/config/app";
import { VITE_DOMAIN } from "~/config/env";
import { useCompany } from "~/hooks/useCompany";
import usePath from "~/hooks/usePath";
import { useTenantId } from "~/hooks/useTenantId";
import useToast from "~/hooks/useToast";

export default function ConnectSocialNetwork({
  redToConnect,
  setRedToConnect,
}: {
  redToConnect: string | null;
  setRedToConnect: (redToConnect: string | null) => void;
}) {
  const [apiToken, setApiToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedVerificationToken, setCopiedVerificationToken] = useState(false);
  const [copiedTokenWeb, setCopiedTokenWeb] = useState(false);
  const fetcher = useFetcher();
  const PATH = usePath();
  const tenantId = useTenantId();
  const company = useCompany();
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedStep, setExpandedStep] = useState(1);
  const [steps, setsteps] = useState<any[]>([]);
  const STEPS_META: any[] = [
    {
      id: 1,
      title: "Entrar a Meta For Developers",
      description:
        "Ve a <a href='https://developers.meta.com' target='_blank' rel='noopener noreferrer' class='text-blue-400 hover:text-blue-300 underline'>developers.meta.com</a> y entra con tu cuenta de Facebook",
      completed: false,
    },
    {
      id: 2,
      title: "Crear una nueva app",
      description: `
      Ve a <a href='https://developers.facebook.com/apps/creation/' target='_blank' rel='noopener noreferrer' class='text-blue-400 hover:text-blue-300 underline'>developers.meta.com/apps/creation/</a> y crea una nueva app o selecciona una app existente (Nota: La app debe estar en estado <strong>producción</strong>).
      <ul class='max-w-md space-y-1 text-gray-700 dark:text-[#92a4c9] list-disc list-inside'>
        <li>Ingresa un nombre para la app, ejemplo: <strong>${APP_NAME}</strong>.</li>
        <li>Casos de uso: <strong>Otro</strong></li>
        <li>Tipo de aplicación: <strong>Empresa</strong></li>
        <li>Selecciona un portafolio si tienes uno, de lo contrario puedes omitirlo</li>
      </ul>
      `,
      completed: false,
    },
    {
      id: 3,
      title: "Conectar tu cuenta con Meta",
      description: `Selecciona ${redToConnect} de la lista de productos/aplicaciones y haz click en configurar luego haz click en conectar cuenta e inicia sesión con tu cuenta de ${redToConnect}`,
      completed: false,
    },
    {
      id: 4,
      title: "Configurar webhooks",
      description: `Configura los webhooks usando la URL y Token de verificación proporcionada arriba. Asegúrate de verificar la conexión antes de continuar.`,
      completed: false,
    },
  ];
  const STEPS_WEB: any[] = [
    {
      id: 1,
      title: "Descarga e instala el Plugin",
      // TODO: Colocar link real de descarga
      description:
        "Ve a <a href='https://sizor.cloud/downloads/plugin' target='_blank' rel='noopener noreferrer' class='text-blue-400 hover:text-blue-300 underline'>sizor.cloud/downloads/plugin</a> y descarga nuestro Plugin para WordPres. Una vez descargado súbelo a tu página, instala y activa el Plugin.",
      completed: false,
    },
    {
      id: 2,
      title: "Conectar tu cuenta con Sizor",
      description:
        "En las configuraciones del Plugin se te pedirá que pegues tu API KEY, para ello debes copiar la clave secreta y pegarla en la configuración del Plugin",
      completed: false,
    },
    {
      id: 3,
      title: "Configurar diseño",
      description:
        "Ahora desde la configuración del Plugin puedes configurar tu Plugin en cuanto a diseño, funcionalidades y configuraciones adicionales para empezar a funcionar.",
      completed: false,
    },
  ];

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setExpandedStep(currentStep - 1);
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      setExpandedStep(currentStep + 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    setExpandedStep(stepId);
  };

  const renderHTML = (htmlString: string) => {
    return <div dangerouslySetInnerHTML={{ __html: htmlString }} />;
  };

  const validateForm = () => {
    if (!apiToken.trim() && redToConnect != "Web") {
      useToast({ icon: "error", title: "El API Token es requerido" });
      return false;
    }

    if (!accountId.trim() && redToConnect != "Web") {
      useToast({ icon: "error", title: "El Account ID es requerido" });
      return false;
    }

    return true;
  };

  const handleConnect = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    fetcher.submit(
      {
        apiToken,
        accountId,
        socialNetwork: redToConnect,
      },
      { method: "POST", action: `${PATH}/chat/` }
    );
  };

  const handleCopyWebhook = async () => {
    const webhookUrl = `https://${VITE_DOMAIN}/${tenantId}/${company?.id}/${redToConnect?.toLowerCase()}/webhook`;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error copying to clipboard:", err);
    }
  };

  const handleCopyVerificationToken = async () => {
    const verificationToken = company?.id;
    try {
      await navigator.clipboard.writeText(verificationToken);
      setCopiedVerificationToken(true);
      setTimeout(() => setCopiedVerificationToken(false), 2000);
    } catch (err) {
      console.error("Error copying to clipboard:", err);
    }
  };

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        useToast({ icon: "success", title: "Canal conectado correctamente" });
        setRedToConnect(null);
      } else {
        useToast({
          icon: "error",
          title: fetcher.data.message || "Error al conectar el canal",
        });
      }
      setIsLoading(false);
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (redToConnect == "Web") setsteps(STEPS_WEB);
    else setsteps(STEPS_META);
  }, [redToConnect]);

  function getTokenWeb() {
    // Estructura:
    // SIZOR_tenantId_companyId_planId
    return `SIZOR_${tenantId}_${company?.id}_${company?.planId}`;
  }

  const handleCopyTokenWeb = async () => {
    try {
      await navigator.clipboard.writeText(getTokenWeb());
      setCopiedTokenWeb(true);
      setTimeout(() => setCopiedTokenWeb(false), 2000);
    } catch (err) {
      console.error("Error copying to clipboard:", err);
    }
  };

  if (!redToConnect) return null;

  return (
    <>
      <div className="relative flex h-screen flex-col bg-gray-50 dark:bg-[#111722] group/design-root overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col justify-center items-center">
          <div className="w-full max-w-6xl rounded-xl bg-white dark:bg-[#192233] shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 border-r border-gray-200 dark:border-[#324467]/50">
                <div className="flex flex-col h-full">
                  <p className="text-gray-900 dark:text-white tracking-light text-[28px] font-bold leading-tight min-w-72">
                    Conectar {redToConnect}
                  </p>
                  {redToConnect == "Web" ? (
                    <div className="flex-grow mt-8 space-y-3">
                      <div className="flex flex-col">
                        <label className="flex items-center gap-2">
                          <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">
                            CLAVE SECRETA
                          </p>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            disabled
                            value={getTokenWeb()}
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#324467] bg-gray-50 dark:bg-[#111722] focus:border-blue-500 placeholder:text-gray-500 dark:placeholder:text-[#92a4c9] p-[10px] text-base font-normal leading-normal"
                          />
                          <button
                            onClick={handleCopyTokenWeb}
                            className="cursor-pointer flex items-center gap-2 text-gray-700 dark:text-white px-4 py-2 rounded-lg border border-gray-300 dark:border-[#324467] hover:bg-gray-100 dark:hover:bg-[#324467]/50"
                          >
                            {copiedTokenWeb ? <Check /> : <Copy />}
                            {copiedTokenWeb ? "Copiado" : "Copiar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow mt-8 space-y-3">
                      <div className="flex flex-col">
                        <label className="flex items-center gap-2">
                          <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">
                            URL del Webhook
                          </p>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            disabled
                            value={`https://${VITE_DOMAIN}/${tenantId}/${company?.id}/${redToConnect?.toLowerCase()}/webhook`}
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#324467] bg-gray-50 dark:bg-[#111722] focus:border-blue-500 placeholder:text-gray-500 dark:placeholder:text-[#92a4c9] p-[10px] text-base font-normal leading-normal"
                          />
                          <button
                            onClick={handleCopyWebhook}
                            className="cursor-pointer flex items-center gap-2 text-gray-700 dark:text-white px-4 py-2 rounded-lg border border-gray-300 dark:border-[#324467] hover:bg-gray-100 dark:hover:bg-[#324467]/50"
                          >
                            {copied ? <Check /> : <Copy />}
                            {copied ? "Copiado" : "Copiar"}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <label className="flex items-center gap-2">
                          <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">
                            Token de verificación
                          </p>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            disabled
                            value={company?.id}
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#324467] bg-gray-50 dark:bg-[#111722] focus:border-blue-500 placeholder:text-gray-500 dark:placeholder:text-[#92a4c9] p-[10px] text-base font-normal leading-normal"
                          />
                          <button
                            onClick={handleCopyVerificationToken}
                            className="cursor-pointer flex items-center gap-2 text-gray-700 dark:text-white px-4 py-2 rounded-lg border border-gray-300 dark:border-[#324467] hover:bg-gray-100 dark:hover:bg-[#324467]/50"
                          >
                            {copiedVerificationToken ? <Check /> : <Copy />}
                            {copiedVerificationToken ? "Copiado" : "Copiar"}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <label className="flex items-center gap-2">
                          <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">
                            API Token
                          </p>
                        </label>
                        <input
                          autoComplete="off"
                          type="text"
                          className="form-input flex w-full min-w-0 flex-1 rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#324467] bg-gray-50 dark:bg-[#111722] focus:border-blue-500 placeholder:text-gray-500 dark:placeholder:text-[#92a4c9] p-[10px] text-base font-normal leading-normal"
                          placeholder="Ingresa tu API Token"
                          onChange={(e) => setApiToken(e.target.value)}
                          value={apiToken}
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="flex items-center gap-2">
                          <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">
                            Account ID
                          </p>
                        </label>
                        <input
                          className="form-input flex w-full min-w-0 flex-1 rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#324467] bg-gray-50 dark:bg-[#111722] focus:border-blue-500 placeholder:text-gray-500 dark:placeholder:text-[#92a4c9] p-[15px] text-base font-normal leading-normal"
                          placeholder="Ingresa tu Account ID"
                          onChange={(e) => setAccountId(e.target.value)}
                          value={accountId}
                          type="text"
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  )}
                  <div className="mt-2">
                    <button
                      onClick={handleConnect}
                      disabled={isLoading}
                      className="hover:bg-blue-500/90 flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-blue-500 text-white text-base font-bold leading-normal tracking-[0.015em]"
                    >
                      <span className="truncate">
                        {isLoading ? "Conectando..." : "Conectar canal"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-900 dark:text-white tracking-light text-[28px] font-bold leading-tight">
                    Cómo conectar
                  </p>
                  <button
                    className="text-gray-700 dark:text-white hover:text-gray-500 dark:hover:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2 transition-all duration-300"
                    onClick={() => setRedToConnect(null)}
                  >
                    <X />
                  </button>
                </div>
                <div className="flex flex-col gap-3 py-4">
                  <div className="flex gap-6 justify-between">
                    <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">
                      Paso {currentStep}/{steps.length}
                    </p>
                    <p className="text-gray-900 dark:text-white text-sm font-normal leading-normal">
                      {Math.round((currentStep / steps.length) * 100)}%
                    </p>
                  </div>
                  <div className="rounded bg-gray-200 dark:bg-[#324467]">
                    <div
                      className="h-2 rounded bg-blue-500"
                      style={{
                        width: `${(currentStep / steps.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="space-y-2">
                    {steps.map((step, index) => {
                      const isExpanded = expandedStep === step.id;
                      const isCompleted =
                        step.completed || index + 1 < currentStep;
                      const isCurrent = index + 1 === currentStep;

                      return (
                        <div
                          key={step.id}
                          className="border border-gray-200 dark:border-[#324467] rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => handleStepClick(step.id)}
                            className="cursor-pointer w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 dark:hover:bg-[#324467]/20 transition-colors"
                          >
                            <div className="flex-shrink-0">
                              {isCompleted ? (
                                <span className="text-blue-500">
                                  <CheckCircle />
                                </span>
                              ) : isCurrent ? (
                                <span className="text-blue-500">
                                  <Circle />
                                </span>
                              ) : (
                                <span className="text-[#92a4c9]">
                                  <Circle />
                                </span>
                              )}
                            </div>

                            <div className="flex-1">
                              <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">
                                {step.title}
                              </p>
                              {!isExpanded && (
                                <p className="text-gray-600 dark:text-[#92a4c9] text-sm font-normal leading-normal mt-1 line-clamp-1">
                                  {step.description.replace(/<[^>]*>/g, "")}
                                </p>
                              )}
                            </div>

                            <div className="flex-shrink-0">
                              <span
                                className={
                                  "relative text-gray-600 dark:text-[#92a4c9] transition-transform duration-300"
                                }
                              >
                                <ChevronDown
                                  className={`${isExpanded ? "rotate-180" : ""} transition-transform duration-300`}
                                />
                              </span>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-gray-200 dark:border-[#324467]">
                              <div className="pt-4">
                                <div className="text-gray-600 dark:text-[#92a4c9] text-base font-normal leading-normal">
                                  {renderHTML(step.description)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between mt-8">
                  <button
                    onClick={handlePreviousStep}
                    disabled={currentStep === 1}
                    className={`flex cursor-pointer items-center gap-2 text-gray-700 dark:text-white px-4 py-2 rounded-lg border border-gray-300 dark:border-[#324467] hover:bg-gray-100 dark:hover:bg-[#324467]/50 ${
                      currentStep === 1 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <ArrowLeft />
                    Regresar
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={currentStep === steps.length}
                    className={`flex cursor-pointer items-center gap-2 text-white bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-500/90 ${
                      currentStep === steps.length
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    Siguiente
                    <ArrowRight />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
