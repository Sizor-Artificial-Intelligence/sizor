import {
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import FormUser from "~/components/app/users/form";
import { getUser, updateUser, getUserCompanies } from "~/data/user.server";

export default function Route() {
  const data = useLoaderData<any>();
  return (
    <FormUser
      isEditing
      initialData={data.user}
      userCompanies={data.userCompanies}
    />
  );
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { userId }: any = params;
  const [user, userCompanies] = await Promise.all([
    getUser(request, userId),
    getUserCompanies(request, userId),
  ]);

  return {
    user,
    userCompanies,
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { userId }: any = params;
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );

  if (request.method === "POST") {
    try {
      return await updateUser(request, formData, userId);
    } catch (error: any) {
      if (error?.status === 450) {
        return {
          status: "error",
          message: error?.message || null,
        };
      }
      return {
        status: "error",
        message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      };
    }
  }
  return null;
}
