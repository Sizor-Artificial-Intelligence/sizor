import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface NotificationsContextType {
  unreadNotifications: number;
  setUnreadNotifications: (count: number) => void;
  incrementNotifications: () => void;
  decrementNotifications: () => void;
  resetNotifications: () => void;
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

interface NotificationsProviderProps {
  children: ReactNode;
  initialValue?: number;
}

export function NotificationsProvider({
  children,
  initialValue = 0,
}: NotificationsProviderProps) {
  const [unreadNotifications, setUnreadNotifications] =
    useState<number>(initialValue);

  const incrementNotifications = useCallback(() => {
    setUnreadNotifications((prev) => prev + 1);
  }, []);

  const decrementNotifications = useCallback(() => {
    setUnreadNotifications((prev) => Math.max(0, prev - 1));
  }, []);

  const resetNotifications = useCallback(() => {
    setUnreadNotifications(0);
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        unreadNotifications,
        setUnreadNotifications,
        incrementNotifications,
        decrementNotifications,
        resetNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
}
