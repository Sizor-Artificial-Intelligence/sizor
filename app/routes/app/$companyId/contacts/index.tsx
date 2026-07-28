import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import ContactsPage from "~/components/app/contacts";
import {
  createContact,
  getContacts,
  importContacts,
  exportContacts,
  updateContact,
} from "~/data/contact.server";

export default function Route() {
  return <ContactsPage />;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { companyId }: any = params;
  return await getContacts(request, companyId);
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );
  const { companyId }: any = params;

  if (request.method === "POST") {
    try {
      const action = formData?._action as string;

      if (action === "update") {
        const contactId = formData?.contactId as string;
        if (!contactId) {
          return { success: false, message: "ID de contacto requerido" };
        }
        return await updateContact(request, companyId, contactId, formData);
      }

      return await createContact(request, companyId, formData);
    } catch (error: any) {
      if (error?.status === 450) {
        return { message: error?.message || null };
      }
      return {
        message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      };
    }
  }

  if (request.method === "PATCH") {
    try {
      const type = formData?.type;
      if (type === "export") {
        return await exportContacts(request, companyId);
      }

      return await importContacts(request, companyId, formData);
    } catch (error: any) {
      if (error?.status === 450) {
        return { message: error?.message || null };
      }
      return {
        message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      };
    }
  }

  return null;
}
