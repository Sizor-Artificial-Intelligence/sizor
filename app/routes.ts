import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // ### Marketing ###
  index("routes/index.tsx"),
  route("about-us", "routes/marketing/about-us.tsx"),
  route("contact", "routes/marketing/contact.tsx"),
  route("privacy-policy", "routes/marketing/privacy-policy.tsx"),
  route(
    "terms-and-conditions-resale-licenses",
    "routes/marketing/terms-and-conditions-resale-licenses.tsx"
  ),

  // Auth
  route("auth/register", "routes/auth/signup/index.tsx"),
  route("auth/signup/company", "routes/auth/signup/company.tsx"),
  route("auth/signup/plan", "routes/auth/signup/plan.tsx"),
  route("auth/logout", "routes/auth/logout.tsx"),
  route("auth/login", "routes/auth/login.tsx"),
  route("auth/forgot-password", "routes/auth/forgot-password/index.tsx"),
  route(
    "auth/forgot-password/send-code",
    "routes/auth/forgot-password/send-code.tsx"
  ),
  route(
    "auth/forgot-password/verify-code",
    "routes/auth/forgot-password/verify-code.tsx"
  ),
  route(
    "auth/forgot-password/reset-password",
    "routes/auth/forgot-password/reset-password.tsx"
  ),
  route("auth/google", "routes/auth/google/index.tsx"),
  route("auth/google-calendar", "routes/auth/google-calendar/index.tsx"),
  route(
    "auth/google-calendar/callback",
    "routes/auth/google-calendar/callback.tsx"
  ),

  // App and layout
  route("app", "routes/app/index.tsx", [
    // Home
    route(":companyId", "routes/app/$companyId/index.tsx"),

    // Contacts
    route(":companyId/contacts", "routes/app/$companyId/contacts/index.tsx"),
    route(
      ":companyId/contacts/custom-fields",
      "routes/app/$companyId/contacts/custom-fields.tsx"
    ),
    route(
      ":companyId/contacts/:contactId/mark-read",
      "routes/app/$companyId/contacts/$contactId.mark-read.tsx"
    ),
    route(
      ":companyId/contacts/send-message",
      "routes/app/$companyId/contacts/send-message.tsx"
    ),
    route(
      ":companyId/contacts/clear-chat",
      "routes/app/$companyId/contacts/clear-chat.tsx"
    ),
    route(
      ":companyId/api/copilot",
      "routes/app/$companyId/api/copilot.tsx"
    ),

    // Chats
    route(":companyId/chat", "routes/app/$companyId/chat/index.tsx"),
    route(
      ":companyId/chat/:contactId",
      "routes/app/$companyId/chat/details.tsx"
    ),

    // Calendar
    route(":companyId/calendar", "routes/app/$companyId/calendar/index.tsx"),

    // Agents
    route(":companyId/agents", "routes/app/$companyId/agents/index.tsx"),
    route(":companyId/agents/add", "routes/app/$companyId/agents/add.tsx"),
    route(
      ":companyId/agents/:id/edit",
      "routes/app/$companyId/agents/$id.edit.tsx"
    ),

    // Reports
    route(":companyId/reports", "routes/app/$companyId/reports/index.tsx"),

    // Settings
    route(":companyId/settings", "routes/app/$companyId/settings/index.tsx"),

    // Profile
    route(":companyId/profile", "routes/app/$companyId/profile/index.tsx"),

    // Notifications
    route(
      ":companyId/notifications",
      "routes/app/$companyId/notifications/index.tsx"
    ),

    // Plan
    route(
      ":companyId/get-more-tokens",
      "routes/app/$companyId/plan/get-more-tokens.tsx"
    ),
    route(
      ":companyId/pay-license",
      "routes/app/$companyId/plan/pay-license.tsx"
    ),

    // Licenses
    route(":companyId/licenses", "routes/app/$companyId/licenses/index.tsx"),
    route(":companyId/licenses/add", "routes/app/$companyId/licenses/add.tsx"),

    // Api keys
    route(":companyId/api-keys", "routes/app/$companyId/api-keys/index.tsx"),
    route(
      ":companyId/api-keys/:apiKeyId/licenses",
      "routes/app/$companyId/api-keys/licenses.tsx"
    ),

    // Forms
    route(":companyId/forms", "routes/app/$companyId/forms/index.tsx"),
    route(":companyId/forms/add", "routes/app/$companyId/forms/add.tsx"),
    route(
      ":companyId/forms/:formId/edit",
      "routes/app/$companyId/forms/edit.$formId.tsx"
    ),
    route(
      ":companyId/forms/:formId/responses",
      "routes/app/$companyId/forms/responses.$formId.tsx"
    ),

    // Smart inbox
    route(
      ":companyId/smart-inbox",
      "routes/app/$companyId/smart-inbox/index.tsx"
    ),

    // Api
    route(":companyId/api/sql", "routes/app/$companyId/api/sql.tsx"),
    route(
      ":companyId/api/unread-notifications",
      "routes/app/$companyId/api/unread-notifications.tsx"
    ),
    route(
      ":companyId/api/unread-smart-inbox",
      "routes/app/$companyId/api/unread-smart-inbox.tsx"
    ),

    // Users
    route(":companyId/users", "routes/app/$companyId/users/index.tsx"),
    route(":companyId/users/add", "routes/app/$companyId/users/add.tsx"),
    route(
      ":companyId/users/:userId/edit",
      "routes/app/$companyId/users/edit.$userId.tsx"
    ),

    // Portfolio
    route(":companyId/portfolio", "routes/app/$companyId/portfolio/index.tsx"),

    // Training
    route(":companyId/training", "routes/app/$companyId/training/index.tsx"),
  ]),

  // Webhooks
  route(
    ":tenantId/:companyId/:socialNetwork/webhook",
    "routes/webhooks/meta.tsx"
  ),
  route("api/webhooks/payment", "routes/api/webhooks/payment.tsx"),

  // Api
  route("api/ai-response", "routes/api/ai-response.tsx"),
  route("api/upload-image", "routes/api/upload-image.tsx"),
  route("api/sql", "routes/api/sql.tsx"),
  route("api/exists-subdomain", "routes/api/exists-subdomain.tsx"),
  route("api/qdrant", "routes/api/qdrant/index.tsx"),
  route("api/qdrant/:id", "routes/api/qdrant/id.tsx"),
  route("api/submit-form", "routes/api/submit-form.tsx"),
] satisfies RouteConfig;
