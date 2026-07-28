import type { LoaderFunctionArgs } from "react-router";
import { destroyUserSession, requireUserSession } from "~/data/auth.server";

export async function action({ request }: LoaderFunctionArgs) {
  if (request.method !== "POST") {
    const error: any = new Error("Metodo invalido.");
    error.status = 400;
    throw error;
  }
  const userId = await requireUserSession(request);
  return destroyUserSession(request);
}

export async function loader({ request }: LoaderFunctionArgs) {
  return destroyUserSession(request);
}
