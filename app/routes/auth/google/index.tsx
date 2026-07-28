import { redirect, type ActionFunctionArgs } from "react-router";
import { verifyGoogleToken, signupWithGoogle } from "~/data/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const idToken = formData.get("idToken") as string;
  const actionType = formData.get("actionType") as string; // "login" o "signup"

  if (!idToken) {
    return { message: "Token de Google requerido" };
  }

  try {
    // Verificar el token de Google
    const googleUserInfo = await verifyGoogleToken(idToken);
    console.log(googleUserInfo, "googleUserInfo");

    // Registrar o hacer login con Google
    return await signupWithGoogle(googleUserInfo, request, actionType);
  } catch (error: any) {
    console.error("Error en autenticación con Google:", error);
    return {
      message: error?.message || "Error al autenticar con Google",
    };
  }
}
