import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import {
  getPortfolioItems,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  importPortfolioItems,
} from "~/data/portfolio.server";
import PortfolioPage from "~/components/app/portfolio";
import { requireUserSession } from "~/data/auth.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserSession(request);
  const { companyId } = params;

  if (!companyId) {
    throw new Response("Company ID is required", { status: 400 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("search") || undefined;

  const portfolioData = await getPortfolioItems(
    request,
    companyId,
    page,
    10,
    search
  );

  return Response.json(portfolioData);
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserSession(request);
  const { companyId } = params;

  if (!companyId) {
    throw new Response("Company ID is required", { status: 400 });
  }

  const formData = await request.formData();
  const actionType = formData.get("_action") as string;

  try {
    switch (actionType) {
      case "create": {
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const priceStr = formData.get("price") as string;
        const imageUrl = formData.get("imageUrl") as string;

        if (!name) {
          return Response.json(
            { success: false, error: "El nombre es requerido" },
            { status: 400 }
          );
        }

        const price = priceStr ? parseFloat(priceStr) : undefined;

        const item = await createPortfolioItem(request, companyId, {
          name,
          description: description || undefined,
          price,
          imageUrl: imageUrl || undefined,
        });

        return Response.json({ success: true, item });
      }

      case "update": {
        const itemId = formData.get("itemId") as string;
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const priceStr = formData.get("price") as string;
        const imageUrl = formData.get("imageUrl") as string;

        if (!itemId) {
          return Response.json(
            { success: false, error: "ID del item es requerido" },
            { status: 400 }
          );
        }

        if (!name) {
          return Response.json(
            { success: false, error: "El nombre es requerido" },
            { status: 400 }
          );
        }

        const price = priceStr ? parseFloat(priceStr) : undefined;

        const item = await updatePortfolioItem(request, itemId, companyId, {
          name,
          description: description || undefined,
          price,
          imageUrl: imageUrl || undefined,
        });

        return Response.json({ success: true, item });
      }

      case "delete": {
        const itemId = formData.get("itemId") as string;

        if (!itemId) {
          return Response.json(
            { success: false, error: "ID del item es requerido" },
            { status: 400 }
          );
        }

        await deletePortfolioItem(request, itemId, companyId);

        return Response.json({ success: true });
      }

      case "import": {
        const items = formData.get("items") as string;
        const result = await importPortfolioItems(request, companyId, items);
        return Response.json({ ...result });
      }

      default:
        return Response.json(
          { success: false, error: "Acción no válida" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Portfolio action error:", error);
    return Response.json(
      { success: false, error: error.message || "Error al procesar la acción" },
      { status: 500 }
    );
  }
}

export default PortfolioPage;
