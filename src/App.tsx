import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OrganizationProvider } from "./contexts/OrganizationContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import TOS from "./pages/TOS";
import Policy from "./pages/Policy";
import Thumb from "./pages/Thumb";
import NotFound from "./pages/NotFound";
import AliasesList from "./pages/AliasesList";
import AddAlias from "./pages/AddAlias";
import AliasDetail from "./pages/AliasDetail";
import TrustReport from "./pages/TrustReport";
import Monitoring from "./pages/Monitoring";
import ApiDocs from "./pages/ApiDocs";
import SdkDocs from "./pages/SdkDocs";
import WebhookTester from "./pages/WebhookTester";
import Admin from "./pages/Admin";
import Usage from "./pages/Usage";
import ApiKeys from "./pages/ApiKeys";
import Settings from "./pages/Settings";
import VerifyAlias from "./pages/VerifyAlias";
import Billing from "./pages/Billing";
import Organizations from "./pages/Organizations";
import OrganizationNew from "./pages/OrganizationNew";
import OrganizationMembers from "./pages/OrganizationMembers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <OrganizationProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/aliases" element={<AliasesList />} />
            <Route path="/dashboard/aliases/new" element={<AddAlias />} />
            <Route path="/dashboard/aliases/:id" element={<AliasDetail />} />
            <Route path="/dashboard/aliases/:id/verify" element={<VerifyAlias />} />
            <Route path="/dashboard/aliases/:id/trust" element={<TrustReport />} />
            <Route path="/dashboard/monitoring" element={<Monitoring />} />
            <Route path="/dashboard/usage" element={<Usage />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/dashboard/api-keys" element={<ApiKeys />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/organizations" element={<Organizations />} />
            <Route path="/organizations/new" element={<OrganizationNew />} />
            <Route path="/organizations/:organizationId/members" element={<OrganizationMembers />} />
            <Route path="/docs/api" element={<ApiDocs />} />
            <Route path="/docs/sdk" element={<SdkDocs />} />
            <Route path="/docs/webhooks" element={<WebhookTester />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/tos" element={<TOS />} />
            <Route path="/policy" element={<Policy />} />
            <Route path="/thumb" element={<Thumb />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </OrganizationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
