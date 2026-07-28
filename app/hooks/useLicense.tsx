import { useMatches } from "react-router";
import type { License } from "~/types/schema";
export const useLicense = () => {
  const matches: any = useMatches();
  return matches[1]?.data?.license as License;
};
