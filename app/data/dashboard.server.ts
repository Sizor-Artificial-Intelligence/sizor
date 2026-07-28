import { getDateTime } from "~/lib/utils.functions";
import { getPrismaTenant } from "~/data/database.server";

interface DashboardOverview {
  totalContacts: number;
  activeContacts: number;
  totalMessages: number;
  unreadMessages: number;
  totalAgents: number;
  activeAgents: number;
  totalForms: number;
  formSubmissions: number;
  totalTokens: number;
  tokensUsed: number;
  portfolioItems: number;
}

interface RecentActivity {
  id: string;
  type: "message" | "form" | "agent" | "appointment";
  title: string;
  description: string;
  time: string;
  createdAt: Date;
}

interface ChannelData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface DashboardMetrics {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  description: string;
  icon: string;
}

interface ReportDashboard {
  overview: DashboardOverview;
  recentActivity: RecentActivity[];
  channels: ChannelData[];
  metrics: DashboardMetrics[];
}

export async function getReportDashboard(
  request: Request,
  companyId: string
): Promise<ReportDashboard> {
  try {
    const prisma = await getPrismaTenant(request);

    // Obtener datos de la empresa
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        plan: true,
      },
    });

    if (!company) {
      throw new Error("Company not found");
    }

    // Fechas para cálculos
    const now = new Date(getDateTime());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Consultas paralelas para mejor rendimiento
    const [
      totalContacts,
      activeContacts,
      totalMessages,
      unreadMessages,
      totalAgents,
      activeAgents,
      totalForms,
      formSubmissions,
      portfolioItems,
      recentMessages,
      recentFormResponses,
      recentNotifications,
      channelStats,
      todayMessages,
      yesterdayMessages,
      thisWeekFormSubmissions,
      lastWeekFormSubmissions,
      thisMonthContacts,
      lastMonthContacts,
      aiResponseRate,
      lastMonthAiResponseRate,
    ] = await Promise.all([
      // Contactos
      prisma.contact.count({
        where: { companyId, active: true },
      }),
      prisma.contact.count({
        where: {
          companyId,
          active: true,
          createdAt: { gte: lastMonth },
        },
      }),

      // Mensajes
      prisma.message.count({
        where: { companyId },
      }),
      prisma.message.count({
        where: {
          companyId,
          status: "UNREAD",
        },
      }),

      // Agentes
      prisma.agent.count({
        where: { companyId },
      }),
      prisma.agent.count({
        where: {
          companyId,
          active: true,
        },
      }),

      // Formularios
      prisma.form.count({
        where: { companyId, active: true },
      }),
      prisma.formResponse.count({
        where: {
          companyId,
          createdAt: { gte: lastWeek },
        },
      }),

      // Portfolio
      prisma.portfolio.count({
        where: { companyId },
      }),

      // Actividad reciente - Mensajes
      prisma.message.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 2,
        include: {
          contact: {
            select: { name: true, lastName: true },
          },
        },
      }),

      // Actividad reciente - Formularios
      prisma.formResponse.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          form: {
            select: { name: true },
          },
        },
      }),

      // Actividad reciente - Notificaciones
      prisma.notification.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 1,
      }),

      // Estadísticas por canal (basado en el campo origin de Contact)
      prisma.contact.groupBy({
        by: ["origin"],
        where: { companyId, active: true },
        _count: { origin: true },
      }),

      // Mensajes de hoy
      prisma.message.count({
        where: {
          companyId,
          createdAt: { gte: today },
        },
      }),

      // Mensajes de ayer
      prisma.message.count({
        where: {
          companyId,
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
      }),

      // Formularios esta semana
      prisma.formResponse.count({
        where: {
          companyId,
          createdAt: { gte: lastWeek },
        },
      }),

      // Formularios semana pasada
      prisma.formResponse.count({
        where: {
          companyId,
          createdAt: {
            gte: new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000),
            lt: lastWeek,
          },
        },
      }),

      // Contactos este mes
      prisma.contact.count({
        where: {
          companyId,
          active: true,
          createdAt: { gte: lastMonth },
        },
      }),

      // Contactos mes anterior
      prisma.contact.count({
        where: {
          companyId,
          active: true,
          createdAt: {
            gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 1),
            lt: lastMonth,
          },
        },
      }),

      // Tasa de respuestas IA (mensajes con respondWithIa = true)
      prisma.contact.count({
        where: {
          companyId,
          respondWithIa: true,
        },
      }),

      // Tasa de respuestas IA del mes anterior para comparación
      prisma.contact.count({
        where: {
          companyId,
          respondWithIa: true,
          createdAt: {
            gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 1),
            lt: lastMonth,
          },
        },
      }),
    ]);

    // Calcular tokens usados y disponibles (validar valores)
    const totalTokens = company.plan?.maxTokens || 0;
    const tokensUsed = company.plan?.tokensUsed || 0;

    // Asegurar que los valores no sean negativos
    const safeTotalTokens = Math.max(0, totalTokens);
    const safeTokensUsed = Math.max(0, Math.min(tokensUsed, safeTotalTokens));

    // Procesar canales de comunicación
    const channelMap: { [key: string]: { name: string; color: string } } = {
      WhatsApp: { name: "WhatsApp", color: "bg-green-500" },
      Facebook: { name: "Facebook", color: "bg-blue-500" },
      Instagram: { name: "Instagram", color: "bg-pink-500" },
      Manual: { name: "Web", color: "bg-gray-500" },
    };

    const totalChannelContacts = channelStats.reduce(
      (sum, stat) => sum + stat._count.origin,
      0
    );
    const channels: ChannelData[] = channelStats.map((stat) => {
      const channelInfo = channelMap[stat.origin] || {
        name: stat.origin,
        color: "bg-gray-500",
      };
      const percentage =
        totalChannelContacts > 0
          ? Math.round((stat._count.origin / totalChannelContacts) * 100)
          : 0;

      return {
        name: channelInfo.name,
        count: stat._count.origin || 0,
        percentage: isNaN(percentage) ? 0 : percentage,
        color: channelInfo.color,
      };
    });

    // Procesar actividad reciente
    const recentActivity: RecentActivity[] = [];

    // Agregar mensajes recientes
    recentMessages.forEach((message, index) => {
      recentActivity.push({
        id: `message-${message.id}`,
        type: "message",
        title:
          `Nuevo mensaje de ${message.contact.name} ${message.contact.lastName || ""}`.trim(),
        description: message.content || "Mensaje sin contenido",
        time: getRelativeTime(message.createdAt),
        createdAt: message.createdAt,
      });
    });

    // Agregar formularios recientes
    recentFormResponses.forEach((response, index) => {
      recentActivity.push({
        id: `form-${response.id}`,
        type: "form",
        title: "Formulario completado",
        description: `${response.form.name}`,
        time: getRelativeTime(response.createdAt),
        createdAt: response.createdAt,
      });
    });

    // Agregar notificaciones recientes
    recentNotifications.forEach((notification, index) => {
      recentActivity.push({
        id: `notification-${notification.id}`,
        type: "agent",
        title: notification.title,
        description: notification.message,
        time: getRelativeTime(notification.createdAt),
        createdAt: notification.createdAt,
      });
    });

    // Ordenar actividad reciente por fecha
    recentActivity.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    // Calcular métricas con cambios
    const messagesChange =
      yesterdayMessages > 0
        ? Math.round(
            ((todayMessages - yesterdayMessages) / yesterdayMessages) * 100
          )
        : 0;

    const formChange =
      lastWeekFormSubmissions > 0
        ? Math.round(
            ((thisWeekFormSubmissions - lastWeekFormSubmissions) /
              lastWeekFormSubmissions) *
              100
          )
        : 0;

    const contactsChange =
      lastMonthContacts > 0
        ? Math.round(
            ((thisMonthContacts - lastMonthContacts) / lastMonthContacts) * 100
          )
        : 0;

    const aiResponsePercentage =
      totalContacts > 0
        ? Math.round((aiResponseRate / totalContacts) * 100)
        : 0;

    // Calcular cambio de respuestas IA vs mes anterior
    const lastMonthAiPercentage =
      lastMonthContacts > 0
        ? Math.round((lastMonthAiResponseRate / lastMonthContacts) * 100)
        : 0;

    const aiResponseChange =
      lastMonthAiPercentage > 0
        ? Math.round(
            ((aiResponsePercentage - lastMonthAiPercentage) /
              lastMonthAiPercentage) *
              100
          )
        : 0;

    // Validar que los valores no sean NaN
    const safeMessagesChange = isNaN(messagesChange) ? 0 : messagesChange;
    const safeFormChange = isNaN(formChange) ? 0 : formChange;
    const safeContactsChange = isNaN(contactsChange) ? 0 : contactsChange;
    const safeAiResponsePercentage = isNaN(aiResponsePercentage)
      ? 0
      : aiResponsePercentage;
    const safeAiResponseChange = isNaN(aiResponseChange) ? 0 : aiResponseChange;

    // Crear métricas del dashboard
    const metrics: DashboardMetrics[] = [
      {
        title: "Contactos Activos",
        value: activeContacts.toString(),
        change: `${safeContactsChange >= 0 ? "+" : ""}${safeContactsChange}%`,
        changeType: safeContactsChange >= 0 ? "positive" : "negative",
        description: "vs mes anterior",
        icon: "Users",
      },
      {
        title: "Mensajes Hoy",
        value: todayMessages.toString(),
        change: `${safeMessagesChange >= 0 ? "+" : ""}${safeMessagesChange}%`,
        changeType: safeMessagesChange >= 0 ? "positive" : "negative",
        description: "vs ayer",
        icon: "MessageSquare",
      },
      //   {
      //     title: "Respuestas IA",
      //     value: `${safeAiResponsePercentage}%`,
      //     change: `${safeAiResponseChange >= 0 ? "+" : ""}${safeAiResponseChange}%`,
      //     changeType: safeAiResponseChange >= 0 ? "positive" : "negative",
      //     description: "vs mes anterior",
      //     icon: "Bot",
      //   },
      {
        title: "Formularios Completados",
        value: thisWeekFormSubmissions.toString(),
        change: `${safeFormChange >= 0 ? "+" : ""}${safeFormChange}%`,
        changeType: safeFormChange >= 0 ? "positive" : "negative",
        description: "Esta semana",
        icon: "FileText",
      },
    ];

    return {
      overview: {
        totalContacts: Math.max(0, totalContacts),
        activeContacts: Math.max(0, activeContacts),
        totalMessages: Math.max(0, totalMessages),
        unreadMessages: Math.max(0, unreadMessages),
        totalAgents: Math.max(0, totalAgents),
        activeAgents: Math.max(0, activeAgents),
        totalForms: Math.max(0, totalForms),
        formSubmissions: Math.max(0, thisWeekFormSubmissions),
        totalTokens: safeTotalTokens,
        tokensUsed: safeTokensUsed,
        portfolioItems: Math.max(0, portfolioItems),
      },
      recentActivity: recentActivity.slice(0, 4), // Limitar a 4 elementos
      channels,
      metrics,
    };
  } catch (error) {
    console.log(error);
    throw `Error: ${error}`;
  }
}

// Calcular tiempo relativo
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Hace un momento";
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return `Hace ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7)
    return `Hace ${diffInDays} día${diffInDays > 1 ? "s" : ""}`;

  return `Hace ${Math.floor(diffInDays / 7)} semana${Math.floor(diffInDays / 7) > 1 ? "s" : ""}`;
}
