import { useState } from "react";
import { useApi } from "./useApi";
import { useRouter } from "next/navigation";

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  userId: string;
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  success: boolean;
  message: string;
}

export const useAuth = () => {
  const { fetchApi, saveToken, clearToken, isAuthenticated, initializing, token } = useApi();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const signup = async (data: SignupData) => {
    setLoading(true);
    setError(null);

    try {
      const response = (await fetchApi("/Auth/register", {
        method: "POST",
        data,
      })) as AuthResponse;

      if (response.success && response.token) {
        saveToken(response.token);
        await getCurrentUser(); // Get user data after signup
        router.push("/dashboard");
        return response;
      } else {
        throw new Error(response.message || "Signup failed");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during signup");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginData) => {
    setLoading(true);
    setError(null);

    try {
      const response = (await fetchApi("/Auth/login", {
        method: "POST",
        data,
      })) as AuthResponse;

      if (response.success && response.token) {
        saveToken(response.token);
        await getCurrentUser(); // Get user data after login
        router.push("/dashboard");
        return response;
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async () => {
    if (!isAuthenticated) return null;

    setLoading(true);
    try {
      const userData = (await fetchApi("/Auth/currentUser", {
        method: "GET",
      })) as UserData;

      setUser(userData);
      return userData;
    } catch (err: any) {
      setError(err.message || "Failed to fetch user data");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
    router.push("/login");
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAuthInitializing: initializing,
    token,
    signup,
    login,
    logout,
    getCurrentUser,
  };
};
