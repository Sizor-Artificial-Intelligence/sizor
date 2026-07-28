import { getEscapedValue, getDateTime } from "~/lib/utils.functions";
import { getPrismaTenant, executeAdminQuery } from "./database.server";
import { getTenantId } from "./auth.server";

/**
 * Obtiene todas las API Keys del tenant
 */
export async function getApiKeys(request: Request) {
  try {
    const prisma = await getPrismaTenant(request);
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        ApiKeyLicense: {
          select: {
            id: true,
            tenantId: true,
            createdAt: true,
          },
        },
      },
    });

    return apiKeys;
  } catch (error: any) {
    console.error("Error obteniendo API Keys:", error);
    throw error;
  }
}

/**
 * Crea una nueva API Key
 */
export async function createApiKey(
  request: Request,
  formData: Record<any, any>
) {
  try {
    const prisma = await getPrismaTenant(request);

    const name = getEscapedValue(formData?.name);
    const key = getEscapedValue(formData?.key);

    if (!name || !key) {
      const error: any = new Error("Nombre y API Key son requeridos");
      error.status = 400;
      throw error;
    }

    // Validar que el nombre no esté duplicado
    const existing = await prisma.apiKey.findFirst({
      where: { name },
    });

    if (existing) {
      const error: any = new Error("Ya existe una API Key con este nombre");
      error.status = 400;
      throw error;
    }

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key,
        active: true,
        createdAt: getDateTime(),
        updatedAt: getDateTime(),
      },
    });

    return {
      success: true,
      data: apiKey,
      message: "API Key creada exitosamente",
    };
  } catch (error: any) {
    console.error("Error creando API Key:", error);
    return {
      success: false,
      message: error?.message || "Error al crear la API Key",
    };
  }
}

/**
 * Actualiza una API Key
 */
export async function updateApiKey(
  request: Request,
  apiKeyId: string,
  formData: Record<any, any>
) {
  try {
    const prisma = await getPrismaTenant(request);

    const name = getEscapedValue(formData?.name);
    const key = getEscapedValue(formData?.key);

    if (!name || !key) {
      const error: any = new Error("Nombre y API Key son requeridos");
      error.status = 400;
      throw error;
    }

    // Verificar que la API Key existe
    const existing = await prisma.apiKey.findFirst({
      where: { id: apiKeyId },
    });

    if (!existing) {
      const error: any = new Error("API Key no encontrada");
      error.status = 404;
      throw error;
    }

    // Validar que el nombre no esté duplicado (excluyendo la actual)
    const duplicate = await prisma.apiKey.findFirst({
      where: {
        name,
        NOT: { id: apiKeyId },
      },
    });

    if (duplicate) {
      const error: any = new Error("Ya existe una API Key con este nombre");
      error.status = 400;
      throw error;
    }

    const apiKey = await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        name,
        key,
        updatedAt: getDateTime(),
      },
    });

    return {
      success: true,
      data: apiKey,
      message: "API Key actualizada exitosamente",
    };
  } catch (error: any) {
    console.error("Error actualizando API Key:", error);
    return {
      success: false,
      message: error?.message || "Error al actualizar la API Key",
    };
  }
}

/**
 * Elimina una API Key
 */
export async function deleteApiKey(request: Request, apiKeyId: string) {
  try {
    const prisma = await getPrismaTenant(request);

    // Verificar que la API Key existe
    const existing = await prisma.apiKey.findFirst({
      where: { id: apiKeyId },
    });

    if (!existing) {
      const error: any = new Error("API Key no encontrada");
      error.status = 404;
      throw error;
    }

    await prisma.apiKey.delete({
      where: { id: apiKeyId },
    });

    return {
      success: true,
      message: "API Key eliminada exitosamente",
    };
  } catch (error: any) {
    console.error("Error eliminando API Key:", error);
    return {
      success: false,
      message: error?.message || "Error al eliminar la API Key",
    };
  }
}

/**
 * Cambia el estado activo/inactivo de una API Key
 */
export async function toggleApiKeyStatus(
  request: Request,
  apiKeyId: string,
  active: boolean
) {
  try {
    const prisma = await getPrismaTenant(request);

    // Verificar que la API Key existe
    const existing = await prisma.apiKey.findFirst({
      where: { id: apiKeyId },
    });

    if (!existing) {
      const error: any = new Error("API Key no encontrada");
      error.status = 404;
      throw error;
    }

    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        active,
        updatedAt: getDateTime(),
      },
    });

    return {
      success: true,
      message: active
        ? "API Key activada exitosamente"
        : "API Key desactivada exitosamente",
    };
  } catch (error: any) {
    console.error("Error cambiando estado de API Key:", error);
    return {
      success: false,
      message: error?.message || "Error al cambiar el estado",
    };
  }
}

/**
 * Obtiene las licencias vinculadas a una API Key
 */
export async function getApiKeyLicenses(request: Request, apiKeyId: string) {
  try {
    const tenantId = await getTenantId(request);
    const prisma = await getPrismaTenant(request);

    // Verificar que la API Key existe
    const apiKey = await prisma.apiKey.findFirst({
      where: { id: apiKeyId },
      include: {
        ApiKeyLicense: true,
      },
    });

    if (!apiKey) {
      const error: any = new Error("API Key no encontrada");
      error.status = 404;
      throw error;
    }

    // Obtener información de las licencias desde la DB administrativa
    const tenantIds = apiKey.ApiKeyLicense.map((link: any) => link.tenantId);
    const licenses = [];

    if (tenantIds.length > 0) {
      const placeholders = tenantIds.map(() => "?").join(",");
      const licensesData = await executeAdminQuery(
        `SELECT tenantId, name, email, phone, countryCode, country, CAST(price AS FLOAT) as price, CAST(tokens AS FLOAT) as tokens, active FROM clients WHERE tenantId IN (${placeholders}) AND parentTenantId = ?`,
        [...tenantIds, tenantId],
        true
      );

      licenses.push(...(licensesData || []));
    }

    // Obtener todas las licencias disponibles (que no están ya vinculadas)
    const allLicenses = await executeAdminQuery(
      `SELECT tenantId, name, email, phone, countryCode, country, CAST(price AS FLOAT) as price, CAST(tokens AS FLOAT) as tokens, active FROM clients WHERE parentTenantId = ?`,
      [tenantId],
      true
    );

    const availableLicenses = (allLicenses || []).filter(
      (license: any) => !tenantIds.includes(license.tenantId)
    );

    return {
      linked: licenses,
      available: availableLicenses,
    };
  } catch (error: any) {
    console.error("Error obteniendo licencias de API Key:", error);
    throw error;
  }
}

/**
 * Agrega una licencia a una API Key
 */
export async function addLicenseToApiKey(
  request: Request,
  apiKeyId: string,
  tenantId: string
) {
  try {
    const currentTenantId = await getTenantId(request);
    const prisma = await getPrismaTenant(request);

    // Verificar que la licencia existe y pertenece al tenant actual
    const license = await executeAdminQuery(
      `SELECT tenantId FROM clients WHERE tenantId = ? AND parentTenantId = ?`,
      [tenantId, currentTenantId]
    );

    if (!license) {
      const error: any = new Error("Licencia no encontrada");
      error.status = 404;
      throw error;
    }

    // Verificar que la API Key existe
    const apiKey = await prisma.apiKey.findFirst({
      where: { id: apiKeyId },
    });

    if (!apiKey) {
      const error: any = new Error("API Key no encontrada");
      error.status = 404;
      throw error;
    }

    // Verificar que el cliente no tenga ya una API Key asignada
    const existingLink = await prisma.apiKeyLicense.findFirst({
      where: { tenantId },
    });

    if (existingLink && existingLink.apiKeyId !== apiKeyId) {
      const error: any = new Error(
        "Este cliente ya tiene una API Key asignada"
      );
      error.status = 400;
      throw error;
    }

    // Verificar que no esté ya vinculada a esta API Key
    const alreadyLinked = await prisma.apiKeyLicense.findFirst({
      where: {
        apiKeyId,
        tenantId,
      },
    });

    if (alreadyLinked) {
      const error: any = new Error(
        "Esta licencia ya está vinculada a esta API Key"
      );
      error.status = 400;
      throw error;
    }

    // Crear el vínculo
    await prisma.apiKeyLicense.create({
      data: {
        apiKeyId,
        tenantId,
        createdAt: getDateTime(),
        updatedAt: getDateTime(),
      },
    });

    return {
      success: true,
      message: "Licencia vinculada exitosamente",
    };
  } catch (error: any) {
    console.error("Error agregando licencia a API Key:", error);
    return {
      success: false,
      message: error?.message || "Error al vincular la licencia",
    };
  }
}

/**
 * Elimina una licencia de una API Key
 */
export async function removeLicenseFromApiKey(
  request: Request,
  apiKeyId: string,
  tenantId: string
) {
  try {
    const prisma = await getPrismaTenant(request);

    // Verificar que el vínculo existe
    const link = await prisma.apiKeyLicense.findFirst({
      where: {
        apiKeyId,
        tenantId,
      },
    });

    if (!link) {
      const error: any = new Error("Vínculo no encontrado");
      error.status = 404;
      throw error;
    }

    await prisma.apiKeyLicense.delete({
      where: { id: link.id },
    });

    return {
      success: true,
      message: "Licencia desvinculada exitosamente",
    };
  } catch (error: any) {
    console.error("Error eliminando licencia de API Key:", error);
    return {
      success: false,
      message: error?.message || "Error al desvincular la licencia",
    };
  }
}
