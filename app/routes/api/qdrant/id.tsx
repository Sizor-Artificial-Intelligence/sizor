import type { LoaderFunctionArgs } from "react-router";
import {
  getEmbeddingByReferenceId,
  updateEmbeddingByReferenceId,
} from "~/data/qdrant.server";
import { requireAuthAPI } from "~/data/utils.server";
import { getFormDataRequest } from "~/lib/utils.functions";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireAuthAPI(request);
  const { id }: any = params;
  try {
    const headers = request.headers;
    const tenantId: any = headers.get("x-tenant-id") || null;

    return await getEmbeddingByReferenceId(tenantId, id);
  } catch (error) {
    console.log("Error al ejecutar la carga de Qdrant - id:", error);
    return null;
  }
}

export async function action({ request, params }: LoaderFunctionArgs) {
  await requireAuthAPI(request);
  const { id }: any = params;
  try {
    const formData = await getFormDataRequest(request);
    const headers = request.headers;
    const tenantId: any = headers.get("x-tenant-id") || null;
    const params = formData?.params || {};
    return await updateEmbeddingByReferenceId(
      tenantId,
      id,
      formData?.text,
      formData?.type,
      params
    );
  } catch (error) {
    console.log("Error al ejecutar la acción de Qdrant:", error);
    return null;
  }
}
