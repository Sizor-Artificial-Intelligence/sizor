import { getEscapedValue, getParamsURL } from "~/lib/utils.functions";
import { getPrismaTenant } from "~/data/database.server";

// Crear un contacto
export async function createContact(
  request: Request,
  companyId: string,
  formData: any
) {
  try {
    const prisma = await getPrismaTenant(request);
    const name = getEscapedValue(formData?.name);
    const lastName = getEscapedValue(formData?.lastName);
    const email = getEscapedValue(formData?.email);
    let phone = getEscapedValue(formData?.phone);
    if (phone) phone = String(phone);
    let countryCode = null;
    if (phone?.length > 0) countryCode = getEscapedValue(formData?.countryCode);
    const address = getEscapedValue(formData?.address);
    const gender = getEscapedValue(formData?.gender);

    const newContact = await prisma.contact.create({
      data: {
        companyId,
        name,
        lastName,
        email,
        phone,
        countryCode,
        address,
        gender,
      },
    });

    await prisma.plan.updateMany({
      where: {
        Company: {
          some: {
            id: companyId,
          },
        },
      },
      data: {
        contactsUsed: {
          increment: 1,
        },
      },
    });

    return {
      success: true,
      message: "Contacto creado correctamente",
      data: newContact,
    };
  } catch (error: any) {
    if (error?.status === 450) {
      return { success: false, message: error?.message || null };
    }
    return {
      success: false,
      message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
    };
  }
}

// Obtener los contactos
export async function getContacts(request: Request, companyId: string) {
  try {
    const prisma = await getPrismaTenant(request);
    const searchParams = getParamsURL(request);
    const search = searchParams?.search || null;
    const take = parseInt(searchParams?.take) || 10;
    const skip = parseInt(searchParams?.skip) || 0;
    const page = parseInt(searchParams?.page) || 1;
    const actualSkip = (page - 1) * take;

    // Filtrar por origen, estado, fecha de creación, email, teléfono, sentimiento y calentamiento del lead
    const origin = searchParams?.origin || null;
    const status = searchParams?.status || null;
    const dateFrom = searchParams?.dateFrom || null;
    const dateTo = searchParams?.dateTo || null;
    const hasEmail = searchParams?.hasEmail === "true";
    const hasPhone = searchParams?.hasPhone === "true";
    const sentiment = searchParams?.sentiment || null;
    const leadTemperature = searchParams?.leadTemperature || null;

    // Construir la cláusula where para la búsqueda y filtros
    const whereClause: any = { companyId };

    // Función de búsqueda
    if (search && search.trim() !== "") {
      whereClause.OR = [
        { name: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { senderId: search },
      ];
    }

    // Filtro por origen
    if (origin && origin.trim() !== "") {
      whereClause.origin = origin;
    }

    // Filtro por estado (activo/inactivo)
    if (status && status.trim() !== "") {
      if (status === "active") {
        whereClause.active = true;
      } else if (status === "inactive") {
        whereClause.active = false;
      }
    }

    // Filtros por rango de fechas
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) {
        whereClause.createdAt.gte = `${dateFrom}T00:00:00.000Z`;
      }
      if (dateTo) {
        whereClause.createdAt.lt = `${dateTo}T23:59:59.999Z`;
      }
    }

    // Filtro por existencia de email
    if (hasEmail) {
      whereClause.email = { not: null };
    }

    // Filtro por existencia de teléfono
    if (hasPhone) {
      whereClause.phone = { not: null };
    }

    // Filtro por sentimiento
    if (sentiment && sentiment.trim() !== "") {
      whereClause.sentiment = sentiment;
    }

    // Filtro por calentamiento del lead
    if (leadTemperature && leadTemperature.trim() !== "") {
      whereClause.leadTemperature = leadTemperature;
    }

    // Obtener el total de contactos para la paginación
    const totalCount = await prisma.contact.count({
      where: whereClause,
    });

    // Obtener los contactos paginados con valores de campos personalizados
    const contacts = await prisma.contact.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take,
      skip: actualSkip,
      include: {
        ContactCustomFieldValue: {
          include: {
            customField: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalCount / take);

    return {
      data: contacts,
      count: totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      source: "contacts",
    };
  } catch (error: any) {
    console.log(error);
    throw error;
  }
}

// Exportar los contactos
export async function exportContacts(request: Request, companyId: string) {
  try {
    const prisma = await getPrismaTenant(request);

    // Obtener todos los contactos sin paginación para exportación
    const contacts = await prisma.contact.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        phone: true,
        countryCode: true,
        address: true,
        gender: true,
        active: true,
        origin: true,
        sentiment: true,
        leadTemperature: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: contacts,
      export: true,
      message: "Contactos exportados correctamente",
    };
  } catch (error: any) {
    if (error?.status === 450) {
      return { success: false, message: error?.message || null };
    }
    return {
      success: false,
      message: "Ocurrió un error inesperado al exportar contactos.",
    };
  }
}

// Actualizar un contacto
export async function updateContact(
  request: Request,
  companyId: string,
  contactId: string,
  formData: any
) {
  try {
    const prisma = await getPrismaTenant(request);

    // Validar los campos requeridos
    const name = getEscapedValue(formData?.name);
    if (!name) {
      return {
        success: false,
        message: "El nombre es requerido",
      };
    }

    // Verificar si el contacto existe y pertenece a la empresa
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        companyId,
      },
    });

    if (!existingContact) {
      return {
        success: false,
        message: "Contacto no encontrado",
      };
    }

    // Actualizar la información básica del contacto
    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        name,
        lastName: getEscapedValue(formData?.lastName) || null,
        email: getEscapedValue(formData?.email) || null,
        phone: getEscapedValue(formData?.phone) || null,
        countryCode: getEscapedValue(formData?.countryCode) || null,
        country: getEscapedValue(formData?.country) || null,
        address: getEscapedValue(formData?.address) || null,
        gender: getEscapedValue(formData?.gender) || null,
      },
    });

    // Manejar los valores de los campos personalizados
    if (formData?.customFields) {
      const customFieldsData = JSON.parse(formData.customFields);

      for (const fieldData of customFieldsData) {
        const { customFieldId, value } = fieldData;

        if (customFieldId && value !== undefined) {
          // Upsert el valor del campo personalizado
          await prisma.contactCustomFieldValue.upsert({
            where: {
              contactId_customFieldId: {
                contactId,
                customFieldId,
              },
            },
            update: {
              value: value.trim() !== "" ? value : null,
            },
            create: {
              contactId,
              customFieldId,
              value: value.trim() !== "" ? value : null,
            },
          });
        }
      }
    }

    // Obtener el contacto actualizado con los valores de los campos personalizados
    const contactWithCustomFields = await prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        ContactCustomFieldValue: {
          include: {
            customField: true,
          },
        },
      },
    });

    return {
      success: true,
      message: "Contacto actualizado correctamente",
      data: contactWithCustomFields,
    };
  } catch (error: any) {
    console.error("Error updating contact:", error);
    return {
      success: false,
      message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
    };
  }
}

// Importar los contactos
export async function importContacts(
  request: Request,
  companyId: string,
  formData: any
) {
  try {
    const prisma = await getPrismaTenant(request);
    const contacts = JSON.parse(formData?.data) || [];

    if (contacts.length === 0) {
      return {
        success: false,
        message: "No hay contactos válidos para importar",
      };
    }

    const result = await prisma.contact.createMany({
      data: contacts.map((contact: any) => {
        const name = getEscapedValue(contact?.name);
        const lastName = getEscapedValue(contact?.lastName);
        const email = getEscapedValue(contact?.email);
        let phone = getEscapedValue(contact?.phone);
        if (phone) phone = String(phone);
        let countryCode = null;
        if (phone?.length > 0)
          countryCode = getEscapedValue(contact?.countryCode);
        const address = getEscapedValue(contact?.address);
        const gender = getEscapedValue(contact?.gender);

        return {
          companyId,
          name,
          lastName,
          email,
          phone,
          countryCode,
          address,
          gender,
        };
      }),
    });

    await prisma.plan.updateMany({
      where: {
        Company: {
          some: {
            id: companyId,
          },
        },
      },
      data: {
        contactsUsed: {
          increment: contacts.length,
        },
      },
    });

    return {
      success: true,
      message: `${result.count} contactos importados correctamente`,
    };
  } catch (error: any) {
    if (error?.status === 450) {
      return { success: false, message: error?.message || null };
    }
    return {
      success: false,
      message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
    };
  }
}
