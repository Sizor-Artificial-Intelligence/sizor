import { useMatches } from "react-router";
export const useRequiredPayment = (): {
  subscriptionMonthly: boolean;
  requiredPayment: boolean;
} => {
  const matches: any = useMatches();
  return matches[1]?.data?.validationPayment;
};
