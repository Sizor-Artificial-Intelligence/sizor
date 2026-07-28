import React from "react";
import { useCustomProgress } from "~/hooks/useCustomProgress";

interface NavigationProgressProps {
  variant?: "nprogress" | "custom";
  color?: string;
  height?: number;
  showGlow?: boolean;
}

export const NavigationProgress: React.FC<NavigationProgressProps> = ({
  variant = "custom",
  color = "#3b82f6",
  height = 3,
  showGlow = true,
}) => {
  const { isLoading, progress } = useCustomProgress();

  if (variant === "custom") {
    return (
      <>
        {isLoading && (
          <div
            className="fixed top-0 left-0 right-0 z-50 transition-opacity duration-300"
            style={{
              height: `${height}px`,
              backgroundColor: "rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              className="h-full transition-all duration-300 ease-out relative overflow-hidden progress-bar-container"
              style={{
                width: `${progress}%`,
                backgroundColor: color,
                boxShadow: showGlow
                  ? `0 0 8px ${color}, 0 0 4px ${color}`
                  : "none",
              }}
            >
              {/* Efecto de brillo animado */}
              <div className="progress-shimmer" />
            </div>
          </div>
        )}

        <style>{`
          .progress-shimmer {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            opacity: 0.3;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            animation: shimmer 2s infinite;
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          .progress-bar-container {
            position: relative;
          }
        `}</style>
      </>
    );
  }

  // Para variant 'nprogress', el hook useNProgress ya se encarga de todo
  return null;
};
