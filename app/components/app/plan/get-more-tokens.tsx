import { useEffect, useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import SignupPlan from "~/components/auth/signup/plan";
import { ThemeLoader } from "~/components/ui";
import { useCompany } from "~/hooks/useCompany";
import useFullPath from "~/hooks/useFullPath";
import { useLicense } from "~/hooks/useLicense";
import usePath from "~/hooks/usePath";
import { useRequiredPayment } from "~/hooks/useRequiredPayment";
import useToast from "~/hooks/useToast";

export default function GetMoreTokensPage() {
  const company = useCompany();
  const fetcher = useFetcher();
  const [isLoading, setIsLoading] = useState(false);
  const FULL_PATH = useFullPath();
  const license = useLicense();
  const validationPayment = useRequiredPayment();
  const navigate = useNavigate();
  const PATH = usePath();

  async function onChangePlan(data: any) {
    setIsLoading(true);
    fetcher.submit(data, { method: "POST", action: `${FULL_PATH}?index` });
  }

  useEffect(() => {
    if (fetcher.data) {
      setIsLoading(false);
    }
    if (fetcher.data?.success == false) {
      useToast({
        icon: "error",
        title: fetcher?.data?.message || "Ocurrió un error inesperado",
      });
    }
    if (fetcher.data?.success == true) {
      if (fetcher.data?.url) {
        window.location.href = fetcher.data.url;
      }
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (
      validationPayment.requiredPayment ||
      validationPayment.subscriptionMonthly
    ) {
      navigate(`${PATH}/pay-license/`);
    }
    if (license?.isSon || license?.isEnterprise) {
      navigate(`${PATH}/`);
    }
  }, [validationPayment]);

  return (
    <div>
      {isLoading && <ThemeLoader />}
      <SignupPlan
        reuse
        isFree={company?.plan?.isFree}
        onChangePlan={onChangePlan}
        isPremium={company?.plan?.name === "PREMIUM"}
        isEnterprise={company?.plan?.name === "ENTERPRISE"}
        company={company}
        hasPremium={license?.hasPremium}
        hasEnterprise={license?.isEnterprise}
      />
    </div>
  );
}
