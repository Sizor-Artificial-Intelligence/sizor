import { EMAIL_SUPPORT } from "./app";

const getEnv = (key: string, defaultValue: string = ""): string => {
  // En el servidor se usa process.env
  if (typeof process !== "undefined" && process.env) {
    return process.env[key] || defaultValue;
  }
  // En el cliente se usa import.meta.env
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return (import.meta.env[key] as string) || defaultValue;
  }
  return defaultValue;
};

const NODE_ENV: string = getEnv("VITE_NODE_ENV");
const VITE_DOMAIN: string = getEnv("VITE_DOMAIN");
const VITE_GOOGLE_CLIENT_ID: string = getEnv("VITE_GOOGLE_CLIENT_ID");
const VITE_API_URL_DEV: string = getEnv("VITE_API_URL_DEV");
const VITE_API_URL: string = getEnv("VITE_API_URL");
const VITE_EMAIL_CONTACT: string = EMAIL_SUPPORT;
const PHONE_NUMBER_WHATSAPP: string = getEnv("VITE_PHONE_NUMBER_WHATSAPP");

export {
  VITE_GOOGLE_CLIENT_ID,
  VITE_DOMAIN,
  NODE_ENV,
  VITE_EMAIL_CONTACT,
  PHONE_NUMBER_WHATSAPP,
  VITE_API_URL_DEV,
  VITE_API_URL,
};
