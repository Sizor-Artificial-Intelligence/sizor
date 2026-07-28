import {
  FrownIcon,
  FlameIcon,
  ThermometerIcon,
  SmileIcon,
  MehIcon,
} from "lucide-react";

interface SentimentAnalysisProps {
  sentiment?: string | null;
  leadTemperature?: string | null;
}

export default function SentimentAnalysis({
  sentiment = "neutral",
  leadTemperature = "cold",
}: SentimentAnalysisProps) {
  // Configuración de sentimientos
  const sentimentConfig: Record<string, any> = {
    frustrated: {
      label: "Frustrado",
      color: "text-orange-500 dark:text-orange-400",
      bgColor: "bg-orange-500/10 dark:bg-orange-500/20",
      Icon: FrownIcon,
      barColor: "bg-orange-500 dark:bg-orange-400",
      percentage: 50,
    },
    angry: {
      label: "Enojado",
      color: "text-red-500 dark:text-red-400",
      bgColor: "bg-red-500/10 dark:bg-red-500/20",
      Icon: FrownIcon,
      barColor: "bg-red-500 dark:bg-red-400",
      percentage: 70,
    },
    sad: {
      label: "Triste",
      color: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
      Icon: FrownIcon,
      barColor: "bg-blue-500 dark:bg-blue-400",
      percentage: 40,
    },
    calm: {
      label: "Calmado",
      color: "text-green-500 dark:text-green-400",
      bgColor: "bg-green-500/10 dark:bg-green-500/20",
      Icon: MehIcon,
      barColor: "bg-green-500 dark:bg-green-400",
      percentage: 80,
    },
    happy: {
      label: "Feliz",
      color: "text-emerald-500 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
      Icon: SmileIcon,
      barColor: "bg-emerald-500 dark:bg-emerald-400",
      percentage: 90,
    },
    neutral: {
      label: "Neutral",
      color: "text-slate-500 dark:text-slate-400",
      bgColor: "bg-slate-500/10 dark:bg-slate-500/20",
      Icon: MehIcon,
      barColor: "bg-slate-400 dark:bg-slate-500",
      percentage: 50,
    },
    not_applicable: {
      label: "No Aplica",
      color: "text-slate-500 dark:text-slate-400",
      bgColor: "bg-slate-500/10 dark:bg-slate-500/20",
      Icon: ThermometerIcon,
      barColor: "bg-slate-400 dark:bg-slate-500",
      percentage: 0,
    },
  };

  // Configuración de temperatura del lead
  const temperatureConfig: Record<string, any> = {
    very_hot: {
      label: "Muy Caliente",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-600/10 dark:bg-red-500/20",
      Icon: FlameIcon,
      barColor: "bg-red-600 dark:bg-red-400",
      percentage: 100,
    },
    hot: {
      label: "Caliente",
      color: "text-red-500 dark:text-red-400",
      bgColor: "bg-red-500/10 dark:bg-red-500/20",
      Icon: FlameIcon,
      barColor: "bg-red-500 dark:bg-red-400",
      percentage: 80,
    },
    warm: {
      label: "Tibio",
      color: "text-orange-500 dark:text-orange-400",
      bgColor: "bg-orange-500/10 dark:bg-orange-500/20",
      Icon: ThermometerIcon,
      barColor: "bg-orange-500 dark:bg-orange-400",
      percentage: 60,
    },
    cold: {
      label: "Frío",
      color: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
      Icon: ThermometerIcon,
      barColor: "bg-blue-500 dark:bg-blue-400",
      percentage: 30,
    },
    very_cold: {
      label: "Muy Frío",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-600/10 dark:bg-blue-500/20",
      Icon: ThermometerIcon,
      barColor: "bg-blue-600 dark:bg-blue-400",
      percentage: 10,
    },
    not_applicable: {
      label: "No Aplica",
      color: "text-slate-500 dark:text-slate-400",
      bgColor: "bg-slate-500/10 dark:bg-slate-500/20",
      Icon: ThermometerIcon,
      barColor: "bg-slate-400 dark:bg-slate-500",
      percentage: 0,
    },
  };

  const currentSentiment =
    sentimentConfig[sentiment || "neutral"] || sentimentConfig.neutral;
  const currentTemperature =
    temperatureConfig[leadTemperature || "cold"] || temperatureConfig.cold;

  return (
    <div className="p-6 flex bg-white dark:bg-slate-900 flex-col gap-6 border-b border-slate-200 shadow dark:border-[#232f48]">
      {/* Sentimiento del Cliente */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Sentimiento del Cliente
          </p>
          <span
            className={`flex items-center gap-1 ${currentSentiment.color} font-semibold text-xs ${currentSentiment.bgColor} px-2 py-0.5 rounded`}
          >
            <currentSentiment.Icon className="w-4 h-4" />
            {currentSentiment.label}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-[#232f48] h-2 rounded-full overflow-hidden">
          <div
            className={`h-full ${currentSentiment.barColor} transition-all duration-500`}
            style={{ width: `${currentSentiment.percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Calentura del Lead */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Temperatura del Lead
          </p>
          <span
            className={`flex items-center gap-1 ${currentTemperature.color} font-semibold text-xs ${currentTemperature.bgColor} px-2 py-0.5 rounded`}
          >
            <currentTemperature.Icon className="w-4 h-4" />
            {currentTemperature.label}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-[#232f48] h-2 rounded-full overflow-hidden">
          <div
            className={`h-full ${currentTemperature.barColor} transition-all duration-500`}
            style={{ width: `${currentTemperature.percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
