import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  const hasToken = !!localStorage.getItem("auth_token");

  if (loading && hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="text-center space-y-6">
            <div className="w-14 h-14 bg-gradient-to-r from-primary-600 to-blue-600 rounded-full mx-auto flex items-center justify-center shadow-lg">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Support Dashboard
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Setting up your workspace
              </p>
            </div>

            <div className="relative mx-auto w-16 h-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200">
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-b-blue-400"
                  style={{
                    animationDirection: "reverse",
                    animationDuration: "1.2s",
                  }}
                ></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-700 font-medium">
                Loading your data...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-primary-600 to-blue-600 h-1.5 rounded-full animate-pulse"
                  style={{ width: "65%" }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Authenticating • Loading tickets • Preparing interface
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasToken || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
