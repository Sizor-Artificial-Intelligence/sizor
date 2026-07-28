import type { ActionFunction, LoaderFunctionArgs } from "react-router";
import { processWebhook } from "~/data/META.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === params?.companyId) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export const action: ActionFunction = async ({ request, params }) => {
  try {
    const data = await request.json();

    switch (params.socialNetwork) {
      case "instagram":
      case "facebook":
      case "whatsapp":
        await processWebhook(data, params);
        break;
      default:
        throw new Error("Social network not supported");
    }
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Error en POST /webhook/meta", error);
    return new Response("Error procesando el webhook", { status: 500 });
  }
};
