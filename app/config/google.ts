import { VITE_GOOGLE_CLIENT_ID } from "./env";

// URLs de Google OAuth
export const GOOGLE_OAUTH_CONFIG = {
  clientId: VITE_GOOGLE_CLIENT_ID,
  scope: "openid email profile",
  redirectUri: typeof window !== "undefined" ? window.location.origin : "",
};
