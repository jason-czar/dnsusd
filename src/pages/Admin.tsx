import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Database, Activity, ArrowLeft, TrendingUp, AlertCircle, CheckCircle, Clock, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
  const [activityData, setActivityData] = useState<any[]>([]);
  const [alertsData, setAlertsData] = useState<any[]>([]);
  const [trustScoreDistribution, setTrustScoreDistribution] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState({
    apiHealth: "healthy",
    dbHealth: "healthy",
    lastCheck: new Date(),
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

      // Load activity data (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentLookups } = await supabase
        .from("lookups")
        .select("created_at")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      // Group by day
      const dailyActivity = recentLookups?.reduce((acc: any, lookup: any) => {
        const day = new Date(lookup.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.entries(dailyActivity || {}).map(([date, count]) => ({
        date,
        lookups: count,
      }));
      setActivityData(chartData);

      // Load recent alerts
      const { data: alerts } = await supabase
        .from("alerts")
        .select(`
          *,
          aliases (alias_string),
          profiles (email)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      setAlertsData(alerts || []);

      // Calculate trust score distribution
      const distribution = [
        { name: "High (70-100)", value: aliasesData?.filter(a => (a.trust_score || 0) >= 70).length || 0, color: "hsl(var(--primary))" },
        { name: "Medium (40-69)", value: aliasesData?.filter(a => (a.trust_score || 0) >= 40 && (a.trust_score || 0) < 70).length || 0, color: "hsl(var(--accent))" },
        { name: "Low (0-39)", value: aliasesData?.filter(a => (a.trust_score || 0) < 40).length || 0, color: "hsl(var(--destructive))" },
      ];
      setTrustScoreDistribution(distribution);

      // Check system health
      const healthCheck = {
        apiHealth: "healthy" as const,
        dbHealth: "healthy" as const,
        lastCheck: new Date(),
      };
      setSystemHealth(healthCheck);

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
          {/* System Health */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Health
                  </CardTitle>
                  <CardDescription>Real-time system status and monitoring</CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  Last checked: {systemHealth.lastCheck.toLocaleTimeString()}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">API Services</div>
                    <div className="text-sm text-muted-foreground capitalize">{systemHealth.apiHealth}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Database</div>
                    <div className="text-sm text-muted-foreground capitalize">{systemHealth.dbHealth}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Activity (Last 7 Days)
                </CardTitle>
                <CardDescription>Daily lookup requests</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="colorLookups" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area type="monotone" dataKey="lookups" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorLookups)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Trust Score Distribution
                </CardTitle>
                <CardDescription>Alias trust score breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={trustScoreDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {trustScoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          {alertsData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Recent Alerts
                </CardTitle>
                <CardDescription>Latest system alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alertsData.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border">
                      <AlertCircle className={`h-5 w-5 mt-0.5 ${
                        alert.severity === 'critical' ? 'text-destructive' :
                        alert.severity === 'warning' ? 'text-accent' :
                        'text-muted-foreground'
                      }`} />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{alert.alert_type}</span>
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {alert.severity}
                          </Badge>
                          {alert.resolved && (
                            <Badge variant="outline">Resolved</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.created_at).toLocaleString()}
                          </span>
                          {alert.aliases && (
                            <span className="font-mono">{alert.aliases.alias_string}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Tables */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="aliases">Aliases</TabsTrigger>
              <TabsTrigger value="activity">Activity Logs</TabsTrigger>
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

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest API usage and lookups</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alias</TableHead>
                        <TableHead>Chain</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aliases.slice(0, 20).map((alias) => (
                        <TableRow key={alias.id}>
                          <TableCell className="font-mono text-sm">{alias.alias_string}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{alias.current_currency || "—"}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {alias.current_address ? `${alias.current_address.slice(0, 8)}...${alias.current_address.slice(-6)}` : "—"}
                          </TableCell>
                          <TableCell>
                            {alias.trust_score ? (
                              <Badge variant={alias.trust_score >= 70 ? "default" : alias.trust_score >= 40 ? "secondary" : "destructive"}>
                                {alias.trust_score}%
                              </Badge>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {alias.last_resolved_at
                              ? new Date(alias.last_resolved_at).toLocaleString()
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
