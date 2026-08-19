import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { spawn } from "child_process";
import { PrismaClient } from "@prisma/client";
import { NODE_ENV } from "~/config/env";
import { getTenantId } from "./auth.server";
dotenv.config();

/**
 * Separar host y puerto de DATABASE_HOST
 */
function splitHostPort(value: string): { host: string; port?: string } {
  const trimmed = value.trim();
  const lastColon = trimmed.lastIndexOf(":");
  if (lastColon === -1) {
    return { host: trimmed };
  }
  const portPart = trimmed.slice(lastColon + 1);
  if (!/^\d+$/.test(portPart)) {
    return { host: trimmed };
  }
  return { host: trimmed.slice(0, lastColon), port: portPart };
}

/**
 * Obtener configuración de la base de datos
 */
function getDbConfig() {
  const {
    DATABASE_USER,
    DATABASE_PASSWORD,
    DATABASE_HOST,
    DATABASE_PORT,
    DEFAULT_DATABASE,
    DATABASE_ADMIN,
  } = process.env;

  let host = DATABASE_HOST || "127.0.0.1";
  let port = DATABASE_PORT || "3306";

  // Evitar IPv6 ::1 al usar localhost
  if (host === "localhost") {
    host = "127.0.0.1";
  }

  const parsed = splitHostPort(host);
  host = parsed.host;
  if (parsed.port) {
    port = parsed.port;
  }

  return {
    user: DATABASE_USER || "root",
    password: DATABASE_PASSWORD || "",
    host,
    port,
    defaultDatabase: DEFAULT_DATABASE || "sizor-0001",
    adminDatabase: DATABASE_ADMIN || "sizor-admin",
  };
}

/**
 * Obtener URL de conexión MySQL para Prisma
 */
export function getBaseDatabaseUrl(tenantId?: string) {
  const config = getDbConfig();
  const user = encodeURIComponent(config.user);
  const password = encodeURIComponent(config.password);
  const database = tenantId || config.defaultDatabase;
  return `mysql://${user}:${password}@${config.host}:${config.port}/${database}`;
}

/**
 * Verifica si el tenant es válido
 */
export async function isValidTenant(tenantId: string): Promise<boolean> {
  const sanitizedTenant = tenantId?.trim();

  if (!sanitizedTenant || sanitizedTenant.length < 4) {
    return false;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedTenant)) {
    return false;
  }

  if (!getBaseDatabaseUrl()) {
    console.error("DATABASE_URL no está configurado");
    return false;
  }

  let connection: mysql.Connection | null = null;

  try {
    const config = getDbConfig();
    const urlString = getBaseDatabaseUrl();
    const tenantUrl = new URL(urlString);
    tenantUrl.pathname = `/${sanitizedTenant}`;
    tenantUrl.search = "";

    console.log(`Validando conexión a base de datos... Host: ${config.host}, Database: ${sanitizedTenant}`);

    connection = await mysql.createConnection(tenantUrl.toString());
    await connection.ping();
    console.log(`Conexión exitosa a ${sanitizedTenant}`);
    return true;
  } catch (error: any) {
    const config = getDbConfig();
    // Si la base de datos no existe, es un comportamiento esperado en validación
    if (error?.code === 'ER_BAD_DB_ERROR' || error?.message?.includes("Unknown database")) {
      console.log(`La base de datos ${sanitizedTenant} no existe aún (comportamiento esperado)`);
    } else {
      console.error("Error inesperado validando tenant", {
        tenantId: sanitizedTenant,
        host: config.host,
        error: error?.message || String(error),
        code: error?.code,
      });
    }
    return false;
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {}
    }
  }
}

/**
 * Verifica si un tenantId está disponible (la base de datos NO existe)
 */
async function isTenantAvailable(tenantId: string): Promise<boolean> {
  const sanitizedTenant = tenantId?.trim();

  if (!sanitizedTenant || sanitizedTenant.length < 4) {
    return false;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedTenant)) {
    return false;
  }

  if (!getBaseDatabaseUrl()) {
    console.error("DATABASE_URL no está configurado");
    return false;
  }

  let connection: mysql.Connection | null = null;

  try {
    const tenantUrl = new URL(getBaseDatabaseUrl());
    tenantUrl.pathname = `/${sanitizedTenant}`;
    tenantUrl.search = "";

    // Intentar conectar a la base de datos
    connection = await mysql.createConnection(tenantUrl.toString());
    await connection.ping();
    // Si la conexión es exitosa, la base de datos existe, por lo tanto NO está disponible
    return false;
  } catch (error: any) {
    // Si hay un error de conexión (especialmente "Unknown database"), significa que NO existe
    // y por lo tanto está disponible
    if (
      error?.code === "ER_BAD_DB_ERROR" ||
      error?.message?.includes("Unknown database")
    ) {
      return true;
    }
    // Para otros errores, asumimos que no está disponible por seguridad
    console.warn("Error verificando disponibilidad de tenant", {
      tenantId: sanitizedTenant,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {}
    }
  }
}

/**
 * Encuentra un tenantId disponible, generando variaciones si es necesario
 */
export async function findAvailableTenantId(
  baseTenantId: string
): Promise<string> {
  const sanitizedBase = baseTenantId?.trim();

  if (!sanitizedBase || sanitizedBase.length < 4) {
    throw new Error("El tenant ID base debe tener al menos 4 caracteres");
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedBase)) {
    throw new Error(
      "El tenant ID solo puede contener letras, números, guiones bajos y guiones"
    );
  }

  // Primero intentar con el ID base
  const baseAvailable = await isTenantAvailable(sanitizedBase);
  if (baseAvailable) {
    return sanitizedBase;
  }

  // Si no está disponible, generar variaciones
  let counter = 1;
  const maxAttempts = 9999; // Límite de seguridad

  while (counter <= maxAttempts) {
    // Formatear el contador con ceros a la izquierda (0001, 0002, etc.)
    const suffix = counter.toString().padStart(4, "0");

    // Limitar la longitud total del tenantId a 30 caracteres
    let candidate = sanitizedBase;
    if (candidate.length + suffix.length + 1 > 30) {
      // Si es muy largo, truncar el base para dejar espacio para el sufijo
      const maxBaseLength = 30 - suffix.length - 1; // -1 para el guión
      candidate = candidate.substring(0, maxBaseLength);
      // Asegurar que no termine en guión
      candidate = candidate.replace(/-+$/, "");
    }

    const candidateId = `${candidate}-${suffix}`;

    const available = await isTenantAvailable(candidateId);
    if (available) {
      return candidateId;
    }

    counter++;
  }

  throw new Error(
    "No se pudo encontrar un tenant ID disponible después de múltiples intentos"
  );
}

/**
 * Crea una nueva base de datos para un tenant
 */
export async function createTenantDatabase(tenantId: string): Promise<boolean> {
  const sanitizedTenant = tenantId?.trim();

  if (!sanitizedTenant || sanitizedTenant.length < 4) {
    throw new Error("El tenant ID debe tener al menos 4 caracteres");
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedTenant)) {
    throw new Error(
      "El tenant ID solo puede contener letras, números, guiones bajos y guiones"
    );
  }

  const baseUrl = getBaseDatabaseUrl();

  let connection: mysql.Connection | null = null;

  try {
    const config = getDbConfig();
    // Conectar al servidor MySQL sin especificar base de datos
    const serverUrl = new URL(baseUrl);
    serverUrl.pathname = "/";
    serverUrl.search = "";

    console.log(`Intentando crear base de datos '${sanitizedTenant}' en host '${config.host}'...`);

    connection = await mysql.createConnection(serverUrl.toString());

    // Crear la base de datos
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${sanitizedTenant}\``
    );

    console.log(`Base de datos '${sanitizedTenant}' creada exitosamente.`);
    await connection.end();
    return true;
  } catch (error: any) {
    const config = getDbConfig();
    console.error("Error creando base de datos de tenant", {
      tenantId: sanitizedTenant,
      host: config.host,
      error: error?.message || String(error),
      code: error?.code,
    });
    if (connection) {
      try {
        await connection.end();
      } catch {}
    }
    throw new Error(
      error?.message || "Error al crear la base de datos del tenant"
    );
  }
}

/**
 * Ejecutar migraciones de Prisma para un tenant
 */
export async function runPrismaMigrations(tenantId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const baseUrl = getBaseDatabaseUrl(tenantId);
    const command = process.platform === "win32" ? "npx.cmd" : "npx";
    const args = [
      "prisma",
      "migrate",
      "deploy",
      "--schema",
      "prisma/schema.prisma",
    ];

    const child = spawn(command, args, {
      stdio: "pipe",
      env: {
        ...process.env,
        DATABASE_URL: baseUrl,
        VITE_DATABASE_URL: baseUrl,
      },
      shell: process.platform === "win32",
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `prisma migrate deploy finalizó con código ${code}. ${stderr || stdout}`
          )
        );
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

// Cache de instancias de PrismaClient por tenant
const prismaClients = new Map<string, PrismaClient>();

// Cliente Prisma para la base de datos administrativa (singleton)
let adminPrismaClient: PrismaClient | null = null;

// Bandera para saber si ya registramos los handlers de shutdown
let shutdownHandlersRegistered = false;

// Registrar handlers de shutdown una sola vez
function registerShutdownHandlers() {
  if (shutdownHandlersRegistered || typeof process === "undefined") {
    return;
  }

  shutdownHandlersRegistered = true;

  const shutdown = async () => {
    await disconnectAllPrismaClients();
  };

  process.once("beforeExit", shutdown);
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

/**
 * Obtiene la instancia de PrismaClient para el tenant especificado.
 */
export async function getPrismaTenant(
  request: Request | string | null | undefined
): Promise<PrismaClient> {
  try {
    let tenantId: string;
    if (typeof request === "string") {
      if (!request) {
        throw new Error("TenantId cannot be empty");
      }
      tenantId = request;
    } else if (!request) {
      throw new Error("Request or tenantId is required for getPrismaTenant");
    } else {
      tenantId = await getTenantId(request);
    }

    // Si ya existe una instancia para este tenant, reutilizarla
    if (prismaClients.has(tenantId)) {
      const existingClient = prismaClients.get(tenantId);
      if (existingClient) {
        return existingClient;
      }
    }

    // Crear nueva instancia solo si no existe
    const databaseUrl = getBaseDatabaseUrl(tenantId);
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

    // Almacenar en cache
    prismaClients.set(tenantId, prisma);

    // Registrar handlers de shutdown (solo una vez)
    registerShutdownHandlers();

    return prisma;
  } catch (error) {
    console.error("Error creando prisma tenant", {
      tenantId: typeof request === "string" ? request : "unknown",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Desconectar todos los clientes
export async function disconnectAllPrismaClients(): Promise<void> {
  const disconnectPromises = Array.from(prismaClients.values()).map((client) =>
    client.$disconnect().catch((err) =>
      console.error("Error desconectando cliente Prisma", {
        error: err.message,
      })
    )
  );

  // Desconectar también el cliente administrativo si existe
  if (adminPrismaClient) {
    disconnectPromises.push(
      adminPrismaClient.$disconnect().catch((err) =>
        console.error("Error desconectando cliente Prisma admin", {
          error: err.message,
        })
      )
    );
  }

  await Promise.all(disconnectPromises);
  prismaClients.clear();
  adminPrismaClient = null;
}

/**
 * Obtiene la instancia de PrismaClient para la base de datos administrativa (singleton).
 */
function getAdminPrismaClient(): PrismaClient {
  const config = getDbConfig();

  // Si ya existe una instancia, reutilizarla
  if (adminPrismaClient) {
    return adminPrismaClient;
  }

  // Crear nueva instancia solo si no existe
  console.log(`Iniciando Prisma Admin Client para base de datos: ${config.adminDatabase} en host: ${config.host}`);
  const databaseUrl = getBaseDatabaseUrl(config.adminDatabase);
  adminPrismaClient = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // Registrar handlers de shutdown (solo una vez)
  registerShutdownHandlers();

  return adminPrismaClient;
}

/**
 * Ejecuta consultas a la base de datos administrativa.
 */
export async function executeAdminQuery(
  query: string,
  params: any[] = [],
  isArray: boolean = false
): Promise<any> {
  const prisma = getAdminPrismaClient();
  try {
    const result = await prisma.$queryRawUnsafe(query, ...params);
    if (isArray) {
      return result || [];
    } else {
      if (Array.isArray(result)) {
        return result[0] || null;
      } else {
        return result || null;
      }
    }
  } catch (error) {
    console.error("Error ejecutando consulta administrativa", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
