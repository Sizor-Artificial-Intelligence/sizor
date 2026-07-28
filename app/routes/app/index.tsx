import { Outlet, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { redirectPathApp, requireUserSession } from "~/data/auth.server";
import LayoutApp from "~/layout";

export default function Route() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <LayoutApp
      initialUnreadMessages={loaderData?.initialUnreadMessages ?? 0}
      initialUnreadSmartInbox={loaderData?.initialUnreadSmartInbox ?? 0}
      initialUnreadNotifications={loaderData?.notifications ?? 0}
    >
      <Outlet />
    </LayoutApp>
  );
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserSession(request, params?.companyId || null);
  return await redirectPathApp(request, userId, params);
}
