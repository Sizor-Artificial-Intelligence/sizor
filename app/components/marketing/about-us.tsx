import { Headset, Lightbulb, UserCheck, Users } from "lucide-react";
import LayoutPagesMarketing from "./layout";
import { Link } from "react-router";

export default function AboutUsPage() {
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
                        Soluciones pioneras de IA para las empresas del futuro
                      </h1>
                      <h2 className="text-white/80 text-sm font-normal leading-normal @[480px]:text-base @[480px]:font-normal @[480px]:leading-normal font-display">
                        Desarrollamos IA personalizada para resolver tus
                        desafíos más complejos.
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-10">
                <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-5 font-display">
                  Nuestra Misión
                </h2>
                <p className="text-white/80 text-base font-normal leading-normal font-display">
                  Nuestra misión es crear desarrollos de IA a medida que
                  impulsen el crecimiento y la eficiencia empresarial. Nos
                  dedicamos a brindar soluciones innovadoras y eficaces que
                  satisfagan las necesidades únicas de nuestros clientes,
                  ayudándolos a navegar por las complejidades de la era digital
                  y alcanzar sus objetivos estratégicos.
                </p>
              </div>
              <div className="px-4 py-10">
                <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6 pt-5 font-display">
                  Nuestros Valores
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-900/30 p-6 rounded-lg border border-blue-500/20">
                    <div className="text-blue-500 text-3xl mb-3">
                      <span className="">
                        <Lightbulb className="w-7 h-7" />
                      </span>
                    </div>
                    <h3 className="text-white text-lg font-bold mb-2 font-display">
                      Innovación
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed font-display">
                      Ampliamos constantemente los límites de lo posible,
                      explorando nuevas ideas y tecnologías para ofrecer
                      soluciones de IA de vanguardia.
                    </p>
                  </div>
                  <div className="bg-gray-900/30 p-6 rounded-lg border border-blue-500/20">
                    <div className="text-blue-500 text-3xl mb-3">
                      <span className="">
                        <UserCheck className="w-7 h-7" />
                      </span>
                    </div>
                    <h3 className="text-white text-lg font-bold mb-2 font-display">
                      Integridad
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed font-display">
                      Operamos con transparencia y honestidad, generando
                      confianza con nuestros clientes al cumplir nuestras
                      promesas y mantener los más altos estándares éticos.
                    </p>
                  </div>
                  <div className="bg-gray-900/30 p-6 rounded-lg border border-blue-500/20">
                    <div className="text-blue-500 text-3xl mb-3">
                      <span className="">
                        <Users className="w-7 h-7" />
                      </span>
                    </div>
                    <h3 className="text-white text-lg font-bold mb-2 font-display">
                      Colaboración
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed font-display">
                      Creemos en el poder del trabajo en equipo, trabajando en
                      estrecha colaboración con nuestros clientes y socios para
                      lograr objetivos compartidos y generar éxito mutuo.
                    </p>
                  </div>
                  <div className="bg-gray-900/30 p-6 rounded-lg border border-blue-500/20">
                    <div className="text-blue-500 text-3xl mb-3">
                      <span className="">
                        <Headset className="w-7 h-7" />
                      </span>
                    </div>
                    <h3 className="text-white text-lg font-bold mb-2 font-display">
                      Centrado en el cliente
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed font-display">
                      Nuestros clientes son el centro de todo lo que hacemos.
                      Nos esforzamos por comprender a fondo sus necesidades y
                      ofrecer soluciones personalizadas que aporten valor real.
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-20 text-center">
                <h2 className="text-white text-3xl font-bold leading-tight tracking-[-0.015em] mb-4 font-display">
                  Construyamos el futuro juntos
                </h2>
                <Link
                  to="/contact/"
                  className="flex min-w-[84px] max-w-[280px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-blue-500 text-white text-base font-bold leading-normal tracking-[0.015em] mx-auto hover:bg-blue-500 transition-colors font-display"
                >
                  <span className="truncate">Contactanos</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutPagesMarketing>
  );
}
