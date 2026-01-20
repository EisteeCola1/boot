"use client";

import { createContext, useContext } from "react";

type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
};

type AdminContextValue = {
  user: AuthUser;
  token: string;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({
  value,
  children,
}: {
  value: AdminContextValue;
  children: React.ReactNode;
}) {
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminContext() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("AdminContext missing");
  }
  return ctx;
}
