export interface User {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  countryCode?: string;
  country?: string;
  password: string;
  nextPathSignup?: string;
  codeVerification?: string;
  isSuperAdmin: boolean;
  avatar: string;
  routesAllowed?: string;
  isGoogle: boolean;
  UserCompany?: UserCompany[];
  assignedContacts: Contact[];
}

export interface Company {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  initialsName: string;
  planId?: string;
  plan?: Plan;
  conectedWithCalendar?: boolean;
  googleCalendarId?: string | null;
  googleAccessToken?: string | null;
  googleRefreshToken?: string | null;
  googleTokenExpiry?: Date | null;
  googleCalendarName?: string | null;
  googleCalendarEmail?: string | null;
  SETT_IA_RESPONSE?: boolean;
  NOTT_METHOD?: "app" | "email" | "both";
  NOTT_FORM_SUBMISSION?: boolean;
  NOTT_APPOINTMENT_CREATED?: boolean;
  NOTT_APPOINTMENT_MODIFIED?: boolean;
  NOTT_APPOINTMENT_CANCELLED?: boolean;
  NOTT_CHAT_ASSIGNED_TO_HUMAN?: boolean;
  UserCompany?: UserCompany[];
  TokenTransactions?: TokenTransaction[];
  Form?: Form[];
  FormResponse?: FormResponse[];
  Agent?: Agent[];
}

export interface Plan {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  price: number;
  datePay?: Date | null;
  daysToExpireSubscription: number;
  dateStartSubscription?: Date | null;
  pendingPayment?: boolean;
  isFree: boolean;
  maxContacts: number;
  contactsUsed: number;
  contactsUnlimited: boolean;
  maxAgents: number;
  agentsUsed: number;
  maxTokens: number;
  tokensUsed: number;
  maxSocialMedia: number;
  socialMediaUsed: number;
  agentsUnlimited: boolean;
  baseTokens: number;
  additionalTokens: number;
  additionalTokensUsed: number;
  additionalTokensType?: "one-time" | "permanent" | null;
  additionalTokensPrice: number;
  additionalTokensExpiry?: Date | null;
  facebookConnected?: boolean;
  whatsappConnected?: boolean;
  instagramConnected?: boolean;
  webConnected?: boolean;
  API_TOKEN_FACEBOOK?: string | null;
  ACCOUNT_ID_FACEBOOK?: string | null;
  API_TOKEN_INSTAGRAM?: string | null;
  ACCOUNT_ID_INSTAGRAM?: string | null;
  agentId?: string | null;
  agent?: Agent | null;
  Company?: Company[];
  TokenTransactions?: TokenTransaction[];
}

export interface UserCompany {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  companyId: string;
  user?: User;
  company?: Company;
}

export interface License {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  maxUsers: number;
  maxLicenses: number;
  usersUsed: number;
  isEnterprise: boolean;
  subdomain?: string | null;
  nameParent?: string | null;
  parentTenantId?: string | null;
  nameEnterprise?: string | null;
  hasPremium: boolean;
  usersUnlimited: boolean;
  isSon: boolean;
  dateLastVerification?: Date | null;
}

export interface TokenTransaction {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  companyId: string;
  company?: Company;
  planId: string;
  plan?: Plan;
  transactionType:
  | "plan_creation"
  | "token_increase"
  | "token_expiry"
  | "monthly_renewal";
  tokensAmount: number;
  price: number;
  increaseType?: "one-time" | "permanent" | null;
  expiryDate?: Date | null;
  isActive: boolean;
  description?: string | null;
}

export interface ContactCustomFieldValue {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  contactId: string;
  customFieldId: string;
  value?: string | null;
  customField?: CustomField;
}

export interface CustomField {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  companyId: string;
  name: string;
  fieldType: string;
  isRequired: boolean;
  options?: string | null;
  order: number;
  active: boolean;
}

export interface Contact {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  companyId: string;
  company?: Company;
  active: boolean;
  name: string;
  lastName?: string | null;
  countryCode?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gender?: string | null;
  origin: string;
  avatar?: string | null;
  respondWithIa?: boolean;
  senderId?: string;
  sentiment?: "neutral" | "happy" | "sad" | "frustrated" | "angry" | "calm" | null;
  leadTemperature?: "cold" | "warm" | "hot" | "very_hot" | "very_cold" | "not_applicable" | null;
  ContactCustomFieldValue?: ContactCustomFieldValue[];
  agent?: Agent | null;
  agentId?: string | null;
  assignedUser?: User | null;
  assignedUserId?: string | null;
  FormResponse?: FormResponse[];
}

export interface Form {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  companyId: string;
  company?: Company;
  name: string;
  description?: string | null;
  slug: string;
  active: boolean;
  FormField?: FormField[];
  FormResponse?: FormResponse[];
  Agent?: Agent[];
}

export interface FormField {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  formId: string;
  form?: Form;
  label: string;
  fieldType:
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "email"
  | "phone"
  | "select"
  | "checkbox"
  | "radio";
  isRequired: boolean;
  placeholder?: string | null;
  options?: string | null;
  order: number;
  active: boolean;
  FormResponseValue?: FormResponseValue[];
}

export interface FormResponse {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  formId: string;
  form?: Form;
  companyId: string;
  company?: Company;
  contactId?: string | null;
  contact?: Contact | null;
  submittedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  active: boolean;
  read: boolean;
  FormResponseValue?: FormResponseValue[];
}

export interface FormResponseValue {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  formResponseId: string;
  formResponse?: FormResponse;
  formFieldId: string;
  formField?: FormField;
  value?: string | null;
  active: boolean;
}

export interface Agent {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  companyId: string;
  company?: Company;
  name: string;
  instructions: string;
  canManageAppointments: boolean;
  canCollectFormData: boolean;
  canAccessPortfolio: boolean;
  formId?: string | null;
  form?: Form;
  limitations?: string | null;
  escalationRules?: string | null;
  active: boolean;
  isMultiAgent?: boolean;
  SubAgentsAsMain?: AgentSubAgent[];
  SubAgentsAsMember?: AgentSubAgent[];
}

/** Relación agente principal (multiagente) ↔ subagente con rol para enrutar (soporte, ventas, etc.). */
export interface AgentSubAgent {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  mainAgentId: string;
  mainAgent?: Agent;
  subAgentId: string;
  subAgent?: Agent;
  role: string;
  order: number;
}

export interface Reaction {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  messageId: string;
  message?: Message;
  senderId: string;
  emoji: string;
  action: "react" | "unreact";
  companyId: string;
  company?: Company;
}

export interface Message {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  content?: string | null;
  sender: string;
  senderId: string;
  timestamp: string;
  messageId: string;
  contactId: string;
  contact?: Contact;
  status: string;
  type: string;
  attachments?: string | null;
  companyId: string;
  company?: Company;
  reactions?: Reaction[];
}

export interface Notification {
  id: string;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  title: string;
  message: string;
  isPublic: boolean;
  userId: string | null;
  path: string | null;
  isRead: boolean;
  active: boolean;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
