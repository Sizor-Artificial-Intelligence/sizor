import { getEscapedValue, roundNumber } from "~/lib/utils.functions";
import { getPrismaTenant } from "~/data/database.server";

export interface PortfolioListResult {
  items: any[];
  total: number;
  page: number;
  totalPages: number;
}

// Obtener portafolio
export async function getPortfolioItems(
  request: Request,
  companyId: string,
  page: number = 1,
  perPage: number = 30,
  search?: string
): Promise<PortfolioListResult> {
  try {
    const prisma = await getPrismaTenant(request);

    const skip = (page - 1) * perPage;

    // Construir filtros de búsqueda
    const whereClause: any = {
      companyId,
    };

    if (search && search.trim()) {
      whereClause.OR = [
        {
          name: {
            contains: search.trim(),
          },
        },
        {
          description: {
            contains: search.trim(),
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.portfolio.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: perPage,
      }),
      prisma.portfolio.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(total / perPage);

    return {
      items,
      total,
      page,
      totalPages,
    };
  } catch (error) {
    console.error("Error getting portfolio items:", error);
    throw new Error("Error al obtener items del portafolio");
  }
}

// Crear item del portafolio
export async function createPortfolioItem(
  request: Request,
  companyId: string,
  data: {
    name: string;
    description?: string;
    price?: number;
    imageUrl?: string;
  }
): Promise<any> {
  try {
    const prisma = await getPrismaTenant(request);

    const item = await prisma.portfolio.create({
      data: {
        companyId,
        name: data.name,
        description: data.description || null,
        price: data.price || null,
        imageUrl: data.imageUrl || null,
      },
    });

    return item;
  } catch (error) {
    console.error("Error creating portfolio item:", error);
    throw new Error("Error al crear item del portafolio");
  }
}

// Actualizar item del portafolio
export async function updatePortfolioItem(
  request: Request,
  itemId: string,
  companyId: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
  }
): Promise<any> {
  try {
    const prisma = await getPrismaTenant(request);

    const existingItem = await prisma.portfolio.findFirst({
      where: {
        id: itemId,
        companyId,
      },
    });

    if (!existingItem) {
      throw new Error("Item no encontrado");
    }

    const item = await prisma.portfolio.update({
      where: {
        id: itemId,
      },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description || null,
        }),
        ...(data.price !== undefined && { price: data.price || null }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
      },
    });

    return item;
  } catch (error) {
    console.error("Error updating portfolio item:", error);
    throw new Error("Error al actualizar item del portafolio");
  }
}

// Eliminar item del portafolio
export async function deletePortfolioItem(
  request: Request,
  itemId: string,
  companyId: string
): Promise<boolean> {
  try {
    const prisma = await getPrismaTenant(request);

    const existingItem = await prisma.portfolio.findFirst({
      where: {
        id: itemId,
        companyId,
      },
    });

    if (!existingItem) {
      throw new Error("Item no encontrado");
    }

    await prisma.portfolio.delete({
      where: {
        id: itemId,
      },
    });

    return true;
  } catch (error) {
    console.error("Error deleting portfolio item:", error);
    throw new Error("Error al eliminar item del portafolio");
  }
}

// Importar items del portafolio
export async function importPortfolioItems(
  request: Request,
  companyId: string,
  items: string
): Promise<any> {
  try {
    const prisma = await getPrismaTenant(request);
    const itemsData = JSON.parse(items);

    if (itemsData.length === 0) {
      return {
        success: false,
        message: "No hay items válidos para importar",
      };
    }

    const result = await prisma.portfolio.createMany({
      data: itemsData.map((item: any) => {
        return {
          companyId,
          name: getEscapedValue(item.name),
          description: getEscapedValue(item.description),
          price: roundNumber(getEscapedValue(item.price)) || null,
        };
      }),
    });

    return {
      success: true,
      message: `${result.count} items importados correctamente`,
    };
  } catch (error) {
    console.error("Error importing portfolio items:", error);
    return {
      success: false,
      message: "Error al importar items del portafolio",
    };
  }
}
