import React from "react";
import LayoutPagesMarketing from "./layout";
import { Mail } from "lucide-react";
import { VITE_EMAIL_CONTACT } from "~/config/env";

export default function PrivacyPolicyPage() {
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
                        "linear-gradient(rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.7) 100%), url('/images/landing/background-about-us.png')",
                    }}
                  >
                    <div className="flex flex-col gap-2 text-center">
                      <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] @[480px]:text-5xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em] font-display">
                        Política de Privacidad
                      </h1>
                      <h2 className="text-white/80 text-sm font-normal leading-normal @[480px]:text-base @[480px]:font-normal @[480px]:leading-normal font-display">
                        Tu confianza es importante para nosotros. Aquí te
                        explicamos cómo protegemos tus datos.
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-10">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 font-display">
                      Recopilación de Datos
                    </h2>
                    <p className="text-white/80 text-base font-normal leading-normal font-display">
                      Recopilamos la información que nos proporciona
                      directamente, por ejemplo, cuando crea una cuenta,
                      completa un formulario o se comunica con nosotros. Esto
                      puede incluir su nombre, dirección de correo electrónico y
                      cualquier otra información que nos proporcione. También
                      recopilamos datos anónimos relacionados con el uso que
                      hace de nuestros servicios, como información del
                      dispositivo y estadísticas de uso, para mejorar nuestra
                      oferta.
                    </p>
                  </div>
                  <div>
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 font-display">
                      Uso de Datos
                    </h2>
                    <p className="text-white/80 text-base font-normal leading-normal font-display">
                      Los datos que recopilamos se utilizan para proporcionar,
                      mantener y mejorar nuestros servicios. Esto incluye
                      personalizar su experiencia, comunicarnos con usted y
                      desarrollar nuevas funciones. Nos comprometemos a utilizar
                      sus datos de forma responsable y no los utilizaremos para
                      fines distintos a los descritos en esta política.
                    </p>
                  </div>
                  <div>
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 font-display">
                      Protección de Datos
                    </h2>
                    <p className="text-white/80 text-base font-normal leading-normal font-display">
                      Implementamos diversas medidas de seguridad para mantener
                      la seguridad de su información personal. Sus datos se
                      almacenan en servidores seguros y utilizamos cifrado para
                      protegerlos durante la transmisión. El acceso a sus datos
                      personales está restringido exclusivamente al personal
                      autorizado.
                    </p>
                  </div>
                  <div>
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 font-display">
                      Compartición de Datos
                    </h2>
                    <p className="text-white/80 text-base font-normal leading-normal font-display">
                      No vendemos, intercambiamos ni transferimos de ningún otro
                      modo su información personal identificable a terceros.
                      Esto no incluye a terceros de confianza que nos ayudan a
                      operar nuestro sitio web o a dirigir nuestro negocio,
                      siempre que dichas partes se comprometan a mantener la
                      confidencialidad de esta información. También podemos
                      divulgar su información cuando consideremos que es
                      necesario para cumplir con la ley.
                    </p>
                  </div>
                  <div>
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 font-display">
                      Sus derechos
                    </h2>
                    <p className="text-white/80 text-base font-normal leading-normal font-display">
                      Tiene derecho a acceder, actualizar o eliminar su
                      información personal en cualquier momento. Puede hacerlo
                      iniciando sesión en su cuenta o contactándonos
                      directamente. Responderemos a su solicitud lo antes
                      posible.
                    </p>
                  </div>
                  <div className="border-t border-blue-500/20 pt-8 mt-8">
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 font-display">
                      Contacto para inquietudes sobre privacidad
                    </h2>
                    <p className="text-white/80 text-base font-normal leading-normal mb-4 font-display">
                      Si tiene alguna pregunta o inquietud sobre nuestra
                      política de privacidad o los datos que tenemos sobre
                      usted, no dude en contactarnos.
                    </p>
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
