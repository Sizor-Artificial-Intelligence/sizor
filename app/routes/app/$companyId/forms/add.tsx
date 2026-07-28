import type { ActionFunctionArgs } from "react-router";
import FormForms from "~/components/app/forms/form";
import { createForm, updateForm } from "~/data/forms.server";

export default function Route() {
  return <FormForms />;
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );
  const { companyId }: any = params;

  if (request.method === "POST") {
    try {
      return await createForm(request, companyId, formData);
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

  if (request.method === "PUT") {
    try {
      const { formId } = formData;
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
