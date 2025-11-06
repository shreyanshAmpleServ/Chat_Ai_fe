import { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../components/Auth/LoginPage";
import { Dashboard } from "../components/Layout/Dashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../components/Layout";

interface RouteType {
  path: string;
  element: ReactElement;
  title: string;
  status: boolean;
  requiresAuth: boolean;
  icon?: string;
}

/**
 * Array of route objects defining the routes for the application.
 * @type {Array<RouteType>}
 */
const routes: RouteType[] = [
  // Public Routes
  {
    path: "/login",
    element: <LoginPage />,
    title: "Login",
    status: true,
    requiresAuth: false,
  },

  {
    path: "/dashboard",
    element: <Dashboard />,
    title: "Dashboard",
    status: true,
    requiresAuth: true,
  },
];

const Routers = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <LoginPage />
          // <PublicRoute>
          // </PublicRoute>
        }
      />
      {/* Protected Routes with Layout */}
      <Route
        element={
          // <ProtectedRoute>
          <Layout />
        }
      >
        {/* </ProtectedRoute> */}
        {routes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={route.element}
            // element={<ProtectedRoute>{route.element}</ProtectedRoute>}
          />
        ))}
      </Route>
      {/* Catch all route */}
      <Route
        path="*"
        element={
          // <ProtectedRoute>
          <Navigate to="/dashboard" replace />
          // </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default Routers;
export { routes };
