import { redirect, type LoaderFunctionArgs } from "react-router";
import LoginForm from "~/components/auth/login";
import { isLogin, login } from "~/data/auth.server";
import type { Route } from "./+types/login";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Iniciar Sesión - Sizor" },
    {
      name: "description",
      content:
        "Inicia sesión en tu cuenta de Sizor para acceder a tu panel de automatización con IA. Gestiona tus agentes y conversaciones.",
    },
    {
      name: "keywords",
      content:
        "iniciar sesión Sizor, login, acceso cuenta, panel IA, gestión agentes",
    },
    { property: "og:title", content: "Iniciar Sesión - Sizor" },
    {
      property: "og:description",
      content:
        "Inicia sesión en tu cuenta de Sizor para acceder a tu panel de automatización con IA.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://sizor.com/auth/login" },
    // { property: "og:image", content: "https://sizor.com/images/og-login.jpg" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Iniciar Sesión - Sizor" },
    {
      name: "twitter:description",
      content:
        "Inicia sesión en tu cuenta de Sizor para acceder a tu panel de automatización con IA.",
    },
    // { name: "twitter:image", content: "https://sizor.com/images/og-login.jpg" },
  ];
}

export default function Route() {
  return <LoginForm />;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userIsLogin = await isLogin(request);
  if (userIsLogin) return redirect("/app/");
  return null;
}

export async function action({ request, params }: LoaderFunctionArgs) {
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );

  if (request.method === "POST") {
    try {
      return await login(formData);
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
