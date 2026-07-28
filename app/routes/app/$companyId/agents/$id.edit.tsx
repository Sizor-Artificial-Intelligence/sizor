import {
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import FormAgent from "~/components/app/agents/form";
import { getAgent, getSubAgentCandidates, updateAgent } from "~/data/agents.server";
import { getForms } from "~/data/forms.server";
import {
  getAllTrainingFolders,
  getAllTrainingFiles,
} from "~/data/training.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const { companyId, id }: any = params;
    if (!companyId || !id) {
      return { forms: [], folders: [], files: [], agent: null, subAgentCandidates: [] };
    }
    const [forms, folders, files, agent, subAgentCandidates] = await Promise.all([
      getForms(request, companyId),
      getAllTrainingFolders(request, companyId),
      getAllTrainingFiles(request, companyId),
      getAgent(request, companyId, id),
      getSubAgentCandidates(request, companyId),
    ]);
    return { forms, folders, files, agent, subAgentCandidates };
  } catch (error) {
    console.error("Error loading data:", error);
    return { forms: [], folders: [], files: [], agent: null, subAgentCandidates: [] };
  }
}

export default function Route() {
  const { forms, folders, files, agent, subAgentCandidates } =
    useLoaderData<typeof loader>();
  return (
    <FormAgent
      availableForms={forms as any}
      availableFolders={folders as any}
      availableFiles={files as any}
      subAgentCandidates={subAgentCandidates as any}
      editAgent={agent as any}
      isEditing={true}
    />
  );
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );
  const { companyId, id }: any = params;

  if (request.method === "POST") {
    try {
      return await updateAgent(request, companyId, id, formData);
    } catch (error: any) {
      if (error?.status === 450) {
        return { status: "error", message: error?.message || null };
      }
      return {
        status: "error",
        message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      };
    }
  }

  return null;
}
