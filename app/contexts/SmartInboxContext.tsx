import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface SmartInboxContextType {
  unreadSmartInbox: number;
  setUnreadSmartInbox: (count: number) => void;
  incrementSmartInbox: () => void;
  decrementSmartInbox: () => void;
  resetSmartInbox: () => void;
}

const SmartInboxContext = createContext<SmartInboxContextType | undefined>(
  undefined
);

interface SmartInboxProviderProps {
  children: ReactNode;
  initialValue?: number;
}

export function SmartInboxProvider({
  children,
  initialValue = 0,
}: SmartInboxProviderProps) {
  const [unreadSmartInbox, setUnreadSmartInbox] =
    useState<number>(initialValue);

  const incrementSmartInbox = useCallback(() => {
    setUnreadSmartInbox((prev) => prev + 1);
  }, []);

  const decrementSmartInbox = useCallback(() => {
    setUnreadSmartInbox((prev) => Math.max(0, prev - 1));
  }, []);

  const resetSmartInbox = useCallback(() => {
    setUnreadSmartInbox(0);
  }, []);

  return (
    <SmartInboxContext.Provider
      value={{
        unreadSmartInbox,
        setUnreadSmartInbox,
        incrementSmartInbox,
        decrementSmartInbox,
        resetSmartInbox,
      }}
    >
      {children}
    </SmartInboxContext.Provider>
  );
}

export function useSmartInbox() {
  const context = useContext(SmartInboxContext);
  if (context === undefined) {
    throw new Error("useSmartInbox must be used within a SmartInboxProvider");
  }
  return context;
}
