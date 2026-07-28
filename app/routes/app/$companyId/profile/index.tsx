import type { ActionFunctionArgs } from "react-router";
import ProfilePage from "~/components/app/profile";
import { requireUserSession, updateProfile } from "~/data/auth.server";

export default function Route() {
  return <ProfilePage />;
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserSession(request);
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );

  if (request.method === "POST") {
    try {
      return await updateProfile(request, formData, userId);
    } catch (error: any) {
      return {
        status: "error",
        message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      };
    }
  }
  return null;
}
