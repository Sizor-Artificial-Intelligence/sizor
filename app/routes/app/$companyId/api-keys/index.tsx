import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import ApiKeysPage from "~/components/app/api-keys";
import { requireUserSession } from "~/data/auth.server";
import {
  getApiKeys,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  toggleApiKeyStatus,
  addLicenseToApiKey,
  removeLicenseFromApiKey,
} from "~/data/api-keys.server";

export default function Route() {
  return <ApiKeysPage />;
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserSession(
    request,
    params.companyId,
    "Enterprise"
  );
  return await getApiKeys(request);
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

  const { action: actionType, apiKeyId } = formData;

  try {
    if (actionType === "create") {
      return await createApiKey(request, formData);
    }

    if (actionType === "update") {
      if (!apiKeyId) {
        return {
          success: false,
          message: "API Key ID es requerido",
        };
      }
      return await updateApiKey(request, apiKeyId, formData);
    }

    if (actionType === "delete") {
      if (!apiKeyId) {
        return {
          success: false,
          message: "API Key ID es requerido",
        };
      }
      return await deleteApiKey(request, apiKeyId);
    }

    if (actionType === "toggleStatus") {
      if (!apiKeyId) {
        return {
          success: false,
          message: "API Key ID es requerido",
        };
      }
      const active = formData.active === "true";
      return await toggleApiKeyStatus(request, apiKeyId, active);
    }

    if (actionType === "addLicense") {
      if (!apiKeyId || !formData.tenantId) {
        return {
          success: false,
          message: "API Key ID y Tenant ID son requeridos",
        };
      }
      return await addLicenseToApiKey(request, apiKeyId, formData.tenantId);
    }

    if (actionType === "removeLicense") {
      if (!apiKeyId || !formData.tenantId) {
        return {
          success: false,
          message: "API Key ID y Tenant ID son requeridos",
        };
      }
      return await removeLicenseFromApiKey(
        request,
        apiKeyId,
        formData.tenantId
      );
    }

    return {
      success: false,
      message: "Acción no válida",
    };
  } catch (error: any) {
    console.error("Error en action de API Keys:", error);
    return {
      success: false,
      message: error?.message || "Ocurrió un error inesperado",
    };
  }
}
