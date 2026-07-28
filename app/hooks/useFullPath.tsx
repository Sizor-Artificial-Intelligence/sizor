import { useMatches } from "react-router";

export default function useFullPath() {
  const matches = useMatches();
  let PATH = matches[matches.length - 1].pathname;
  if (PATH.endsWith("/")) {
    PATH = PATH.slice(0, -1);
  }
  return PATH;
}
