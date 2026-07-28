import { redirect, type LoaderFunctionArgs } from "react-router";
import RegisterForm from "~/components/auth/signup";
import { APP_NAME } from "~/config/app";
import { isLogin, signup } from "~/data/auth.server";

export function meta({}) {
  return [
    { title: `Registro - ${APP_NAME}` },
    {
      name: "description",
      content:
        "Regístrate gratis en Sizor y comienza a automatizar tus conversaciones con IA. Planes desde $0. Conecta WhatsApp, Instagram y Facebook.",
    },
    {
      name: "keywords",
      content:
        "registro Sizor, crear cuenta, automatización IA, planes gratis, WhatsApp Instagram Facebook",
    },
    { property: "og:title", content: "Registro - Sizor" },
    {
      property: "og:description",
      content:
        "Regístrate gratis en Sizor y comienza a automatizar tus conversaciones con IA.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://sizor.com/auth/register" },
    // {
    //   property: "og:image",
    //   content: "https://sizor.com/images/og-register.jpg",
    // },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Registro - Sizor" },
    {
      name: "twitter:description",
      content:
        "Regístrate gratis en Sizor y comienza a automatizar tus conversaciones con IA.",
    },
    // {
    //   name: "twitter:image",
    //   content: "https://sizor.com/images/og-register.jpg",
    // },
  ];
}

export default function Route() {
  return <RegisterForm />;
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
      return await signup(formData);
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
