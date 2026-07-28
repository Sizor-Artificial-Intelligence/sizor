import { getEscapedValue, roundNumber } from "~/lib/utils.functions";
import { getPrismaTenant } from "~/data/database.server";
import { createPreferencePayment } from "./payment.server";
import { verifySocialNetworkToken } from "./META.server";
import { getTenantId } from "./auth.server";
import { APP_NAME } from "~/config/app";

// Actualizar un plan
export async function updatePlan(
  request: Request,
  companyId: string,
  userId: string,
  formData: any
) {
  try {
    const price = roundNumber(formData?.price || 0);
    const licenses = roundNumber(formData?.licenses || 0);
    const tokens = roundNumber(formData?.tokens || 0);
    const planName = formData?.plan;
    const isTokenIncrease = formData?.isTokenIncrease;
    const tokenIncreaseType = formData?.tokenIncreaseType;
    const subdomain = formData?.subdomain;
    const prisma = await getPrismaTenant(request);
    let type = "";
    let updateData: any = {};
    let paymentType: "one-time" | "subscription" = "one-time";

    // Obtener el plan actual para verificar si es gratis
    const currentPlan = await prisma.plan.findFirst({
      where: { Company: { some: { id: companyId } } },
    });

    // Verificar si es upgrade desde gratis
    const isUpgradingFromFree = currentPlan?.isFree === true;
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Obtener el tipo de pago y crear objeto de actualizaciones
    if (isTokenIncrease) {
      type = "TOKEN-INCREASE";
      paymentType = "one-time";
      // Lógica para aumento de tokens en plan Premium existente
      const currentBaseTokens = currentPlan?.baseTokens || 0;
      const currentAdditionalTokens = currentPlan?.additionalTokens || 0;
      const currentPrice = currentPlan?.price || 0;
      const currentAdditionalPrice = currentPlan?.additionalTokensPrice || 0;
      updateData = {};
      if (tokenIncreaseType === "one-time") {
        // Aumento temporal - mantener tokens base y agregar adicionales
        updateData.additionalTokens = currentAdditionalTokens + tokens;
        updateData.additionalTokensType = "one-time";
        updateData.additionalTokensExpiry = endOfMonth;
        updateData.additionalTokensPrice = currentAdditionalPrice + price;
        updateData.maxTokens = currentBaseTokens + updateData.additionalTokens;
        paymentType = "one-time";
      } else if (tokenIncreaseType === "permanent") {
        paymentType = "subscription";
        // Aumento permanente - agregar a baseTokens y mantener adicionales activos
        const newBaseTokens = currentBaseTokens + tokens;
        const totalActiveTokens = newBaseTokens + currentAdditionalTokens;

        updateData.baseTokens = newBaseTokens;
        updateData.price = currentPrice + price; // Actualizar precio del plan
        updateData.maxTokens = totalActiveTokens; // Incluir tokens adicionales activos

        // Mantener tokens adicionales si están activos (no expirados)
        if (
          currentPlan?.additionalTokensType === "one-time" &&
          currentPlan?.additionalTokensExpiry &&
          new Date(currentPlan.additionalTokensExpiry) > now
        ) {
          // Los tokens temporales siguen activos, mantenerlos
          updateData.additionalTokens = currentAdditionalTokens;
          updateData.additionalTokensType = currentPlan.additionalTokensType;
          updateData.additionalTokensExpiry =
            currentPlan.additionalTokensExpiry;
          updateData.additionalTokensPrice = currentAdditionalPrice;
        } else {
          // No hay tokens adicionales activos, limpiar
          updateData.additionalTokens = 0;
          updateData.additionalTokensType = null;
          updateData.additionalTokensExpiry = null;
          updateData.additionalTokensPrice = 0;
        }
      }
    } else {
      type = "PLAN-CREATION";
      paymentType = "subscription";
      updateData = {
        price: price,
        name: planName,
        tokensUsed: 0,
        isFree: false,
      };
      if (isUpgradingFromFree || planName === "PREMIUM") {
        // Al pasar de gratis a Premium, establecer baseTokens como el nuevo total
        updateData.baseTokens = tokens;
        updateData.additionalTokens = 0;
        updateData.additionalTokensType = null;
        updateData.additionalTokensExpiry = null;
        updateData.additionalTokensPrice = 0;
        updateData.maxTokens = tokens;
      } else {
        // Para otros planes, mantener la lógica actual
        updateData.maxTokens = tokens;
      }
    }

    // Crear preferencia de pago
    const paymentData = await createPreferencePayment(
      await getTenantId(request),
      price,
      `${APP_NAME} - ${planName} plan`,
      {
        tenantId: await getTenantId(request),
        type,
        licenses,
        updateData: JSON.stringify(updateData),
        companyId,
        isTokenIncrease,
        tokens,
        tokenIncreaseType,
        endOfMonth,
        planName,
        price,
        subdomain,
        userId,
      }
    );

    if (!paymentData || !paymentData.url) {
      const error: any = new Error("Error al crear la preferencia de pago");
      error.status = 450;
      throw error;
    }

    return {
      success: true,
      url: paymentData.url,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Error al actualizar el plan",
    };
  }
}

// Conectar una red social
export async function connectSocialNetwork(
  request: Request,
  companyId: string,
  formData: any
) {
  try {
    const prisma = await getPrismaTenant(request);
    const socialNetwork = formData?.socialNetwork;
    const apiToken = formData?.apiToken;
    const accountId = formData?.accountId;
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
      },
      include: {
        plan: true,
      },
    });
    const plan = company?.plan;

    if (socialNetwork != "Web") {
      const res = await verifySocialNetworkToken(
        apiToken,
        accountId,
        companyId,
        socialNetwork
      );

      if (!res) {
        return {
          success: false,
          message: "Token de acceso a la red social no válido",
        };
      }
    }

    await prisma.plan.update({
      where: {
        id: plan?.id,
      },
      data: {
        [socialNetwork?.toLowerCase() + "Connected"]: true,
        ...(socialNetwork != "Web"
          ? {
              ["ACCOUNT_ID_" + socialNetwork?.toUpperCase()]: accountId,
              ["API_TOKEN_" + socialNetwork?.toUpperCase()]: apiToken,
            }
          : {}),
      },
    });

    await prisma.plan.updateMany({
      where: {
        Company: {
          some: { id: companyId },
        },
      },
      data: {
        socialMediaUsed: {
          increment: 1,
        },
      },
    });

    return {
      connected: true,
      success: true,
      message: "Canal conectado correctamente",
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Error al conectar la red social",
    };
  }
}

// Actualizar las configuraciones
export async function updateSettings(
  request: Request,
  companyId: string,
  formData: any
) {
  try {
    const prisma = await getPrismaTenant(request);
    const settings = JSON.parse(formData?.settings);
    const notifications = JSON.parse(formData?.notifications);

    await prisma.company.update({
      where: { id: companyId },
      data: {
        SETT_IA_RESPONSE: getEscapedValue(settings?.SETT_IA_RESPONSE),
        NOTT_METHOD: getEscapedValue(notifications?.notificationMethod),
        NOTT_FORM_SUBMISSION: getEscapedValue(notifications?.formSubmission),
        NOTT_APPOINTMENT_CREATED: getEscapedValue(
          notifications?.appointmentCreated
        ),
        NOTT_APPOINTMENT_MODIFIED: getEscapedValue(
          notifications?.appointmentModified
        ),
        NOTT_APPOINTMENT_CANCELLED: getEscapedValue(
          notifications?.appointmentCancelled
        ),
        NOTT_CHAT_ASSIGNED_TO_HUMAN: getEscapedValue(
          notifications?.chatAssignedToHuman
        ),
      },
    });

    return {
      status: "success",
      message: "Configuraciones actualizadas correctamente",
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      message: "Error al actualizar las configuraciones",
    };
  }
}

// Obtener el plan actual por empresa
export async function getPlanByCompanyId(request: Request, companyId: string) {
  try {
    const prisma = await getPrismaTenant(request);
    const plan = await prisma.plan.findFirst({
      where: { Company: { some: { id: companyId } } },
    });
    return plan;
  } catch (error) {
    console.log(error);
  }
  return null;
}
