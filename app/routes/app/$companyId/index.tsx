import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import DashboardPage from "~/components/app/dashboard";
import { requireUserSession, updateUserCountry } from "~/data/auth.server";
import { getReportDashboard } from "~/data/dashboard.server";

export default function Route() {
  return <DashboardPage />;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserSession(request);
  const { companyId }: any = params;
  return await getReportDashboard(request, companyId);
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserSession(request);
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );

  if (request.method === "PATCH") {
    try {
      await updateUserCountry(request, userId, formData);
      return {
        status: "success",
        message: "País actualizado correctamente",
        type: "updateUserCountry",
      };
    } catch (error: any) {
      return {
        status: "error",
        message: error?.message || null,
        type: "updateUserCountry",
      };
    }
  }

  return null;
}
