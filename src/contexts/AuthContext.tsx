import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { createContext, ReactNode, useContext, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  loginFn,
  logoutFn,
  registerFn,
  SignUpCredentials,
  type LoginCredentials,
} from "../services/authentication";

interface AuthContextType {
  user: any;
  isAuthenticated: any;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  logout: () => Promise<void>;
  // refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = React.useState<any>(null);

  const hasToken = localStorage.getItem("auth_token");

  // const {
  //   data: user = null,
  //   isLoading,
  //   refetch: refetchUser,
  //   error,
  // } = useQuery({
  //   queryKey: authKeys.user(),
  //   queryFn: getCurrentUserFn,
  //   enabled: hasToken,
  //   staleTime: Infinity,
  //   retry: false,
  // });

  useEffect(() => {
    if (!hasToken) {
      // localStorage.removeItem("auth_token");
      queryClient.clear();
      navigate("/login", { replace: true });
    }
  }, [hasToken, queryClient, navigate]);
  useEffect(() => {
    if (!user) {
      setUser(JSON.parse(localStorage.getItem("user") || "null"));
    }
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: loginFn,
    onSuccess: (data) => {
      setUser(((data as any)?.data as any)?.user);
      // console.log("Login successful:", ((data as any)?.data as any)?.token);
      localStorage.setItem("auth_token", ((data as any)?.data as any)?.token);
      localStorage.setItem(
        "user",
        JSON.stringify(((data as any)?.data as any)?.user)
      );
      navigate("/dashboard");
      queryClient.setQueryData(authKeys.user(), data.user);
    },
    onError: (error) => {
      console.error("Login failed:", error);
      throw error;
    },
  });

  const signUpMutation = useMutation({
    mutationFn: registerFn,
    onSuccess: (data) => {
      console.log("Signup successful:", data);
      // localStorage.setItem("auth_token", data.token);
      // queryClient.setQueryData(authKeys.user(), data.user);
      // navigate("/dashboard");
    },
    onError: (error) => {
      console.error("Login failed:", error);
      throw error;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutFn,
    onSuccess: () => {
      localStorage.removeItem("auth_token");
      queryClient.clear();
      navigate("/login");
    },
    onError: (error) => {
      localStorage.removeItem("auth_token");
      queryClient.clear();
      navigate("/login");
      console.error("Logout error:", error);
    },
  });

  const login = async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials);
  };
  const signUp = async (credentials: SignUpCredentials) => {
    await signUpMutation.mutateAsync(credentials);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const contextValue: AuthContextType = {
    user: user || null,
    isAuthenticated: Boolean(user) && hasToken,
    loading:
      // isLoading ||
      signUpMutation?.isPending ||
      loginMutation.isPending ||
      logoutMutation.isPending,
    login,
    logout,
    signUp,
    // refetchUser,
  };

  if (!hasToken && pathname !== "/login") {
    return <Navigate to="/login" />;
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
