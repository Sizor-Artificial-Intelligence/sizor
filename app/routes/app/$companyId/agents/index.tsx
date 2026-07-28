import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import AgentsPage from "~/components/app/agents";
import { deleteAgent, getAgents } from "~/data/agents.server";

export default function Route() {
  return <AgentsPage />;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { companyId }: any = params;
  return await getAgents(request, companyId);
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { companyId }: any = params;
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );

  try {
    return await deleteAgent(request, companyId, formData?.id);
  } catch (error) {
    return {
      status: "error",
      message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
    };
  }
}
