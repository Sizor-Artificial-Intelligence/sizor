import React, { useEffect, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import useToast from "~/hooks/useToast";

export type ResponseMode = "instructions_only" | "qa_only" | "both";

const RESPONSE_MODE_OPTIONS: Array<{
  value: ResponseMode;
  label: string;
  description: string;
}> = [
  {
    value: "instructions_only",
    label: "Solo instrucciones generales",
    description:
      "El agente responde según las instrucciones que definas (tono, rol, qué puede y no puede hacer). Ideal cuando quieres un asistente flexible que siga guías generales.",
  },
  {
    value: "qa_only",
    label: "Solo respuestas específicas (Q&A)",
    description:
      "El agente solo responde con preguntas y respuestas que tú configures. Cada consulta del usuario se empareja con la respuesta definida. Útil para FAQs o respuestas muy controladas.",
  },
  {
    value: "both",
    label: "Ambos (instrucciones + respuestas específicas)",
    description:
      "Combina instrucciones generales con un banco de preguntas y respuestas. El agente usa las respuestas específicas cuando aplican y las instrucciones para el resto.",
  },
];

interface BasicInfoTabProps {
  name: string;
  onNameChange: (value: string) => void;
  responseMode: ResponseMode;
  onResponseModeChange: (value: ResponseMode) => void;
  instructions: string;
  onInstructionsChange: (value: string) => void;
  /** Fuerza el tema del botón de grabar (y elementos que lo usen). Si no se pasa, se usa el tema global. */
  forceTheme?: "light" | "dark";
}

export function BasicInfoTab({
  name,
  onNameChange,
  responseMode,
  onResponseModeChange,
  instructions,
  onInstructionsChange,
  forceTheme,
}: BasicInfoTabProps) {
  const showInstructions =
    responseMode === "instructions_only" || responseMode === "both";

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);

  const startRecording = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      useToast({
        icon: "error",
        title: "Tu navegador no soporta reconocimiento de voz",
      });
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const rec = new SpeechRecognition();

    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "es-ES";

    rec.onstart = () => {
      setIsRecording(true);
      setInterimTranscript("");
      useToast({
        icon: "success",
        title: "Escuchando... Habla ahora",
      });
    };

    rec.onresult = (event: any) => {
      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);

      if (finalText) {
        onInstructionsChange(
          instructions + (instructions ? " " : "") + finalText
        );
      }
    };

    rec.onerror = (event: any) => {
      console.error("Error en reconocimiento de voz:", event.error);
      useToast({
        icon: "error",
        title: "Error en el reconocimiento de voz: " + event.error,
      });
      setIsRecording(false);
      setInterimTranscript("");
    };

    rec.onend = () => {
      setIsRecording(false);
      setInterimTranscript("");
      useToast({
        icon: "success",
        title: "Reconocimiento finalizado",
      });
    };

    setRecognition(rec);
    rec.start();
  };

  const stopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
      setInterimTranscript("");
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    return () => {
      if (recognition && isRecording) {
        recognition.stop();
      }
    };
  }, [recognition, isRecording]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <label
          htmlFor="specific-agent-name"
          className="text-sm font-medium text-foreground block"
        >
          Nombre del agente
        </label>
        <Input
          id="specific-agent-name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ej: Soporte, Ventas, Asistente general…"
          className="bg-input border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-3">
          Modo de respuesta
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Elige cómo responderá el agente. Solo puedes seleccionar una opción.
        </p>
        <div className="space-y-3">
          {RESPONSE_MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onResponseModeChange(opt.value)}
              className={cn(
                "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                responseMode === opt.value
                  ? "border-primary bg-muted"
                  : "border-border bg-muted/50 hover:border-primary/50 hover:bg-muted",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex-shrink-0 w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center transition-colors",
                    responseMode === opt.value
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/50",
                  )}
                >
                  {responseMode === opt.value && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-primary-foreground"
                      aria-hidden
                    />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground block mb-1">
                    {opt.label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {opt.description}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {showInstructions && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="specific-agent-instructions"
              className="text-sm font-medium text-foreground"
            >
              Instrucciones para el agente
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleRecording}
              disabled={isProcessingVoice}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                isRecording
                  ? "border-red-400/60 text-red-600 dark:text-red-300 bg-red-500/20 hover:bg-red-500/30 hover:text-red-700 dark:hover:text-red-200"
                  : "border-border text-foreground bg-transparent hover:bg-muted hover:text-foreground"
              )}
            >
              {isProcessingVoice ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              <span>
                {isProcessingVoice
                  ? "Procesando..."
                  : isRecording
                    ? "Detener grabación"
                    : "Grabar voz"}
              </span>
            </Button>
          </div>
          <div className="relative">
            <textarea
              id="specific-agent-instructions"
              value={instructions}
              onChange={(e) => onInstructionsChange(e.target.value)}
              placeholder="Describe cómo debe comportarse el agente, qué tono usar, qué información puede proporcionar. Si usas respuestas específicas, estas se aplican además en casos concretos. O usa el micrófono para dictar."
              rows={5}
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background resize-y min-h-[120px]"
            />
            {isRecording && interimTranscript && (
              <div className="absolute bottom-2 left-3 right-3 rounded-lg bg-muted border border-border p-2 text-sm text-foreground">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <span className="font-medium text-foreground">
                    Escuchando:
                  </span>
                </div>
                <p className="text-muted-foreground italic">{interimTranscript}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
