export const countries: {
  code: string;
  name: string;
  flag: string;
  abbr: string;
}[] = [
    { code: "+54", name: "Argentina", flag: "🇦🇷", abbr: "AR" },
    { code: "+591", name: "Bolivia", flag: "🇧🇴", abbr: "BO" },
    { code: "+56", name: "Chile", flag: "🇨🇱", abbr: "CL" },
    { code: "+57", name: "Colombia", flag: "🇨🇴", abbr: "CO" },
    { code: "+506", name: "Costa Rica", flag: "🇨🇷", abbr: "CR" },
    { code: "+53", name: "Cuba", flag: "🇨🇺", abbr: "CU" },
    { code: "+1", name: "República Dominicana", flag: "🇩🇴", abbr: "DO" },
    { code: "+593", name: "Ecuador", flag: "🇪🇨", abbr: "EC" },
    { code: "+503", name: "El Salvador", flag: "🇸🇻", abbr: "SV" },
    { code: "+502", name: "Guatemala", flag: "🇬🇹", abbr: "GT" },
    { code: "+504", name: "Honduras", flag: "🇭🇳", abbr: "HN" },
    { code: "+52", name: "México", flag: "🇲🇽", abbr: "MX" },
    { code: "+505", name: "Nicaragua", flag: "🇳🇮", abbr: "NI" },
    { code: "+507", name: "Panamá", flag: "🇵🇦", abbr: "PA" },
    { code: "+595", name: "Paraguay", flag: "🇵🇾", abbr: "PY" },
    { code: "+51", name: "Perú", flag: "🇵🇪", abbr: "PE" },
    { code: "+1", name: "Puerto Rico", flag: "🇵🇷", abbr: "PR" },
    { code: "+598", name: "Uruguay", flag: "🇺🇾", abbr: "UY" },
    { code: "+58", name: "Venezuela", flag: "🇻🇪", abbr: "VE" },
  ];

export const ROUTES = [
  {
    order: 0,
    key: "dashboard",
    icon: "BarChart3",
    label: "Panel de control",
    to: "",
    nameRoute: "routes/app/$companyId/index",
  },
  {
    order: 1,
    key: "contact",
    icon: "User",
    label: "Contactos",
    to: "contacts",
    // category: "Gestión",
    nameRoute:
      "routes/app/$companyId/contacts/index|routes/app/$companyId/contacts/custom-fields",
  },
  {
    order: 2,
    key: "chat",
    icon: "MessageCircle",
    label: "Chat en vivo",
    to: "chat",
    // category: "Comunicación",
    nameRoute:
      "routes/app/$companyId/chat/index|routes/app/$companyId/chat/details",
  },
  {
    order: 3,
    key: "forms",
    icon: "SquarePen",
    label: "Formularios",
    to: "forms",
    // category: "Gestión",
    nameRoute:
      "routes/app/$companyId/forms/index|routes/app/$companyId/forms/add|routes/app/$companyId/forms/edit.$formId|routes/app/$companyId/forms/responses.$formId",
  },
  {
    order: 4,
    key: "smart-inbox",
    icon: "Inbox",
    label: "Inbox inteligente",
    to: "smart-inbox",
    // category: "Comunicación",
    nameRoute: "routes/app/$companyId/smart-inbox/index",
  },
  {
    order: 5,
    key: "portfolio",
    icon: "FolderOpen",
    label: "Portafolio",
    to: "portfolio",
    // category: "Gestión",
    nameRoute: "routes/app/$companyId/portfolio/index",
  },
  {
    order: 6,
    key: "training",
    icon: "Cloudy",
    label: "Entrenamiento",
    to: "training",
    category: "Automatización",
    nameRoute:
      "routes/app/$companyId/training/index|routes/app/$companyId/training/add|routes/app/$companyId/training/edit.$trainingId",
  },
  {
    order: 6,
    key: "agents",
    icon: "Brain",
    label: "Agentes",
    to: "agents",
    category: "Automatización",
    nameRoute:
      "routes/app/$companyId/agents/index|routes/app/$companyId/agents/$id.edit|routes/app/$companyId/agents/add",
  },
  {
    order: 7,
    key: "licenses",
    icon: "Folders",
    label: "Licencias",
    to: "licenses",
    // category: "Enterprise",
    nameRoute: "routes/app/$companyId/licenses/index",
    isEnterprise: true,
  },
  {
    order: 8,
    key: "api-keys",
    icon: "Key",
    label: "API Keys",
    to: "api-keys",
    // category: "Enterprise",
    nameRoute: "routes/app/$companyId/api-keys/index",
    isEnterprise: true,
  },
  {
    order: 9,
    key: "users",
    icon: "Users",
    label: "Usuarios",
    to: "users",
    // category: "Administración",
    nameRoute:
      "routes/app/$companyId/users/index|routes/app/$companyId/users/add|routes/app/$companyId/users/edit.$userId",
  },
  {
    order: 10,
    key: "settings",
    icon: "Settings",
    label: "Ajustes",
    to: "settings",
    // category: "Administración",
    nameRoute: "routes/app/$companyId/settings/index",
  },
];

export const CATEGORY_ICONS: Record<string, string> = {
  Gestión: "Briefcase",
  Comunicación: "MessageSquare",
  Administración: "Shield",
  Automatización: "Zap",
  Enterprise: "Building2",
};

export const ROUTES_FOR_NORMAL_LICENSE = ROUTES.filter(
  (route) => !route.isEnterprise
)
  .map((route) => route.key)
  .join("|");
export const ROUTES_FOR_ENTERPRISE_LICENSE = ROUTES.map(
  (route) => route.key
).join("|");
