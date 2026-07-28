import bcrypt from "bcryptjs";
const { hash } = bcrypt;
import { getDateTime, getEscapedValue } from "~/lib/utils.functions";
import { executeAdminQuery, getPrismaTenant } from "~/data/database.server";
import {
  ROUTES_FOR_ENTERPRISE_LICENSE,
  ROUTES_FOR_NORMAL_LICENSE,
} from "~/lib/data";
import { getTenantId } from "./auth.server";
import { randomUUID } from "node:crypto";

export async function getUser(request: Request, userId: string) {
  try {
    const prisma = await getPrismaTenant(request);
    return await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
  } catch (error) {
    console.log(error);
    throw `Error al consultar el usuario: ${error}`;
  }
}

export async function getLayoutData(
  userId: string,
  companyId: string,
  request: Request
) {
  try {
    const prisma = await getPrismaTenant(request);
    const tenantId = await getTenantId(request);
    const user = await getUser(request, userId);
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
      },
      include: {
        plan: true,
      },
    });

    return {
      user,
      tenantId,
      company,
    };
  } catch (error) {
    console.log(error);
    throw `Error: ${error}`;
  }
}

export async function createUser(
  request: Request,
  formData: any,
  companyId: string
) {
  try {
    const prisma = await getPrismaTenant(request);
    const firstName = getEscapedValue(formData.firstName);
    const lastName = getEscapedValue(formData.lastName);
    const email = getEscapedValue(formData.email);
    let phone = getEscapedValue(formData?.phone);
    if (phone) phone = String(phone);
    let countryCode = null;
    if (phone?.length > 0) countryCode = getEscapedValue(formData?.countryCode);
    const country = getEscapedValue(formData.country);
    const password = getEscapedValue(formData.password);
    const license = await prisma.license.findFirst({});

    // Verificar si el usuario ya existe en firebase
    const existingUser = await executeAdminQuery(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    if (existingUser) {
      return {
        status: "error",
        message:
          "Ya existe un usuario con el correo electrónico proporcionado.",
      };
    }

    // Buscar usuario en la base de datos
    const userDb = await prisma.user.findFirst({
      where: {
        email,
      },
    });
    if (userDb) {
      return {
        status: "error",
        message:
          "Ya existe un usuario con el correo electrónico proporcionado.",
      };
    }

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        countryCode,
        country,
        password: await hash(password, 12),
        createdAt: getDateTime(),
        updatedAt: getDateTime(),
        nextPathSignup: null,
        routesAllowed: license?.isEnterprise
          ? ROUTES_FOR_ENTERPRISE_LICENSE
          : ROUTES_FOR_NORMAL_LICENSE,
      },
    });
    await prisma.userCompany.create({
      data: {
        userId: newUser.id,
        companyId,
      },
    });
    const tenantId = await getTenantId(request);

    await executeAdminQuery(
      `INSERT INTO users (email, tenantId) VALUES (?, ?)`,
      [email, tenantId]
    );

    await prisma.license.updateMany({
      data: {
        usersUsed: {
          increment: 1,
        },
      },
    });

    return {
      status: "success",
      message: "Usuario creado correctamente",
      user: newUser,
    };
  } catch (error) {
    console.log(error);

    return {
      status: "error",
      message: "Error al crear el usuario",
    };
  }
}

export async function getUsers(
  request: Request,
  userId: string,
  companyId: string
) {
  try {
    const prisma = await getPrismaTenant(request);
    return await prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },
        UserCompany: {
          some: {
            companyId,
          },
        },
      },
    });
  } catch (error) {
    console.log(error);
    throw `Error al consultar los usuarios: ${error}`;
  }
}

export async function getUserCompanies(request: Request, userId: string) {
  try {
    const prisma = await getPrismaTenant(request);
    return await prisma.userCompany.findMany({
      where: {
        userId,
      },
      include: {
        company: {
          include: {
            plan: true,
          },
        },
      },
    });
  } catch (error) {
    console.log(error);
    throw `Error al consultar las empresas del usuario: ${error}`;
  }
}

export async function updateUser(
  request: Request,
  formData: any,
  userId: string
) {
  try {
    const prisma = await getPrismaTenant(request);
    const firstName = getEscapedValue(formData.firstName);
    const lastName = getEscapedValue(formData.lastName);
    const email = getEscapedValue(formData.email);
    let phone = getEscapedValue(formData?.phone);
    if (phone) phone = String(phone);
    let countryCode = null;
    if (phone?.length > 0) countryCode = getEscapedValue(formData?.countryCode);
    const country = getEscapedValue(formData.country);
    const routesAllowed = getEscapedValue(formData.routesAllowed);

    // Obtener el usuario actual que se está editando
    const currentUser = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!currentUser) {
      return {
        status: "error",
        message: "Usuario no encontrado",
      };
    }

    // Verificar si el nuevo email ya existe en otro usuario
    const existingUserWithEmail = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId }, // Excluir el usuario actual
      },
    });

    if (existingUserWithEmail) {
      return {
        status: "error",
        message:
          "Ya existe un usuario con el correo electrónico proporcionado.",
      };
    }

    const tenantId = await getTenantId(request);
    const oldEmail = currentUser.email;
    const emailChanged = oldEmail !== email;

    // Si el email cambió, manejar la db admin
    if (emailChanged) {
      // Verificar si el nuevo email ya existe en la db admin
      const existingUserInFirebase = await executeAdminQuery(
        `SELECT * FROM users WHERE email = ? LIMIT 1`,
        [email]
      );
      if (existingUserInFirebase) {
        return {
          status: "error",
          message:
            "Ya existe un usuario con el correo electrónico proporcionado en Firebase.",
        };
      }

      // Crear nuevo registro en Firebase con el nuevo email
      await executeAdminQuery(
        `INSERT INTO users (email, tenantId) VALUES (?, ?)`,
        [email, tenantId]
      );

      // Eliminar el registro antiguo de Firebase (si existe)
      if (oldEmail) {
        const oldUserInFirebase = await executeAdminQuery(
          `SELECT * FROM users WHERE email = ? LIMIT 1`,
          [oldEmail]
        );
        if (oldUserInFirebase) {
          await executeAdminQuery(`DELETE FROM users WHERE id = ?`, [
            oldUserInFirebase.id,
          ]);
        }
      }
    } else {
      // Si el email no cambió, solo actualizar el registro existente en Firebase
      const existingUserInFirebase = await executeAdminQuery(
        `SELECT * FROM users WHERE email = ? LIMIT 1`,
        [email]
      );
      if (existingUserInFirebase) {
        await executeAdminQuery(
          `UPDATE users SET email = ?, tenantId = ? WHERE id = ?`,
          [email, tenantId, existingUserInFirebase.id]
        );
      }
    }

    // Actualizar usuario en la base de datos
    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        phone,
        countryCode,
        country,
        routesAllowed,
        updatedAt: getDateTime(),
      },
    });

    return {
      status: "success",
      message: "Usuario actualizado correctamente",
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      message: "Error al actualizar el usuario",
    };
  }
}
