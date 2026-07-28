import { useMatches } from "react-router";
import type { User } from "~/types/schema";

export const useUser = () => {
  const matches: any = useMatches();
  return matches[1]?.data?.user as User;
};
