"use client";

import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useAuth } from "./useAuth";

interface AuthContextType {
  user: any;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAuthInitializing: boolean;
  token: string | null;
  signup: (data: any) => Promise<any>;
  login: (data: any) => Promise<any>;
  logout: () => void;
  getCurrentUser: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();

  useEffect(() => {
    // Try to load user data on initial mount if token exists
    if (auth.isAuthenticated && !auth.isAuthInitializing) {
      auth.getCurrentUser();
    }
  }, [auth.isAuthenticated, auth.isAuthInitializing]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
