import { useMatches } from "react-router";

export const useTenantId = () => {
  const matches: any = useMatches();
  return matches[1]?.data?.tenantId as string;
};
