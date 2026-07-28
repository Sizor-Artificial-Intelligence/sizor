import type { LoaderFunctionArgs } from "react-router";
import SignupCompany from "~/components/auth/signup/company";
import { APP_NAME } from "~/config/app";
import {
  requireUserSession,
  signupCompany,
  validateRouteSignup,
} from "~/data/auth.server";

export function meta({}) {
  return [{ title: `Registro empresa - ${APP_NAME}` }];
}

export default function Route() {
  return <SignupCompany />;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserSession(request);
  return await validateRouteSignup(request, userId, "/auth/signup/company/");
}

export async function action({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserSession(request);
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );

  if (request.method === "POST") {
    try {
      return await signupCompany(request, formData, userId);
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
