import React from "react";
import LayoutPagesMarketing from "./layout";
import { Mail, Shield, AlertTriangle, FileText } from "lucide-react";
import { VITE_EMAIL_CONTACT } from "~/config/env";

export default function TermsAndConditionsResaleLicenses() {
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
                        Términos y Condiciones de Reventa de Licencias
                      </h1>
                      <h2 className="text-white/80 text-sm font-normal leading-normal @[480px]:text-base @[480px]:font-normal @[480px]:leading-normal font-display">
                        Políticas y términos que rigen la creación y reventa de
                        licencias de nuestra plataforma.
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-10">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 font-display flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      Alcance de la Licencia de Reventa
                    </h2>
                    <p className="text-white/80 text-base font-normal leading-normal font-display">
                      Al crear una licencia a través de nuestra plataforma,
                      usted adquiere el derecho a revender y gestionar dicha
                      licencia bajo su propia marca o nombre comercial. Esta
                      licencia le permite otorgar acceso a terceros a los
                      servicios de nuestra plataforma, asumiendo usted la
                      responsabilidad completa sobre la gestión, facturación y
                      soporte a los usuarios finales de cada licencia creada.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 font-display flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-500" />
                      Responsabilidades del Revendedor
                    </h2>
                    <p className="text-white/80 text-base font-normal leading-normal font-display mb-3">
                      Como revendedor de licencias, usted es responsable de:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-white/80 text-base font-normal leading-normal font-display ml-4">
                      <li>
                        Gestionar adecuadamente todas las licencias que cree,
                        incluyendo la configuración de límites de tokens,
                        usuarios, contactos y empresas según corresponda.
                      </li>
                      <li>
                        Proporcionar soporte técnico adecuado a los usuarios
                        finales de las licencias que haya creado y vendido.
                      </li>
                      <li>
                        Asegurar que el uso de las licencias se realice de
                        acuerdo con las políticas de uso aceptable y las leyes
                        aplicables.
                      </li>
                      <li>
                        Mantener la confidencialidad de las credenciales y datos
                        de acceso de las licencias creadas.
                      </li>
                      <li>
                        Respetar los límites establecidos para cada licencia
                        (tokens, usuarios, contactos, empresas) según la
                        configuración inicial.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 font-display flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      Límites y Restricciones
                    </h2>
                    <p className="text-white/80 text-base font-normal leading-normal font-display mb-3">
                      Al crear una licencia, usted debe establecer límites
                      claros para:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-white/80 text-base font-normal leading-normal font-display ml-4">
                      <li>
                        <strong>Tokens:</strong> La cantidad base de tokens que
                        la licencia tendrá disponible para uso con servicios de
                        inteligencia artificial.
                      </li>
                      <li>
                        <strong>Contactos:</strong> El número máximo de
                        contactos permitidos o establecer como ilimitado según
                        su modelo de negocio.
                      </li>
                      <li>
                        <strong>Empresas:</strong> La cantidad de empresas que
                        la licencia puede gestionar, o permitir creación
                        ilimitada.
                      </li>
                      <li>
                        <strong>Usuarios:</strong> El número máximo de usuarios
                        que pueden acceder bajo la licencia creada.
                      </li>
                    </ul>
                    <p className="text-white/80 text-base font-normal leading-normal font-display mt-4">
                      Estos límites deben ser establecidos de manera
                      responsable, considerando las necesidades del usuario
                      final y el uso proyectado de la plataforma.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 font-display">
                      Uso Aceptable y Prohibiciones
                    </h2>
                    <p className="text-white/80 text-base font-normal leading-normal font-display mb-3">
                      Está estrictamente prohibido:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-white/80 text-base font-normal leading-normal font-display ml-4">
                      <li>
                        Crear licencias para actividades ilegales, fraudulentas
                        o que violen derechos de terceros.
                      </li>
                      <li>
                        Utilizar las licencias para spam, phishing, o cualquier
                        actividad maliciosa.
                      </li>
                      <li>
                        Compartir o revender credenciales de acceso de manera no
                        autorizada.
                      </li>
                      <li>
                        Intentar eludir, deshabilitar o comprometer las medidas
                        de seguridad de la plataforma.
                      </li>
                      <li>
                        Realizar ingeniería inversa, descompilar o intentar
                        extraer el código fuente de la plataforma.
                      </li>
                      <li>
                        Utilizar las licencias de manera que cause daño,
                        interrupciones o sobrecarga a nuestros servidores o
                        infraestructura.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 font-display">
                      Gestión de Usuarios y Autenticación
                    </h2>
                    <p className="text-white/80 text-base font-normal leading-normal font-display">
                      Cuando crea una licencia, puede configurar el método de
                      autenticación para los usuarios finales. Si habilita la
                      opción de inicio de sesión con Google, el usuario final no
                      requerirá contraseña para acceder. Es su responsabilidad
                      asegurar que solo los usuarios autorizados tengan acceso a
                      las licencias que cree y que se proporcione la
                      documentación adecuada sobre los métodos de autenticación
                      disponibles.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 font-display">
                      Responsabilidad Legal y Garantías
                    </h2>
                    <p className="text-white/80 text-base font-normal leading-normal font-display">
                      Usted asume toda la responsabilidad legal derivada de las
                      licencias que cree y de los usuarios finales que las
                      utilicen. Nos reservamos el derecho de suspender o
                      terminar cualquier licencia que viole estos términos o
                      nuestras políticas de uso aceptable. No proporcionamos
                      garantías expresas o implícitas sobre el funcionamiento
                      ininterrumpido o libre de errores de la plataforma, aunque
                      nos esforzamos por mantener un alto nivel de
                      disponibilidad y rendimiento.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 font-display">
                      Modificaciones y Terminación
                    </h2>
                    <p className="text-white/80 text-base font-normal leading-normal font-display">
                      Nos reservamos el derecho de modificar estos términos y
                      condiciones en cualquier momento. Los cambios
                      significativos serán notificados con anticipación
                      razonable. Usted puede terminar su relación con nosotros
                      en cualquier momento, pero todas las licencias activas
                      creadas antes de la terminación continuarán funcionando
                      según los términos establecidos al momento de su creación,
                      salvo que sean suspendidas por violación de estos
                      términos.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 font-display">
                      Propiedad Intelectual
                    </h2>
                    <p className="text-white/80 text-base font-normal leading-normal font-display">
                      Todos los derechos de propiedad intelectual sobre la
                      plataforma, incluyendo pero no limitado a software,
                      diseño, contenido y marcas, pertenecen a nosotros o a
                      nuestros licenciantes. La licencia de reventa que usted
                      recibe no otorga ningún derecho de propiedad sobre la
                      plataforma subyacente. Usted mantiene todos los derechos
                      sobre su marca, contenido y materiales que cree o
                      proporcione al usar la plataforma.
                    </p>
                  </div>

                  <div className="border-t border-blue-500/20 pt-8 mt-8">
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 font-display">
                      Contacto y Soporte
                    </h2>
                    <p className="text-white/80 text-base font-normal leading-normal mb-4 font-display">
                      Si tiene preguntas sobre estos términos y condiciones,
                      sobre la creación de licencias, o necesita soporte
                      técnico, puede contactarnos a través de los siguientes
                      medios:
                    </p>
                    <div className="flex items-start gap-4">
                      <div className="text-blue-500 mt-1">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-white text-lg font-bold">
                          Correo electrónico
                        </h3>
                        <p className="text-white/80">{VITE_EMAIL_CONTACT}</p>
                        <a
                          className="text-blue-500 hover:underline"
                          href={`mailto:${VITE_EMAIL_CONTACT}?subject=Consulta sobre Términos de Reventa de Licencias`}
                        >
                          Enviar un correo electrónico
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-8">
                    <p className="text-white/90 text-sm font-normal leading-normal font-display">
                      <strong>Nota importante:</strong> Al crear una licencia en
                      nuestra plataforma, usted acepta estos términos y
                      condiciones en su totalidad. Si no está de acuerdo con
                      alguno de estos términos, no proceda con la creación de
                      licencias. El uso continuado de nuestra plataforma para
                      crear licencias constituye su aceptación de estos términos
                      y cualquier modificación posterior.
                    </p>
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
