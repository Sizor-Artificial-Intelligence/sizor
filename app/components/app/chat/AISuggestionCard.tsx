import type { LucideIcon } from "lucide-react";

interface AISuggestionCardProps {
  title: string;
  description: string;
  Icon: LucideIcon;
  iconColor?: string;
}

export default function AISuggestionCard({
  title,
  description,
  Icon,
  iconColor = "text-primary",
}: AISuggestionCardProps) {
  return (
    <div className="group p-4 rounded-xl border border-slate-100 dark:border-[#232f48] bg-slate-50 dark:bg-[#1a2333] hover:border-primary/50 dark:hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] bg-primary dark:bg-primary/90 text-white px-2 py-0.5 rounded-full">
          Aplicar
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <p className="text-xs font-bold text-slate-900 dark:text-white">
          {title}
        </p>
      </div>
      <p className="text-xs text-slate-600 dark:text-[#92a4c9] leading-relaxed line-clamp-3">
        {description}
      </p>
    </div>
  );
}

