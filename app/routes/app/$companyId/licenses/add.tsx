import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import FormLicense from "~/components/app/licenses/form";
import { requireUserSession } from "~/data/auth.server";
import { createLicense } from "~/data/licenses.server";

export default function Route() {
  return <FormLicense />;
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserSession(
    request,
    params.companyId,
    "Enterprise"
  );
  return null;
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );

  if (request.method === "POST") {
    try {
      return await createLicense(request, formData);
    } catch (error: any) {
      if (error?.status === 450) {
        return {
          success: false,
          status: "error",
          message: error?.message || null,
        };
      }
      return {
        success: false,
        status: "error",
        message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      };
    }
  }

  return null;
}
