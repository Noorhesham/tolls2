"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../hooks/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, isAuthInitializing } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthInitializing && !loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, isAuthInitializing, router]);

  // Show loading state during initialization or when loading user data
  if (isAuthInitializing || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  // Hide content if not authenticated (will redirect in the useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
