import {
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import FormAgent from "~/components/app/agents/form";
import { createAgent, getSubAgentCandidates } from "~/data/agents.server";
import { getForms } from "~/data/forms.server";
import {
  getAllTrainingFolders,
  getAllTrainingFiles,
} from "~/data/training.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const { companyId }: any = params;
    const [forms, folders, files, subAgentCandidates] = await Promise.all([
      getForms(request, companyId),
      getAllTrainingFolders(request, companyId),
      getAllTrainingFiles(request, companyId),
      getSubAgentCandidates(request, companyId),
    ]);
    return { forms, folders, files, subAgentCandidates };
  } catch (error) {
    console.error("Error loading data:", error);
    return { forms: [], folders: [], files: [], subAgentCandidates: [] };
  }
}

export default function Route() {
  const { forms, folders, files, subAgentCandidates } =
    useLoaderData<typeof loader>();
  return (
    <FormAgent
      availableForms={forms as any}
      availableFolders={folders as any}
      availableFiles={files as any}
      subAgentCandidates={subAgentCandidates as any}
    />
  );
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData(),
  );
  const { companyId }: any = params;

  if (request.method === "POST") {
    try {
      return await createAgent(request, companyId, formData);
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
