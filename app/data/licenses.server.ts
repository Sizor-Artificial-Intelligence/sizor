import { getEscapedValue, roundNumber } from "~/lib/utils.functions";
import { executeAdminQuery, getPrismaTenant } from "./database.server";
import { createUserAccount, getTenantId } from "./auth.server";

export async function createLicense(
  request: Request,
  formData: Record<any, any>
) {
  try {
    const prisma = await getPrismaTenant(request);
    const license = await prisma.license.findFirst({});

    if (!license) {
      const error: any = new Error("No se encontró la licencia.");
      error.status = 450;
      throw error;
    }

    const firstName = getEscapedValue(formData?.firstName);
    const lastName = getEscapedValue(formData?.lastName);
    const email = getEscapedValue(formData?.email);
    const phone = getEscapedValue(formData?.phone);
    const countryCode = getEscapedValue(formData?.countryCode);
    const country = getEscapedValue(formData?.country);
    const useGoogleLogin = getEscapedValue(formData?.useGoogleLogin);
    const password = getEscapedValue(formData?.password);
    const baseTokens = roundNumber(formData?.baseTokens);
    const maxContacts = roundNumber(formData?.maxContacts);
    const contactsUnlimited = getEscapedValue(formData?.contactsUnlimited);
    const maxUsers = roundNumber(formData?.maxUsers);
    const usersUnlimited = getEscapedValue(formData?.usersUnlimited);
    const price = roundNumber(formData?.price);
    const companyName = getEscapedValue(formData?.companyName);
    const maxAgents = roundNumber(formData?.maxAgents);
    const agentsUnlimited = getEscapedValue(formData?.agentsUnlimited);

    // Crear la cuenta/licencia
    const { success, message, user, tenantId } = await createUserAccount({
      user: {
        firstName,
        lastName,
        email,
        phone,
        countryCode,
        country,
        password,
        isGoogleLogin: useGoogleLogin,
        picture: null,
      },
      enterprise: {
        name: license?.nameEnterprise,
        subdomain: license?.subdomain,
        tenantId: await getTenantId(request),
      },
      plan: {
        baseTokens,
        price,
        companyName,
        maxUsers,
        maxAgents,
        maxContacts,
        contactsUnlimited,
        agentsUnlimited,
        usersUnlimited,
      },
      isEnterprise: true,
    });

    if (!success || !user || !tenantId) {
      const error: any = new Error(
        message || "Ocurrió un error al crear la licencia. Intenta nuevamente."
      );
      error.status = 450;
      throw error;
    }

    return {
      success: true,
      status: "success",
      message: "Licencia creada exitosamente",
    };
  } catch (error: any) {
    console.log(error);
    return {
      success: false,
      status: "error",
      message: error?.message || null,
    };
  }
}

export async function getLicenses(request: Request) {
  try {
    const tenantId = await getTenantId(request);
    const licenses = await executeAdminQuery(
      `SELECT id, tenantId, name, email, phone, countryCode, country, plan, parentTenantId, CAST(price AS FLOAT) as price, CAST(tokens AS FLOAT) as tokens, active FROM clients WHERE parentTenantId = ?`,
      [tenantId],
      true
    );
    return licenses;
  } catch (error: any) {
    console.log(error);
  }
}

export async function updateLicensePrice(
  request: Request,
  tenantId: string,
  price: number
) {
  try {
    const currentTenantId = await getTenantId(request);

    // Verificar que la licencia pertenece al tenant actual
    const license = await executeAdminQuery(
      `SELECT tenantId FROM clients WHERE tenantId = ? AND parentTenantId = ?`,
      [tenantId, currentTenantId]
    );

    if (!license) {
      const error: any = new Error("Licencia no encontrada");
      error.status = 450;
      throw error;
    }

    // Cambiar en el admin
    await executeAdminQuery(`UPDATE clients SET price = ? WHERE tenantId = ?`, [
      roundNumber(price),
      tenantId,
    ]);

    // Cambiar en el tenant
    const prisma = await getPrismaTenant(tenantId);
    await prisma.plan.updateMany({
      data: {
        price: roundNumber(price),
      },
    });

    return {
      success: true,
      message: "Precio actualizado exitosamente",
    };
  } catch (error: any) {
    console.error("Error actualizando precio de licencia:", error);
    return {
      success: false,
      message: error?.message || "Error al actualizar el precio",
    };
  }
}

export async function updateLicenseTokens(
  request: Request,
  tenantId: string,
  tokens: number
) {
  try {
    const currentTenantId = await getTenantId(request);

    // Verificar que la licencia pertenece al tenant actual
    const license = await executeAdminQuery(
      `SELECT tenantId FROM clients WHERE tenantId = ? AND parentTenantId = ?`,
      [tenantId, currentTenantId]
    );

    if (!license) {
      const error: any = new Error("Licencia no encontrada");
      error.status = 450;
      throw error;
    }

    // Cambiar en el admin
    await executeAdminQuery(
      `UPDATE clients SET tokens = ? WHERE tenantId = ?`,
      [roundNumber(tokens), tenantId]
    );

    // Cambiar en el tenant
    const prisma = await getPrismaTenant(tenantId);
    await prisma.plan.updateMany({
      data: {
        baseTokens: roundNumber(tokens),
        maxTokens: roundNumber(tokens),
      },
    });

    return {
      success: true,
      message: "Tokens actualizados exitosamente",
    };
  } catch (error: any) {
    console.error("Error actualizando tokens de licencia:", error);
    return {
      success: false,
      message: error?.message || "Error al actualizar los tokens",
    };
  }
}

export async function toggleLicenseStatus(
  request: Request,
  tenantId: string,
  active: boolean
) {
  try {
    const currentTenantId = await getTenantId(request);

    // Verificar que la licencia pertenece al tenant actual
    const license = await executeAdminQuery(
      `SELECT tenantId FROM clients WHERE tenantId = ? AND parentTenantId = ?`,
      [tenantId, currentTenantId]
    );

    if (!license) {
      const error: any = new Error("Licencia no encontrada");
      error.status = 450;
      throw error;
    }

    // Cambiar en el admin
    await executeAdminQuery(
      `UPDATE clients SET active = ? WHERE tenantId = ?`,
      [active ? 1 : 0, tenantId]
    );

    // Cambiar en el tenant
    const prisma = await getPrismaTenant(tenantId);
    await prisma.plan.updateMany({
      data: {
        pendingPayment: !active,
      },
    });

    return {
      success: true,
      message: active
        ? "Licencia activada exitosamente"
        : "Licencia bloqueada exitosamente",
    };
  } catch (error: any) {
    console.error("Error actualizando estado de licencia:", error);
    return {
      success: false,
      message: error?.message || "Error al actualizar el estado",
    };
  }
}
