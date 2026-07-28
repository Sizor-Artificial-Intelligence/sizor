import type { ActionFunctionArgs } from "react-router";
import FormUser from "~/components/app/users/form";
import { createUser } from "~/data/user.server";

export default function Route() {
  return <FormUser />;
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { companyId }: any = params;
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );

  if (request.method === "POST") {
    try {
      return await createUser(request, formData, companyId);
    } catch (error: any) {
      if (error?.status === 450) {
        return {
          status: "error",
          message: error?.message || null,
        };
      }
      return {
        status: "error",
        message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      };
    }
  }
  return null;
}
