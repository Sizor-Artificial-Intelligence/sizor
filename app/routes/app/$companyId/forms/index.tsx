import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import FormsPage from "~/components/app/forms";
import { deleteForm, getForms } from "~/data/forms.server";

export default function Route() {
  return <FormsPage />;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { companyId }: any = params;
  return await getForms(request, companyId);
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );

  try {
    return await deleteForm(request, formData.id);
  } catch (error) {
    console.log(error);
    return { success: "error", message: "Error al eliminar el formulario" };
  }
}
