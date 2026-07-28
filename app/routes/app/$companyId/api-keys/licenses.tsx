import type { LoaderFunctionArgs } from "react-router";
import { requireUserSession } from "~/data/auth.server";
import { getApiKeyLicenses } from "~/data/api-keys.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserSession(
    request,
    params.companyId,
    "Enterprise"
  );

  const { apiKeyId } = params;

  if (!apiKeyId) {
    return Response.json({ error: "API Key ID es requerido" }, { status: 400 });
  }

  try {
    const data = await getApiKeyLicenses(request, apiKeyId);
    return Response.json(data);
  } catch (error: any) {
    console.error("Error obteniendo licencias de API Key:", error);
    return Response.json(
      { error: error?.message || "Error al obtener las licencias" },
      { status: error?.status || 500 }
    );
  }
}
