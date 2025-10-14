import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Clock, AlertCircle, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Usage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCalls: 0,
    thisMonth: 0,
    avgResponseTime: 0,
    errorRate: 0,
    endpointBreakdown: [] as { endpoint: string; count: number }[],
    rateLimit: { limit: 1000, remaining: 1000 },
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    await fetchUsageStats(user.id);
    setLoading(false);
  };

  const fetchUsageStats = async (userId: string) => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get total calls this month
    const { data: monthlyData, error: monthlyError } = await supabase
      .from("api_usage")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    if (monthlyError) {
      console.error("Error fetching monthly usage:", monthlyError);
      return;
    }

    // Get all-time stats
    const { data: allTimeData, error: allTimeError } = await supabase
      .from("api_usage")
      .select("*")
      .eq("user_id", userId);

    if (allTimeError) {
      console.error("Error fetching all-time usage:", allTimeError);
      return;
    }

    // Calculate stats
    const monthlyCount = monthlyData?.length || 0;
    const totalCount = allTimeData?.length || 0;
    
    const avgResponseTime = allTimeData?.length 
      ? Math.round(allTimeData.reduce((sum, item) => sum + item.response_time_ms, 0) / allTimeData.length)
      : 0;

    const errorCount = allTimeData?.filter(item => item.status_code >= 400).length || 0;
    const errorRate = allTimeData?.length ? Math.round((errorCount / allTimeData.length) * 100) : 0;

    // Endpoint breakdown
    const endpointMap = new Map<string, number>();
    allTimeData?.forEach(item => {
      endpointMap.set(item.endpoint, (endpointMap.get(item.endpoint) || 0) + 1);
    });

    const endpointBreakdown = Array.from(endpointMap.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate rate limit status
    const freeLimit = 1000;
    const remaining = Math.max(0, freeLimit - monthlyCount);

    setStats({
      totalCalls: totalCount,
      thisMonth: monthlyCount,
      avgResponseTime,
      errorRate,
      endpointBreakdown,
      rateLimit: { limit: freeLimit, remaining },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading usage data...</p>
        </div>
      </div>
    );
  }

  const freeLimit = 1000;
  const usagePercentage = (stats.thisMonth / freeLimit) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Usage & Billing</h1>
          <p className="text-muted-foreground">
            Track your API consumption and manage your plan
          </p>
        </div>

        {/* Current Plan */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Plan: Free Tier</CardTitle>
            <CardDescription>1,000 resolutions per month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">
                    {stats.thisMonth.toLocaleString()} / {freeLimit.toLocaleString()} calls this month
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {usagePercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={usagePercentage} />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {stats.rateLimit.remaining.toLocaleString()} calls remaining
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Resets monthly
                  </span>
                </div>
              </div>
              
              {usagePercentage >= 100 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm font-semibold text-destructive">
                    <AlertCircle className="inline mr-2 h-4 w-4" />
                    Rate limit reached! Upgrade to Pro to continue.
                  </p>
                </div>
              )}
              
              {usagePercentage >= 80 && usagePercentage < 100 && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <p className="text-sm">
                    <AlertCircle className="inline mr-2 h-4 w-4" />
                    You're approaching your monthly limit ({usagePercentage.toFixed(0)}% used). Consider upgrading to Pro.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">Available Plans</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Free</h4>
                    <p className="text-2xl font-bold mb-2">$0</p>
                    <p className="text-sm text-muted-foreground mb-4">1,000 resolutions/month</p>
                    <Button variant="outline" disabled className="w-full">
                      Current Plan
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4 border-primary">
                    <h4 className="font-semibold mb-2">Pro</h4>
                    <p className="text-2xl font-bold mb-2">$49/mo</p>
                    <p className="text-sm text-muted-foreground mb-4">100,000 resolutions/month + advanced features</p>
                    <Button className="w-full" disabled>
                      Coming Soon
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Enterprise</h4>
                    <p className="text-2xl font-bold mb-2">Custom</p>
                    <p className="text-sm text-muted-foreground mb-4">Unlimited + custom SLAs</p>
                    <Button variant="outline" className="w-full" disabled>
                      Contact Sales
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">API Calls This Month</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonth.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalCalls.toLocaleString()} all-time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">
                Across all requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.errorRate}%</div>
              <p className="text-xs text-muted-foreground">
                4xx and 5xx errors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{100 - stats.errorRate}%</div>
              <p className="text-xs text-muted-foreground">
                Successful requests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Endpoint Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Endpoint</CardTitle>
            <CardDescription>Breakdown of API calls by endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.endpointBreakdown.length > 0 ? (
              <div className="space-y-4">
                {stats.endpointBreakdown.map(({ endpoint, count }) => (
                  <div key={endpoint}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">{endpoint}</span>
                      <span className="text-sm text-muted-foreground">
                        {count.toLocaleString()} calls
                      </span>
                    </div>
                    <Progress 
                      value={(count / stats.totalCalls) * 100} 
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No API usage data yet. Start making API calls to see statistics here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
