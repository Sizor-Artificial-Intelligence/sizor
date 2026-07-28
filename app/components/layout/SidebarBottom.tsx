import React from "react";
import { HelpCircle, ArrowUp, User, DollarSign } from "lucide-react";
import { Link, useMatches } from "react-router";
import usePath from "~/hooks/usePath";
import { useCompany } from "~/hooks/useCompany";
import {
  formatFullDate,
  formatNumberWithSeparators,
} from "~/lib/utils.functions";
import { useLicense } from "~/hooks/useLicense";
import { useTokens } from "~/contexts/TokensContext";
import { useRequiredPayment } from "~/hooks/useRequiredPayment";
import { useDaysToExpireSubscription } from "~/hooks/useDaysToExpireSubscription";

interface BottomMenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  to: string;
  nameRoute: string;
}

interface SidebarBottomProps {
  isCollapsed?: boolean;
}

const SidebarBottom: React.FC<SidebarBottomProps> = ({
  isCollapsed = false,
}) => {
  const matches = useMatches();
  const PATH = usePath();
  const company = useCompany();
  const license = useLicense();
  const { realTimeTokens } = useTokens();
  const validationPayment = useRequiredPayment();
  const requiredPayment = validationPayment.requiredPayment;
  const subscriptionMonthly = validationPayment.subscriptionMonthly;
  const daysToExpireSubscription = useDaysToExpireSubscription();
  const showExpirationWarning =
    daysToExpireSubscription <= 3 && !company?.plan?.isFree;

  // Calcular tokens totales disponibles
  const getTotalAvailableTokens = () => {
    if (!company?.plan) return 0;

    const baseTokens = company.plan.baseTokens || 0;
    const additionalTokens = company.plan.additionalTokens || 0;
    const additionalTokensType = company.plan.additionalTokensType;
    const additionalTokensExpiry = company.plan.additionalTokensExpiry;

    // Si hay tokens adicionales temporales, verificar si han expirado
    if (additionalTokensType === "one-time" && additionalTokensExpiry) {
      const now = new Date();
      const expiryDate = new Date(additionalTokensExpiry);

      // Si han expirado, solo contar tokens base
      if (now > expiryDate) {
        return baseTokens;
      }
    }

    // Para tokens permanentes o temporales no expirados
    return baseTokens + additionalTokens;
  };

  const totalAvailableTokens = getTotalAvailableTokens();
  // Usar tokens en tiempo real si están disponibles, sino usar los del plan
  const tokensUsed =
    realTimeTokens?.tokensUsed ?? company?.plan?.tokensUsed ?? 0;
  const usagePercentage =
    totalAvailableTokens > 0 ? (tokensUsed / totalAvailableTokens) * 100 : 0;

  const bottomMenuItems: BottomMenuItem[] = [
    {
      key: "profile",
      icon: <User className="w-5 h-5" />,
      label: "Mi perfil",
      to: "profile",
      nameRoute: "routes/app/$companyId/profile/index",
    },
  ];

  return (
    <div
      className={`border-t dark:border-r border-gray-00 dark:border-gray-700 space-y-1 ${isCollapsed ? "p-2" : "p-4"}`}
    >
      {bottomMenuItems.map((item) => {
        let active = matches[matches.length - 1]?.id === item.nameRoute;

        return (
          <Link
            to={`${PATH}/${item.to}/`}
            key={item.key}
            className={`
             group flex items-center rounded-lg cursor-pointer transition-all duration-200
             ${isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3"}
             text-sm
            ${
              active
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium shadow-sm border border-blue-100 dark:border-blue-800"
                : "text-gray-600 dark:text-gray-200 hover:bg-white dark:hover:border-blue-800 hover:border-blue-100 border border-transparent dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
            }
          `}
            title={isCollapsed ? item.label : undefined}
          >
            <span
              className={`transition-colors duration-200 ${
                active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
              } ${!isCollapsed ? "mr-3" : ""}`}
            >
              {item.icon}
            </span>
            <div
              className={`transition-all duration-300 justify-between flex items-center w-full ease-in-out overflow-hidden ${
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
            >
              <span className="transition-colors duration-200 whitespace-nowrap">
                {item.label}
              </span>
              {active && (
                <div className="ml-auto w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
              )}
            </div>
          </Link>
        );
      })}

      <div
        className={`text-xs ${license?.isEnterprise && !requiredPayment && !showExpirationWarning ? "hidden" : ""} ${requiredPayment || showExpirationWarning ? "bg-red-200 dark:bg-red-900/30 text-gray-800 dark:text-red-300" : "bg-gray-50 border border-gray-300 dark:border-none dark:bg-gray-800 text-gray-500 dark:text-gray-200"} rounded-lg mt-3 transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed
            ? "px-2 py-2 max-h-0 opacity-0"
            : "px-4 py-4 max-h-screen opacity-100"
        }`}
      >
        <div
          className={`flex items-center ${requiredPayment || subscriptionMonthly || showExpirationWarning ? "justify-center" : "justify-between"} mb-2`}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {requiredPayment || subscriptionMonthly || showExpirationWarning
                ? license?.isSon
                  ? "¡LICENCIA BLOQUEADA!"
                  : "¡SUSCRIPCIÓN VENCIDA!"
                : "Uso de créditos"}
            </span>
          </div>
          {!requiredPayment &&
            !subscriptionMonthly &&
            !showExpirationWarning && (
              <span className="text-gray-400 dark:text-gray-400">
                {formatNumberWithSeparators(tokensUsed)} /{" "}
                {formatNumberWithSeparators(totalAvailableTokens)}
              </span>
            )}
        </div>
        {!requiredPayment && !subscriptionMonthly && !showExpirationWarning && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1.5 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                usagePercentage >= 90
                  ? "bg-gradient-to-r from-red-500 to-red-600"
                  : usagePercentage >= 70
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                    : "bg-gradient-to-r from-green-500 to-green-600"
              }`}
              style={{
                width: `${Math.min(usagePercentage, 100).toFixed(2)}%`,
              }}
            ></div>
          </div>
        )}
        {subscriptionMonthly && !requiredPayment && !showExpirationWarning && (
          <p className="pb-1.5 text-justify text-red-500 dark:text-red-300">
            Los tokens adicionales vencerán en{" "}
            {formatFullDate(company?.plan?.additionalTokensExpiry)}. Si no
            renuevas el plan antes de esa fecha, su plan también vencerá.
          </p>
        )}
        {(company?.plan?.additionalTokens &&
          company.plan.additionalTokensType === "one-time" &&
          company.plan.additionalTokensExpiry &&
          new Date() < new Date(company.plan.additionalTokensExpiry) &&
          !requiredPayment &&
          !subscriptionMonthly &&
          !showExpirationWarning && (
            <p className="text-xs mb-1.5 text-gray-500 dark:text-gray-200">
              <span className="text-xs text-blue-700 dark:text-blue-300 py-0.5">
                Aumento temporal de +
                {formatNumberWithSeparators(company.plan.additionalTokens)}
              </span>
            </p>
          )) ||
          ""}
        {!license?.isSon ? (
          <Link
            to={`${PATH}/${requiredPayment || subscriptionMonthly || showExpirationWarning ? "pay-license" : "get-more-tokens"}/`}
            className={`${requiredPayment || subscriptionMonthly || showExpirationWarning ? "bg-red-400 text-white dark:bg-red-700" : "bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-100 hover:bg-gray-800 dark:hover:bg-gray-600"} w-full cursor-pointer flex items-center justify-center px-3 py-2 text-xs rounded-md transition-all duration-200 hover:shadow-md group`}
          >
            {requiredPayment || subscriptionMonthly || showExpirationWarning ? (
              <DollarSign className="w-3 h-3 mr-1 group-hover:translate-y-[-1px] transition-transform duration-200" />
            ) : (
              <ArrowUp className="w-3 h-3 mr-1 group-hover:translate-y-[-1px] transition-transform duration-200" />
            )}
            {(() => {
              if (
                requiredPayment ||
                subscriptionMonthly ||
                showExpirationWarning
              )
                return "Pagar plan";
              if (company?.plan?.isFree) return "Mejorar mi plan";
              if (company?.plan?.name === "PREMIUM") return "Aumentar tokens";
              if (!company?.plan) return "Comprar plan";
              return "Obtener más tokens";
            })()}
          </Link>
        ) : null}
      </div>
    </div>
  );
};

export default SidebarBottom;
