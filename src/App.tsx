import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import DigitalIdSetup from "./pages/DigitalIdSetup.tsx";
import { MobileShell } from "./components/layout/MobileShell.tsx";
import Home from "./pages/Home.tsx";
import MapView from "./pages/MapView.tsx";
import SOS from "./pages/SOS.tsx";
import Alerts from "./pages/Alerts.tsx";
import Settings from "./pages/Settings.tsx";
import ReportIncident from "./pages/ReportIncident.tsx";
import SafeRoute from "./pages/SafeRoute.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import { AuthProvider } from "./components/auth/AuthProvider.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/digital-id" element={<DigitalIdSetup />} />
            <Route path="/admin" element={<AdminDashboard />} />

            <Route path="/app" element={<MobileShell />}>
              <Route index element={<Home />} />
              <Route path="map" element={<MapView />} />
              <Route path="sos" element={<SOS />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="settings" element={<Settings />} />
              <Route path="report" element={<ReportIncident />} />
              <Route path="route" element={<SafeRoute />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
