import { useEffect, useState } from "react";
import { useNavigation } from "react-router";

export function useCustomProgress() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (navigation.state === "loading") {
      setIsLoading(true);
      setProgress(0);

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) return prev;
          // Incremento más lento hacia el final
          const increment = prev < 50 ? Math.random() * 20 : Math.random() * 5;
          return Math.min(prev + increment, 85);
        });
      }, 150);

      return () => clearInterval(interval);
    } else if (navigation.state === "idle") {
      setProgress(100);
      // Ocultar después de completar
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    }
  }, [navigation.state]);

  return { isLoading, progress };
}
