import { useEffect } from "react";
import { useNavigation } from "react-router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import "~/styles/nprogress.css";

// Configurar NProgress
NProgress.configure({
  showSpinner: false,
  minimum: 0.1,
  speed: 500,
  trickleSpeed: 200,
});

export function useNProgress() {
  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === "loading") {
      NProgress.start();
    } else if (navigation.state === "idle") {
      NProgress.done();
    }
  }, [navigation.state]);
}
