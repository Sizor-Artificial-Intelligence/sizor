import { useMatches } from "react-router";
import type { Company } from "~/types/schema";
export const useCompany = () => {
  const matches: any = useMatches();
  return matches[1]?.data?.company as Company;
};
