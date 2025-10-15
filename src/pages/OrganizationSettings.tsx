import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, Trash2, CreditCard, Activity } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  settings?: any;
  created_at: string;
}

interface ActivityLog {
  id: string;
  action: string;
  created_at: string;
  metadata?: any;
  profiles?: {
    email: string;
    display_name: string;
  };
}

export default function OrganizationSettings() {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch organization
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organizationId)
        .single();

      if (orgError) throw orgError;
      setOrganization(orgData);
      setName(orgData.name);
      setSlug(orgData.slug);

      // Get user's role
      const { data: memberData } = await supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", organizationId)
        .eq("user_id", user.id)
        .single();

      setUserRole(memberData?.role || null);

      // Fetch activity logs
      const { data: logsData, error: logsError } = await supabase
        .from("organization_activity_logs")
        .select("id, action, created_at, metadata, user_id")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      // Fetch profiles for activity logs
      const logsWithProfiles = await Promise.all(
        (logsData || []).map(async (log) => {
          if (!log.user_id) return { ...log, profiles: null };
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, display_name")
            .eq("id", log.user_id)
            .single();

          return { ...log, profiles: profile };
        })
      );

      setActivityLogs(logsWithProfiles);

      // Fetch organization subscription
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .single();

      setSubscription(subData);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load organization settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name,
          slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        })
        .eq("id", organizationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization settings updated",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", organizationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization deleted",
      });

      navigate("/organizations");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete organization",
        variant: "destructive",
      });
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

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      organization_created: "Organization created",
      member_invited: "Member invited",
      member_joined: "Member joined",
      member_removed: "Member removed",
      member_role_changed: "Member role changed",
      settings_updated: "Settings updated",
      subscription_updated: "Subscription updated",
    };
    return labels[action] || action;
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  if (!organization || !userRole) {
    return (
      <div className="container mx-auto py-8">
        <p>Organization not found or you don't have access</p>
      </div>
    );
  }

  const canEdit = userRole === "owner" || userRole === "admin";

  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Organization Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization configuration and preferences
          </p>
        </div>
        <Badge variant="secondary">{userRole}</Badge>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          {userRole === "owner" && <TabsTrigger value="danger">Danger Zone</TabsTrigger>}
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Details
              </CardTitle>
              <CardDescription>
                Update your organization name and identifier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Organization Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={!canEdit}
                />
                <p className="text-sm text-muted-foreground">
                  Used in URLs. Only lowercase letters, numbers, and hyphens.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Created</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(organization.created_at), "PPP")}
                </p>
              </div>

              {canEdit && (
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing & Subscription
              </CardTitle>
              <CardDescription>
                Manage your organization subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription ? (
                <>
                  <div className="space-y-2">
                    <Label>Current Plan</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-lg">
                        {subscription.tier.toUpperCase()}
                      </Badge>
                      <Badge variant={subscription.status === "active" ? "default" : "destructive"}>
                        {subscription.status}
                      </Badge>
                    </div>
                  </div>

                  {subscription.current_period_end && (
                    <div className="space-y-2">
                      <Label>Billing Period</Label>
                      <p className="text-sm text-muted-foreground">
                        Renews on {format(new Date(subscription.current_period_end), "PPP")}
                      </p>
                    </div>
                  )}

                  <Button onClick={handleManageBilling}>
                    Manage Subscription
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    No active subscription. Upgrade to unlock team features.
                  </p>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Team Plan</CardTitle>
                        <CardDescription>For small to medium teams</CardDescription>
                        <div className="text-2xl font-bold mt-2">$99<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm mb-4">
                          <li>• Up to 10 team members</li>
                          <li>• Shared aliases</li>
                          <li>• Team analytics</li>
                          <li>• Priority support</li>
                        </ul>
                        <Button className="w-full" onClick={() => handleUpgrade("team")}>
                          Upgrade to Team
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Enterprise Plan</CardTitle>
                        <CardDescription>For large organizations</CardDescription>
                        <div className="text-2xl font-bold mt-2">$299<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm mb-4">
                          <li>• Unlimited team members</li>
                          <li>• Advanced RBAC</li>
                          <li>• 24/7 dedicated support</li>
                          <li>• SLA guarantee</li>
                        </ul>
                        <Button className="w-full" onClick={() => handleUpgrade("enterprise")}>
                          Upgrade to Enterprise
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Log
              </CardTitle>
              <CardDescription>
                Recent actions and changes in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No activity recorded yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {getActionLabel(log.action)}
                        </TableCell>
                        <TableCell>
                          {log.profiles?.display_name || log.profiles?.email || "System"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(log.created_at), "PPp")}
                        </TableCell>
                        <TableCell>
                          {log.metadata && (
                            <span className="text-sm text-muted-foreground">
                              {JSON.stringify(log.metadata).substring(0, 50)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {userRole === "owner" && (
          <TabsContent value="danger">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions that will permanently affect your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-destructive rounded-lg">
                    <h3 className="font-semibold mb-2">Delete Organization</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Once deleted, all data including aliases, members, and settings will be
                      permanently removed. This action cannot be undone.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Organization
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <strong>{organization.name}</strong> and
                            all associated data. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}