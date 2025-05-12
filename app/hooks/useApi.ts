import { useState, useEffect } from "react";

const BASE_URL = "https://smarttollsystem-production.up.railway.app/api";

interface FetchOptions extends RequestInit {
  token?: string;
  data?: any;
}

export const useApi = () => {
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Load token from localStorage on mount
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
    }
    setInitializing(false);
  }, []);

  const saveToken = (newToken: string) => {
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
  };

  const clearToken = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
  };

  const fetchApi = async (endpoint: string, options: FetchOptions = {}) => {
    const { data, token: overrideToken, ...fetchOptions } = options;

    const url = `${BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers);

    // Use override token if provided, otherwise use stored token
    const authToken = overrideToken || token;
    if (authToken) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }

    headers.set("Content-Type", "application/json");

    const config: RequestInit = {
      ...fetchOptions,
      headers,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      const responseData = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          data: responseData,
          message: responseData.message || "An error occurred",
        };
      }

      return responseData;
    } catch (error) {
      throw error;
    }
  };

  return {
    fetchApi,
    token,
    isAuthenticated: !!token,
    saveToken,
    clearToken,
    initializing,
  };
};
