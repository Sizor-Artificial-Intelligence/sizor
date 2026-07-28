import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getCopilotUsageStatus, processCopilotQuery } from "~/data/copilot.server";
import { requireUserSession } from "~/data/auth.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    await requireUserSession(request);

    const { companyId } = params;
    if (!companyId) {
      return Response.json(
        { success: false, error: "Company ID is required" },
        { status: 400 }
      );
    }

    const status = await getCopilotUsageStatus(request, companyId);
    return Response.json({ success: true, ...status }, { status: 200 });
  } catch (error) {
    console.error("Error en copilot loader:", error);
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    // Verificar autenticación
    await requireUserSession(request);

    const { companyId } = params;
    if (!companyId) {
      return Response.json(
        { success: false, error: "Company ID is required" },
        { status: 400 }
      );
    }

    const { contactId, query } = await request.json();

    if (!contactId) {
      return Response.json(
        { success: false, error: "Contact ID is required" },
        { status: 400 }
      );
    }

    if (!query || !query.trim()) {
      return Response.json(
        { success: false, error: "Query is required" },
        { status: 400 }
      );
    }

    const result = await processCopilotQuery(
      request,
      companyId,
      contactId,
      query.trim()
    );

    if (result.success) {
      return Response.json(
        {
          success: true,
          response: result.response,
          tokensUsed: result.tokensUsed,
          tokensUsedToday: result.tokensUsedToday,
          dailyLimit: result.dailyLimit,
          copilotUnlimited: result.copilotUnlimited,
          date: result.date,
          upgradePrice: result.upgradePrice,
          blocked: result.blocked,
        },
        { status: 200 }
      );
    } else {
      if (result.code === "COPILOT_DAILY_LIMIT_REACHED") {
        return Response.json(
          {
            success: false,
            error: result.error || "Copilot limit reached",
            code: result.code,
            tokensUsedToday: result.tokensUsedToday,
            dailyLimit: result.dailyLimit,
            copilotUnlimited: result.copilotUnlimited,
            date: result.date,
            upgradePrice: result.upgradePrice,
            blocked: true,
          },
          { status: 429 }
        );
      }

      return Response.json(
        {
          success: false,
          error: result.error || "Error processing query",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error en copilot action:", error);
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
