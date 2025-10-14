import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Database, Activity, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [aliases, setAliases] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAliases: 0,
    totalLookups: 0,
    avgTrustScore: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (!roles) {
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      loadAdminData();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // Load users with their roles
      const { data: usersData } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles (role)
        `)
        .order("created_at", { ascending: false });

      setUsers(usersData || []);

      // Load all aliases with user info
      const { data: aliasesData } = await supabase
        .from("aliases")
        .select(`
          *,
          profiles (email, display_name)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      setAliases(aliasesData || []);

      // Calculate stats
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: totalAliases } = await supabase
        .from("aliases")
        .select("*", { count: "exact", head: true });

      const { count: totalLookups } = await supabase
        .from("lookups")
        .select("*", { count: "exact", head: true });

      const { data: avgData } = await supabase
        .from("aliases")
        .select("trust_score");

      const avgTrustScore = avgData && avgData.length > 0
        ? Math.round(avgData.reduce((sum, a) => sum + (a.trust_score || 0), 0) / avgData.length)
        : 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalAliases: totalAliases || 0,
        totalLookups: totalLookups || 0,
        avgTrustScore,
      });
    } catch (error) {
      console.error("Error loading admin data:", error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10">Admin Access</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Aliases</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAliases}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Lookups</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLookups}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Trust Score</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgTrustScore}</div>
              </CardContent>
            </Card>
          </div>

          {/* Data Tables */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="aliases">Aliases</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage all users in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Display Name</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono text-sm">{user.email}</TableCell>
                          <TableCell>{user.display_name || "—"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {user.user_roles?.map((ur: any, idx: number) => (
                                <Badge key={idx} variant="secondary">
                                  {ur.role}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="aliases">
              <Card>
                <CardHeader>
                  <CardTitle>Alias Management</CardTitle>
                  <CardDescription>View all aliases across the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alias</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Trust Score</TableHead>
                        <TableHead>Verification</TableHead>
                        <TableHead>Last Resolved</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aliases.map((alias) => (
                        <TableRow key={alias.id}>
                          <TableCell className="font-mono text-sm">{alias.alias_string}</TableCell>
                          <TableCell>{alias.profiles?.email || "Unknown"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                (alias.trust_score || 0) >= 70
                                  ? "default"
                                  : (alias.trust_score || 0) >= 40
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {alias.trust_score || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {alias.dns_verified && <Badge variant="outline">DNS</Badge>}
                              {alias.https_verified && <Badge variant="outline">HTTPS</Badge>}
                              {alias.dnssec_enabled && <Badge variant="outline">DNSSEC</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {alias.last_resolved_at
                              ? new Date(alias.last_resolved_at).toLocaleDateString()
                              : "Never"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
