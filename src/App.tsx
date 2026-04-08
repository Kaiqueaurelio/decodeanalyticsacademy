import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { AdminRoute } from "@/components/AdminRoute";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Biblioteca from "./pages/Biblioteca";
import MaterialView from "./pages/MaterialView";
import Perfil from "./pages/Perfil";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMateriais from "./pages/admin/AdminMateriais";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminAlertas from "./pages/admin/AdminAlertas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
            <Route path="/biblioteca" element={<ProtectedLayout><Biblioteca /></ProtectedLayout>} />
            <Route path="/material/:id" element={<ProtectedLayout><MaterialView /></ProtectedLayout>} />
            <Route path="/perfil" element={<ProtectedLayout><Perfil /></ProtectedLayout>} />

            <Route path="/admin" element={<ProtectedLayout><AdminRoute><AdminDashboard /></AdminRoute></ProtectedLayout>} />
            <Route path="/admin/materiais" element={<ProtectedLayout><AdminRoute><AdminMateriais /></AdminRoute></ProtectedLayout>} />
            <Route path="/admin/usuarios" element={<ProtectedLayout><AdminRoute><AdminUsuarios /></AdminRoute></ProtectedLayout>} />
            <Route path="/admin/logs" element={<ProtectedLayout><AdminRoute><AdminLogs /></AdminRoute></ProtectedLayout>} />
            <Route path="/admin/alertas" element={<ProtectedLayout><AdminRoute><AdminAlertas /></AdminRoute></ProtectedLayout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
