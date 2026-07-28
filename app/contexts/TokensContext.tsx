import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface TokensData {
  tokensUsed: number;
  maxTokens: number;
  isFree: boolean;
}

interface TokensContextType {
  realTimeTokens: TokensData | null;
  setRealTimeTokens: (tokens: TokensData | null) => void;
  updateTokens: (tokens: TokensData) => void;
}

const TokensContext = createContext<TokensContextType | undefined>(undefined);

interface TokensProviderProps {
  children: ReactNode;
}

export function TokensProvider({ children }: TokensProviderProps) {
  const [realTimeTokens, setRealTimeTokens] = useState<TokensData | null>(null);

  const updateTokens = useCallback((tokens: TokensData) => {
    setRealTimeTokens(tokens);
  }, []);

  return (
    <TokensContext.Provider
      value={{
        realTimeTokens,
        setRealTimeTokens,
        updateTokens,
      }}
    >
      {children}
    </TokensContext.Provider>
  );
}

export function useTokens() {
  const context = useContext(TokensContext);
  if (context === undefined) {
    throw new Error("useTokens must be used within a TokensProvider");
  }
  return context;
}
