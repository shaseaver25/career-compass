import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { RequireRole } from "@/components/RequireRole";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Careers from "./pages/Careers.tsx";
import CareerDetail from "./pages/CareerDetail.tsx";
import Companies from "./pages/Companies.tsx";
import CompanyDetail from "./pages/CompanyDetail.tsx";
import Bookmarks from "./pages/Bookmarks.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import InterviewNew from "./pages/InterviewNew.tsx";
import Admin from "./pages/Admin.tsx";
import Explore from "./pages/Explore.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route element={<SiteLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/careers/:slug" element={<CareerDetail />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/companies/:slug" element={<CompanyDetail />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<RequireRole role="company_rep"><Dashboard /></RequireRole>} />
                <Route path="/dashboard/interviews/new" element={<RequireRole role="company_rep"><InterviewNew /></RequireRole>} />
                <Route path="/admin" element={<RequireRole role="admin"><Admin /></RequireRole>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
