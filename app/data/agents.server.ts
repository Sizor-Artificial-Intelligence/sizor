import { getEscapedValue } from "~/lib/utils.functions";
import { getPrismaTenant } from "~/data/database.server";
import { getTenantId } from "~/data/auth.server";
import { syncAgentTrainingRulesToQdrant } from "~/data/qdrant.server";

const RESPONSE_MODES = ["instructions_only", "qa_only", "both"] as const;

function parseTrainingRules(formData: any): Array<{ trigger: string; response: string }> {
  try {
    const raw = formData?.trainingRules;
    if (!raw || raw === "[]") return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (r: unknown) =>
          r &&
          typeof r === "object" &&
          "trigger" in r &&
          "response" in r &&
          typeof (r as { trigger: unknown }).trigger === "string" &&
          typeof (r as { response: unknown }).response === "string"
      )
      .map((r: { trigger: string; response: string }) => ({
        trigger: String(r.trigger).trim(),
        response: String(r.response).trim(),
      }))
      .filter((r) => r.trigger && r.response);
  } catch {
    return [];
  }
}

function parseSubAgentIds(formData: any): string[] {
  try {
    const raw = formData?.subAgentIds;
    if (!raw || raw === "[]") return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id: unknown) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

// Crear un agente (específico o multiagente)
export async function createAgent(
  request: Request,
  companyId: string,
  formData: any
) {
  try {
    const prisma = await getPrismaTenant(request);
    const agentType = getEscapedValue(formData?.agentType) || "specific";

    // Multiagente: solo nombre + subagentes
    if (agentType === "multiagent") {
      const name = getEscapedValue(formData?.name);
      if (!name || String(name).trim().length < 3) {
        throw new Error("El nombre del agente es obligatorio y debe tener al menos 3 caracteres");
      }
      const subAgentIds = parseSubAgentIds(formData);
      if (subAgentIds.length < 2) {
        throw new Error("Un multiagente debe tener al menos 2 subagentes");
      }

      const agent = await prisma.agent.create({
        data: {
          name: String(name).trim(),
          instructions: "Agente orquestador que delega a subagentes según el rol del mensaje del usuario.",
          responseMode: "instructions_only",
          companyId,
          isMultiAgent: true,
          SubAgentsAsMain: {
            create: subAgentIds.map((subAgentId: string, order: number) => ({
              subAgentId,
              role: `rol_${order}`,
              order,
            })),
          },
        },
      });

      await prisma.plan.updateMany({
        where: { Company: { some: { id: companyId } } },
        data: { agentsUsed: { increment: 1 } },
      });

      return { status: "success", message: "Multiagente creado correctamente", agent };
    }

    // Agente específico
    const name = getEscapedValue(formData?.name);
    if (!name || String(name).trim().length < 3) {
      throw new Error("El nombre del agente es obligatorio y debe tener al menos 3 caracteres");
    }

    const instructionsRaw = getEscapedValue(formData?.instructions);
    const instructions =
      instructionsRaw ||
      "Responde según las instrucciones definidas. Si no hay regla que aplique, indica que no tienes esa información.";

    let responseMode = getEscapedValue(formData?.responseMode) || "instructions_only";
    if (!RESPONSE_MODES.includes(responseMode as (typeof RESPONSE_MODES)[number])) {
      responseMode = "instructions_only";
    }

    // Habilidades (schema Agent)
    const canManageAppointments = !!getEscapedValue(formData?.canManageAppointments);
    const canCollectFormData = !!getEscapedValue(formData?.canCollectFormData);
    const canAccessPortfolio = !!getEscapedValue(formData?.canAccessPortfolio);
    const formId = canCollectFormData ? getEscapedValue(formData?.formId) : null;

    // Restricciones (JSON string)
    const limitations = formData?.limitations || "[]";
    const escalationRules = formData?.escalationRules || "[]";

    // Base de conocimiento: carpetas y archivos (JSON array de IDs)
    let selectedFolders: string[] = [];
    let selectedFiles: string[] = [];

    try {
      if (formData?.trainingFolders && formData.trainingFolders !== "[]") {
        const parsed = JSON.parse(formData.trainingFolders);
        selectedFolders = Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error("Error parsing trainingFolders:", error);
    }

    try {
      if (formData?.trainingFiles && formData.trainingFiles !== "[]") {
        const parsed = JSON.parse(formData.trainingFiles);
        selectedFiles = Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error("Error parsing trainingFiles:", error);
    }

    const trainingRules = parseTrainingRules(formData);

    const agent = await prisma.agent.create({
      data: {
        name: String(name).trim(),
        instructions,
        responseMode,
        canManageAppointments,
        canCollectFormData,
        formId,
        limitations,
        escalationRules,
        companyId,
        canAccessPortfolio,
        TrainingFolders: {
          create: selectedFolders.map((folderId: string) => ({
            folderId,
          })),
        },
        TrainingFiles: {
          create: selectedFiles.map((fileId: string) => ({
            fileId,
          })),
        },
        TrainingRules: {
          create: trainingRules.map((r, i) => ({
            trigger: r.trigger,
            response: r.response,
            order: i,
          })),
        },
      },
    });

    await prisma.plan.updateMany({
      where: {
        Company: {
          some: { id: companyId },
        },
      },
      data: {
        agentsUsed: {
          increment: 1,
        },
      },
    });

    if (
      (responseMode === "qa_only" || responseMode === "both") &&
      trainingRules.length > 0
    ) {
      try {
        const tenantId = await getTenantId(request);
        const withRules = await prisma.agent.findUnique({
          where: { id: agent.id },
          include: { TrainingRules: { orderBy: [{ order: "asc" }] } },
        });
        const rules = (withRules?.TrainingRules || []).map((r) => ({
          id: r.id,
          trigger: r.trigger,
          response: r.response,
        }));
        await syncAgentTrainingRulesToQdrant(tenantId, agent.id, rules);
      } catch (err) {
        console.error("Error syncing training rules to Qdrant:", err);
      }
    }

    return { status: "success", message: "Agente creado correctamente", agent };
  } catch (error) {
    console.log(error);
    throw new Error("Error creating agent");
  }
}

// Obtener agentes que pueden ser subagentes (no multiagente)
export async function getSubAgentCandidates(request: Request, companyId: string) {
  try {
    const prisma = await getPrismaTenant(request);
    return await prisma.agent.findMany({
      where: { companyId, isMultiAgent: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.log(error);
    return [];
  }
}

// Obtener los agentes
export async function getAgents(request: Request, companyId: string) {
  try {
    const prisma = await getPrismaTenant(request);
    return await prisma.agent.findMany({
      where: {
        companyId,
      },
    });
  } catch (error) {
    console.log(error);
    throw new Error("Error getting agents");
  }
}

// Obtener un agente
export async function getAgent(
  request: Request,
  companyId: string,
  id: string
) {
  try {
    const prisma = await getPrismaTenant(request);
    return await prisma.agent.findUnique({
      where: { id, companyId },
      include: {
        TrainingFolders: {
          include: {
            folder: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        TrainingFiles: {
          include: {
            file: {
              select: {
                id: true,
                name: true,
                fileName: true,
                fileType: true,
              },
            },
          },
        },
        TrainingRules: {
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        },
        SubAgentsAsMain: {
          include: {
            subAgent: { select: { id: true, name: true } },
          },
          orderBy: { order: "asc" },
        },
      },
    });
  } catch (error) {
    console.log(error);
    throw new Error("Error getting agent");
  }
}

// Actualizar un agente
export async function updateAgent(
  request: Request,
  companyId: string,
  id: string,
  formData: any
) {
  try {
    const prisma = await getPrismaTenant(request);
    const agentType = getEscapedValue(formData?.agentType);

    // Multiagente: solo nombre + subagentes
    if (agentType === "multiagent") {
      const name = getEscapedValue(formData?.name);
      if (!name || String(name).trim().length < 3) {
        throw new Error("El nombre del agente es obligatorio y debe tener al menos 3 caracteres");
      }
      const subAgentIds = parseSubAgentIds(formData);
      if (subAgentIds.length < 2) {
        throw new Error("Un multiagente debe tener al menos 2 subagentes");
      }

      await prisma.agentSubAgent.deleteMany({ where: { mainAgentId: id } });

      await prisma.agent.update({
        where: { id, companyId },
        data: {
          name: String(name).trim(),
          SubAgentsAsMain: {
            create: subAgentIds.map((subAgentId: string, order: number) => ({
              subAgentId,
              role: `rol_${order}`,
              order,
            })),
          },
        },
      });

      return {
        status: "success",
        message: "Multiagente actualizado correctamente",
      };
    }

    const name = getEscapedValue(formData?.name);
    const instructions = getEscapedValue(formData?.instructions);
    let responseMode = getEscapedValue(formData?.responseMode) || "instructions_only";
    if (!RESPONSE_MODES.includes(responseMode as (typeof RESPONSE_MODES)[number])) {
      responseMode = "instructions_only";
    }
    const canManageAppointments = getEscapedValue(
      formData?.canManageAppointments
    );
    const canCollectFormData = getEscapedValue(formData?.canCollectFormData);
    const canAccessPortfolio = getEscapedValue(formData?.canAccessPortfolio);
    const formId = getEscapedValue(formData?.formId);
    const limitations = formData?.limitations || "[]";
    const escalationRules = formData?.escalationRules || "[]";

    // Parsear carpetas y archivos seleccionados
    let selectedFolders: string[] = [];
    let selectedFiles: string[] = [];

    try {
      if (formData?.trainingFolders && formData.trainingFolders !== "[]") {
        selectedFolders = JSON.parse(formData.trainingFolders);
      }
    } catch (error) {
      console.error("Error parsing trainingFolders:", error);
    }

    try {
      if (formData?.trainingFiles && formData.trainingFiles !== "[]") {
        selectedFiles = JSON.parse(formData.trainingFiles);
      }
    } catch (error) {
      console.error("Error parsing trainingFiles:", error);
    }

    const trainingRules = parseTrainingRules(formData);

    // Eliminar relaciones existentes y crear nuevas
    await prisma.agentTrainingFolder.deleteMany({
      where: { agentId: id },
    });
    await prisma.agentTrainingFile.deleteMany({
      where: { agentId: id },
    });
    await prisma.agentTrainingRule.deleteMany({
      where: { agentId: id },
    });

    const agent = await prisma.agent.update({
      where: { id, companyId },
      data: {
        name,
        instructions,
        responseMode,
        canManageAppointments,
        canCollectFormData,
        formId,
        limitations,
        escalationRules,
        canAccessPortfolio,
        TrainingFolders: {
          create: selectedFolders.map((folderId: string) => ({
            folderId,
          })),
        },
        TrainingFiles: {
          create: selectedFiles.map((fileId: string) => ({
            fileId,
          })),
        },
        TrainingRules: {
          create: trainingRules.map((r, i) => ({
            trigger: r.trigger,
            response: r.response,
            order: i,
          })),
        },
      },
    });

    if (responseMode === "qa_only" || responseMode === "both") {
      try {
        const tenantId = await getTenantId(request);
        const withRules = await prisma.agent.findUnique({
          where: { id, companyId },
          include: { TrainingRules: { orderBy: [{ order: "asc" }] } },
        });
        const rules = (withRules?.TrainingRules || []).map((r) => ({
          id: r.id,
          trigger: r.trigger,
          response: r.response,
        }));
        await syncAgentTrainingRulesToQdrant(tenantId, id, rules);
      } catch (err) {
        console.error("Error syncing training rules to Qdrant:", err);
      }
    } else {
      try {
        const tenantId = await getTenantId(request);
        await syncAgentTrainingRulesToQdrant(tenantId, id, []);
      } catch (err) {
        console.error("Error clearing training rules from Qdrant:", err);
      }
    }

    return {
      status: "success",
      message: "Agente actualizado correctamente",
      agent,
    };
  } catch (error) {
    console.log(error);
    throw new Error("Error updating agent");
  }
}

// Eliminar un agente
export async function deleteAgent(
  request: Request,
  companyId: string,
  id: string
) {
  try {
    const prisma = await getPrismaTenant(request);
    const plan = await prisma.plan.findFirst({
      where: {
        Company: {
          some: { id: companyId },
        },
      },
    });

    if (plan?.agentId === id) {
      return {
        status: "error",
        message:
          "No se puede eliminar el agente porque es el agente por defecto para el chat",
      };
    }

    const agent = await prisma.agent.findUnique({
      where: { id, companyId },
      include: {
        _count: {
          select: {
            Contact: true,
          },
        },
      },
    });

    if (agent?._count?.Contact && agent?._count?.Contact > 0) {
      return {
        status: "error",
        message:
          "No se puede eliminar el agente porque tiene contactos asignados",
      };
    }

    await prisma.agent.delete({ where: { id, companyId } });

    await prisma.plan.updateMany({
      where: {
        Company: {
          some: { id: companyId },
        },
      },
      data: {
        agentsUsed: { decrement: 1 },
      },
    });

    return { status: "success", message: "Agente eliminado correctamente" };
  } catch (error) {
    console.log(error);
    throw new Error("Error deleting agent");
  }
}
