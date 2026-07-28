import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import LicensesPage from "~/components/app/licenses";
import { requireUserSession } from "~/data/auth.server";
import {
  getLicenses,
  updateLicensePrice,
  updateLicenseTokens,
  toggleLicenseStatus,
} from "~/data/licenses.server";

export default function Route() {
  return <LicensesPage />;
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserSession(
    request,
    params.companyId,
    "Enterprise"
  );
  return await getLicenses(request);
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserSession(
    request,
    params.companyId,
    "Enterprise"
  );

  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );

  const { action: actionType, tenantId } = formData;

  try {
    if (actionType === "updatePrice") {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 0) {
        return {
          success: false,
          message: "El precio debe ser un número válido mayor o igual a 0",
        };
      }
      return await updateLicensePrice(request, tenantId, price);
    }

    if (actionType === "updateTokens") {
      const tokens = parseFloat(formData.tokens);
      if (isNaN(tokens) || tokens < 0) {
        return {
          success: false,
          message: "Los créditos deben ser un número válido mayor o igual a 0",
        };
      }
      return await updateLicenseTokens(request, tenantId, tokens);
    }

    if (actionType === "toggleStatus") {
      const active = formData.active === "true";
      return await toggleLicenseStatus(request, tenantId, active);
    }

    return {
      success: false,
      message: "Acción no válida",
    };
  } catch (error: any) {
    console.error("Error en action de licencias:", error);
    return {
      success: false,
      message: error?.message || "Ocurrió un error inesperado",
    };
  }
}
