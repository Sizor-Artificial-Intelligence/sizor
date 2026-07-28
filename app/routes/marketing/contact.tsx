import ContactUsPage from "~/components/marketing/contact";
import { EMAIL_SUPPORT } from "~/config/app";
import { VITE_EMAIL_CONTACT, PHONE_NUMBER_WHATSAPP } from "~/config/env";
import { sendEmail } from "~/data/utils.server";

export function meta({}) {
  return [
    { title: "Contacto - Sizor" },
    {
      name: "description",
      content:
        "Contáctanos para resolver tus dudas sobre automatización con IA. Email, WhatsApp y horarios de atención. Estamos aquí para ayudarte.",
    },
    {
      name: "keywords",
      content:
        "contacto Sizor, soporte técnico, ayuda IA, automatización, WhatsApp, email contacto",
    },
    { property: "og:title", content: "Contacto - Sizor" },
    {
      property: "og:description",
      content:
        "Contáctanos para resolver tus dudas sobre automatización con IA. Email, WhatsApp y horarios de atención.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://sizor.com/contact" },
    // {
    //   property: "og:image",
    //   content: "https://sizor.com/images/og-contact.jpg",
    // },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Contacto - Sizor" },
    {
      name: "twitter:description",
      content:
        "Contáctanos para resolver tus dudas sobre automatización con IA.",
    },
    // {
    //   name: "twitter:image",
    //   content: "https://sizor.com/images/og-contact.jpg",
    // },
  ];
}

export default function Route() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: "Contacto - Sizor",
            description:
              "Contáctanos para resolver tus dudas sobre automatización con IA",
            url: "https://sizor.com/contact",
            mainEntity: {
              "@type": "Organization",
              name: "Sizor",
              url: "https://sizor.com",
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  telephone: `+${PHONE_NUMBER_WHATSAPP}`,
                  contactType: "customer service",
                  availableLanguage: "Spanish",
                  areaServed: "AR",
                },
                {
                  "@type": "ContactPoint",
                  email: EMAIL_SUPPORT,
                  contactType: "customer service",
                  availableLanguage: "Spanish",
                },
              ],
              openingHours: ["Mo-Fr 08:00-18:00", "Sa 09:00-13:00"],
              sameAs: [`https://wa.me/${PHONE_NUMBER_WHATSAPP}`],
            },
          }),
        }}
      />
      <ContactUsPage />
    </>
  );
}

export async function action({ request }: { request: Request }) {
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData(),
  );

  if (request.method === "POST") {
    try {
      return {
        sendEmail: await sendEmail(
          "contact",
          VITE_EMAIL_CONTACT,
          "Contacto",
          formData,
        ),
      };
    } catch (error: any) {
      return { message: error?.message || null };
    }
  }
}
