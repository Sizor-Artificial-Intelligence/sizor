import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import PayLicensePage from "~/components/app/plan/pay-license";
import { APP_NAME } from "~/config/app";
import { getTenantId, requireUserSession } from "~/data/auth.server";
import { createPreferencePayment } from "~/data/payment.server";
import { getPlanByCompanyId } from "~/data/plan.server";
import { getFormDataRequest } from "~/lib/utils.functions";

export default function Route() {
  return <PayLicensePage />;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { companyId }: any = params;
  return getPlanByCompanyId(request, companyId);
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { companyId }: any = params;
  try {
    const userId = await requireUserSession(request);
    const plan = await getPlanByCompanyId(request, companyId);
    const formData = await getFormDataRequest(request);
    const res = await createPreferencePayment(
      await getTenantId(request),
      formData?.price || plan?.price || 0,
      formData?.description || `${APP_NAME} - Buy ${plan?.name} plan`,
      {
        type: formData?.type || "MONTHLY-PAYMENT",
        tenantId: await getTenantId(request),
        price: plan?.price || 0,
        planId: plan?.id,
        companyId: companyId,
        plan: plan?.name,
        userId,
      }
    );
    return {
      success: true,
      ...res,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Ocurrió un error inesperado, intentalo nuevamente",
    };
  }
}
