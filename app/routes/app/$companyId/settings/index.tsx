import type { ActionFunctionArgs } from "react-router";
import SettingsPage from "~/components/app/settings";
import { updateSettings } from "~/data/plan.server";

export default function Route() {
  return <SettingsPage />;
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );
  const { companyId }: any = params;

  if (request.method === "POST") {
    try {
      return await updateSettings(request, companyId, formData);
    } catch (error: any) {
      if (error?.status === 450) {
        return { status: "error", message: error?.message || null };
      }
      return {
        status: "error",
        message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      };
    }
  }

  return null;
}
