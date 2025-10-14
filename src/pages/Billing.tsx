import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Subscription {
  id: string;
  tier: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

const Billing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [managingSubscription, setManagingSubscription] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchSubscription();
  };

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("status", "active")
        .single();

      if (error) {
        console.log("No active subscription found");
        setSubscription(null);
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-subscription");

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open subscription management",
        variant: "destructive",
      });
    } finally {
      setManagingSubscription(false);
    }
  };

  const getTierBadge = (tier: string) => {
    const variants: Record<string, string> = {
      free: "secondary",
      pro: "default",
      enterprise: "destructive",
    };
    return (
      <Badge variant={variants[tier] as any}>
        {tier.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: string; icon: any }> = {
      active: { variant: "default", icon: CheckCircle2 },
      past_due: { variant: "destructive", icon: AlertCircle },
      cancelled: { variant: "secondary", icon: AlertCircle },
    };
    const config = variants[status] || variants.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-4xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground mb-8">
          Manage your subscription and billing information
        </p>

        {subscription ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Current Subscription
                    </CardTitle>
                    <CardDescription>Your active subscription details</CardDescription>
                  </div>
                  {getTierBadge(subscription.tier)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(subscription.status)}
                </div>

                {subscription.current_period_start && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Billing Period
                    </span>
                    <span className="text-sm">
                      {new Date(subscription.current_period_start).toLocaleDateString()} - {new Date(subscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {subscription.cancel_at_period_end && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your subscription will be cancelled at the end of the current billing period on {new Date(subscription.current_period_end).toLocaleDateString()}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleManageSubscription}
                  disabled={managingSubscription}
                  className="w-full"
                >
                  {managingSubscription ? "Opening..." : "Manage Subscription"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Benefits</CardTitle>
                <CardDescription>What's included in your {subscription.tier} plan</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {subscription.tier === "pro" && (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        100,000 alias resolutions per month
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Priority support
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Advanced monitoring & alerts
                      </li>
                    </>
                  )}
                  {subscription.tier === "enterprise" && (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Unlimited alias resolutions
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        24/7 dedicated support
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Custom integrations
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        SLA guarantee
                      </li>
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Active Subscription</CardTitle>
              <CardDescription>You're currently on the free plan</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Upgrade to Pro or Enterprise to unlock more features and higher limits.
              </p>
              <Button onClick={() => navigate("/usage")}>
                View Plans & Upgrade
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Billing;
