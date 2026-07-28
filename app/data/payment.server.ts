import axios from "axios";
import { NODE_ENV, VITE_DOMAIN } from "~/config/env";
import type { AxiosResponse } from "axios";
import { executeAdminQuery, getPrismaTenant } from "~/data/database.server";
import {
  getDateTime,
  getTimeElapsed,
  roundNumber,
} from "~/lib/utils.functions";
import { sendEmail } from "./utils.server";
import { APP_NAME, EMAIL_ADMINISTRATION, EMAIL_SUPPORT } from "~/config/app";
import { createSubdomain } from "./multi-tenant.server";
import { randomUUID } from "node:crypto";

interface PaymentEvent {
  id: string;
  type: "SALE_APPROVED" | "SALE_REJECTED" | "VOID_APPROVED" | "VOID_REJECTED";
  subject: string | null;
  source: string;
  spec_version: string;
  time: number;
  data: {
    payment_id: string;
    merchant_id: string;
    created_at: string;
    amount: {
      currency: string;
      total: number;
      taxes: any[];
      tip: number;
    };
    user_id: string | null;
    metadata: {
      reference: string;
      [key: string]: any;
    };
    bold_code: string;
    payer_email: string;
    payment_method: string;
    card?: {
      brand: string;
      cardholder_name: string;
      masked_pan: string;
      installments: string | number;
      card_type: string;
    };
    approval_number?: string;
    [key: string]: any;
  };
  datacontenttype: string;
  [key: string]: any;
}

// Crear una preferencia de pago
export async function createPreferencePayment(
  tenantId: string,
  amount: number,
  description: string,
  metadata: any
): Promise<{ url: string } | null> {
  try {
    const reference = `${tenantId}_${Date.now()}`;
    const URL =
      NODE_ENV === "development"
        ? process.env.VITE_API_URL_DEV
        : process.env.VITE_API_URL;
    const response: AxiosResponse<any> = await axios.post(
      `${URL}/payment/create`,
      { amount, description, reference, tenantId },
      {
        headers: {
          "X-API-KEY": process.env.SIZOR_API_KEY,
        },
      }
    );

    // Guardar metadatos en DB
    if (response?.data?.data?.url) {
      await executeAdminQuery(
        `INSERT INTO payment_preferences (tenantId, amount, description, reference, metadata) VALUES (?, ?, ?, ?, ?)`,
        [tenantId, amount, description, reference, JSON.stringify(metadata)]
      );
    }
    return {
      url: response?.data?.data?.url || null,
    };
  } catch (error) {
    console.log(error);
    throw `Error al crear la preferencia de pago: ${error}`;
  }
}

// Procesar un pago
export async function processPayment(formData: PaymentEvent) {
  try {
    console.log("DEBUG: Procesando pago", formData);

    const tenantId = formData?.data?.metadata?.reference?.split("_")[0];
    const paymentMethod = formData?.data?.payment_method;
    const reference = formData?.data?.metadata?.reference;

    // Buscar preferencia de pago
    const paymentPreference: any = await executeAdminQuery(
      `SELECT * FROM payment_preferences WHERE reference = ? AND tenantId = ? AND is_processed = 0`,
      [reference, tenantId]
    );

    if (!paymentPreference) {
      console.log("DEBUG: Preferencia de pago no encontrada", reference);
      return false;
    }

    console.log("DEBUG: Preferencia de pago encontrada", paymentPreference);

    // Parse metadata with error handling for nested JSON strings
    let metadata: any;
    try {
      metadata = JSON.parse(paymentPreference?.metadata);
    } catch (parseError) {
      // If parsing fails, try to fix nested JSON strings
      // This handles cases where updateData is a JSON string that wasn't properly escaped
      let metadataStr = paymentPreference?.metadata || "{}";

      // Find the updateData field and fix its escaped JSON content
      // Pattern: "updateData":"{...}" where {...} contains unescaped quotes
      const updateDataStart = metadataStr.indexOf('"updateData":"');
      if (updateDataStart !== -1) {
        // Find where the updateData value starts (after the opening quote)
        const valueStart = updateDataStart + '"updateData":"'.length;

        // Find the matching closing quote by looking for the pattern: }"}
        // This works because updateData is a JSON object string
        let braceCount = 0;
        let jsonStart = -1;
        let jsonEnd = -1;

        for (let i = valueStart; i < metadataStr.length; i++) {
          if (metadataStr[i] === "{") {
            if (jsonStart === -1) jsonStart = i;
            braceCount++;
          } else if (metadataStr[i] === "}") {
            braceCount--;
            if (braceCount === 0 && jsonStart !== -1) {
              jsonEnd = i;
              break;
            }
          }
        }

        if (jsonStart !== -1 && jsonEnd !== -1) {
          // Extract the JSON content (the unescaped JSON object)
          const jsonContent = metadataStr.substring(jsonStart, jsonEnd + 1);
          // Properly escape it for JSON string (escape backslashes first, then quotes)
          const escapedContent = jsonContent
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
          // Replace the unescaped version with the escaped one
          // The structure should be: "updateData":"{...}" -> "updateData":"{escaped...}"
          // Include any content between valueStart and jsonStart (whitespace, etc.)
          const before = metadataStr.substring(0, jsonStart);
          const after = metadataStr.substring(jsonEnd + 1);
          // The after part should start with a quote (the closing quote of the string value)
          // Reconstruct: before + escapedContent + closing quote + rest
          metadataStr = before + escapedContent + after;

          try {
            metadata = JSON.parse(metadataStr);
          } catch (secondError) {
            console.error(
              "Failed to parse metadata even after fixing updateData:",
              secondError
            );
            console.error("Original metadata:", paymentPreference?.metadata);
            console.error("Fixed metadata:", metadataStr);
            throw new Error(
              `Error al parsear los metadatos del pago: ${secondError}`
            );
          }
        } else {
          console.error("Could not locate updateData JSON boundaries");
          throw new Error(
            `Error al parsear los metadatos del pago: ${parseError}`
          );
        }
      } else {
        console.error("Could not find updateData field in metadata");
        throw new Error(
          `Error al parsear los metadatos del pago: ${parseError}`
        );
      }
    }

    const price = paymentPreference?.amount;
    const type = metadata?.type;
    let planName = metadata?.plan;

    // Validar que el pago fue exitoso
    if (formData?.type !== "SALE_APPROVED") {
      // TODO: Enviar correo de pago no aprobado o no acreditado
      console.log("Pago no aprobado o no acreditado:", {
        type: formData?.type,
        data: formData?.data,
      });
      return false;
    }

    const prisma = await getPrismaTenant(tenantId);
    const companyId = metadata?.companyId;
    const userId = metadata?.userId;
    const plan = await prisma.plan.findFirst({
      where: {
        Company: {
          some: {
            id: companyId,
          },
        },
      },
    });
    const planId = plan?.id;
    let daysLeftSubscription =
      (plan?.daysToExpireSubscription || 30) -
      (getTimeElapsed(plan?.datePay || (plan?.dateStartSubscription as any))
        ?.days || 0);
    if (daysLeftSubscription > 3) daysLeftSubscription = 3;
    if (daysLeftSubscription < 0) daysLeftSubscription = 0;

    console.log("DEBUG: Pago exitoso - Procesando por medio del webhook", {
      type,
      tenantId,
      price,
    });

    // Pago de suscripción mensual
    if (type === "MONTHLY-PAYMENT") {
      let additionalTokensUsed = 0;
      if (plan?.additionalTokens && plan?.additionalTokens > 0) {
        let tempAdditionalTokensUsed = plan?.tokensUsed - plan?.baseTokens;
        if (tempAdditionalTokensUsed > 0)
          additionalTokensUsed = tempAdditionalTokensUsed;
      }

      await prisma.plan.update({
        where: { id: planId },
        data: {
          datePay: getDateTime(),
          pendingPayment: false,
          tokensUsed: additionalTokensUsed,
          additionalTokensUsed,
          daysToExpireSubscription: daysLeftSubscription + 30,
        },
      });

      planName = plan?.name;

      // TODO: Resetear tokens y lo necesario para reactivar el plan
    }

    // Se acaba de registrar y compra el plan premium
    if (type === "PREMIUM-FIRST-TIME") {
      const tokens = parseFloat(metadata?.tokens);
      const userId = metadata?.userId;
      const licenses = metadata?.licenses;
      const subdomain = metadata?.subdomain;

      // crear plan
      const newPlan = await prisma.plan.create({
        data: {
          name: metadata?.plan,
          price: roundNumber(price),
          isFree: false,
          maxTokens: metadata?.plan === "ENTERPRISE" ? 0 : tokens,
          baseTokens: metadata?.plan === "ENTERPRISE" ? 0 : tokens,
          dateStartSubscription: getDateTime(),
          datePay: getDateTime(),
        },
      });

      // Buscar empresa
      const company = await prisma.company.findFirst({
        where: {
          UserCompany: {
            some: {
              userId,
            },
          },
        },
      });

      // Asignar el plan a la empresa
      await prisma.company.update({
        where: { id: company?.id },
        data: { planId: newPlan?.id },
      });

      // Licencia
      let license = await prisma.license.findFirst({});
      if (!license) {
        license = await prisma.license.create({
          data: {
            maxLicenses:
              metadata?.plan === "ENTERPRISE" ? parseInt(licenses) : 1,
            ...(metadata?.plan === "ENTERPRISE" ? { subdomain } : {}),
            isEnterprise: metadata?.plan === "ENTERPRISE",
            subdomain,
            hasPremium: true,
            dateLastVerification: getDateTime(),
          },
        });
      } else {
        await prisma.license.update({
          where: { id: license?.id },
          data: {
            maxLicenses:
              metadata?.plan === "ENTERPRISE" ? parseInt(licenses) : 1,
            ...(metadata?.plan === "ENTERPRISE" ? { subdomain } : {}),
            isEnterprise: metadata?.plan === "ENTERPRISE",
            subdomain,
            hasPremium: true,
          },
        });
      }

      // Crear subdominio
      if (metadata?.plan === "ENTERPRISE") {
        await createSubdomain(subdomain, tenantId);

        await prisma.license.update({
          where: { id: license?.id },
          data: {
            nameEnterprise: company?.name,
          },
        });
      }

      // Establecer como enterprise en el admin
      await executeAdminQuery(
        `UPDATE clients SET isEnterprise = 1 WHERE tenantId = ?`,
        [tenantId]
      );

      // Usuario
      await prisma.user.update({
        where: { id: userId },
        data: {
          nextPathSignup: null,
        },
      });

      planName = metadata?.plan;
    }

    // Pasa de gratis a premium o aumenta tokens del plan premium
    if (type === "PLAN-CREATION" || type === "TOKEN-INCREASE") {
      const licenses = parseInt(metadata?.licenses || 0);
      const updateData = JSON.parse(metadata?.updateData || "{}");
      const isTokenIncrease = metadata?.isTokenIncrease;
      const tokens = parseFloat(metadata?.tokens);
      const tokenIncreaseType = metadata?.tokenIncreaseType;
      const endOfMonth = metadata?.endOfMonth;
      planName = metadata?.plan;
      const subdomain = metadata?.subdomain;
      const userId = metadata?.userId;

      // Actualizar plan
      await prisma.plan.updateMany({
        where: { Company: { some: { id: companyId } } },
        data: {
          ...updateData,
          datePay: getDateTime(),
        },
      });

      // Buscar plan
      const plan = await prisma.plan.findFirst({
        where: { Company: { some: { id: companyId } } },
      });

      // Crear registro de transacción
      if (plan) {
        await prisma.tokenTransaction.create({
          data: {
            companyId: companyId,
            planId: plan.id,
            transactionType: isTokenIncrease
              ? "token_increase"
              : "plan_creation",
            tokensAmount: tokens,
            price: roundNumber(price),
            increaseType: isTokenIncrease ? tokenIncreaseType : null,
            expiryDate:
              isTokenIncrease && tokenIncreaseType === "one-time"
                ? endOfMonth
                : null,
            description: isTokenIncrease
              ? `Aumento de créditos ${tokenIncreaseType === "one-time" ? "temporal" : "permanente"}`
              : `Actualización a plan ${planName}`,
          },
        });
      }

      // Actualizar licencia
      if (planName === "ENTERPRISE") {
        let license = await prisma.license.findFirst({});
        const company = await prisma.company.findFirst({
          where: {
            UserCompany: {
              some: {
                userId,
              },
            },
          },
        });

        await createSubdomain(subdomain, tenantId);

        await prisma.license.update({
          where: { id: license?.id },
          data: {
            nameEnterprise: company?.name,
            maxLicenses: licenses,
            isEnterprise: true,
            subdomain,
            hasPremium: true,
          },
        });

        // Establecer como enterprise en el admin
        await executeAdminQuery(
          `UPDATE clients SET isEnterprise = 1 WHERE tenantId = ?`,
          [tenantId]
        );
      } else {
        let license = await prisma.license.findFirst({});
        await prisma.license.update({
          where: { id: license?.id },
          data: {
            hasPremium: true,
          },
        });
      }
    }

    // Copilot ilimitado
    if (type === "COPILOT_UNLIMITED") {
      await prisma.company.update({
        where: { id: companyId },
        data: {
          copilotUnlimited: true,
        },
      });
    }

    // Enviar correo de seguimiento a administración
    if (NODE_ENV == "production") {
      await sendEmail(
        "payment-success-admin",
        EMAIL_ADMINISTRATION,
        `Nuevo pago recibido de ${APP_NAME} (${tenantId})`,
        {
          price,
          tenantId,
          type,
          metadata: JSON.stringify(metadata),
        }
      );
    }

    // Actualizar plan y precio en el admin
    if (type !== "COPILOT_UNLIMITED") {
      if (!planName) planName = metadata?.plan || metadata?.planName;
      await executeAdminQuery(
        `UPDATE clients SET plan = ?, price = ? WHERE tenantId = ?`,
        [planName, roundNumber(price), tenantId]
      );
    }

    // Enviar correo de pago exitoso al usuario
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    await sendEmail(
      "payment-success-user",
      user?.email || "",
      `Pago exitoso - ${APP_NAME}`,
      {
        user_name: user?.firstName || "" + " " + user?.lastName || "",
        plan_name: metadata?.plan || "",
        payment_date: getDateTime(),
        payment_method: paymentMethod,
        payment_amount: price,
        url: `${VITE_DOMAIN}/app/`,
      }
    );

    // Actualizar preferencia de pago
    await executeAdminQuery(
      `UPDATE payment_preferences SET is_processed = 1 WHERE reference = ? AND tenantId = ?`,
      [reference, tenantId]
    );

    return true;
  } catch (error) {
    console.log(error);
    throw `Error al procesar el pago: ${error}`;
  }
}
