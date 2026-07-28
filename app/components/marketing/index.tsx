import {
  Bot,
  Boxes,
  CheckCircle,
  ChevronDown,
  Facebook,
  Instagram,
  Link2,
  Lock,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router";
import { APP_NAME } from "~/config/app";
import { FaWhatsapp } from "react-icons/fa";
import { useState } from "react";
import LayoutPagesMarketing from "./layout";

const faqData = [
  {
    id: 0,
    question: "¿Qué son los créditos y cómo se consumen?",
    answer:
      "Los créditos son unidades que usa la IA para procesar y generar respuestas. Cada mensaje que envía tu agente consume créditos. Un crédito equivale aproximadamente a 0.75 palabras. Por ejemplo, una respuesta de 100 palabras consume unos 130 créditos.",
  },
  {
    id: 1,
    question: "¿Cómo funcionan los agentes de IA?",
    answer:
      "Los agentes son asistentes virtuales que puedes personalizar con diferentes personalidades, conocimientos y respuestas. Puedes entrenarlos con información específica de tu empresa para que respondan como un miembro de tu equipo.",
  },
  {
    id: 2,
    question: "¿Qué redes sociales están disponibles?",
    answer:
      "Actualmente soportamos WhatsApp, Instagram y Facebook. Estamos trabajando en integrar más plataformas como TikTok, YouTube y Discord.",
  },
  {
    id: 3,
    question: "¿Puedo cambiar de plan en cualquier momento?",
    answer:
      "Sí, puedes actualizar tu plan en cualquier momento. Los cambios se aplican inmediatamente y solo pagas la diferencia.",
  },
  {
    id: 4,
    question: "¿Qué incluye la integración para créditos ilimitados?",
    answer:
      "Te permite conectar tu propia infraestructura de IA con OpenAI para usar tus propios créditos sin límites. Ideal para empresas con alto volumen de conversaciones.",
  },
  {
    id: 5,
    question: "¿Cómo funciona la creación de licencias para reventa?",
    answer:
      "Puedes crear sub-licencias de Sizor para revender a tus clientes. Esto incluye acceso completo a la plataforma con tu marca, precios personalizados y gestión de clientes. Perfecto para agencias y consultores.",
  },
  {
    id: 6,
    question: "¿Qué tipo de asistencia personalizada ofrecen?",
    answer:
      "Incluye soporte técnico 24/7, consultoría para optimizar tus agentes, capacitación para tu equipo, desarrollo de funcionalidades específicas y migración de datos desde otras plataformas.",
  },
  {
    id: 7,
    question: "¿Es seguro conectar mis redes sociales?",
    answer:
      "Sí, utilizamos conexiones seguras y encriptadas. Solo accedemos a los permisos necesarios para enviar y recibir mensajes. Nunca almacenamos contraseñas y puedes revocar el acceso en cualquier momento.",
  },
];

export default function LandingPage() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <>
      <LayoutPagesMarketing isHome={true}>
        <div className="@container py-10">
          <div className="@[480px]:p-4">
            <div
              className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat @[480px]:gap-8 items-center justify-center p-4 text-center"
              data-alt="Abstract blue and black gradient background"
            >
              <div className="flex flex-col gap-2">
                <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] @[480px]:text-5xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em]">
                  Automatiza tus conversaciones en <br /> redes sociales con IA
                </h1>
                <h2 className="text-white/80 text-sm font-normal leading-normal @[480px]:text-base @[480px]:font-normal @[480px]:leading-normal max-w-2xl mx-auto">
                  Ahorre tiempo, aumente las ventas y brinde un servicio al
                  cliente excepcional con nuestra solución inteligente de
                  respuesta automática.
                </h2>
              </div>
              <Link
                to="/auth/register/"
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 @[480px]:h-12 @[480px]:px-5 bg-blue-500 text-white text-sm font-bold leading-normal tracking-[0.015em] @[480px]:text-base @[480px]:font-bold @[480px]:leading-normal @[480px]:tracking-[0.015em] hover:bg-blue-500/90 transition-colors"
              >
                <span className="truncate">Comenzar gratis</span>
              </Link>
            </div>
          </div>
        </div>
        <div
          id="features"
          className="flex flex-col gap-10 px-4 py-10 @container"
        >
          <div className="flex flex-col gap-4 text-center">
            <h2 className="text-white tracking-light text-[32px] font-bold leading-tight @[480px]:text-4xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em]">
              Características clave
            </h2>
            <p className="text-white/80 text-base font-normal leading-normal max-w-2xl mx-auto">
              Descubre cómo nuestras características con IA pueden revolucionar
              tu gestión de redes sociales.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-1 gap-4 rounded-lg border border-[#232f48] bg-[#192233] p-6 flex-col items-center text-center hover:border-primary/50 transition-all">
              <span className="material-symbols-outlined text-blue-500 text-4xl">
                Chat
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-white text-lg font-bold leading-tight">
                  Respuestas automáticas
                </h3>
                <p className="text-[#92a4c9] text-sm font-normal leading-normal">
                  Responde instantáneamente a preguntas y mensajes comunes con
                  nuestra IA inteligente. Configura tus agentes para dar
                  respuestas personalizadas.
                </p>
              </div>
            </div>
            <div className="flex flex-1 gap-4 rounded-lg border border-[#232f48] bg-[#192233] p-6 flex-col items-center text-center hover:border-primary/50 transition-all">
              <span className="material-symbols-outlined text-blue-500 text-4xl">
                Pedidos
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-white text-lg font-bold leading-tight">
                  Inbox inteligente
                </h3>
                <p className="text-[#92a4c9] text-sm font-normal leading-normal">
                  Establece los datos que necesitas para crear el pedido
                  (nombre, email, teléfono, etc.) la IA guiará a tu cliente
                  hasta crear el pedido.
                </p>
              </div>
            </div>
            <div className="flex flex-1 gap-4 rounded-lg border border-[#232f48] bg-[#192233] p-6 flex-col items-center text-center hover:border-primary/50 transition-all">
              <span className="material-symbols-outlined text-blue-500 text-4xl">
                Agente humano
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-white text-lg font-bold leading-tight">
                  Escalar a agente humano
                </h3>
                <p className="text-[#92a4c9] text-sm font-normal leading-normal">
                  Establece condiciones para que la IA escale la conversación a
                  un agente humano, de esta forma filtra las conversaciones más
                  complejas o que necesitan un toque personal.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-10">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="flex flex-col gap-4">
                <h2 className="text-white tracking-light text-[32px] font-bold leading-tight sm:text-4xl sm:font-black sm:leading-tight sm:tracking-[-0.033em]">
                  Potencie su IA con contexto
                </h2>
                <p className="text-white/80 text-base font-normal leading-normal max-w-xl">
                  Proporciona a la IA tu catálogo de productos, incluyendo
                  imágenes y precios. Tu agente tendrá la habilidad de consultar
                  el catálogo y ofrecer respuestas personalizadas cuando sea
                  necesario, esto incluye envío de imágenes y precios.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  <div className="flex flex-col gap-3 p-4 rounded-lg bg-[#192233] border border-[#232f48]">
                    <span className="text-blue-500 text-3xl">
                      <Boxes size={32} />
                    </span>
                    <h3 className="text-white text-lg font-bold leading-tight">
                      Catálogo de productos
                    </h3>
                    <p className="text-[#92a4c9] text-sm">
                      Sube tus productos para crear un catálogo completo que la
                      IA pueda referenciar.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 p-4 rounded-lg bg-[#192233] border border-[#232f48]">
                    <span className="text-blue-500 text-3xl">
                      <Bot size={32} />
                    </span>
                    <h3 className="text-white text-lg font-bold leading-tight">
                      Agentes especializados
                    </h3>
                    <p className="text-[#92a4c9] text-sm">
                      Entrena agentes IA para tareas específicas, desde soporte
                      al cliente hasta ventas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="relative rounded-xl border border-[#232f48] bg-[#192233] p-4 sm:p-6 shadow-2xl shadow-primary/10">
                <div className="absolute inset-0 bg-grid-slate-700/20 [mask-image:linear-gradient(0deg,#000,rgba(0,0,0,0.6))]"></div>
                <div className="relative flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      alt="Auriculares con tecnología de IA"
                      className="w-16 h-16 rounded-md object-cover"
                      src="/images/landing/Auriculares con tecnología de IA.png"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        Auriculares con tecnología de IA
                      </p>
                      <p className="text-blue-500 font-bold text-lg">$299.99</p>
                    </div>
                  </div>
                  <div className="h-px bg-[#232f48]"></div>
                  <div className="flex items-center gap-4">
                    <img
                      alt="Teclado de respuesta inteligente"
                      className="w-16 h-16 rounded-md object-cover"
                      src="/images/landing/Teclado de respuesta inteligente.png"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        Teclado de respuesta inteligente
                      </p>
                      <p className="text-blue-500 font-bold text-lg">$149.99</p>
                    </div>
                  </div>
                  <div className="h-px bg-[#232f48]"></div>
                  <div className="flex items-center gap-4">
                    <img
                      alt="Lámpara de escritorio automatizada"
                      className="w-16 h-16 rounded-md object-cover"
                      src="/images/landing/Lámpara de escritorio automatizada.png"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        Lámpara de escritorio automatizada
                      </p>
                      <p className="text-blue-500 font-bold text-lg">$79.99</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="how-it-works" className="px-4 py-10">
          <div className="flex flex-col gap-4 text-center mb-10">
            <h2 className="text-white tracking-light text-[32px] font-bold leading-tight sm:text-4xl sm:font-black sm:leading-tight sm:tracking-[-0.033em]">
              Conecta todo en un solo lugar
            </h2>
            <p className="text-white/80 text-base font-normal leading-normal max-w-2xl mx-auto">
              {APP_NAME} integra con tus redes sociales favoritas, centralizando
              tu comunicación y flujo de trabajo.
            </p>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] bg-blue-500/20 rounded-full blur-3xl"></div>
            <div className="relative grid grid-cols-3 gap-y-12 sm:gap-y-20 items-center justify-items-center w-full max-w-3xl">
              <div className="col-span-3 flex justify-center">
                <div className="size-20 sm:size-24 rounded-full bg-[#192233] border-2 border-primary flex items-center justify-center text-blue-500">
                  <img
                    src="/images/logo-letters-white.png"
                    alt="Logo"
                    className="w-10 sm:w-20"
                  />
                </div>
              </div>
              <div className="size-14 sm:size-16 rounded-full bg-[#192233] border border-[#232f48] flex items-center justify-center">
                <Facebook size={32} className="text-blue-500" />
              </div>
              <div className="size-14 sm:size-16 rounded-full bg-[#192233] border border-[#232f48] flex items-center justify-center">
                <Instagram size={32} className="text-[#8134AF]" />
              </div>
              <div className="size-14 sm:size-16 rounded-full bg-[#192233] border border-[#232f48] flex items-center justify-center">
                <FaWhatsapp size={32} className="text-green-500" />
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-10">
          <h2 className="text-white text-center text-[28px] sm:text-[32px] font-bold leading-tight tracking-[-0.015em] pb-8">
            Cómo funciona
          </h2>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 md:gap-x-6">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center size-12 rounded-full bg-blue-500/20 text-blue-500">
                <span className="material-symbols-outlined text-3xl">
                  <Link2 size={32} />
                </span>
              </div>
              <div className="w-[2px] bg-[#324467] h-full grow"></div>
            </div>
            <div className="flex flex-1 flex-col pb-12 pt-2">
              <h3 className="text-white text-xl font-bold leading-normal">
                Conecta tus cuentas
              </h3>
              <p className="text-white/70">
                Conecta tus perfiles de redes sociales a {APP_NAME} en unos
                pocos pasos sencillos.
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center size-12 rounded-full bg-blue-500/20 text-blue-500">
                <span className="material-symbols-outlined text-3xl">
                  <Lock size={26} />
                </span>
              </div>
              <div className="w-[2px] bg-[#324467] h-full grow"></div>
            </div>
            <div className="flex flex-1 flex-col pb-12 pt-2">
              <h3 className="text-white text-xl font-bold leading-normal">
                Establece tus reglas
              </h3>
              <p className="text-white/70">
                Personaliza cómo la IA responde a diferentes tipos de mensajes y
                consultas.
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center size-12 rounded-full bg-blue-500/20 text-blue-500">
                <span className="material-symbols-outlined text-3xl">
                  <TrendingUp size={32} />
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col pb-12 pt-2">
              <h3 className="text-white text-xl font-bold leading-normal">
                Ve crecer tu negocio
              </h3>
              <p className="text-white/70">
                Deja que nuestra IA maneje las conversaciones mientras tú
                enfocas en escalar tu negocio.
              </p>
            </div>
          </div>
        </div>

        <div id="pricing" className="px-4 py-10">
          <div className="flex flex-col gap-4 text-center mb-10">
            <h2 className="text-white tracking-light text-[32px] font-bold leading-tight sm:text-4xl sm:font-black sm:leading-tight sm:tracking-[-0.033em]">
              Planes y precios
            </h2>
            <p className="text-white/80 text-base font-normal leading-normal max-w-2xl mx-auto">
              Elige el plan que te conviene.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col p-6 bg-[#192233] rounded-lg border border-[#232f48] hover:border-primary transition-all">
              <h3 className="text-white text-xl font-bold">Gratis</h3>
              <p className="text-white/80 text-4xl font-bold mt-2">
                $0<span className="text-lg font-medium">/mo</span>
              </p>
              <ul className="text-white/70 space-y-3 mt-6 grow">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  1 Red Social
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  7 Contactos
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  1 Agente
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  10,000 Créditos
                </li>
              </ul>
              <Link
                to="/auth/register/?plan=free"
                className="w-full mt-6 flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#232f48] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#324467] transition-colors"
              >
                Elegir Plan
              </Link>
            </div>
            <div className="flex flex-col p-6 bg-[#192233] rounded-lg border-2 border-primary transition-all relative">
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-blue-500 px-3 py-1 text-white text-xs font-bold rounded-full">
                MÁS POPULAR
              </div>
              <h3 className="text-primary text-xl font-bold">Premium</h3>
              <div className="mt-2">
                <p className="text-white text-4xl font-bold">
                  Desde $6,00<span className="text-lg font-medium">/mo</span>
                </p>
                <p className="text-white/60 text-sm mt-1">
                  El precio varía según la cantidad de créditos elegidos
                </p>
              </div>
              <ul className="text-white/70 space-y-3 mt-6 grow">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  Todas las redes sociales
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  Contactos ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  Agentes ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  Multi-empresa (Ilimitado)
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  Multi-usuario (Ilimitado)
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  Cantidad de créditos a elección
                </li>
              </ul>
              <Link
                to="/auth/register/?plan=premium"
                className="w-full mt-6 flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-blue-500 text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-500/90 transition-colors"
              >
                Elegir Plan
              </Link>
            </div>
            {/* <div className="flex flex-col p-6 bg-[#192233] rounded-lg border border-[#232f48] hover:border-primary transition-all">
              <h3 className="text-white text-xl font-bold">Enterprise</h3>
              <p className="text-white text-4xl font-bold mt-2">
                Personalizado
              </p>
              <ul className="text-white/70 space-y-3 mt-6 grow">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  Todas las redes sociales
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  Contactos ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  Agentes ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  Multi-empresa (Ilimitado)
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  Multi-usuario (Ilimitado)
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  Créditos ilimitados{" "}
                  <span className="text-sm">(Conexión con OpenAI)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  Creación de licencias
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    <CheckCircle size={24} />
                  </span>
                  Soporte técnico prioritario
                </li>
              </ul>
              <Link
                to="/auth/register/?plan=enterprise"
                className="w-full mt-6 flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#232f48] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#324467] transition-colors"
              >
                Elegir Plan
              </Link>
            </div> */}
          </div>
        </div>

        <div id="testimonials" className="py-10 px-4">
          <h2 className="text-white text-center text-[28px] sm:text-[32px] font-bold leading-tight tracking-[-0.015em] pb-8">
            Lo que dicen nuestros clientes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#192233] p-8 rounded-lg border border-[#232f48]">
              <p className="text-white/90 italic">
                "Esta aplicación ha sido un cambio de juego para nuestro
                negocio! Hemos visto un aumento del 40% en la conversión de
                leads desde que empezamos a usar {APP_NAME}."
              </p>
              <p className="text-blue-500 font-bold mt-4">- Joseph García</p>
            </div>
            <div className="bg-[#192233] p-8 rounded-lg border border-[#232f48]">
              <p className="text-white/90 italic">
                "Increíble ahorro de tiempo. Ahora puedo enfocarme en la
                estrategia en lugar de estar bogado por los DMs repetitivos.
                Altamente recomendado!"
              </p>
              <p className="text-blue-500 font-bold mt-4">
                - Edward Stuard, Gerente de Marketing
              </p>
            </div>
          </div>
        </div>

        <div id="faq" className="px-4 py-10">
          <div className="flex flex-col gap-4 text-center mb-10">
            <h2 className="text-white tracking-light text-[32px] font-bold leading-tight sm:text-4xl sm:font-black sm:leading-tight sm:tracking-[-0.033em]">
              Preguntas frecuentes
            </h2>
            <p className="text-white/80 text-base font-normal leading-normal max-w-2xl mx-auto">
              ¿Tienes preguntas? Tenemos las respuestas. Si no encuentras lo que
              buscas, contáctanos.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            {faqData.map((faq, index) => (
              <div key={faq.id} className="border-b border-[#232f48]">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                  className="cursor-pointer w-full flex justify-between items-center py-4 text-left"
                >
                  <h3 className="text-white font-medium text-lg">
                    {faq.question}
                  </h3>
                  <span
                    className={`${openIndex === index ? "rotate-180" : ""} material-symbols-outlined text-white/70 transition-transform`}
                  >
                    <ChevronDown size={24} />
                  </span>
                </button>
                {openIndex === index && (
                  <div className="pb-4 text-white/70">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </LayoutPagesMarketing>
    </>
  );
}
