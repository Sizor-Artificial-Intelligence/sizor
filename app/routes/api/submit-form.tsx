import type { ActionFunctionArgs } from "react-router";
import { submitFormResponse } from "~/data/smart-inbox.serve";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const apiKey = request.headers.get("X-API-KEY");
    if (apiKey !== process.env.SIZOR_API_KEY) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { tenantId, companyId, contactId, formId, formData } = data;

    if (!tenantId || !companyId || !formId || !formData) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get("x-forwarded-for") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    const result = await submitFormResponse(
      tenantId,
      companyId,
      contactId,
      formId,
      formData,
      ipAddress,
      userAgent
    );

    return Response.json(result);
  } catch (error: any) {
    console.error("❌ Error in api/submit-form:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
