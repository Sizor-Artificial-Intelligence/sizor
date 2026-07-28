export default function ChatNavigation() {
  return (
    <header className="flex items-center justify-between border-b border-solid border-slate-200 dark:border-[#232f48] px-6 py-3 bg-white dark:bg-slate-900 shrink-0">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 text-primary">
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">
            Chat en vivo
          </h2>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a
            className="text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors"
            href="#"
          >
            Dashboard
          </a>
          <a
            className="text-primary text-sm font-semibold border-b-2 border-primary py-4"
            href="#"
          >
            Conversaciones
          </a>
          <a
            className="text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors"
            href="#"
          >
            Análisis
          </a>
          <a
            className="text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors"
            href="#"
          >
            Configuración
          </a>
        </div>
      </div>
    </header>
  );
}
