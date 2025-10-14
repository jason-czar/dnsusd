import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Plus, Search, Home as HomeIcon, Bell, Code2, BarChart, Key, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAliases: 0,
    verifiedAliases: 0,
    totalVerifications: 0,
  });

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchStats(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchStats(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchStats = async (userId: string) => {
    try {
      // Fetch user's aliases
      const { data: aliases, error: aliasError } = await supabase
        .from("aliases")
        .select("*")
        .eq("user_id", userId);

      if (aliasError) throw aliasError;

      const totalAliases = aliases?.length || 0;
      const verifiedAliases = aliases?.filter(a => a.dns_verified || a.https_verified).length || 0;
      const totalVerifications = aliases?.filter(a => a.last_verification_at).length || 0;

      setStats({
        totalAliases,
        verifiedAliases,
        totalVerifications,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HomeIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">AliasResolve</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold">Dashboard</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Manage your crypto aliases and domains with OpenAlias standard
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Resolve Alias
                </CardTitle>
                <CardDescription>
                  Look up wallet addresses from domains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Go to Resolver
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/dashboard/aliases")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Manage Aliases
                </CardTitle>
                <CardDescription>
                  View and manage your domain aliases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  View Aliases
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/dashboard/monitoring")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Monitoring
                </CardTitle>
                <CardDescription>
                  Configure alerts and monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Setup Alerts
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/dashboard/usage")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Usage & Billing
                </CardTitle>
                <CardDescription>
                  Track API consumption
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  View Usage
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/dashboard/api-keys")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys
                </CardTitle>
                <CardDescription>
                  Generate and manage API keys
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Manage Keys
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/docs/api")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  API Documentation
                </CardTitle>
                <CardDescription>
                  Integrate with our REST API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  View API Docs
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  My Domains
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalAliases}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalAliases === 0 ? "No domains yet" : `${stats.totalAliases} domain${stats.totalAliases === 1 ? "" : "s"}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Aliases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.verifiedAliases}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.verifiedAliases === 0 ? "No aliases configured" : `${stats.verifiedAliases} verified`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Verifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalVerifications}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalVerifications === 0 ? "No verifications yet" : `${stats.totalVerifications} completed`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started with OpenAlias</CardTitle>
              <CardDescription>
                Follow these steps to set up your first domain alias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Add your domain</h4>
                  <p className="text-sm text-muted-foreground">
                    Register a domain you own to start managing wallet addresses
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Configure OpenAlias records</h4>
                  <p className="text-sm text-muted-foreground">
                    Add DNS TXT records or host a JSON file with your wallet addresses
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Verify ownership</h4>
                  <p className="text-sm text-muted-foreground">
                    We'll verify DNS records and HTTPS endpoints to build trust
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
