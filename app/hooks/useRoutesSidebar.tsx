import { useMatches } from "react-router";
import type { MenuItem } from "~/types/app";

export const useRoutesSidebar = () => {
  const matches: any = useMatches();
  return matches[1]?.data?.routesAllowed as MenuItem[];
};
