import { randomUUID } from "node:crypto";
import { getDateTime } from "~/lib/utils.functions";
import { executeAdminQuery } from "~/data/database.server";

// Obtener la siguiente codigo de licencia
export async function getNextLicenseCode(): Promise<string> {
  try {
    const res = await executeAdminQuery(
      `SELECT nextLicenseCode FROM config LIMIT 1`
    );
    return res?.nextLicenseCode || "0001";
  } catch (error) {
    console.log(error);
    throw `Error al buscar la siguiente licencia: ${error}`;
  }
}

// Incrementar el siguiente codigo de licencia
export async function incrementNextLicenseCode(): Promise<void> {
  try {
    const currentCode = await getNextLicenseCode();
    const nextCode = (parseInt(currentCode) + 1).toString().padStart(4, "0");
    await executeAdminQuery(`UPDATE config SET nextLicenseCode = ?`, [
      nextCode,
    ]);
  } catch (error) {
    console.log(error);
    throw `Error al incrementar el siguiente codigo de licencia: ${error}`;
  }
}

// Crear subdominio
export async function createSubdomain(
  subdomain: string,
  tenantId: string
): Promise<void> {
  try {
    await executeAdminQuery(
      `INSERT INTO subdomains (subdomain, tenantId) VALUES (?, ?)`,
      [subdomain, tenantId]
    );
  } catch (error) {
    console.log(error);
    throw `Error al crear el subdominio: ${error}`;
  }
}

// Validar si un subdominio existe
export async function getExistsSubdomain(subdomain: string): Promise<boolean> {
  try {
    const NOT_ALLOWED_SUBDOMAINS = ["www", "admin", "api", "app", "dashboard"];
    if (NOT_ALLOWED_SUBDOMAINS.includes(subdomain)) {
      return true;
    }
    const res = await executeAdminQuery(
      `SELECT id FROM subdomains WHERE subdomain = ?`,
      [subdomain]
    );
    return res?.id ? true : false;
  } catch (error) {
    console.log(error);
    throw `Error al validar si el subdominio existe: ${error}`;
  }
}
