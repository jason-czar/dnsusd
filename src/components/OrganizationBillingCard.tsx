import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Users } from "lucide-react";
import { format } from "date-fns";

interface OrganizationBillingCardProps {
  organizationId: string;
}

export function OrganizationBillingCard({ organizationId }: OrganizationBillingCardProps) {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<any>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  const fetchData = async () => {
    try {
      // Fetch subscription
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .single();

      setSubscription(subData);

      // Fetch member count
      const { count } = await supabase
        .from("organization_members")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId);

      setMemberCount(count || 0);
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-organization-subscription", {
        body: { organization_id: organizationId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
    }
  };

  const handleUpgrade = async (tier: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-organization-checkout", {
        body: { organization_id: organizationId, tier }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="animate-pulse">Loading billing information...</div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Organization Billing
          </CardTitle>
          <CardDescription>Upgrade to unlock team features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              No active organization subscription. Upgrade to a team plan to enable:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Multiple team members</li>
              <li>Shared aliases</li>
              <li>Organization-level analytics</li>
              <li>Team activity logs</li>
            </ul>
            <div className="flex gap-2">
              <Button onClick={() => handleUpgrade("team")}>Upgrade to Team</Button>
              <Button variant="outline" onClick={() => handleUpgrade("enterprise")}>
                Upgrade to Enterprise
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Organization Subscription
        </CardTitle>
        <CardDescription>Manage your team subscription</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-lg">
                {subscription.tier.toUpperCase()}
              </Badge>
              <Badge variant={subscription.status === "active" ? "default" : "destructive"}>
                {subscription.status}
              </Badge>
            </div>
          </div>
          <Button onClick={handleManageBilling}>Manage</Button>
        </div>

        {subscription.current_period_end && (
          <div>
            <p className="text-sm text-muted-foreground">Billing Period</p>
            <p className="text-sm font-medium">
              Renews on {format(new Date(subscription.current_period_end), "PPP")}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {memberCount} team member{memberCount !== 1 ? "s" : ""}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}