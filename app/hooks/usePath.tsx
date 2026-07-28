import { useMatches } from "react-router";

export default function usePath() {
  const matches = useMatches();
  return `/app/${matches[2]?.params?.companyId}`;
}
