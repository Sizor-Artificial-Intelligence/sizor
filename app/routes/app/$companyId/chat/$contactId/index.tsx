import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import ChatPage from "~/components/app/chat";
import {
  getChats,
  getChatMessages,
  markMessagesAsRead,
  getChatById,
} from "~/data/chat.server";
import { connectSocialNetwork } from "~/data/plan.server";

export default function Route() {
  return <ChatPage />;
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );
  const { companyId }: any = params;

  if (request.method === "POST") {
    try {
      return await connectSocialNetwork(request, companyId, formData);
    } catch (error: any) {
      if (error?.status === 450) {
        return { message: error?.message || null, success: false };
      }
      return {
        message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
        success: false,
      };
    }
  }

  return null;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { companyId, contactId }: any = params;
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("search") || undefined;

  // Obtener filtros de los query parameters
  const channelsParam = url.searchParams.get("channels");
  const assignmentType = url.searchParams.get("assignmentType") as
    | "all"
    | "my"
    | "specific"
    | null;
  const specificUsersParam = url.searchParams.get("specificUsers");

  const filters = {
    channels: channelsParam ? channelsParam.split(",") : undefined,
    assignmentType: assignmentType || undefined,
    specificUsers: specificUsersParam
      ? specificUsersParam.split(",")
      : undefined,
  };

  const [contacts, messages, chat] = await Promise.all([
    getChats(request, companyId, searchQuery, filters),
    contactId ? getChatMessages(request, companyId, contactId) : null,
    contactId ? getChatById(request, companyId, contactId) : null,
  ]);

  // Marcar mensajes como leídos cuando se abre el chat
  if (contactId) {
    await markMessagesAsRead(request, companyId, contactId);
  }

  return {
    contacts,
    messages,
    chat,
  };
}
