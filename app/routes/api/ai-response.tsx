import type { LoaderFunctionArgs } from "react-router";
import { respondToMessage } from "~/data/chat.server";

export async function action({ request }: LoaderFunctionArgs) {
  try {
    return await respondToMessage(request);
  } catch (error) {
    console.error("❌ Error procesando respuesta de IA:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
