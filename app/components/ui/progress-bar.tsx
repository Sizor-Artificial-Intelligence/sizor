import React, { useEffect, useState } from "react";
import { useNavigation } from "react-router";

interface ProgressBarProps {
  color?: string;
  height?: number;
  showGlow?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  color = "#3b82f6",
  height = 3,
  showGlow = true,
}) => {
  const navigation = useNavigation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (navigation.state === "loading") {
      setIsVisible(true);
      setProgress(0);

      // Simular progreso gradual
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);

      return () => clearInterval(interval);
    } else if (navigation.state === "idle") {
      setProgress(100);
      // Ocultar después de completar
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 300);
    }
  }, [navigation.state]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 transition-opacity duration-300"
      style={{
        height: `${height}px`,
        backgroundColor: "rgba(0, 0, 0, 0.1)",
      }}
    >
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          backgroundColor: color,
          boxShadow: showGlow ? `0 0 10px ${color}, 0 0 5px ${color}` : "none",
        }}
      />
    </div>
  );
};
