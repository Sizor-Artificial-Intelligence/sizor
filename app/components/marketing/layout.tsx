import React from "react";
import { Link, useNavigate } from "react-router";
import { APP_NAME } from "~/config/app";

export default function LayoutPagesMarketing({
  children,
  isHome = false,
}: {
  children: React.ReactNode;
  isHome?: boolean;
}) {
  const navigate = useNavigate();
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80; // Height of fixed header
      const elementPosition = element.offsetTop - headerHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
    if (!isHome) {
      navigate(`/#${sectionId}`);
    }
  };

  return (
    <>
      <div className="relative flex h-auto min-h-screen w-full flex-col bg-[#111722] dark group/design-root overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col sm:max-w-4/5 flex-1">
              <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#232f48] px-4 sm:px-10 py-3 bg-[#111722]">
                <div className="flex items-center gap-4 text-white">
                  <Link to="/">
                    <img
                      src="/images/logo-letters-white.png"
                      alt="Logo"
                      className="w-28"
                    />
                  </Link>
                </div>
                <div className="hidden md:flex flex-1 justify-center gap-8">
                  <div className="flex items-center gap-9">
                    <button
                      onClick={() => scrollToSection("features")}
                      className="cursor-pointer text-white text-sm font-medium leading-normal hover:text-blue-400 transition-colors"
                    >
                      Características
                    </button>
                    <button
                      onClick={() => scrollToSection("how-it-works")}
                      className="cursor-pointer text-white text-sm font-medium leading-normal hover:text-blue-400 transition-colors"
                    >
                      Cómo funciona
                    </button>
                    <button
                      onClick={() => scrollToSection("pricing")}
                      className="cursor-pointer text-white text-sm font-medium leading-normal hover:text-blue-400 transition-colors"
                    >
                      Precios
                    </button>
                    <button
                      onClick={() => scrollToSection("testimonials")}
                      className="cursor-pointer text-white text-sm font-medium leading-normal hover:text-blue-400 transition-colors"
                    >
                      Testimonios
                    </button>
                    <button
                      onClick={() => scrollToSection("faq")}
                      className="cursor-pointer text-white text-sm font-medium leading-normal hover:text-blue-400 transition-colors"
                    >
                      Preguntas frecuentes
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to="/auth/register/"
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-blue-500 text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-500/90 transition-colors"
                  >
                    <span className="truncate">Registrarse</span>
                  </Link>
                  <Link
                    to="/auth/login/"
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#232f48] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#324467] transition-colors"
                  >
                    <span className="truncate">Iniciar sesión</span>
                  </Link>
                </div>
              </header>
              <main className="flex flex-col gap-12 sm:gap-16 md:gap-24 pt-20">
                {children}
              </main>
              <footer className="text-center py-10 mt-12 border-t border-[#232f48]">
                <p className="text-white/50 text-sm">
                  © {new Date().getFullYear()} {APP_NAME}. Todos los derechos
                  reservados.
                </p>
                <div className="flex justify-center flex-col md:flex-row gap-4 mt-4">
                  <Link
                    className="text-white/70 hover:text-blue-500 transition-colors"
                    to="/about-us"
                  >
                    Acerca de nosotros
                  </Link>
                  <Link
                    className="text-white/70 hover:text-blue-500 transition-colors"
                    to="/contact"
                  >
                    Contacto
                  </Link>
                  <Link
                    className="text-white/70 hover:text-blue-500 transition-colors"
                    to="/privacy-policy"
                  >
                    Política de privacidad
                  </Link>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
