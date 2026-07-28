/**
 * Devuelve la fecha y hora actual en formato ISO 8601, ajustada a la zona horaria local.
 * Permite restar días a la fecha actual si se especifica.
 */
export function getDateTime(
  date: string | Date | null = null,
  daysToSubtract = 0
): string {
  const currentDate = new Date();

  // Calcula la nueva fecha restando los días especificados
  currentDate.setDate(currentDate.getDate() - daysToSubtract);

  // Obtiene el offset de la zona horaria en minutos y conviérte a milisegundos
  const timeZoneOffset = currentDate.getTimezoneOffset() * 60000;

  // Resta el offset para obtener la fecha UTC
  const localDate = new Date(currentDate.getTime() - timeZoneOffset);

  // Convierte la fecha a una cadena en formato ISO 8601 con la letra 'Z' al final para indicar UTC
  let formattedDate = localDate.toISOString();

  if (date) {
    // Handle Date objects by converting to ISO string
    const dateString = typeof date === "string" ? date : date.toISOString();
    formattedDate = `${dateString?.substring(0, 10)}${formattedDate?.substring(
      10,
      24
    )}`;
  }

  return formattedDate;
}

/**
 * Obtiene la fecha y hora actual en formato MySQL.
 */
export function getDateForMySQL() {
  return getDateTime().substring(0, 10) + " " + getDateTime().substring(11, 19);
}

/**
 * Formatea una fecha ISO para mostrarla en el formato: "YYYY-MM-DD HH:MM:SS".
 */
export function getFormatIsoDate(
  dateIso: string | Date,
  includeHours: boolean = true,
  includeType: boolean = false
) {
  let ampm = "";

  if (typeof dateIso === "object") {
    dateIso = dateIso?.toISOString();
  }

  const date = dateIso?.substring(0, 10) || "";
  let time = "";

  if (includeHours) {
    time = dateIso?.substring(11, 19) || "";
    const [hour, minute, second] = time.split(":").map(Number);
    if (includeType) {
      ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      time = `${hour12}:${minute}:${second} ${ampm}`;
    }
  }

  return `${date} ${time}`;
}

/**
 * Redondea un número a un número específico de decimales.
 */
export function roundNumber(number: number, decimals: number = 2) {
  if (isNaN(number) || !number || !parseFloat(`${number}`)) number = 0;
  number = parseFloat(`${number}`);
  let factor = Math.pow(10, decimals);
  return Math.round(number * factor) / factor;
}

/**
 * Genera una cadena aleatoria de letras con una longitud especificada.
 */
export function generateRandomLetters(length = 5, numbersOnly = false) {
  const alphabet = numbersOnly ? "0123456789" : "abcdefghijklmnopqrstuvwxyz";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    result += alphabet.charAt(randomIndex);
  }

  return result;
}

/**
 * Formatea un número con separadores de miles usando puntos como separador.
 */
export function formatNumberWithSeparators(
  number: number | null | undefined
): string {
  if (number === null || number === undefined || isNaN(number)) {
    return "0";
  }

  // Convierte el número a string y agrega puntos como separadores de miles
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Obtiene el estado de colapso del sidebar desde localStorage.
 * Retorna false por defecto si no hay valor guardado.
 */
export function getSidebarCollapsedState(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const saved = localStorage.getItem("sidebar-collapsed");
    const result = saved ? JSON.parse(saved) : false;
    return result;
  } catch (error) {
    return false;
  }
}

/**
 * Devuelve un valor escapado, convirtiéndolo en un valor adecuado para almacenamiento o procesamiento.
 * Si el valor es inválido, lo convierte a `null` o realiza la conversión necesaria.
 */
export function getEscapedValue(value: any): any {
  // Si no existe un valor o es un valor inválido, retornamos null
  if (
    value == null ||
    (typeof value === "string" && value.trim().length === 0)
  ) {
    return null;
  }

  // Convertimos el valor a string para asegurarnos de que trim pueda aplicarse
  let response = typeof value === "string" ? value.trim() : String(value);

  // Manejar valores no deseados
  if (response === "null" || response === "undefined" || response === "NaN") {
    return null;
  }

  // Manejar booleanos
  if (response === "true") return true;
  if (response === "false") return false;

  // Retornar el valor final
  return response;
}

/**
 * Obtiene los parámetros de la URL de la solicitud y los convierte en un objeto.
 */
export function getParamsURL(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const queryParams: any = {};
  searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });
  return queryParams;
}

/**
 * Formatea una fecha completa en español.
 */
export function formatFullDate(date: any): string {
  if (!date) return "";
  if (date instanceof Date) {
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${month} ${day}, ${year}`;
  }

  date = getDateTime(date);
  if (typeof date !== "object") date = new Date(date);

  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}

/**
 * Ejecuta una consulta SQL en el servidor.
 */
export async function executeSQL(
  PATH: string,
  sql: string,
  isArray: boolean = false
) {
  try {
    const response = await fetch(`${PATH}/api/sql`, {
      method: "POST",
      body: JSON.stringify({ sql, isArray }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.json();
  } catch (error) {
    console.log(error);
    return null;
  }
}

/**
 * Convierte audio a texto usando la API de Whisper de OpenAI.
 * Esta función descarga el audio, lo envía a la API de OpenAI y devuelve el texto transcrito.
 * Requiere una API key de OpenAI.
 */
export async function transcribeAudio(
  audioUrl: string,
  language: string = "es"
): Promise<string> {
  try {
    // Descargar el archivo de audio
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Error al descargar el audio: ${response.statusText}`);
    }

    const audioBlob = await response.blob();

    // Crear FormData para enviar a la API de OpenAI
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.mp3");
    formData.append("model", "whisper-1");
    formData.append("language", language);

    // Enviar a la API de Whisper de OpenAI
    const whisperResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      }
    );

    if (!whisperResponse.ok) {
      const errorData = await whisperResponse.json().catch(() => ({}));
      throw new Error(
        `Error de la API de OpenAI: ${whisperResponse.statusText} - ${errorData.error?.message || ""}`
      );
    }

    const result = await whisperResponse.json();
    return result.text || "";
  } catch (error) {
    console.error("Error al transcribir el audio:", error);
    throw new Error(
      `Error en la transcripción: ${error instanceof Error ? error.message : "Error desconocido"}`
    );
  }
}

/**
 * Formatea un precio en formato de moneda.
 */
export function formatPrice(price: number | null) {
  if (price === null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "symbol",
  }).format(price);
}

/**
 * Obtiene el tiempo relativo de una fecha.
 */
export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Justo ahora";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Hace ${minutes} minuto${minutes > 1 ? "s" : ""}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Hace ${hours} hora${hours > 1 ? "s" : ""}`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `Hace ${days} día${days > 1 ? "s" : ""}`;
  } else {
    const months = Math.floor(diffInSeconds / 2592000);
    return `Hace ${months} mes${months > 1 ? "es" : ""}`;
  }
}

/**
 * Formatea una fecha estilo WhatsApp para mostrar en chats.
 * Retorna formato como: "01:11 PM", "Ayer", "Lunes", "10/09/2025"
 */
export function formatWhatsAppTime(date: string | Date | null): string {
  if (!date) return "";

  const messageDate = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDay = new Date(
    messageDate.getFullYear(),
    messageDate.getMonth(),
    messageDate.getDate()
  );

  // Verificar si es hoy
  if (messageDay.getTime() === today.getTime()) {
    // Mostrar solo la hora en formato 12 horas
    return messageDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Verificar si es ayer
  if (messageDay.getTime() === yesterday.getTime()) {
    return "Ayer";
  }

  // Verificar si es de la semana actual
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (messageDay > weekAgo) {
    // Mostrar el día de la semana
    return messageDate.toLocaleDateString("es-ES", { weekday: "long" });
  }

  // Para fechas más antiguas, mostrar fecha completa
  return messageDate.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Devuelve un string con la primera letra en mayuscula
export function getFirstLetterInUpperCase(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Calcula el tiempo transcurrido desde una fecha ISO hasta la fecha actual.
 * Retorna un objeto con días, horas y minutos transcurridos.
 */
export function getTimeElapsed(isoDate: string | Date): {
  days: number;
  hours: number;
  minutes: number;
  totalMinutes: number;
  totalHours: number;
  totalDays: number;
} {
  const now = new Date(getDateTime());
  const pastDate = new Date(isoDate);

  // Calcular la diferencia en milisegundos
  const diffInMs = now.getTime() - pastDate.getTime();

  // Si la fecha es futura, retornar valores en 0
  if (diffInMs < 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      totalMinutes: 0,
      totalHours: 0,
      totalDays: 0,
    };
  }

  // Convertir a diferentes unidades
  const totalMinutes = Math.floor(diffInMs / (1000 * 60));
  const totalHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const totalDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Calcular días, horas y minutos restantes
  const days = Math.floor(totalMinutes / (24 * 60));
  const remainingMinutesAfterDays = totalMinutes % (24 * 60);
  const hours = Math.floor(remainingMinutesAfterDays / 60);
  const minutes = remainingMinutesAfterDays % 60;

  return {
    days,
    hours,
    minutes,
    totalMinutes,
    totalHours,
    totalDays,
  };
}

/**
 * Devuelve la fecha que será dentro de x días desde la fecha actual.
 * @param daysToAdd - Número de días a agregar (puede ser negativo para fechas pasadas)
 * @param baseDate - Fecha base opcional (por defecto usa la fecha actual)
 * @returns Fecha en formato ISO 8601
 */
export function getDateInDays(
  daysToAdd: number,
  baseDate: string | Date | null = null
): string {
  const currentDate = baseDate ? new Date(baseDate) : new Date();

  // Agregar los días especificados
  currentDate.setDate(currentDate.getDate() + daysToAdd);

  // Obtiene el offset de la zona horaria en minutos y conviérte a milisegundos
  const timeZoneOffset = currentDate.getTimezoneOffset() * 60000;

  // Resta el offset para obtener la fecha UTC
  const localDate = new Date(currentDate.getTime() - timeZoneOffset);

  // Convierte la fecha a una cadena en formato ISO 8601
  return localDate.toISOString();
}

/**
 * Obtiene los datos del formulario de la solicitud
 */
export async function getFormDataRequest(
  request: Request
): Promise<Record<any, any>> {
  const contentType = request.headers.get("content-type") || "";
  let payload: Record<string, any> = {};

  if (contentType.includes("application/json")) {
    payload = await request.json();
  } else if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    payload = Object.fromEntries(formData.entries());
  } else if (contentType.trim().length === 0) {
    // Attempt to read as JSON when content-type is missing but body exists
    try {
      payload = await request.json();
    } catch (error) {
      payload = {};
    }
  } else {
    payload = {};
    throw new Error("Unsupported Content-Type: " + contentType);
  }
  return payload;
}

/**
 * Convierte un valor a una fecha
 */
export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const date = new Date(value as any);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Obtiene la fecha formateada en letras
 */
export function getFormattedDateInLetters(
  value: unknown,
  showHours: boolean = false
): string {
  const date = toDate(value);
  if (!date) return "Sin fecha registrada";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...(showHours && { hour: "2-digit", minute: "2-digit" }),
  }).format(date);
}
