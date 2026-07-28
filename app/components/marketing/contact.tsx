import { VITE_EMAIL_CONTACT, PHONE_NUMBER_WHATSAPP } from "~/config/env";
import LayoutPagesMarketing from "./layout";
import { Calendar, Mail, Phone } from "lucide-react";
import useToast from "~/hooks/useToast";
import { useFetcher } from "react-router";
import { useEffect, useRef, useState } from "react";

export default function ContactUsPage() {
  const fetcher = useFetcher();
  const [loading, setLoading] = useState(false);
  const refForm = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const description = formData.get("description") as string;

    if (!name || name?.length < 3) {
      useToast({ icon: "error", title: "Ingresa un nombre válido" });
      return;
    }
    if (
      !email ||
      !email.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    ) {
      useToast({
        icon: "error",
        title: "Ingresa un correo electrónico válido",
      });
      return;
    }
    if (!description || description?.length < 10) {
      useToast({
        icon: "error",
        title: "Ingresa una descripción válida de al menos 10 caracteres",
      });
      return;
    }
    setLoading(true);
    fetcher.submit(
      { name, email, description },
      {
        method: "POST",
        action: "/contact",
      },
    );
  };

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher?.data?.sendEmail) {
        useToast({
          icon: "success",
          title:
            "Gracias por contactarnos, nos pondremos en contacto con usted lo antes posible.",
        });
        refForm?.current?.reset();
      } else {
        useToast({
          icon: "error",
          title:
            "Ocurrió un error al enviar el mensaje, por favor intente nuevamente.",
        });
      }
      setLoading(false);
    }
  }, [fetcher.data]);

  return (
    <LayoutPagesMarketing>
      <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
              <div className="@container">
                <div className="@[480px]:p-4">
                  <div
                    className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat @[480px]:gap-8 @[480px]:rounded-xl items-center justify-center p-4"
                    data-alt="Abstract blue and black digital pattern"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.7) 100%), url("/images/landing/background-about-us.png")',
                    }}
                  >
                    <div className="flex flex-col gap-2 text-center">
                      <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] @[480px]:text-5xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em] font-display">
                        Contáctanos
                      </h1>
                      <h2 className="text-white/80 text-sm font-normal leading-normal @[480px]:text-base @[480px]:font-normal @[480px]:leading-normal font-display">
                        Estamos aquí para responder a sus preguntas y explorar
                        cómo nuestras soluciones de IA pueden beneficiar a su
                        negocio.
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="flex flex-col">
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-5 font-display">
                      Contáctanos
                    </h2>
                    <p className="text-white/80 text-base font-normal leading-normal mb-6 font-display">
                      Complete el formulario y nos pondremos en contacto con
                      usted lo antes posible.
                    </p>
                    <form
                      ref={refForm}
                      className="space-y-4"
                      onSubmit={handleSubmit}
                    >
                      <div>
                        <label
                          htmlFor="name"
                          className="text-white/80 text-sm font-medium"
                        >
                          Nombre
                        </label>
                        <input
                          className="w-full bg-gray-900/30 border border-blue-500/20 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500 transition-all"
                          id="name"
                          name="name"
                          type="text"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="text-white/80 text-sm font-medium"
                        >
                          Correo electrónico
                        </label>
                        <input
                          className="w-full bg-gray-900/30 border border-blue-500/20 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500 transition-all"
                          id="email"
                          name="email"
                          type="email"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="description"
                          className="text-white/80 text-sm font-medium"
                        >
                          Descripción
                        </label>
                        <textarea
                          className="w-full bg-gray-900/30 border border-blue-500/20 rounded-md p-3 text-white h-32 resize-none focus:ring-blue-500 focus:border-blue-500 transition-all"
                          id="description"
                          name="description"
                        ></textarea>
                      </div>
                      <button
                        className="flex w-full min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-blue-500 text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-blue-500 transition-colors font-display"
                        type="submit"
                        disabled={loading}
                      >
                        <span className="truncate">
                          {loading ? "Enviando..." : "Enviar mensaje"}
                        </span>
                      </button>
                    </form>
                  </div>
                  <div className="flex flex-col pt-5">
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 md:pt-5 font-display">
                      Nuestra información
                    </h2>
                    <div className="space-y-6 mt-6">
                      <div className="flex items-start gap-4">
                        <div className="text-blue-500 mt-1">
                          <span className="material-symbols-outlined">
                            <Mail />
                          </span>
                        </div>
                        <div>
                          <h3 className="text-white text-lg font-bold">
                            Correo electrónico
                          </h3>
                          <p className="text-white/80">{VITE_EMAIL_CONTACT}</p>
                          <a
                            className="text-blue-500 hover:underline"
                            href={`mailto:${VITE_EMAIL_CONTACT}`}
                          >
                            Enviar un correo electrónico
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="text-blue-500 mt-1">
                          <span className="material-symbols-outlined">
                            <Phone />
                          </span>
                        </div>
                        <div>
                          <h3 className="text-white text-lg font-bold">
                            WhatsApp
                          </h3>
                          <p className="text-white/80">
                            +{PHONE_NUMBER_WHATSAPP}
                          </p>
                          <a
                            className="text-blue-500 hover:underline"
                            href={`https://wa.me/${PHONE_NUMBER_WHATSAPP}`}
                          >
                            Enviar un mensaje de WhatsApp
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="text-blue-500 mt-1">
                          <span className="material-symbols-outlined">
                            <Calendar />
                          </span>
                        </div>

                        <div>
                          <h3 className="text-white text-lg font-bold">
                            Horarios de atención
                          </h3>
                          <p className="text-white/80">
                            Lunes a Viernes: 08:00 AM - 06:00 PM
                          </p>
                          <p className="text-white/80">
                            Sábado: 09:00 AM - 01:00 PM
                          </p>
                          <p className="text-white/80">Domingo: Cerrado</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutPagesMarketing>
  );
}
