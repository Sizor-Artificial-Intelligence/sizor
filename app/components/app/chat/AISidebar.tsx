// TODO: Descomentar cuando se implementen las sugerencias rápidas
// import { GiftIcon, WandSparkles } from "lucide-react";
import { SparklesIcon, X } from "lucide-react";
import SentimentAnalysis from "./SentimentAnalysis";
// TODO: Descomentar cuando se implementen las sugerencias rápidas
// import AISuggestionCard from "./AISuggestionCard";
import AIQuery from "./AIQuery";

// TODO: Descomentar cuando se implementen las sugerencias rápidas
// const suggestions = [
//   {
//     title: "Resolución Empática",
//     description:
//       "Entiendo completamente tu preocupación sobre el plazo de entrega para el sábado, Sarah. He revisado y hay un retraso en el hub local. Dejaré que se acelere esto...",
//     Icon: WandSparkles,
//     iconColor: "text-primary",
//   },
//   {
//     title: "Oferta de Retención",
//     description:
//       "Mientras rastreo esto, he agregado un código de descuento del 20% a tu cuenta por el inconveniente. Aquí está tu enlace de rastreo...",
//     Icon: GiftIcon,
//     iconColor: "text-green-500 dark:text-green-400",
//   },
// ];

interface AISidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedChat: string | null;
  chat: any;
}

export default function AISidebar({
  isOpen,
  onToggle,
  selectedChat,
  chat,
}: AISidebarProps) {
  return (
    <>
      {/* Sidebar completo */}
      <aside
        className={`
          w-96 bg-white dark:bg-slate-900 flex flex-col ai-sidebar-glow min-h-0
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none absolute right-0 top-0 bottom-0"}
        `}
      >
        <div className="p-5 border-b border-slate-100 dark:border-[#232f48] bg-white dark:bg-primary/10 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 dark:bg-primary/30 text-primary">
                <SparklesIcon className="w-4 h-4" />
              </div>
              <h2 className="text-slate-900 dark:text-white font-bold text-base tracking-tight">
                Asistente de IA Copilot
              </h2>
            </div>
            <button
              onClick={onToggle}
              className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 flex flex-col bg-slate-50 border dark:bg-slate-900 shadow">
          {/* SentimentAnalysis fijo arriba */}
          <div className="shrink-0">
            <SentimentAnalysis
              sentiment={chat?.sentiment}
              leadTemperature={chat?.leadTemperature}
            />
          </div>
          {/* TODO: Descomentar cuando se implementen las sugerencias rápidas */}
          {/* <div className="p-6 flex flex-col gap-4 shrink-0">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Sugerencias rápidas
            </p>
            {suggestions.map((suggestion, index) => (
              <AISuggestionCard key={index} {...suggestion} />
            ))}
          </div> */}
          {/* AIQuery ocupa el resto del espacio */}
          <AIQuery contactId={selectedChat} />
        </div>
      </aside>
    </>
  );
}
