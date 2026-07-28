import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";
import { randomUUID } from "node:crypto";
import { getTenantId } from "./auth.server";

// Una sola colección global
const COLLECTION_NAME = "embeddings";

// Tipos de embeddings
type EmbeddingType = "trainingFile" | "message" | "trainingRule";

// Instanciar Qdrant y OpenAI
// TODO: No usar OpenAI para esto de embeddings, usar el modelo del servidor(vps)
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Crear la colección si no existe
async function ensureCollection() {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some(
    (c) => c.name === COLLECTION_NAME
  );

  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: { size: 1536, distance: "Cosine" },
    });
  }
}

// Insertar un texto en la colección
export async function saveEmbedding(
  request: Request | string,
  text: string,
  type: EmbeddingType,
  referenceId?: string,
  params: any = {}
) {
  try {
    await ensureCollection();
    const tenantId =
      typeof request === "string" ? request : await getTenantId(request);

    const formattedText = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const id = referenceId ? referenceId : randomUUID();

    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: formattedText,
    });
    const vector = emb.data[0].embedding;

    await qdrant.upsert(COLLECTION_NAME, {
      points: [
        {
          id,
          vector,
          payload: {
            tenantId,
            text: formattedText,
            type,
            ...params,
          },
        },
      ],
    });

    console.log("Embedding guardado en Qdrant", {
      tenantId,
      type,
      referenceId: id,
    });
    return {
      success: true,
      text: formattedText,
      type,
      referenceId: id,
      vector,
    };
  } catch (error) {
    console.error("Error al insertar embedding en Qdrant", {
      tenantId: typeof request === "string" ? request : "unknown",
      type,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Buscar un embedding por referenceId
export async function getEmbeddingByReferenceId(
  request: Request | string,
  referenceId: string
) {
  await ensureCollection();
  const tenantId =
    typeof request === "string" ? request : await getTenantId(request);

  const results = await qdrant.retrieve(COLLECTION_NAME, {
    ids: [referenceId],
    with_payload: true,
    with_vector: true,
  });

  const points = Array.isArray(results)
    ? results
    : (results as any)?.points || [];

  const point = points.find((item: any) => {
    const payloadTenant = item?.payload?.tenantId;
    return payloadTenant === tenantId;
  });

  if (!point) {
    return null;
  }

  return {
    id: point.id,
    vector: point.vector,
    payload: point.payload as Record<string, unknown>,
  };
}

// Actualizar un embedding existente
export async function updateEmbeddingByReferenceId(
  request: Request | string,
  referenceId: string,
  text: string,
  type?: EmbeddingType,
  params: any = {}
) {
  try {
    await ensureCollection();
    const tenantId =
      typeof request === "string" ? request : await getTenantId(request);

    const formattedText = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[ -\u036f]/g, "");

    const existing = await getEmbeddingByReferenceId(tenantId, referenceId);
    if (!existing) {
      return {
        success: false,
        message: "Embedding no encontrado",
      };
    }

    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: formattedText,
    });
    const vector = emb.data[0].embedding;

    await qdrant.upsert(COLLECTION_NAME, {
      points: [
        {
          id: referenceId,
          vector,
          payload: {
            ...(existing.payload || {}),
            ...params,
            tenantId,
            text: formattedText,
            type: type || (existing.payload?.type as EmbeddingType | undefined),
          },
        },
      ],
    });

    console.log("Embedding actualizado en Qdrant", {
      tenantId,
      referenceId,
    });
    return {
      success: true,
      referenceId,
      text: formattedText,
      type: type || existing.payload?.type,
      vector,
    };
  } catch (error) {
    console.error("Error al actualizar embedding en Qdrant", {
      tenantId: typeof request === "string" ? request : "unknown",
      referenceId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Busca embeddings similares
export async function searchSimilarEmbeddings(
  request: Request | string,
  text: string,
  type: EmbeddingType | "All" = "All",
  limit: number = 5,
  params: any = {},
  keysSearch: string[] = []
) {
  await ensureCollection();
  const tenantId =
    typeof request === "string" ? request : await getTenantId(request);
  const formattedText = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const emb = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: formattedText,
  });

  const vector = emb.data[0].embedding;

  const additionalParams = params
    ? Object.keys(params).map((key) => ({
      key,
      match: { value: params[key] },
    }))
    : [];
  const results = await qdrant.search(COLLECTION_NAME, {
    vector,
    filter: {
      must: [
        { key: "tenantId", match: { value: tenantId } },
        ...(type !== "All" ? [{ key: "type", match: { value: type } }] : []),
        ...additionalParams,
      ],
    },
    limit,
  });

  const keys = keysSearch.length > 0 ? keysSearch : Object.keys(params);
  return (
    results?.map((r) => {
      let response: any = {
        text: r.payload?.text || "",
        id: r.id,
      };

      keys.forEach((key) => {
        response[key] = r.payload?.[key] || "";
      });

      return response;
    }) || []
  );
}

/**
 * Busca reglas de entrenamiento (disparador→respuesta) por similitud al mensaje del usuario.
 * Usado en modos qa_only y both del agente.
 */
export async function searchTrainingRules(
  tenantId: string,
  agentId: string,
  query: string,
  limit: number = 5
): Promise<Array<{ trigger: string; response: string; score: number }>> {
  await ensureCollection();
  const formattedText = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!formattedText.trim()) {
    return [];
  }

  const emb = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: formattedText,
  });
  const vector = emb.data[0].embedding;

  const results = await qdrant.search(COLLECTION_NAME, {
    vector,
    filter: {
      must: [
        { key: "tenantId", match: { value: tenantId } },
        { key: "type", match: { value: "trainingRule" } },
        { key: "agentId", match: { value: agentId } },
      ],
    },
    limit,
  });

  return (results || []).map((r: any) => ({
    trigger: r.payload?.trigger ?? "",
    response: r.payload?.response ?? "",
    score: typeof r.score === "number" ? r.score : 0,
  }));
}

/**
 * Sincroniza las reglas de entrenamiento del agente en Qdrant.
 * Elimina las existentes para el agente y crea embeddings para cada regla (trigger).
 */
export async function syncAgentTrainingRulesToQdrant(
  tenantId: string,
  agentId: string,
  rules: Array<{ id: string; trigger: string; response: string }>
) {
  await ensureCollection();
  await deleteEmbeddingsByParams(tenantId, {
    type: "trainingRule",
    agentId,
  });

  for (const rule of rules) {
    if (!rule.trigger?.trim() || !rule.response?.trim()) continue;
    await saveEmbedding(tenantId, rule.trigger, "trainingRule", rule.id, {
      agentId,
      trigger: rule.trigger,
      response: rule.response,
    });
  }
}

// Eliminar un embedding por referenceId
export async function deleteEmbeddingByReferenceId(
  request: Request | string,
  referenceId: string
) {
  try {
    await ensureCollection();

    const tenantId =
      typeof request === "string" ? request : await getTenantId(request);

    const existing = await getEmbeddingByReferenceId(request, referenceId);
    if (!existing) {
      return {
        success: false,
        message: "Embedding no encontrado",
      };
    }

    if (existing.payload?.tenantId !== tenantId) {
      return {
        success: false,
        message: "No autorizado para eliminar este embedding",
      };
    }

    await qdrant.delete(COLLECTION_NAME, {
      points: [referenceId],
    });

    console.log("Embedding eliminado de Qdrant", {
      tenantId,
      referenceId,
    });

    return {
      success: true,
      referenceId,
      message: "Embedding eliminado correctamente",
    };
  } catch (error) {
    console.error("Error al eliminar embedding", {
      tenantId: typeof request === "string" ? request : "unknown",
      referenceId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Eliminar embeddings por parámetros dinámicos (ej: fileId, type, etc.)
export async function deleteEmbeddingsByParams(
  request: Request | string,
  params: Record<string, any>
) {
  try {
    await ensureCollection();

    const tenantId =
      typeof request === "string" ? request : await getTenantId(request);

    // Construir el filtro con los parámetros dinámicos
    const filterConditions = [
      { key: "tenantId", match: { value: tenantId } },
      ...Object.keys(params).map((key) => ({
        key,
        match: { value: params[key] },
      })),
    ];

    // Usar scroll para encontrar todos los puntos que coinciden con los filtros
    let allPointIds: (string | number)[] = [];
    let offset: string | number | undefined = undefined;
    const limit = 100; // Procesar en lotes de 100

    do {
      const scrollResult = await qdrant.scroll(COLLECTION_NAME, {
        filter: {
          must: filterConditions,
        },
        limit,
        offset,
        with_payload: false,
        with_vector: false,
      });

      const points = scrollResult.points || [];
      const ids = points.map((point) => point.id);
      allPointIds = [...allPointIds, ...ids];

      // Actualizar el offset para la siguiente iteración
      const nextOffset = scrollResult.next_page_offset;
      offset =
        nextOffset === null || nextOffset === undefined
          ? undefined
          : (nextOffset as string | number);
    } while (offset !== null && offset !== undefined);

    // Si no se encontraron puntos, retornar
    if (allPointIds.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        message:
          "No se encontraron embeddings que coincidan con los parámetros",
      };
    }

    // Eliminar todos los puntos encontrados
    await qdrant.delete(COLLECTION_NAME, {
      points: allPointIds,
    });

    console.log("Embeddings eliminados por parámetros", {
      tenantId,
      deletedCount: allPointIds.length,
      params,
    });

    return {
      success: true,
      deletedCount: allPointIds.length,
      deletedIds: allPointIds,
      message: `${allPointIds.length} embedding(s) eliminado(s) correctamente`,
    };
  } catch (error) {
    console.error("Error al eliminar embeddings por parámetros", {
      tenantId: typeof request === "string" ? request : "unknown",
      params,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
