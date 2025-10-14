import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  settings?: any;
  role?: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  isPersonalContext: boolean;
  switchToPersonal: () => void;
  switchToOrganization: (orgId: string) => void;
  refreshOrganizations: () => Promise<void>;
  loading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isPersonalContext, setIsPersonalContext] = useState(true);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrganizations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setOrganizations([]);
        setLoading(false);
        return;
      }

      // Get organizations where user is a member
      const { data: members, error } = await supabase
        .from("organization_members")
        .select(`
          role,
          organizations (
            id,
            name,
            slug,
            logo_url,
            settings
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const orgs = members?.map((m: any) => ({
        ...m.organizations,
        role: m.role,
      })) || [];

      setOrganizations(orgs);

      // Restore last selected organization from localStorage
      const lastOrgId = localStorage.getItem("lastOrganizationId");
      if (lastOrgId && orgs.find((o: Organization) => o.id === lastOrgId)) {
        const org = orgs.find((o: Organization) => o.id === lastOrgId);
        setCurrentOrganization(org);
        setIsPersonalContext(false);
      }
    } catch (error: any) {
      console.error("Error fetching organizations:", error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setOrganizations([]);
        setCurrentOrganization(null);
        setIsPersonalContext(true);
      } else if (event === "SIGNED_IN") {
        fetchOrganizations();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const switchToPersonal = () => {
    setCurrentOrganization(null);
    setIsPersonalContext(true);
    localStorage.removeItem("lastOrganizationId");
  };

  const switchToOrganization = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
      setIsPersonalContext(false);
      localStorage.setItem("lastOrganizationId", orgId);
    }
  };

  const refreshOrganizations = async () => {
    await fetchOrganizations();
  };

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        isPersonalContext,
        switchToPersonal,
        switchToOrganization,
        refreshOrganizations,
        loading,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}