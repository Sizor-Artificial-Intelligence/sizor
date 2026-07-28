import { useMatches } from "react-router";
import { useCompany } from "./useCompany";
import { useLicense } from "./useLicense";
export const useDaysToExpireSubscription = (): number => {
  const matches: any = useMatches();
  const company = useCompany();
  const license = useLicense();
  if (license?.isSon) {
    return 999;
  }
  return (
    (company?.plan?.daysToExpireSubscription || 30) -
    (matches[1]?.data?.timeElapsedSubscription?.days || 0)
  );
};
