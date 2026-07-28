import type { LoaderFunctionArgs } from "react-router";
import { sendCodeForgotPassword } from "~/data/auth.server";

export async function action({ request, params }: LoaderFunctionArgs) {
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );

  if (request.method === "POST") {
    try {
      return await sendCodeForgotPassword(formData);
    } catch (error: any) {
      if (error?.status === 450) {
        return { message: error?.message || null };
      }
      return {
        message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      };
    }
  }

  return null;
}
