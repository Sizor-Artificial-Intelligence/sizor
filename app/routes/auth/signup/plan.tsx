import type { LoaderFunctionArgs } from "react-router";
import SignupPlan from "~/components/auth/signup/plan";
import {
  requireUserSession,
  signupPlan,
  validateRouteSignup,
} from "~/data/auth.server";

export default function Route() {
  return <SignupPlan />;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserSession(request);
  return await validateRouteSignup(request, userId, "/auth/signup/plan/");
}

export async function action({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserSession(request);
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );

  if (request.method === "POST") {
    try {
      return await signupPlan(request, formData, userId);
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
