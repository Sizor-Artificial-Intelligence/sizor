import { toast } from "sonner";

interface useToastProps {
  icon: "success" | "error" | "warning" | "info";
  title: string;
  position?:
    | "top-start"
    | "top-end"
    | "top"
    | "bottom-start"
    | "bottom-end"
    | "bottom"
    | "center";
  timer?: number;
}

export default function useToast({
  icon = "info",
  title = "",
  position = "top-end",
  timer = 3500,
}: useToastProps) {
  // Mapear los iconos de sweetalert2 a sonner
  const iconMap = {
    success: "success",
    error: "error",
    warning: "warning",
    info: "info",
  };

  // Mapear las posiciones de sweetalert2 a sonner
  const positionMap = {
    "top-start": "top-left",
    "top-end": "top-right",
    top: "top-center",
    "bottom-start": "bottom-left",
    "bottom-end": "bottom-right",
    bottom: "bottom-center",
    center: "top-center",
  };

  const sonnerIcon = iconMap[icon];
  const sonnerPosition = positionMap[position] || "top-right";

  // Estilos personalizados para cada tipo de toast
  const toastStyles = {
    success: {
      style: {
        background: "#f0fdf4",
        color: "#166534",
        borderRadius: "8px",
        fontWeight: "500",
        fontSize: "14px",
        padding: "12px 16px",
        minHeight: "48px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      },
    },
    error: {
      style: {
        background: "#fef2f2",
        color: "#991b1b",
        borderRadius: "8px",
        fontWeight: "500",
        fontSize: "14px",
        padding: "12px 16px",
        minHeight: "48px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      },
    },
    warning: {
      style: {
        background: "#fffbeb",
        color: "#92400e",
        borderRadius: "8px",
        fontWeight: "500",
        fontSize: "14px",
        padding: "12px 16px",
        minHeight: "48px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      },
    },
    info: {
      style: {
        background: "#eff6ff",
        color: "#1e40af",
        borderRadius: "8px",
        fontWeight: "500",
        fontSize: "14px",
        padding: "12px 16px",
        minHeight: "48px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      },
    },
  };

  const currentStyle = toastStyles[icon];

  // Usar el toast de sonner con estilos personalizados
  if (sonnerIcon === "success") {
    toast.success(title, {
      duration: timer,
      position: sonnerPosition as any,
      style: currentStyle.style,
    });
  } else if (sonnerIcon === "error") {
    toast.error(title, {
      duration: timer,
      position: sonnerPosition as any,
      style: currentStyle.style,
    });
  } else if (sonnerIcon === "warning") {
    toast.warning(title, {
      duration: timer,
      position: sonnerPosition as any,
      style: currentStyle.style,
    });
  } else {
    toast.info(title, {
      duration: timer,
      position: sonnerPosition as any,
      style: currentStyle.style,
    });
  }

  return null;
}
