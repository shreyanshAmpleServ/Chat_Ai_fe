import { AuthProvider } from "./contexts/AuthContext";
import { LoginPage } from "./components/Auth/LoginPage";
import { Dashboard } from "./components/Layout/Dashboard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "./configs/queryClient";
import { BrowserRouter } from "react-router-dom";
import Routers from "./routes";
import { Toaster } from "react-hot-toast";

// function AppContent() {
//   const { user, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-slate-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   return user ? <Dashboard /> : <LoginPage />;
// }
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchInterval: false,
      gcTime: 60 * 1000,
    },
  },
});
// const queryClient = getQueryClient();
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routers />
          {/* <AppContent /> */}
          {/* <Routers /> */}
          {/* <AppContent /> */}
          <Toaster position="top-right" toastOptions={{ duration: 800 }} />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
