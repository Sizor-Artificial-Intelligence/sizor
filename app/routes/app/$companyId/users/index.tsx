import type { LoaderFunctionArgs } from "react-router";
import UsersPage from "~/components/app/users";
import { requireUserSession } from "~/data/auth.server";
import { getUsers } from "~/data/user.server";

export default function Route() {
  return <UsersPage />;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserSession(request);
  const { companyId }: any = params;
  return await getUsers(request, userId, companyId);
}
