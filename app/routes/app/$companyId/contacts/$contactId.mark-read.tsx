import type { ActionFunctionArgs } from "react-router";
import { markMessagesAsRead } from "~/data/chat.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const { contactId, companyId }: any = params;
  try {
    const success = await markMessagesAsRead(request, companyId, contactId);

    if (success) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else {
      return new Response(JSON.stringify({ success: false }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
