import type { ActionFunctionArgs } from "react-router";
import { requireUserSession } from "~/data/auth.server";
import { getExistsSubdomain } from "~/data/multi-tenant.server";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserSession(request);
  try {
    if (request.method == "POST") {
      const data = await request.json();
      const subdomain = data?.subdomain;
      const exists = await getExistsSubdomain(subdomain);
      return {
        exists,
      };
    }
  } catch (error) {
    console.log(error);
  }
}
