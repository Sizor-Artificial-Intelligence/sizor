import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { requireUserSession } from "~/data/auth.server";
import { getSmartInboxes, markAsRead } from "~/data/smart-inbox.serve";
import FormResponsesPage from "~/components/app/forms/responses";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserSession(request);
  const { companyId }: any = params;
  return getSmartInboxes(request, null, companyId);
}

export default function Route() {
  return <FormResponsesPage isSmartInbox />;
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserSession(request);
  const { companyId }: any = params;
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );
  const { responseId } = formData;
  await markAsRead(request, responseId, companyId);
  return { isRead: true, responseId };
}
