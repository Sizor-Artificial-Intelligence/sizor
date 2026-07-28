import {
  generateRandomLetters,
  getDateTime,
  getEscapedValue,
} from "~/lib/utils.functions";
import { executeAdminQuery, getPrismaTenant } from "~/data/database.server";
import { getTenantId } from "./auth.server";
import { randomUUID } from "node:crypto";

// Crear un formulario
export async function createForm(
  request: Request,
  companyId: string,
  formData: any
) {
  try {
    const prisma = await getPrismaTenant(request);
    const tenantId = await getTenantId(request);
    const name = getEscapedValue(formData?.name);
    const description = getEscapedValue(formData?.description);
    const fields = JSON.parse(formData?.fields);

    // Generar slug único
    let slug = generateRandomLetters(6);
    let existSlug = await executeAdminQuery(
      `SELECT COUNT(*) FROM \`form-slugs\` WHERE slug = ?`,
      [slug]
    );
    let exists = existSlug?.count || 0 > 0;
    while (exists) {
      slug = generateRandomLetters(6);
      existSlug = await executeAdminQuery(
        `SELECT COUNT(*) FROM \`form-slugs\` WHERE slug = ?`,
        [slug]
      );
      exists = existSlug?.count || 0 > 0;
    }

    // Crear el formulario en la base de datos
    const form = await prisma.form.create({
      data: {
        name,
        description,
        slug,
        companyId,
        active: true,
        FormField: {
          create: fields.map((field: any, index: number) => ({
            label: field.label,
            fieldType: field.fieldType,
            isRequired: field.isRequired,
            placeholder: field.placeholder,
            options: field.options,
            order: field.order || index,
            active: field.active !== false,
          })),
        },
      },
      include: {
        FormField: true,
      },
    });

    // Guardar el mapeo de slug en Firebase
    await executeAdminQuery(
      `INSERT INTO \`form-slugs\` (formId, tenantId, slug) VALUES (?, ?, ?)`,
      [form.id, tenantId, slug]
    );

    return {
      status: "success",
      message: "Formulario creado correctamente",
      formId: form.id,
      slug: slug,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// Obtener un formulario por su slug
export async function getFormBySlug(request: Request, slug: string) {
  try {
    const tenantId = await getTenantId(request);
    // Obtener el mapeo del slug desde Firebase
    const mapping = await executeAdminQuery(
      `SELECT * FROM \`form-slugs\` WHERE slug = ? AND tenantId = ?`,
      [slug, tenantId]
    );

    if (!mapping) {
      return null;
    }

    // Conectar a la base de datos del tenant correcto
    const prisma = await getPrismaTenant(mapping.tenantId);

    // Obtener el formulario con sus campos
    const form = await prisma.form.findUnique({
      where: {
        id: mapping.formId,
        active: true,
      },
      include: {
        FormField: {
          where: {
            active: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        company: {
          select: {
            name: true,
            initialsName: true,
          },
        },
      },
    });

    return form;
  } catch (error) {
    console.log(error);
    return null;
  }
}

// Actualizar un formulario
export async function updateForm(
  request: Request,
  formId: string,
  formData: any
) {
  try {
    const prisma = await getPrismaTenant(request);
    const name = getEscapedValue(formData?.name);
    const description = getEscapedValue(formData?.description);
    const fields = JSON.parse(formData?.fields);

    // Actualizar el formulario
    const form = await prisma.form.update({
      where: { id: formId },
      data: {
        name,
        description,
        updatedAt: new Date(),
      },
    });

    // Obtener campos existentes ordenados por order
    const existingFields = await prisma.formField.findMany({
      where: { formId, active: true },
      orderBy: { order: "asc" },
    });

    // Procesar cada campo del formulario actualizado
    const processedFieldIds = new Set<string>();

    for (let i = 0; i < fields.length; i++) {
      const fieldData = fields[i];
      const order = fieldData.order !== undefined ? fieldData.order : i;

      // Buscar un campo existente en la misma posición
      const existingField = existingFields[i];

      if (existingField && !processedFieldIds.has(existingField.id)) {
        // Actualizar campo existente
        await prisma.formField.update({
          where: { id: existingField.id },
          data: {
            label: fieldData.label,
            fieldType: fieldData.fieldType,
            isRequired: fieldData.isRequired,
            placeholder: fieldData.placeholder,
            options: fieldData.options,
            order: order,
            active: fieldData.active !== false,
            updatedAt: new Date(),
          },
        });
        processedFieldIds.add(existingField.id);
      } else {
        // Crear nuevo campo
        await prisma.formField.create({
          data: {
            formId,
            label: fieldData.label,
            fieldType: fieldData.fieldType,
            isRequired: fieldData.isRequired,
            placeholder: fieldData.placeholder,
            options: fieldData.options,
            order: order,
            active: fieldData.active !== false,
          },
        });
      }
    }

    // Marcar como inactivos los campos que ya no están en el formulario
    // pero NO los eliminamos para preservar las relaciones con respuestas
    const fieldsToDeactivate = existingFields.filter(
      (field) => !processedFieldIds.has(field.id)
    );

    if (fieldsToDeactivate.length > 0) {
      await prisma.formField.updateMany({
        where: {
          id: {
            in: fieldsToDeactivate.map((field) => field.id),
          },
        },
        data: {
          active: false,
          updatedAt: new Date(),
        },
      });
    }

    console.log(`Formulario actualizado: ${form.id}`);

    return {
      status: "success",
      message: "Formulario actualizado correctamente",
      formId: form.id,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// Obtener un formulario por su ID
export async function getFormById(request: Request, formId: string) {
  try {
    const prisma = await getPrismaTenant(request);
    const form = await prisma.form.findUnique({
      where: { id: formId, active: true },
      include: {
        FormField: {
          where: { active: true },
          orderBy: { order: "asc" },
        },
      },
    });
    return form;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// Obtener los formularios
export async function getForms(request: Request, companyId: string) {
  try {
    const prisma = await getPrismaTenant(request);
    const forms = await prisma.form.findMany({
      where: { companyId, active: true },
      include: {
        FormField: {
          where: { active: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return forms;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// Eliminar un formulario
export async function deleteForm(request: Request, formId: string) {
  try {
    const prisma = await getPrismaTenant(request);
    const responsesCount = await prisma.formResponse.count({
      where: { formId },
    });

    if (responsesCount > 0) {
      return {
        success: "error",
        message:
          "No se puede eliminar el formulario porque tiene respuestas asociadas",
      };
    }

    const agentsCount = await prisma.agent.count({ where: { formId } });
    if (agentsCount > 0) {
      return {
        success: "error",
        message:
          "No se puede eliminar el formulario porque tiene agentes asociados",
      };
    }

    await prisma.formField.updateMany({
      where: { formId },
      data: { active: false },
    });
    await prisma.form.update({
      where: { id: formId },
      data: { active: false },
    });

    return {
      success: "success",
      message: "Formulario eliminado correctamente",
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
}
