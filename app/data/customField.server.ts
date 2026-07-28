import { getEscapedValue, getParamsURL } from "~/lib/utils.functions";
import { getPrismaTenant } from "~/data/database.server";

// Crear un campo personalizado
export async function createCustomField(
  request: Request,
  companyId: string,
  formData: any
) {
  try {
    const prisma = await getPrismaTenant(request);
    const name = getEscapedValue(formData?.name);
    const fieldType = getEscapedValue(formData?.fieldType);
    const isRequired =
      formData?.isRequired == "true" || formData?.isRequired == true;
    const options = getEscapedValue(formData?.options) || null;

    // Validar los campos requeridos
    if (!name || !fieldType) {
      return {
        success: false,
        message: "Nombre y tipo de campo son requeridos",
      };
    }

    // Validar el tipo de campo
    const validFieldTypes = [
      "text",
      "number",
      "date",
      "boolean",
      "select",
      "textarea",
    ];
    if (!validFieldTypes.includes(fieldType)) {
      return {
        success: false,
        message: "Tipo de campo no válido",
      };
    }

    // Validar las opciones para los campos de tipo lista desplegable
    if (fieldType === "select" && !options) {
      return {
        success: false,
        message:
          "Las opciones son requeridas para campos de tipo lista desplegable",
      };
    }

    // Verificar si el nombre del campo ya existe para esta empresa
    const existingField = await prisma.customField.findFirst({
      where: {
        companyId,
        name: name,
        active: true,
      },
    });

    if (existingField) {
      return {
        success: false,
        message: "Ya existe un campo con ese nombre",
      };
    }

    // Obtener el siguiente número de orden
    const lastField = await prisma.customField.findFirst({
      where: { companyId },
      orderBy: { order: "desc" },
    });

    const nextOrder = lastField ? lastField.order + 1 : 1;

    const newCustomField = await prisma.customField.create({
      data: {
        companyId,
        name,
        fieldType,
        isRequired,
        options,
        order: nextOrder,
      },
    });

    return {
      success: true,
      message: "Campo personalizado creado correctamente",
      data: newCustomField,
    };
  } catch (error: any) {
    console.error("Error creating custom field:", error);
    return {
      success: false,
      message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
    };
  }
}

// Obtener los campos personalizados
export async function getCustomFields(request: Request, companyId: string) {
  try {
    const prisma = await getPrismaTenant(request);
    const searchParams = getParamsURL(request);
    const includeInactive = searchParams?.includeInactive === "true";

    const whereClause: any = { companyId };

    const customFields = await prisma.customField.findMany({
      where: whereClause,
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: {
            ContactCustomFieldValue: true,
          },
        },
      },
    });

    return {
      success: true,
      data: customFields,
    };
  } catch (error: any) {
    console.error("Error fetching custom fields:", error);
    return {
      success: false,
      message: "Error al obtener los campos personalizados",
    };
  }
}

// Actualizar un campo personalizado
export async function updateCustomField(
  request: Request,
  companyId: string,
  fieldId: string,
  formData: any
) {
  try {
    const prisma = await getPrismaTenant(request);
    const name = getEscapedValue(formData?.name);
    const fieldType = getEscapedValue(formData?.fieldType);
    const isRequired =
      formData?.isRequired == "true" || formData?.isRequired == true;
    const options = getEscapedValue(formData?.options) || null;

    // Validar los campos requeridos
    if (!name || !fieldType) {
      return {
        success: false,
        message: "Nombre y tipo de campo son requeridos",
      };
    }

    // Validar el tipo de campo
    const validFieldTypes = [
      "text",
      "number",
      "date",
      "boolean",
      "select",
      "textarea",
    ];
    if (!validFieldTypes.includes(fieldType)) {
      return {
        success: false,
        message: "Tipo de campo no válido",
      };
    }

    // Validar las opciones para los campos de tipo lista desplegable
    if (fieldType === "select" && !options) {
      return {
        success: false,
        message:
          "Las opciones son requeridas para campos de tipo lista desplegable",
      };
    }

    // Verificar si el campo existe y pertenece a la empresa
    const existingField = await prisma.customField.findFirst({
      where: {
        id: fieldId,
        companyId,
      },
    });

    if (!existingField) {
      return {
        success: false,
        message: "Campo personalizado no encontrado",
      };
    }

    // Verificar si el nombre del campo ya existe para esta empresa (excluyendo el campo actual)
    const duplicateField = await prisma.customField.findFirst({
      where: {
        companyId,
        name: name,
        active: true,
        id: { not: fieldId },
      },
    });

    if (duplicateField) {
      return {
        success: false,
        message: "Ya existe un campo con ese nombre",
      };
    }

    const updatedField = await prisma.customField.update({
      where: { id: fieldId },
      data: {
        name,
        fieldType,
        isRequired,
        options,
      },
      include: {
        _count: {
          select: {
            ContactCustomFieldValue: true,
          },
        },
      },
    });

    return {
      success: true,
      message: "Campo personalizado actualizado correctamente",
      data: updatedField,
    };
  } catch (error: any) {
    console.error("Error updating custom field:", error);
    return {
      success: false,
      message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
    };
  }
}

// Eliminar un campo personalizado
export async function deleteCustomField(
  request: Request,
  companyId: string,
  fieldId: string
) {
  try {
    const prisma = await getPrismaTenant(request);

    // Verificar si el campo existe y pertenece a la empresa
    const existingField = await prisma.customField.findFirst({
      where: {
        id: fieldId,
        companyId,
      },
      include: {
        _count: {
          select: {
            ContactCustomFieldValue: true,
          },
        },
      },
    });

    if (!existingField) {
      return {
        success: false,
        message: "Campo personalizado no encontrado",
      };
    }

    // Verificar si el campo está siendo utilizado por algún contacto
    if (existingField._count.ContactCustomFieldValue > 0) {
      return {
        success: false,
        message:
          "No se puede eliminar el campo porque está siendo utilizado por algunos contactos. Desactívalo en su lugar.",
      };
    }

    await prisma.customField.delete({
      where: { id: fieldId },
    });

    return {
      success: true,
      message: "Campo personalizado eliminado correctamente",
    };
  } catch (error: any) {
    console.error("Error deleting custom field:", error);
    return {
      success: false,
      message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
    };
  }
}

// Reordenar los campos personalizados
export async function reorderCustomFields(
  request: Request,
  companyId: string,
  fieldIds: string[]
) {
  try {
    const prisma = await getPrismaTenant(request);

    // Validar que todos los campos pertenezcan a la empresa
    const fields = await prisma.customField.findMany({
      where: {
        id: { in: fieldIds },
        companyId,
      },
    });

    if (fields.length !== fieldIds.length) {
      return {
        success: false,
        message: "Uno o más campos no pertenecen a esta empresa",
      };
    }

    // Actualizar el orden para cada campo
    const updatePromises = fieldIds.map((fieldId, index) =>
      prisma.customField.update({
        where: { id: fieldId },
        data: { order: index + 1 },
      })
    );

    await Promise.all(updatePromises);

    return {
      success: true,
      message: "Orden de campos actualizado correctamente",
    };
  } catch (error: any) {
    console.error("Error reordering custom fields:", error);
    return {
      success: false,
      message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
    };
  }
}

// Activar o desactivar un campo personalizado
export async function toggleCustomFieldActive(
  request: Request,
  companyId: string,
  fieldId: string
) {
  try {
    const prisma = await getPrismaTenant(request);

    // Verificar si el campo existe y pertenece a la empresa
    const existingField = await prisma.customField.findFirst({
      where: {
        id: fieldId,
        companyId,
      },
    });

    if (!existingField) {
      return {
        success: false,
        message: "Campo personalizado no encontrado",
      };
    }

    const updatedField = await prisma.customField.update({
      where: { id: fieldId },
      data: {
        active: !existingField.active,
      },
      include: {
        _count: {
          select: {
            ContactCustomFieldValue: true,
          },
        },
      },
    });

    return {
      success: true,
      message: `Campo ${updatedField.active ? "activado" : "desactivado"} correctamente`,
      data: updatedField,
    };
  } catch (error: any) {
    console.error("Error toggling custom field active status:", error);
    return {
      success: false,
      message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
    };
  }
}
