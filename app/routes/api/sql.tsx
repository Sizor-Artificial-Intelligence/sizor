import type { LoaderFunctionArgs } from "react-router";
import { requireAuthAPI } from "~/data/utils.server";
import { getPrismaTenant } from "~/data/database.server";

export async function action({ request }: LoaderFunctionArgs) {
  await requireAuthAPI(request);
  try {
    if (request.method == "POST") {
      const formData: Record<any, any> = Object.fromEntries(
        await request.formData()
      );
      const sql = formData?.sql?.replace(/\r?\n/g, " ");
      const tenantId = formData?.tenantId;

      console.log(` Tenant -- ${tenantId} -- | Consulta SQL = ${sql}`);

      const prisma = await getPrismaTenant(tenantId);
      const response = await prisma.$queryRawUnsafe(sql);

      return {
        runScript: true,
        response,
      };
    }
  } catch (error) {
    return {
      runScript: false,
      response: null,
    };
  }
  return null;
}
