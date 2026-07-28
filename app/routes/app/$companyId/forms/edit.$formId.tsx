import type { ActionFunctionArgs } from "react-router";
import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import FormForms from "~/components/app/forms/form";
import { getFormById, updateForm } from "~/data/forms.server";
import { requireUserSession } from "~/data/auth.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserSession(request);
  const { formId } = params;

  if (!formId) {
    throw new Response("ID de formulario no encontrado", { status: 404 });
  }

  const form = await getFormById(request, formId);

  if (!form) {
    throw new Response("Formulario no encontrado", { status: 404 });
  }

  return { form };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );
  const { formId } = params;

  if (request.method === "PUT") {
    try {
      if (!formId) {
        return { status: "error", message: "ID de formulario no encontrado" };
      }
      return await updateForm(request, formId, formData);
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

export default function EditFormRoute() {
  const { form } = useLoaderData<typeof loader>();

  return <FormForms editForm={form as any} isEditing={true} />;
}
