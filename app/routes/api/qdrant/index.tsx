import type { LoaderFunctionArgs } from "react-router";
import {
  deleteEmbeddingsByParams,
  saveEmbedding,
  searchSimilarEmbeddings,
} from "~/data/qdrant.server";
import { requireAuthAPI } from "~/data/utils.server";
import { getFormDataRequest } from "~/lib/utils.functions";

export async function action({ request }: LoaderFunctionArgs) {
  await requireAuthAPI(request);
  try {
    const formData = await getFormDataRequest(request);
    const headers = request.headers;
    const tenantId: any = headers.get("x-tenant-id") || null;
    const params = formData?.params || {};
    const action = formData?.action || null;

    if (action === "delete") {
      return await deleteEmbeddingsByParams(tenantId, params);
    }

    return await saveEmbedding(
      tenantId,
      formData?.text,
      formData?.type,
      formData?.referenceId,
      params
    );
  } catch (error) {
    console.log("Error al ejecutar la acción de Qdrant:", error);
    return null;
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuthAPI(request);
  try {
    const formData = await getFormDataRequest(request);
    const headers = request.headers;
    const tenantId: any = headers.get("x-tenant-id") || null;
    const arr = await searchSimilarEmbeddings(
      tenantId,
      formData?.text,
      formData?.type,
      formData?.limit
    );
    return {
      success: true,
      data: arr,
    };
  } catch (error) {
    console.log("Error al ejecutar la carga de Qdrant - index:", error);
    return null;
  }
}
