import {
  getCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  reorderCustomFields,
  toggleCustomFieldActive,
} from "~/data/customField.server";
import { requireUserSession } from "~/data/auth.server";
import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import CustomFieldsPage from "~/components/app/contacts/custom-fields";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserSession(request);
  const { companyId }: any = params;

  if (!companyId) {
    throw new Response("Company ID is required", { status: 400 });
  }

  const result = await getCustomFields(request, companyId);
  return { customFields: result?.data || [], userId };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserSession(request);
  const { companyId }: any = params;

  if (!companyId) {
    throw new Response("Company ID is required", { status: 400 });
  }

  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );
  console.log(formData);
  const action = formData?._action as string;

  switch (action) {
    case "create": {
      const result = await createCustomField(request, companyId, formData);
      return result;
    }

    case "update": {
      const fieldId = formData?.fieldId as string;
      if (!fieldId) {
        return { success: false, message: "ID de campo requerido" };
      }
      const result = await updateCustomField(
        request,
        companyId,
        fieldId,
        formData
      );
      return result;
    }

    case "delete": {
      const fieldId = formData?.fieldId as string;
      if (!fieldId) {
        return { success: false, message: "ID de campo requerido" };
      }
      const result = await deleteCustomField(request, companyId, fieldId);
      return result;
    }

    case "toggle-active": {
      const fieldId = formData?.fieldId as string;
      if (!fieldId) {
        return { success: false, message: "ID de campo requerido" };
      }
      const result = await toggleCustomFieldActive(request, companyId, fieldId);
      return result;
    }

    case "reorder": {
      const fieldIds = JSON.parse(formData?.fieldIds as string);
      if (!Array.isArray(fieldIds)) {
        return { success: false, message: "IDs de campos inválidos" };
      }
      const result = await reorderCustomFields(request, companyId, fieldIds);
      return result;
    }

    default:
      return { success: false, message: "Acción no válida" };
  }
}

export default function Route() {
  return <CustomFieldsPage />;
}
