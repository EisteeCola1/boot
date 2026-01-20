"use client";

import { createContext, useContext } from "react";

type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
};

type HomeContextValue = {
  user: AuthUser;
  token: string;
};

const HomeContext = createContext<HomeContextValue | null>(null);

export function HomeProvider({
  value,
  children,
}: {
  value: HomeContextValue;
  children: React.ReactNode;
}) {
  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
}

export function useHomeContext() {
  const ctx = useContext(HomeContext);
  if (!ctx) {
    throw new Error("HomeContext missing");
  }
  return ctx;
}
