import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { useNProgress } from "./hooks/useNProgress";
import { APP_NAME } from "./config/app";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function meta({ location }: Route.MetaArgs) {
  const baseUrl = "https://sizor.cloud";

  const defaultMeta = [
    { title: `${APP_NAME} - Automatiza conversaciones con IA` },
    {
      name: "description",
      content:
        "Automatiza tus conversaciones en redes sociales con IA. Ahorra tiempo, aumenta ventas y brinda servicio al cliente excepcional con Sizor.",
    },
    {
      name: "keywords",
      content:
        "IA, inteligencia artificial, automatización, redes sociales, WhatsApp, Instagram, Facebook, chatbot, atención al cliente",
    },
    { name: "author", content: "Sizor" },
    { name: "robots", content: "index, follow" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "theme-color", content: "#3b82f6" },
    {
      name: "google-site-verification",
      content: "SsG1pZOQo58FntvS-Ke5k_6W8xn47dlWz4Z4zjlKIro",
    },

    { property: "og:type", content: "website" },
    { property: "og:site_name", content: APP_NAME },
    { property: "og:locale", content: "es_ES" },

    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: "@sizor" },

    { rel: "canonical", href: `${baseUrl}${location.pathname}` },
  ];

  const pathname = location.pathname;

  if (pathname === "/") {
    return [
      ...defaultMeta,
      {
        title: `${APP_NAME} - Automatiza conversaciones con IA en redes sociales`,
      },
      {
        name: "description",
        content:
          "Automatiza tus conversaciones en redes sociales con IA. Conecta WhatsApp, Instagram y Facebook. Respuestas automáticas inteligentes, inbox inteligente y escalado a agentes humanos.",
      },
      {
        property: "og:title",
        content: `${APP_NAME} - Automatiza conversaciones con IA`,
      },
      {
        property: "og:description",
        content:
          "Automatiza tus conversaciones en redes sociales con IA. Ahorra tiempo, aumenta ventas y brinda servicio al cliente excepcional.",
      },
      { property: "og:url", content: `${baseUrl}/` },
      // { property: "og:image", content: `${baseUrl}/images/og-home.jpg` },
      {
        name: "twitter:title",
        content: `${APP_NAME} - Automatiza conversaciones con IA`,
      },
      {
        name: "twitter:description",
        content:
          "Automatiza tus conversaciones en redes sociales con IA. Ahorra tiempo, aumenta ventas y brinda servicio al cliente excepcional.",
      },
      // { name: "twitter:image", content: `${baseUrl}/images/og-home.jpg` },
    ];
  }

  if (pathname === "/about-us") {
    return [
      ...defaultMeta,
      { title: `Quiénes Somos - ${APP_NAME}` },
      {
        name: "description",
        content:
          "Conoce a Sizor, desarrolladores de soluciones pioneras de IA para empresas. Innovación, integridad, colaboración y enfoque en el cliente.",
      },
      { property: "og:title", content: `Quiénes Somos - ${APP_NAME}` },
      {
        property: "og:description",
        content:
          "Conoce a Sizor, desarrolladores de soluciones pioneras de IA para empresas. Innovación, integridad, colaboración y enfoque en el cliente.",
      },
      { property: "og:url", content: `${baseUrl}/about-us` },
      // { property: "og:image", content: `${baseUrl}/images/og-about.jpg` },
      { name: "twitter:title", content: `Quiénes Somos - ${APP_NAME}` },
      {
        name: "twitter:description",
        content:
          "Conoce a Sizor, desarrolladores de soluciones pioneras de IA para empresas.",
      },
      // { name: "twitter:image", content: `${baseUrl}/images/og-about.jpg` },
    ];
  }

  if (pathname === "/contact") {
    return [
      ...defaultMeta,
      { title: `Contacto - ${APP_NAME}` },
      {
        name: "description",
        content:
          "Contáctanos para resolver tus dudas sobre automatización con IA. Email, WhatsApp y horarios de atención. Estamos aquí para ayudarte.",
      },
      { property: "og:title", content: `Contacto - ${APP_NAME}` },
      {
        property: "og:description",
        content:
          "Contáctanos para resolver tus dudas sobre automatización con IA. Email, WhatsApp y horarios de atención.",
      },
      { property: "og:url", content: `${baseUrl}/contact` },
      // { property: "og:image", content: `${baseUrl}/images/og-contact.jpg` },
      { name: "twitter:title", content: `Contacto - ${APP_NAME}` },
      {
        name: "twitter:description",
        content:
          "Contáctanos para resolver tus dudas sobre automatización con IA.",
      },
      // { name: "twitter:image", content: `${baseUrl}/images/og-contact.jpg` },
    ];
  }

  if (pathname === "/auth/register") {
    return [
      ...defaultMeta,
      { title: `Registro - ${APP_NAME}` },
      {
        name: "description",
        content:
          "Regístrate gratis en Sizor y comienza a automatizar tus conversaciones con IA. Planes desde $0. Conecta WhatsApp, Instagram y Facebook.",
      },
      { property: "og:title", content: `Registro - ${APP_NAME}` },
      {
        property: "og:description",
        content:
          "Regístrate gratis en Sizor y comienza a automatizar tus conversaciones con IA.",
      },
      { property: "og:url", content: `${baseUrl}/auth/register` },
      // { property: "og:image", content: `${baseUrl}/images/og-register.jpg` },
      { name: "twitter:title", content: `Registro - ${APP_NAME}` },
      {
        name: "twitter:description",
        content:
          "Regístrate gratis en Sizor y comienza a automatizar tus conversaciones con IA.",
      },
      // { name: "twitter:image", content: `${baseUrl}/images/og-register.jpg` },
    ];
  }

  if (pathname === "/auth/login") {
    return [
      ...defaultMeta,
      { title: `Iniciar Sesión - ${APP_NAME}` },
      {
        name: "description",
        content:
          "Inicia sesión en tu cuenta de Sizor para acceder a tu panel de automatización con IA. Gestiona tus agentes y conversaciones.",
      },
      { property: "og:title", content: `Iniciar Sesión - ${APP_NAME}` },
      {
        property: "og:description",
        content:
          "Inicia sesión en tu cuenta de Sizor para acceder a tu panel de automatización con IA.",
      },
      { property: "og:url", content: `${baseUrl}/auth/login` },
      // { property: "og:image", content: `${baseUrl}/images/og-login.jpg` },
      { name: "twitter:title", content: `Iniciar Sesión - ${APP_NAME}` },
      {
        name: "twitter:description",
        content:
          "Inicia sesión en tu cuenta de Sizor para acceder a tu panel de automatización con IA.",
      },
      // { name: "twitter:image", content: `${baseUrl}/images/og-login.jpg` },
    ];
  }

  // Para rutas no indexables, agregar noindex
  return [...defaultMeta, { name: "robots", content: "noindex, nofollow" }];
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [isMounted, setisMounted] = useState(false);

  useEffect(() => {
    setisMounted(true);
  }, []);

  return (
    <html lang="es" className="light" style={{ colorScheme: "light" }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />

        {/* --- Meta Pixel Code --- */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1575395070161447'); 
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1575395070161447&ev=PageView&noscript=1"
          />
        </noscript>
        {/* --- Fin Meta Pixel --- */}

        {/* --- Google Tag (gtag.js) --- */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17886465259"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-17886465259');
            `,
          }}
        />
        {/* --- Fin Google Tag --- */}
      </head>
      <body id="root">
        {/* Sonner Toaster */}
        {isMounted ? (
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontSize: "14px",
                padding: "12px 16px",
                minHeight: "48px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              },
              className: "custom-toast",
            }}
          />
        ) : null}
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  useNProgress();
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "Se produjo un error inesperado.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "No se pudo encontrar la página solicitada."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
