import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface MessagesContextType {
  unreadMessages: number;
  setUnreadMessages: (count: number) => void;
  incrementMessages: () => void;
  decrementMessages: () => void;
  resetMessages: () => void;
}

const MessagesContext = createContext<MessagesContextType | undefined>(
  undefined
);

interface MessagesProviderProps {
  children: ReactNode;
  initialValue?: number;
}

export function MessagesProvider({
  children,
  initialValue = 0,
}: MessagesProviderProps) {
  const [unreadMessages, setUnreadMessages] = useState<number>(initialValue);

  const incrementMessages = useCallback(() => {
    setUnreadMessages((prev) => prev + 1);
  }, []);

  const decrementMessages = useCallback(() => {
    setUnreadMessages((prev) => Math.max(0, prev - 1));
  }, []);

  const resetMessages = useCallback(() => {
    setUnreadMessages(0);
  }, []);

  return (
    <MessagesContext.Provider
      value={{
        unreadMessages,
        setUnreadMessages,
        incrementMessages,
        decrementMessages,
        resetMessages,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error("useMessages must be used within a MessagesProvider");
  }
  return context;
}
