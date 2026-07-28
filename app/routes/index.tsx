import LandingPage from "~/components/marketing";

export function meta({}) {
  return [
    { title: "Sizor AI - Automatiza conversaciones con IA en redes sociales" },
    {
      name: "description",
      content:
        "Automatiza tus conversaciones en redes sociales con IA. Conecta WhatsApp, Instagram y Facebook. Respuestas automáticas inteligentes, inbox inteligente y escalado a agentes humanos.",
    },
    {
      name: "keywords",
      content:
        "IA, inteligencia artificial, automatización, redes sociales, WhatsApp, Instagram, Facebook, chatbot, atención al cliente, respuestas automáticas",
    },
    {
      property: "og:title",
      content: "Sizor AI - Automatiza conversaciones con IA",
    },
    {
      property: "og:description",
      content:
        "Automatiza tus conversaciones en redes sociales con IA. Ahorra tiempo, aumenta ventas y brinda servicio al cliente excepcional.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://sizor.com/" },
    // { property: "og:image", content: "https://sizor.com/images/og-home.jpg" },
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:title",
      content: "Sizor AI - Automatiza conversaciones con IA",
    },
    {
      name: "twitter:description",
      content:
        "Automatiza tus conversaciones en redes sociales con IA. Ahorra tiempo, aumenta ventas y brinda servicio al cliente excepcional.",
    },
    // { name: "twitter:image", content: "https://sizor.com/images/og-home.jpg" },
  ];
}

export default function index() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Sizor AI",
            description:
              "Automatiza tus conversaciones en redes sociales con IA. Conecta WhatsApp, Instagram y Facebook.",
            url: "https://sizor.com",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
              description: "Plan gratuito disponible",
            },
            featureList: [
              "Respuestas automáticas con IA",
              "Integración con WhatsApp, Instagram y Facebook",
              "Inbox inteligente",
              "Escalado a agentes humanos",
              "Catálogo de productos",
              "Agentes especializados",
            ],
            provider: {
              "@type": "Organization",
              name: "Sizor AI",
              url: "https://sizor.com",
            },
          }),
        }}
      />
      <LandingPage />
    </>
  );
}
