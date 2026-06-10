"use client";

import { createContext, useContext } from "react";

/** @type {React.Context<{ userId: string; userName: string } | null>} */
const AdminSessionContext = createContext(null);

export function AdminSessionProvider({ userId, userName, children }) {
  return (
    <AdminSessionContext.Provider value={{ userId, userName }}>{children}</AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  return useContext(AdminSessionContext);
}
