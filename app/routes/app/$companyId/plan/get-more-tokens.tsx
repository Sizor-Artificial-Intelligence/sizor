import type { LoaderFunctionArgs } from "react-router";
import GetMoreTokensPage from "~/components/app/plan/get-more-tokens";
import { requireUserSession } from "~/data/auth.server";
import { updatePlan } from "~/data/plan.server";

export default function Route() {
  return <GetMoreTokensPage />;
}

export async function action({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserSession(request);
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );
  const { companyId }: any = params;

  if (request.method === "POST") {
    try {
      return await updatePlan(request, companyId, userId, formData);
    } catch (error: any) {
      if (error?.status === 450) {
        return { message: error?.message || null };
      }
      return {
        message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      };
    }
  }

  return null;
}
