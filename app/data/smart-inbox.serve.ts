import { getPrismaTenant } from "~/data/database.server";
import { notifyRealtimeAPI } from "~/data/REALTIME.server";

// Obtener los Inboxes inteligentes
export async function getSmartInboxes(
  request: Request,
  formId: string | null,
  companyId: string
) {
  try {
    const prisma = await getPrismaTenant(request);
    let form = null;

    // Obtener parámetros de paginación y filtros
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const take = parseInt(searchParams.get("take") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const responseId = searchParams.get("id");
    const actualSkip = (page - 1) * take;

    if (formId) {
      // Obtener el formulario
      form = await prisma.form.findFirst({
        where: {
          id: formId,
          companyId: companyId,
          active: true,
        },
        include: {
          FormField: {
            where: { active: true },
            orderBy: { order: "asc" },
          },
        },
      });

      if (!form) {
        throw new Response("Formulario no encontrado", { status: 404 });
      }
    }

    // Construir where clause
    const whereClause = {
      ...(formId && { formId: formId }),
      ...(responseId && { id: responseId }),
      companyId: companyId,
      active: true,
    };

    // Si se busca una respuesta específica, obtener solo esa
    if (responseId) {
      const specificResponse = await prisma.formResponse.findFirst({
        where: whereClause,
        include: {
          FormResponseValue: {
            include: {
              formField: true,
            },
          },
          contact: {
            select: {
              id: true,
              name: true,
              lastName: true,
              email: true,
              phone: true,
              senderId: true,
            },
          },
          form: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!specificResponse) {
        throw new Response("Respuesta no encontrada", { status: 404 });
      }

      // Si la respuesta específica no está marcada como leída, marcarla automáticamente
      if (!specificResponse.read) {
        await prisma.formResponse.update({
          where: { id: responseId },
          data: { read: true },
        });
        specificResponse.read = true; // Actualizar el objeto para la respuesta
      }

      return {
        form,
        responses: [specificResponse],
        count: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
        source: "form-responses",
        specificResponse: specificResponse,
      };
    }

    // Obtener el total de respuestas (solo cuando no se busca una específica)
    const totalCount = await prisma.formResponse.count({
      where: whereClause,
    });

    // Obtener respuestas paginadas
    const responses = await prisma.formResponse.findMany({
      where: whereClause,
      include: {
        FormResponseValue: {
          include: {
            formField: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            phone: true,
            senderId: true,
          },
        },
        form: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
      take,
      skip: actualSkip,
    });

    const totalPages = Math.ceil(totalCount / take);

    return {
      form,
      responses,
      count: totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      source: "form-responses",
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Marcar una respuesta como leída
export async function markAsRead(
  request: Request,
  responseId: string,
  companyId: string
) {
  try {
    const prisma = await getPrismaTenant(request);
    await prisma.formResponse.update({
      where: { id: responseId },
      data: { read: true },
    });

    // Obtener el conteo actualizado de respuestas no leídas
    const unreadSmartInboxCount = await prisma.formResponse.count({
      where: {
        companyId,
        read: false,
        active: true,
      },
    });

    // Notificar actualización del contador de smart inbox
    await notifyRealtimeAPI("smart-inbox-update", {
      companyId,
      unreadCount: unreadSmartInboxCount,
    });
  } catch (error) {
    console.error(error);
  }
}

/**
 * Procesa el envío de un formulario, guarda datos y notifica en tiempo real.
 */
export async function submitFormResponse(
  tenantId: string,
  companyId: string,
  contactId: string | null,
  formId: string,
  formData: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    console.log(`[submitFormResponse] Iniciando para formId: ${formId}, contactId: ${contactId}, tenantId: ${tenantId}`);
    const prisma = await getPrismaTenant(tenantId);

    // 1. Obtener el formulario y sus campos
    const form = await prisma.form.findFirst({
      where: { id: formId, companyId, active: true },
      include: {
        FormField: {
          where: { active: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!form) {
      throw new Error(`Formulario ${formId} no encontrado o inactivo`);
    }

    // 2. Crear la respuesta del formulario
    const formResponse = await prisma.formResponse.create({
      data: {
        formId,
        companyId,
        contactId,
        submittedAt: new Date(),
        ipAddress,
        userAgent,
        read: false,
        active: true,
      },
    });

    // 3. Guardar los valores de los campos
    const dataLower = Object.keys(formData).reduce((acc: any, key) => {
      acc[key.trim().toLowerCase()] = formData[key];
      return acc;
    }, {});

    // Mapeo de sinónimos comunes para mejorar la robustez de la IA
    const synonymMap: Record<string, string[]> = {
      "nombre": ["nombre", "name", "nombre completo", "full name", "usuario"],
      "nombre completo": ["nombre completo", "full name", "name", "nombre"],
      "celular": ["celular", "phone", "teléfono", "telefono", "mobile", "whatsapp"],
      "teléfono": ["teléfono", "telefono", "phone", "celular", "mobile"],
      "email": ["email", "correo", "e-mail", "mail", "correo electrónico"],
      "correo": ["correo", "email", "e-mail", "mail", "correo electrónico"],
    };

    const filledLabels: string[] = [];

    for (const field of form.FormField) {
      const labelLower = field.label.trim().toLowerCase();
      
      // Intentar encontrar el valor: ID exacto, Label exacto, o Sinónimos
      let value = dataLower[field.id.toLowerCase()] || dataLower[labelLower];
      
      if (value === undefined || value === null || value === "") {
        // Buscar en sinónimos si aplica
        for (const [canonical, synonyms] of Object.entries(synonymMap)) {
          if (labelLower.includes(canonical) || synonyms.includes(labelLower)) {
            for (const syn of synonyms) {
              if (dataLower[syn] !== undefined && dataLower[syn] !== null && dataLower[syn] !== "") {
                value = dataLower[syn];
                break;
              }
            }
          }
          if (value) break;
        }
      }

      const strValue = value !== undefined && value !== null ? String(value).trim() : "";

      if (field.isRequired && !strValue) {
        throw new Error(`El campo "${field.label}" es obligatorio`);
      }

      await prisma.formResponseValue.create({
        data: {
          formResponseId: formResponse.id,
          formFieldId: field.id,
          value: strValue || null,
          active: true,
        },
      });

      if (strValue) {
        filledLabels.push(`${field.label}: ${strValue}`);
      }
    }

    console.log(`[submitFormResponse] Campos mapeados con éxito: ${filledLabels.length}/${form.FormField.length}`);
    if (filledLabels.length < form.FormField.length) {
      const missing = form.FormField.filter(f => {
        const val = dataLower[f.id.toLowerCase()] || dataLower[f.label.trim().toLowerCase()];
        return f.isRequired && (!val || val === "");
      }).map(f => f.label);
      if (missing.length > 0) {
         console.warn(`[submitFormResponse] ⚠️ Faltan campos obligatorios: ${missing.join(", ")}`);
      }
    }

    // 4. Crear mensaje del sistema si hay contacto
    if (contactId) {
      const content = `Se recopilaron y llenaron los datos del formulario "${form.name}"`;
      const systemMessage = await prisma.message.create({
        data: {
          content,
          sender: "SYSTEM",
          senderId: "system",
          timestamp: new Date().toISOString(),
          messageId: `system-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          contactId,
          companyId,
          type: "FORM_FILLED",
          status: "READ",
        },
      });

      // Notificar mensaje del sistema en tiempo real
      await notifyRealtimeAPI("system-message", {
        companyId,
        contactId,
        message: {
          id: systemMessage.id,
          content: systemMessage.content,
          sender: systemMessage.sender,
          timestamp: systemMessage.timestamp,
          messageId: systemMessage.messageId,
          type: systemMessage.type,
          status: systemMessage.status,
          createdAt: systemMessage.createdAt.toISOString(),
        },
      });
    }

    // 5. Notificar actualización de Smart Inbox (conteo de no leídos)
    const unreadCount = await prisma.formResponse.count({
      where: { companyId, read: false, active: true },
    });

    await notifyRealtimeAPI("smart-inbox-update", {
      companyId,
      unreadCount,
    });

    const summary = filledLabels.length > 0 ? filledLabels.join(", ") : "formulario completado";
    return {
      success: true,
      message: `Formulario "${form.name}" completado correctamente`,
      summary,
      responseId: formResponse.id,
    };
  } catch (error: any) {
    console.error("❌ Error en submitFormResponse:", error);
    throw error;
  }
}
