import type { LoaderFunctionArgs } from "react-router";
import { requireUserSession } from "~/data/auth.server";
import { getPrismaTenant } from "~/data/database.server";

export async function action({ request }: LoaderFunctionArgs) {
  const userId = await requireUserSession(request);
  try {
    if (request.method == "POST") {
      const data = await request.json();
      const sql = data?.sql?.replace(/\r?\n/g, " ");
      const isArray = data?.isArray;
      const prisma = await getPrismaTenant(request);
      let response: any = await prisma.$queryRawUnsafe(sql);
      if (!isArray) response = response[0];

      return {
        runScript: true,
        response,
      };
    }
  } catch (error) {
    console.log(error);
    return {
      runScript: false,
      response: null,
    };
  }
  return null;
}
