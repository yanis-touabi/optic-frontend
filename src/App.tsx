import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./lib/auth";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Produits from "./pages/Produits";
import Ordonnances from "./pages/Ordonnances";
import Commandes from "./pages/Commandes";
import NouveauBon from "./pages/NouveauBon";
import EditerBon from "./pages/EditerBon";
import ImprimerBon from "./pages/ImprimerBon";
import ImprimerOrdonnance from "./pages/ImprimerOrdonnance";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ConfirmEmail from "./pages/ConfirmEmail";
import Profil from "./pages/Profil";
import AdminUsers from "./pages/AdminUsers";
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
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/profil" element={<Profil />} />
              <Route path="/admin/utilisateurs" element={<ProtectedRoute requireRole="ADMIN"><AdminUsers /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute requireRole="OPTICIEN"><Clients /></ProtectedRoute>} />
              <Route path="/produits" element={<ProtectedRoute requireRole="ADMIN"><Produits /></ProtectedRoute>} />
              <Route path="/ordonnances" element={<Ordonnances />} />
              <Route path="/commandes" element={<ProtectedRoute requireRole="OPTICIEN"><Commandes /></ProtectedRoute>} />
              <Route path="/commandes/nouveau" element={<ProtectedRoute requireRole="OPTICIEN"><NouveauBon /></ProtectedRoute>} />
              <Route path="/commandes/:id/modifier" element={<ProtectedRoute requireRole="OPTICIEN"><EditerBon /></ProtectedRoute>} />
              <Route path="/commandes/:id/imprimer" element={<ProtectedRoute requireRole="OPTICIEN"><ImprimerBon /></ProtectedRoute>} />
              <Route path="/ordonnances/:id/imprimer" element={<ProtectedRoute requireRole="OPTICIEN"><ImprimerOrdonnance /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
