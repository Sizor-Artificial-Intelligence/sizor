import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Users,
  MessageSquare,
  Bot,
  FileText,
  Calendar,
  Activity,
  Globe,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Link, useLoaderData, useNavigate } from "react-router";
import usePath from "~/hooks/usePath";
import { useRequiredPayment } from "~/hooks/useRequiredPayment";
import { useEffect } from "react";
import { useDaysToExpireSubscription } from "~/hooks/useDaysToExpireSubscription";
import { useLicense } from "~/hooks/useLicense";

// Mapeo de iconos para las métricas
const iconMap = {
  Users,
  MessageSquare,
  Bot,
  FileText,
  Calendar,
  Activity,
  Globe,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
};

export default function DashboardPage() {
  const PATH = usePath();
  const dashboardData = useLoaderData();
  const requiredPayment = useRequiredPayment();
  const daysToExpireSubscription = useDaysToExpireSubscription();
  const navigate = useNavigate();
  const license = useLicense();

  // Si requiere pago, mostrar solo el mensaje de pago
  if (requiredPayment?.requiredPayment && !license?.isSon) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>Pago Requerido</span>
            </CardTitle>
            <CardDescription>
              Debes realizar el pago para continuar usando el servicio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tu suscripción requiere renovación. Por favor, realiza el pago
              para no interrumpir el servicio.
            </p>
            <Button
              onClick={() => navigate(`${PATH}/pay-license`)}
              className="w-full cursor-pointer"
            >
              Ir a Pagar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si faltan 3 días o menos para expirar, mostrar advertencia
  const showExpirationWarning =
    daysToExpireSubscription <= 3 && daysToExpireSubscription > 0;

  return (
    <div className="min-h-screen">
      <div className="border-b border-border">
        <div className="flex items-center justify-between p-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Panel del control
            </h1>
            <p className="text-muted-foreground mt-1"></p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Advertencia de expiración próxima */}
        {showExpirationWarning && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-400">
                <AlertCircle className="h-5 w-5" />
                <span>Renovación de Suscripción Próxima</span>
              </CardTitle>
              <CardDescription className="text-yellow-600 dark:text-yellow-300">
                Tu suscripción expirará en {daysToExpireSubscription} día
                {daysToExpireSubscription !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Para no interrumpir el servicio, te recomendamos realizar el
                pago antes de que expire tu suscripción. Esto garantizará la
                continuidad de todos los servicios.
              </p>
              <Button
                onClick={() => navigate(`${PATH}/pay-license`)}
                className="w-full sm:w-auto cursor-pointer"
              >
                Renovar Suscripción Ahora
              </Button>
            </CardContent>
          </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardData.metrics.map((metric: any, index: number) => {
            const IconComponent = iconMap[metric.icon as keyof typeof iconMap];
            return (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-200"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  {IconComponent && (
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardHeader>
                <CardContent className="-mt-2">
                  <div className="text-2xl font-bold text-foreground">
                    {metric.value}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span
                      className={`font-medium ${
                        metric.changeType === "positive"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {metric.change}
                    </span>
                    <span>{metric.description}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Actividad Reciente</span>
              </CardTitle>
              <CardDescription>
                Últimas interacciones y eventos en tu plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardData.recentActivity.map((activity: any) => {
                const ActivityIcon =
                  iconMap[
                    activity.type === "message"
                      ? "MessageSquare"
                      : activity.type === "form"
                        ? "FileText"
                        : activity.type === "agent"
                          ? "Bot"
                          : "Calendar"
                  ];
                return (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-full bg-muted ${
                        activity.type === "message"
                          ? "text-blue-500"
                          : activity.type === "form"
                            ? "text-green-500"
                            : activity.type === "agent"
                              ? "text-purple-500"
                              : "text-orange-500"
                      }`}
                    >
                      {ActivityIcon && <ActivityIcon className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Canales de Comunicación</span>
              </CardTitle>
              <CardDescription>
                Distribución de contactos por canal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardData.channels.map((channel: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {channel.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {channel.count}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${channel.color}`}
                      style={{ width: `${channel.percentage || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Uso de Créditos</span>
              </CardTitle>
              <CardDescription>Consumo de créditos de IA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Usados</span>
                  <span className="text-sm font-medium">
                    {dashboardData.overview.tokensUsed.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Disponibles
                  </span>
                  <span className="text-sm font-medium">
                    {dashboardData.overview.totalTokens.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${
                        dashboardData.overview.totalTokens > 0
                          ? (dashboardData.overview.tokensUsed /
                              dashboardData.overview.totalTokens) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold text-foreground">
                    {dashboardData.overview.totalTokens > 0
                      ? Math.round(
                          (dashboardData.overview.tokensUsed /
                            dashboardData.overview.totalTokens) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span>Agentes IA</span>
              </CardTitle>
              <CardDescription>
                Estado de tus agentes automatizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-foreground">Activos</span>
                </div>
                <span className="text-sm font-medium">
                  {dashboardData.overview.activeAgents}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-foreground">Inactivos</span>
                </div>
                <span className="text-sm font-medium">
                  {dashboardData.overview.totalAgents -
                    dashboardData.overview.activeAgents}
                </span>
              </div>
              <div className="pt-2">
                <Link to={`${PATH}/agents/`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full cursor-pointer"
                  >
                    Gestionar Agentes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Formularios</span>
              </CardTitle>
              <CardDescription>Rendimiento de formularios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Total Formularios
                </span>
                <span className="text-sm font-medium">
                  {dashboardData.overview.totalForms}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Envíos Esta Semana
                </span>
                <span className="text-sm font-medium">
                  {dashboardData.overview.formSubmissions}
                </span>
              </div>
              <div className="pt-2">
                <Link to={`${PATH}/forms/`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full cursor-pointer"
                  >
                    Ver Formularios
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
