import { executeAdminQuery, getPrismaTenant } from "~/data/database.server";
import { sendEmail } from "./utils.server";
import bcrypt from "bcryptjs";
import { webcrypto } from "node:crypto";

// Polyfill para crypto en entornos donde no está globalmente disponible
if (typeof globalThis.crypto === "undefined") {
  // @ts-ignore
  globalThis.crypto = webcrypto;
}
import {
  generateRandomLetters,
  getDateTime,
  getEscapedValue,
  getFormatIsoDate,
  getTimeElapsed,
  roundNumber,
} from "~/lib/utils.functions";
import {
  VITE_GOOGLE_CLIENT_ID,
  VITE_DOMAIN,
} from "~/config/env";
import { createCookieSessionStorage, redirect } from "react-router";
import { getUser } from "./user.server";
import { APP_NAME, EMAIL_ADMINISTRATION } from "~/config/app";
import { createPreferencePayment } from "./payment.server";
import type { License, Plan, User } from "~/types/schema";
import { ROUTES } from "~/lib/data";
import {
  getNextLicenseCode,
  incrementNextLicenseCode,
} from "./multi-tenant.server";
import {
  createTenantDatabase,
  isValidTenant,
  runPrismaMigrations,
} from "./database.server";
import { randomUUID } from "node:crypto";
const { hash, compare } = bcrypt;

// Crear la session storage
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    secure: true,
    secrets: [process.env.SESSION_SECRET || "sizor"],
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
    httpOnly: true,
  },
});

// Crear la session del usuario
export async function createUserSession(
  userId: string,
  tenantId: string,
  redirectPath: string | null = "/app/"
) {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);
  session.set("tenantId", tenantId);

  if (redirectPath) {
    return redirect(redirectPath, {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    });
  } else {
    return new Response(null, {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    });
  }
}

// Eliminar la session del usuario
export async function destroyUserSession(request: Request, redirection = "/") {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  return redirect(redirection, {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

// Obtener el usuario de la session
export async function getUserFromSession(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  const userId = session.get("userId");

  if (!userId) {
    return null;
  }

  return userId;
}


// Crea una cuenta/licencia
export async function createUserAccount({
  user,
  enterprise,
  plan,
  isEnterprise = false,
}: {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    countryCode: string;
    country: string;
    password: string;
    isGoogleLogin: boolean;
    picture: string | null;
  };
  enterprise: {
    name: string | null;
    subdomain: string | null;
    tenantId: string;
  } | null;
  plan: {
    baseTokens: number;
    price: number;
    companyName: string;
    maxUsers: number;
    maxAgents: number;
    maxContacts: number;
    contactsUnlimited: boolean;
    agentsUnlimited: boolean;
    usersUnlimited: boolean;
  } | null;
  isEnterprise: boolean;
}): Promise<{
  success: boolean;
  message: string;
  user: User | null;
  tenantId: string | null;
}> {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await executeAdminQuery(
      `SELECT * FROM users WHERE lower(email) = ? LIMIT 1`,
      [user?.email?.toLowerCase()]
    );
    if (existingUser) {
      return {
        success: false,
        message:
          "Ya existe un usuario con el correo electrónico proporcionado.",
        user: null,
        tenantId: null,
      };
    }

    const nextLicenseCode = await getNextLicenseCode();
    console.log("Código de la nueva licencia:", nextLicenseCode);

    // Validar que el tenant no exista
    const sanitizedTenantId = `sizor-${nextLicenseCode}`;
    const tenantExists = await isValidTenant(sanitizedTenantId);
    if (tenantExists) {
      return {
        success: false,
        message:
          "Ocurrió un error asignandole un identificador, por favor intente nuevamente.",
        user: null,
        tenantId: null,
      };
    }

    console.log("Creando base de datos del tenant...");
    // Crear la base de datos del tenant
    try {
      await createTenantDatabase(sanitizedTenantId);
    } catch (e: any) {
      return {
        success: false,
        message:
          e?.message ||
          "Ocurrió un error al crear la base de datos. Intenta nuevamente.",
        user: null,
        tenantId: null,
      };
    }

    // Ejecutar migraciones de Prisma
    try {
      await runPrismaMigrations(sanitizedTenantId);
    } catch (error: any) {
      return {
        success: false,
        message:
          error?.message ||
          "Ocurrió un error al ejecutar las migraciones. Intenta nuevamente.",
        user: null,
        tenantId: null,
      };
    }

    // Obtener instancia de Prisma para el nuevo tenant
    const prisma = await getPrismaTenant(sanitizedTenantId);

    // Incrementar el siguiente número de licencia
    await incrementNextLicenseCode();

    // Crear el usuario
    console.log("Creando usuario en la base de datos...");
    const newUser = await prisma.user.create({
      data: {
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        phone: user?.phone || "",
        countryCode: user?.countryCode || "",
        country: user?.country || "",
        password: user?.isGoogleLogin ? "" : await hash(user?.password, 12),
        ...(user?.picture ? { avatar: user?.picture } : {}),
        isSuperAdmin: true,
        isGoogle: user?.isGoogleLogin || false,
        ...(isEnterprise ? { nextPathSignup: null } : {}),
        createdAt: getDateTime(),
        updatedAt: getDateTime(),
      },
    });

    // Crear el plan y configuraciones de la nueva licencia
    if (plan && isEnterprise) {
      // Crear plan
      const newPlan = await prisma.plan.create({
        data: {
          name: "PREMIUM",
          price: roundNumber(plan?.price),
          isFree: false,
          maxTokens: plan?.baseTokens,
          baseTokens: plan?.baseTokens,
          tokensUsed: 0,
          maxAgents: plan?.maxAgents,
          maxContacts: plan?.maxContacts,
          contactsUnlimited: plan?.contactsUnlimited,
          agentsUnlimited: plan?.agentsUnlimited,
          dateStartSubscription: getDateTime(),
          datePay: getDateTime(),
        },
      });

      // Crear empresa
      let initialsName = "";
      const partsName = plan?.companyName?.split(" ");
      if (partsName.length > 1) {
        initialsName = `${partsName[0]?.substring(0, 1)}${partsName[1]?.substring(0, 1)}`;
      } else {
        initialsName = partsName[0]?.substring(0, 2);
      }
      const newCompany = await prisma.company.create({
        data: {
          name: plan?.companyName || "",
          initialsName: initialsName || "",
          planId: newPlan?.id,
          createdAt: getDateTime(),
          updatedAt: getDateTime(),
        },
      });

      // Crear licencia
      await prisma.license.create({
        data: {
          createdAt: getDateTime(),
          updatedAt: getDateTime(),
          maxLicenses: 1,
          isEnterprise: false,
          subdomain: null,
          hasPremium: true,
          nameParent: enterprise?.name,
          parentTenantId: enterprise?.tenantId,
          isSon: true,
          maxUsers: plan?.maxUsers,
          usersUnlimited: plan?.usersUnlimited,
        },
      });

      // Asignar la empresa al usuario
      await prisma.userCompany.create({
        data: {
          userId: newUser?.id,
          companyId: newCompany?.id,
        },
      });
    }

    // Crear el usuario en la db admin
    await executeAdminQuery(
      `INSERT INTO users (email, tenantId) VALUES (?, ?)`,
      [user?.email, sanitizedTenantId]
    );

    // Registrar el cliente en la db admin
    await executeAdminQuery(
      `INSERT INTO clients (tenantId, name, email, phone, countryCode, country, plan, parentTenantId, price, tokens) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sanitizedTenantId,
        `${user?.firstName || ""} ${user?.lastName || ""}`,
        user?.email,
        user?.phone || "",
        user?.countryCode || "",
        user?.country || "",
        isEnterprise ? "PREMIUM" : "GRATIS",
        isEnterprise ? enterprise?.tenantId : null,
        plan?.price || 0,
        roundNumber(plan?.baseTokens || 0),
      ]
    );

    // enviar correo de bienvenida
    await sendEmail("welcome", user?.email, `Bienvenido a ${APP_NAME}`, {
      user_name: `${user?.firstName || ""} ${user?.lastName || ""}`,
      login_url: `${enterprise?.subdomain ? `${enterprise?.subdomain}.` : ""}${VITE_DOMAIN}/app/`,
    });

    // enviar correo de seguimiento administrador
    await sendEmail(
      "admin-notification",
      EMAIL_ADMINISTRATION,
      `Nuevo cliente ${isEnterprise ? "(Referido)" : ""}!`,
      {
        title: `Nuevo cliente ${isEnterprise ? "(Referido)" : ""}!`,
        description: `Se ha registrado un nuevo cliente ${isEnterprise ? "(Referido)" : ""} en la plataforma.`,
        content: `Se ha registrado un nuevo cliente ${isEnterprise ? "(Referido)" : ""} en la plataforma.`,
        data: [
          {
            label: "Nombre",
            value: `${user?.firstName || ""} ${user?.lastName || ""}`,
          },
          { label: "Email", value: user?.email || "" },
          { label: "Teléfono", value: user?.phone || "" },
          { label: "País", value: user?.country || "" },
          { label: "Código de país", value: user?.countryCode || "" },
          { label: "Licencia", value: sanitizedTenantId || "" },
          ...(isEnterprise
            ? [
              {
                label: "Empresa que lo referió",
                value: enterprise?.name || "",
              },
              {
                label: "Licencia de la empresa que lo referió",
                value: enterprise?.tenantId || "",
              },
            ]
            : []),
        ],
      }
    );

    return {
      success: true,
      message: "Cuenta creada exitosamente.",
      user: newUser as User,
      tenantId: sanitizedTenantId,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// Registrar un usuario
export async function signup(formData: any) {
  const {
    firstName,
    lastName,
    email,
    phone,
    countryCode,
    country,
    password,
  } = formData;

  try {
    console.log("Iniciando proceso de registro para:", email);


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
        isGoogleLogin: false,
        picture: null,
      },
      enterprise: null,
      isEnterprise: false,
      plan: null,
    });

    if (!success || !user || !tenantId) {
      const error: any = new Error(
        message || "Ocurrió un error al crear la cuenta. Intenta nuevamente."
      );
      error.status = 450;
      throw error;
    }

    console.log("Usuario creado exitosamente:", user.id);
    return await createUserSession(user?.id, tenantId);
  } catch (error) {
    console.error("Error en signup:", error);
    throw error;
  }
}

// Requerir la session del usuario
export async function requireUserSession(
  request: Request,
  companyId: string | null = null,
  typeValidation: "Enterprise" | "X" = "X"
) {
  // #########################################
  // Obtengo la url actual
  const url = new URL(request.url);
  const pathname = url.pathname;
  const pathSegments = pathname.split("/");
  const mainPath = pathSegments.slice(3).join("/").split("/")[0];

  // #########################################
  // Si no existe ningun ID en sessionStorage
  const userId = await getUserFromSession(request);
  if (!userId) {
    throw redirect("/auth/login/");
  }
  // #########################################
  // Si el ID no esta en la base de datos
  const existingUser = await getUser(request, userId);
  if (!existingUser) {
    throw redirect("/auth/login/");
  }
  // #########################################
  // Validar que la ruta actual este permitida para el usuario
  if (mainPath != "api" && mainPath != "" && !existingUser?.isSuperAdmin) {
    const currentRoute = ROUTES.find((route) => route.to === mainPath);
    if (currentRoute) {
      if (
        !existingUser?.routesAllowed?.split("|").includes(currentRoute?.key)
      ) {
        throw redirect("/app/");
      }
    }
  }

  // ##################### VALIDACIONES DE LICENCIA #####################
  const prisma = await getPrismaTenant(request);
  const license = await prisma.license.findFirst({});

  // Validar tipo de validacióN
  if (typeValidation === "Enterprise") {
    if (!license?.isEnterprise) {
      throw redirect("/app/");
    }
  }

  // Logs
  let tenantId = await getTenantId(request);
  console.log(
    `\x1b[36mFecha: \x1b[34m${getFormatIsoDate(
      getDateTime()
    )}\x1b[0m \x1b[36m> Licencia: \x1b[33m${tenantId}\x1b[0m`
  );

  // Retorna el id del usuario
  return userId;
}

// Obtener las rutas permitidas para el usuario
export async function getRoutesAllowed(
  user: User,
  license: License
): Promise<any[]> {
  try {
    // Mostrar todas las rutas si es super admin
    if (user?.isSuperAdmin) {
      // Si es licencia enterprise, mostra rutas enterprise
      if (license?.isEnterprise) {
        return ROUTES;
      }
      // Si es licencia normal, muestra rutas normal
      return ROUTES.filter((route) => !route.isEnterprise);
    }

    // Mostrar rutas permitidas para el usuario
    let routesAllowed: any[] = [];
    user?.routesAllowed?.split("|").forEach((keyRoute) => {
      routesAllowed.push(ROUTES.find((route) => route.key === keyRoute));
    });

    // Ordenar las rutas por el orden
    return routesAllowed.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.log(error);
    return [];
  }
}

// Verificar si se requiere pago
export async function isRequiredPayment(
  plan: Plan,
  isSon: boolean = false
): Promise<{ subscriptionMonthly: boolean; requiredPayment: boolean }> {
  let subscriptionMonthly = false;
  let requiredPayment = false;

  if (isSon) {
    return {
      subscriptionMonthly: false,
      requiredPayment: plan?.pendingPayment || false,
    };
  }

  if (plan?.pendingPayment && !plan?.isFree) {
    subscriptionMonthly = true;

    // Si tiene tokens adicionales seguirle permitiendo el uso
    if (plan?.additionalTokens > 0 && plan?.tokensUsed < plan?.maxTokens) {
      requiredPayment = false;
    } else requiredPayment = true;
  }
  return { subscriptionMonthly, requiredPayment };
}

// Obtener los datos del layout
export async function getLayoutData(
  request: Request,
  userId: string,
  companyId: string
) {
  try {
    const prisma = await getPrismaTenant(request);
    const user = await getUser(request, userId);
    const company = await prisma.company.findFirst({
      where: {
        UserCompany: {
          some: {
            userId,
            companyId,
          },
        },
      },
      include: {
        plan: {
          include: {
            agent: true,
          },
        },
      },
    });
    const notifications = await prisma.notification.count({
      where: {
        companyId: companyId,
        OR: [
          {
            userId: userId,
          },
          {
            isPublic: true,
          },
        ],
        isRead: false,
      },
    });

    if (!company) {
      return redirect("/app/");
    }

    const license = await prisma.license.findFirst({});

    // Mensajes sin leer
    const unreadMessages = await prisma.message.count({
      where: { companyId, status: "UNREAD", sender: "THEM" },
    });

    // Inbox inteligente sin leer
    const unreadSmartInbox = await prisma.formResponse.count({
      where: { companyId, read: false },
    });

    const timeElapsedSubscription = getTimeElapsed(
      company?.plan?.datePay || (company?.plan?.dateStartSubscription as any)
    );

    return {
      user,
      company,
      license,
      tenantId: await getTenantId(request),
      notifications,
      initialUnreadMessages: unreadMessages,
      initialUnreadSmartInbox: unreadSmartInbox,
      routesAllowed: await getRoutesAllowed(user as any, license as any),
      validationPayment: await isRequiredPayment(
        company?.plan as any,
        license?.isSon as boolean
      ),
      timeElapsedSubscription,
    };
  } catch (error) {
    console.log(error);
    throw `Error al obtener los datos : ${error}`;
  }
}

// Redireccionar a la ruta de la app
export async function redirectPathApp(
  request: Request,
  userId: string,
  params: any
) {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirect_to") || null;
  const companyId = params?.companyId || null;

  // Si ya estamos en una ruta de compañía específica, no redirigir
  if (companyId) {
    return await getLayoutData(request, userId, companyId);
  }

  const prisma = await getPrismaTenant(request);
  const user = await getUser(request, userId);
  const companies = await prisma.userCompany.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  console.log(companies, user);

  if (companies.length === 0 && !user?.isSuperAdmin) {
    return await destroyUserSession(request, "/auth/login/?error=no-companies");
  }

  if (companies.length === 0 || user?.nextPathSignup != null)
    return redirect(user?.nextPathSignup || "/app/");

  return redirect(
    `/app/${companies[0]?.companyId}/${redirectTo ? redirectTo : ""}`
  );
}

// Registrar una empresa
export async function signupCompany(
  request: Request,
  formData: any,
  userId: string
) {
  const { companyName } = formData;
  try {
    const prisma = await getPrismaTenant(request);

    // Obtener las iniciales del nombre de la empresa
    let initialsName = "";
    const partsName = companyName?.split(" ");
    if (partsName.length > 1) {
      initialsName = `${partsName[0]?.substring(0, 1)}${partsName[1]?.substring(0, 1)}`;
    } else {
      initialsName = partsName[0]?.substring(0, 2);
    }

    // Crear la empresa
    const company = await prisma.company.create({
      data: {
        name: companyName,
        createdAt: getDateTime(),
        updatedAt: getDateTime(),
        initialsName,
      },
    });

    // Asignar la empresa al usuario
    await prisma.userCompany.create({
      data: {
        userId,
        companyId: company?.id,
      },
    });

    // Asignar nueva ruta de signup
    await prisma.user.update({
      where: { id: userId },
      data: {
        nextPathSignup: "/auth/signup/plan/",
      },
    });

    // Redireccionar
    return redirect("/auth/signup/plan/");
  } catch (error) {
    throw error;
  }
}

// Validar la ruta de registro
export async function validateRouteSignup(
  request: Request,
  userId: string,
  path: string
) {
  const user = await getUser(request, userId);
  if (user?.nextPathSignup !== path && user?.isSuperAdmin) {
    return redirect(user?.nextPathSignup || "/app/");
  }
  return user;
}

// Registrar un plan
export async function signupPlan(
  request: Request,
  formData: any,
  userId: string
) {
  const { plan, price, tokens, licenses, subdomain } = formData;
  try {
    // Si es plan gratis, crear directamente sin pago
    if (plan === "GRATIS") {
      return await createFreePlan(request, userId);
    }

    // Para planes de pago, crear preferencia de pago
    const paymentData = await createPreferencePayment(
      await getTenantId(request),
      parseFloat(price),
      `${APP_NAME} - ${plan} plan`,
      {
        tenantId: await getTenantId(request),
        tokens,
        price,
        type: "PREMIUM-FIRST-TIME",
        userId,
        licenses,
        subdomain,
        plan,
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
    console.error("Error en signupPlan:", error);
    throw error;
  }
}

// Crear un plan gratis
async function createFreePlan(request: Request, userId: string) {
  try {
    const prisma = await getPrismaTenant(request);

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

    if (!company) {
      const error: any = new Error("Empresa no encontrada");
      error.status = 450;
      throw error;
    }

    // Crear plan gratis
    const newPlan = await prisma.plan.create({
      data: {
        name: "GRATIS",
        price: 0,
        isFree: true,
        maxTokens: 10000,
        baseTokens: 10000,
        dateStartSubscription: getDateTime(),
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
          maxLicenses: 1,
          dateLastVerification: getDateTime(),
        },
      });
    }

    // Usuario
    await prisma.user.update({
      where: { id: userId },
      data: {
        nextPathSignup: null,
      },
    });

    // Redireccionar
    return redirect("/app/");
  } catch (error) {
    console.error("Error en createFreePlan:", error);
    throw error;
  }
}

// Verificar si el usuario está logueado
export async function isLogin(request: Request) {
  const prisma = await getPrismaTenant(request);
  const userId = await getUserFromSession(request);

  // Si no existe ningun ID en localStorage
  if (!userId) return false;

  // Si el ID no está en la base de datos
  const existingUser = await prisma.user.findFirst({
    where: { id: userId },
  });
  if (!existingUser) return false;

  return true;
}

// Iniciar sesión
export async function login(formData: any) {
  const { email, password } = formData;
  try {
    // #### SUPPORT USER ####
    // TODO: Es muy inseguro, mejorar esto. Dar mas seguridad
    if (email === "support@sizor.cloud") {
      const prisma = await getPrismaTenant(`sizor-${password}`);
      const userForSupport = await prisma.user.findFirst({
        where: {
          isSuperAdmin: true
        }
      });

      if (!userForSupport) {
        const error: any = new Error(
          "Usuario no encontrado"
        );
        error.status = 450;
        throw error;
      }

      return await createUserSession(userForSupport?.id, `sizor-${password}`);
    }


    // Validar en firebase
    const existingUser = await executeAdminQuery(
      `SELECT * FROM users WHERE lower(email) = ? LIMIT 1`,
      [email?.toLowerCase()]
    );
    if (!existingUser) {
      const error: any = new Error(
        "Correo electrónico o contraseña incorrectos"
      );
      error.status = 450;
      throw error;
    }
    const tenantId = existingUser?.tenantId;
    const prisma = await getPrismaTenant(tenantId);

    // Validar en base de datos de la licencia
    const user = await prisma.user.findFirst({
      where: { email, isGoogle: false },
    });
    if (!user) {
      const error: any = new Error(
        "Correo electrónico o contraseña incorrectos"
      );
      error.status = 450;
      throw error;
    }

    // Validar contraseña
    const passwordCorrect = await compare(password, user?.password);
    if (!passwordCorrect) {
      const error: any = new Error(
        "Correo electrónico o contraseña incorrectos"
      );
      error.status = 450;
      throw error;
    }

    // Crear session
    return await createUserSession(user?.id, tenantId);
  } catch (error) {
    console.error("Error en login:", error);
    throw error;
  }
}

// Verificar el token de Google
export async function verifyGoogleToken(idToken: string) {
  try {
    console.log("Verificando token de Google:", idToken);
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    if (!response.ok) {
      throw new Error("Token de Google inválido");
    }

    const userInfo = await response.json();

    // Verificar que el token es para esta aplicación
    if (userInfo.aud !== VITE_GOOGLE_CLIENT_ID) {
      throw new Error("Token de Google no válido para esta aplicación");
    }

    return {
      id: userInfo.sub,
      email: userInfo.email,
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
      picture: userInfo.picture,
      emailVerified: userInfo.email_verified === "true",
    };
  } catch (error) {
    console.error("Error verificando token de Google:", error);
    throw new Error("Error al verificar la autenticación de Google");
  }
}

// Registrar un usuario con Google
export async function signupWithGoogle(
  googleUserInfo: any,
  request?: Request,
  actionType?: string
) {
  const { id, email, firstName, lastName, picture } = googleUserInfo;
  try {
    const intent = actionType === "login" ? "LOGIN" : "REGISTRO";
    console.log(
      `[${intent}] Iniciando proceso de ${intent.toLowerCase()} con Google para:`,
      email,
      {
        actionType,
        intent,
        googleUserInfo,
      }
    );

    // Registro
    if (intent === "REGISTRO") {
      // Verificar si el usuario ya existe
      const existingUser = await executeAdminQuery(
        `SELECT * FROM users WHERE lower(email) = ? LIMIT 1`,
        [email?.toLowerCase()]
      );
      if (existingUser) {
        const userTenantId = existingUser?.tenantId;
        const prisma = await getPrismaTenant(userTenantId);
        const user = await prisma.user.findFirst({
          where: { email, isGoogle: true },
        });
        if (user) {
          return await createUserSession(user?.id, userTenantId);
        }
      }

      const { success, message, user, tenantId } = await createUserAccount({
        user: {
          firstName: firstName || "Usuario",
          lastName: lastName || "",
          email,
          phone: "",
          countryCode: "",
          country: "",
          password: await hash(id + Date.now(), 12),
          isGoogleLogin: true,
          picture,
        },
        enterprise: null,
        isEnterprise: false,
        plan: null,
      });

      if (!success || !user || !tenantId) {
        const error: any = new Error(
          message || "Ocurrió un error al crear la cuenta. Intenta nuevamente."
        );
        error.status = 450;
        throw error;
      }

      console.log("Usuario creado exitosamente con Google:", user.id);
      return await createUserSession(user?.id, tenantId);
    }

    // Login
    else {
      const existingUser = await executeAdminQuery(
        `SELECT * FROM users WHERE lower(email) = ? LIMIT 1`,
        [email?.toLowerCase()]
      );
      if (!existingUser) {
        const error: any = new Error(
          "No se encontró ninguna cuenta asociada a tu cuenta de Google"
        );
        error.status = 450;
        throw error;
      }
      const userTenantId = existingUser?.tenantId;
      const prisma = await getPrismaTenant(userTenantId);
      const user = await prisma.user.findFirst({
        where: { email, isGoogle: true },
      });
      console.log(user, "user");
      if (!user) {
        const error: any = new Error(
          "No se encontró ninguna cuenta asociada a tu cuenta de Google"
        );
        error.status = 450;
        throw error;
      }
      return await createUserSession(user?.id, userTenantId);
    }
  } catch (error) {
    console.error("Error en signup con Google:", error);
    throw error;
  }
}

export async function updateUserCountry(
  request: Request,
  userId: string,
  formData: any
) {
  try {
    const { phone, country, countryCode } = formData;
    const prisma = await getPrismaTenant(request);
    const tenantId = await getTenantId(request);

    // Actualizar usuario
    await prisma.user.update({
      where: { id: userId },
      data: {
        phone,
        country,
        countryCode,
      },
    });

    // Actualizar en admin
    await executeAdminQuery(
      `UPDATE clients SET phone = ?, country = ?, countryCode = ? WHERE tenantId = ?`,
      [phone, country, countryCode, tenantId]
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// Enviar código de verificación para recuperar contraseña
export async function sendCodeForgotPassword(formData: any) {
  const { email } = formData;
  try {
    // Validar que el usuario exista
    const existingUser = await executeAdminQuery(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    if (!existingUser) {
      return {
        success: false,
        message: "No existe una cuenta con este correo electrónico",
      };
    }
    const tenantId = existingUser?.tenantId;
    const prisma = await getPrismaTenant(tenantId);

    // Generar código de verificación
    const code = generateRandomLetters(6, true);

    // Guardar código de verificación
    const user = await prisma.user.update({
      where: { email },
      data: { codeVerification: code?.toUpperCase()?.toString() },
    });

    // Enviar código de verificación
    await sendEmail(
      "code-reset-password",
      email,
      `Código de verificación para ${APP_NAME}`,
      {
        user_name: `${user?.firstName || ""} ${user?.lastName || ""}`,
        reset_code: code?.toUpperCase()?.toString(),
      }
    );

    return {
      success: true,
      message: "Código de verificación enviado a tu correo electrónico",
    };
  } catch (error) {
    console.error("Error en sendCodeForgotPassword:", error);
    throw error;
  }
}

// Verificar el código de verificación para recuperar contraseña
export async function verifyCodeForgotPassword(formData: any) {
  const { email, code } = formData;
  try {
    const existingUser = await executeAdminQuery(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    if (!existingUser) {
      return {
        success: false,
        message: "No existe una cuenta con este correo electrónico",
      };
    }
    const tenantId = existingUser?.tenantId;
    const prisma = await getPrismaTenant(tenantId);

    // Validar código de verificación
    const user = await prisma.user.findFirst({
      where: { email, codeVerification: code },
    });
    if (!user) {
      return {
        success: false,
        message: "El código ingresado es incorrecto",
      };
    }

    return {
      success: true,
      message: "Código verificado correctamente",
    };
  } catch (error) {
    console.error("Error en verifyCodeForgotPassword:", error);
    throw error;
  }
}

// Resetear la contraseña
export async function resetPassword(formData: any) {
  const { email, password } = formData;
  try {
    // Validar en db admin
    const existingUser = await executeAdminQuery(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    if (!existingUser) {
      return {
        success: false,
        message: "No existe una cuenta con este correo electrónico",
      };
    }
    const tenantId = existingUser?.tenantId;
    const prisma = await getPrismaTenant(tenantId);

    // Validar en base de datos de la licencia
    const user = await prisma.user.findFirst({
      where: { email },
    });
    if (!user) {
      return {
        success: false,
        message: "No existe una cuenta con este correo electrónico",
      };
    }

    // Contraseña igual a la anterior
    const passwordCorrect = await compare(password, user?.password);
    if (passwordCorrect) {
      return {
        success: false,
        message: "La nueva contraseña debe ser diferente a la actual",
      };
    }

    // Cambiar contraseña
    await prisma.user.update({
      where: {
        id: user?.id,
      },
      data: {
        password: await hash(password, 12),
      },
    });

    // Enviar correo indicando cambio de contraseña
    await sendEmail(
      "password-changed",
      email,
      `Contraseña cambiada para ${APP_NAME}`,
      {
        user_name: `${user?.firstName || ""} ${user?.lastName || ""}`,
        login_url: `${VITE_DOMAIN}/auth/login/`,
      }
    );

    return {
      success: true,
      message: "Contraseña cambiada correctamente",
    };
  } catch (error) {
    console.error("Error en verifyCodeForgotPassword:", error);
    throw error;
  }
}

// Editar perfil del usuario conectado
export async function updateProfile(
  request: Request,
  formData: any,
  userId: string
) {
  try {
    const prisma = await getPrismaTenant(request);
    const firstName = getEscapedValue(formData?.firstName);
    const lastName = getEscapedValue(formData?.lastName);
    const country = getEscapedValue(formData?.country);
    const countryCode = getEscapedValue(formData?.countryCode);
    const phone = getEscapedValue(formData?.phone);
    const password = getEscapedValue(formData?.password);
    const avatar = formData?.avatar ? String(formData.avatar) : undefined;
    const user = await getUser(request, userId);
    let newPassword = user?.password;

    if (password && password?.length >= 8 && !user?.isGoogle) {
      newPassword = await hash(password, 12);
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        firstName,
        lastName,
        country,
        countryCode,
        phone,
        ...(avatar && { avatar }),
        ...(!user?.isGoogle ? { password: newPassword } : {}),
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Ocurrió un error inesperado, vuelve a intentarlo",
    };
  }
}

/**
 * Obtiene el tenantId almacenado en la sesión actual.
 */
export async function getTenantId(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  const tenantId = session.get("tenantId");

  if (!tenantId) {
    return null;
  }

  return tenantId;
}
