import { ArrowRight, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useFetcher, useLoaderData, useNavigate } from "react-router";
import { useDaysToExpireSubscription } from "~/hooks/useDaysToExpireSubscription";
import useFullPath from "~/hooks/useFullPath";
import { useLicense } from "~/hooks/useLicense";
import usePath from "~/hooks/usePath";
import { useRequiredPayment } from "~/hooks/useRequiredPayment";
import useToast from "~/hooks/useToast";
import {
  formatFullDate,
  formatNumberWithSeparators,
  formatPrice,
} from "~/lib/utils.functions";
import type { Plan } from "~/types/schema";

export default function PayLicensePage() {
  const plan = useLoaderData<Plan>();
  const [loading, setLoading] = useState(false);
  const fetcher = useFetcher<any>();
  const FULL_PATH = useFullPath();
  const PATH = usePath();
  const validationPayment = useRequiredPayment();
  const navigate = useNavigate();
  const daysToExpireSubscription = useDaysToExpireSubscription();
  const license = useLicense();

  async function handlePay() {
    setLoading(true);
    fetcher.submit(null, {
      method: "POST",
      action: FULL_PATH,
    });
  }

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data?.success) {
        window.location.href = fetcher.data.url;
      } else {
        useToast({
          icon: "error",
          title: fetcher.data?.message || "Error al realizar el pago",
        });
        setLoading(false);
      }
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (
      !validationPayment.requiredPayment &&
      !validationPayment.subscriptionMonthly &&
      daysToExpireSubscription > 3
    ) {
      navigate(
        `${PATH}${license?.isEnterprise || license?.isSon ? "/" : "get-more-tokens/"}`
      );
    }
    if (license?.isSon) {
      navigate(`${PATH}/`);
    }
  }, [validationPayment]);

  return (
    <>
      <div className="relative flex h-auto min-h-screen w-full flex-col items-center overflow-x-hidden p-4 sm:p-6 md:p-8">
        <div className="flex w-full max-w-4xl flex-col gap-8">
          <header>
            <p className="text-gray-900 dark:text-white text-4xl font-bold leading-tight tracking-[-0.033em]">
              Suscripción y facturación
            </p>
          </header>
          <main className="grid grid-cols-1 gap-8">
            <section className="flex flex-col gap-6 rounded-xl bg-white dark:bg-[#192131] p-6 sm:p-8">
              <div>
                <h2 className="text-gray-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3">
                  Tu plan
                </h2>
                <div className="flex gap-3 flex-wrap">
                  <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-primary/10 dark:bg-primary/20 px-4">
                    <p className="text-primary text-sm font-medium leading-normal">
                      {plan?.name || ""}
                    </p>
                  </div>
                  <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 px-4">
                    <p className="text-amber-500 text-sm font-medium leading-normal">
                      Pago pendiente
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between gap-x-6 py-4">
                  <p className="text-gray-500 dark:text-[#92a4c9] text-sm font-normal leading-normal">
                    Precio mensual
                  </p>
                  <p className="text-gray-900 dark:text-white text-sm font-semibold leading-normal text-right">
                    {formatPrice(plan?.price || 0)}
                  </p>
                </div>
                <div className="flex justify-between gap-x-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-[#92a4c9] text-sm font-normal leading-normal">
                    {plan?.datePay
                      ? "Fecha de último pago"
                      : "Fecha de inicio de suscripción"}
                  </p>
                  <p className="text-gray-900 dark:text-white text-sm font-semibold leading-normal text-right">
                    {plan?.datePay
                      ? formatFullDate(plan?.datePay)
                      : formatFullDate(plan?.dateStartSubscription)}
                  </p>
                </div>
                {plan?.additionalTokens > 0 && (
                  <React.Fragment>
                    <div className="flex justify-between gap-x-6 py-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-gray-500 dark:text-[#92a4c9] text-sm font-normal leading-normal">
                        Créditos adicionales
                      </p>
                      <p className="text-gray-900 dark:text-white text-sm font-semibold leading-normal text-right">
                        {formatNumberWithSeparators(plan?.additionalTokens)}
                      </p>
                    </div>
                    <div className="flex justify-between gap-x-6 py-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-gray-500 dark:text-[#92a4c9] text-sm font-normal leading-normal">
                        Vencimiento de créditos adicionales
                      </p>
                      <p className="text-gray-900 dark:text-white text-sm font-semibold leading-normal text-right">
                        {formatFullDate(plan?.additionalTokensExpiry)}
                      </p>
                    </div>
                  </React.Fragment>
                )}
                <div className="flex justify-between gap-x-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-[#92a4c9] text-sm font-normal leading-normal">
                    Total a pagar
                  </p>
                  <p className="text-blue-600 dark:text-blue-500 text-sm font-semibold leading-normal text-right">
                    {formatPrice(plan?.price || 0)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handlePay}
                  className="flex min-w-[84px] flex-1 cursor-pointer items-center justify-between overflow-hidden rounded-lg h-12 px-5 bg-gray-200 hover:bg-gray-300 dark:bg-[#232f48] dark:hover:bg-[#232f48]/80 text-gray-900 dark:text-white text-base font-bold leading-normal tracking-[0.015em]"
                >
                  <span className="truncate">Realizar pago </span>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
