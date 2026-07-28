import AboutUsPage from "~/components/marketing/about-us";

export function meta({}) {
  return [
    { title: "Quiénes Somos - Sizor" },
    {
      name: "description",
      content:
        "Conoce a Sizor, desarrolladores de soluciones pioneras de IA para empresas. Innovación, integridad, colaboración y enfoque en el cliente.",
    },
    {
      name: "keywords",
      content:
        "Sizor, empresa IA, inteligencia artificial, desarrollo software, automatización, innovación, integridad, colaboración",
    },
    { property: "og:title", content: "Quiénes Somos - Sizor" },
    {
      property: "og:description",
      content:
        "Conoce a Sizor, desarrolladores de soluciones pioneras de IA para empresas. Innovación, integridad, colaboración y enfoque en el cliente.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://sizor.com/about-us" },
    // { property: "og:image", content: "https://sizor.com/images/og-about.jpg" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Quiénes Somos - Sizor" },
    {
      name: "twitter:description",
      content:
        "Conoce a Sizor, desarrolladores de soluciones pioneras de IA para empresas.",
    },
    // { name: "twitter:image", content: "https://sizor.com/images/og-about.jpg" },
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
            "@type": "AboutPage",
            name: "Quiénes Somos - Sizor",
            description:
              "Conoce a Sizor, desarrolladores de soluciones pioneras de IA para empresas.",
            url: "https://sizor.com/about-us",
            mainEntity: {
              "@type": "Organization",
              name: "Sizor",
              description:
                "Desarrollamos IA personalizada para resolver desafíos empresariales complejos",
              url: "https://sizor.com",
              foundingDate: "2025",
              mission:
                "Crear desarrollos de IA a medida que impulsen el crecimiento y la eficiencia empresarial",
              values: [
                "Innovación",
                "Integridad",
                "Colaboración",
                "Centrado en el cliente",
              ],
              areaServed: "Global",
              knowsAbout: [
                "Inteligencia Artificial",
                "Automatización",
                "Desarrollo de Software",
                "Redes Sociales",
                "Chatbots",
              ],
            },
          }),
        }}
      />
      <AboutUsPage />
    </>
  );
}
