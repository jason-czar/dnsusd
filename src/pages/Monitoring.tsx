import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bell, Plus, Trash2, AlertTriangle, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MonitoringRule {
  id: string;
  alias_id: string;
  trust_threshold: number;
  alert_email: boolean;
  alert_webhook_url: string | null;
  enabled: boolean;
  aliases?: {
    alias_string: string;
    trust_score: number;
  };
}

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
  resolved: boolean;
  email_sent: boolean;
  webhook_sent: boolean;
  aliases?: {
    alias_string: string;
  };
}

export default function Monitoring() {
  const [rules, setRules] = useState<MonitoringRule[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [userAliases, setUserAliases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    alias_id: "",
    trust_threshold: 50,
    alert_email: true,
    alert_webhook_url: "",
    enabled: true,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch monitoring rules
      const { data: rulesData, error: rulesError } = await supabase
        .from("monitoring_rules")
        .select(`
          *,
          aliases (
            alias_string,
            trust_score
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (rulesError) throw rulesError;
      setRules(rulesData || []);

      // Fetch alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from("alerts")
        .select(`
          *,
          aliases (
            alias_string
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (alertsError) throw alertsError;
      setAlerts(alertsData || []);

      // Fetch user aliases for dropdown
      const { data: aliasesData, error: aliasesError } = await supabase
        .from("aliases")
        .select("id, alias_string, trust_score")
        .eq("user_id", user.id)
        .order("alias_string");

      if (aliasesError) throw aliasesError;
      setUserAliases(aliasesData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("monitoring_rules").insert({
        ...newRule,
        user_id: user.id,
        alert_webhook_url: newRule.alert_webhook_url || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Monitoring rule created successfully",
      });

      setIsDialogOpen(false);
      setNewRule({
        alias_id: "",
        trust_threshold: 50,
        alert_email: true,
        alert_webhook_url: "",
        enabled: true,
      });
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleToggleRule = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("monitoring_rules")
        .update({ enabled })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Rule ${enabled ? "enabled" : "disabled"}`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this monitoring rule?")) return;

    try {
      const { error } = await supabase.from("monitoring_rules").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Monitoring rule deleted",
      });

      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Alert marked as resolved",
      });

      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: any = {
      critical: "destructive",
      warning: "secondary",
      info: "outline",
    };
    return <Badge variant={variants[severity] || "outline"}>{severity}</Badge>;
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: any = {
      trust_score_drop: "Trust Score Drop",
      verification_failed: "Verification Failed",
      address_change: "Address Change",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Monitoring & Alerts</h1>
            <p className="text-muted-foreground">Configure monitoring rules and view alert history</p>
          </div>
        </div>
      </div>

      {/* Monitoring Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Monitoring Rules
              </CardTitle>
              <CardDescription>
                Configure alerts for your aliases based on trust score and verification status
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Monitoring Rule</DialogTitle>
                  <DialogDescription>
                    Set up alerts for changes to your alias verification status
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Alias</Label>
                    <Select
                      value={newRule.alias_id}
                      onValueChange={(value) => setNewRule({ ...newRule, alias_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an alias" />
                      </SelectTrigger>
                      <SelectContent>
                        {userAliases.map((alias) => (
                          <SelectItem key={alias.id} value={alias.id}>
                            {alias.alias_string} (Trust: {alias.trust_score})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Trust Score Threshold</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={newRule.trust_threshold}
                      onChange={(e) =>
                        setNewRule({ ...newRule, trust_threshold: parseInt(e.target.value) })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Alert when trust score drops below this value
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Email Alerts</Label>
                    <Switch
                      checked={newRule.alert_email}
                      onCheckedChange={(checked) =>
                        setNewRule({ ...newRule, alert_email: checked })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Webhook URL (Optional)</Label>
                    <Input
                      type="url"
                      placeholder="https://example.com/webhook"
                      value={newRule.alert_webhook_url}
                      onChange={(e) =>
                        setNewRule({ ...newRule, alert_webhook_url: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Enable Rule</Label>
                    <Switch
                      checked={newRule.enabled}
                      onCheckedChange={(checked) => setNewRule({ ...newRule, enabled: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRule} disabled={!newRule.alias_id}>
                    Create Rule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No monitoring rules configured</p>
              <p className="text-sm">Create a rule to start monitoring your aliases</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alias</TableHead>
                  <TableHead>Trust Threshold</TableHead>
                  <TableHead>Current Score</TableHead>
                  <TableHead>Alerts</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      {rule.aliases?.alias_string || "Unknown"}
                    </TableCell>
                    <TableCell>{rule.trust_threshold}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          (rule.aliases?.trust_score || 0) >= 70
                            ? "default"
                            : (rule.aliases?.trust_score || 0) >= 40
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {rule.aliases?.trust_score || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {rule.alert_email && <Badge variant="outline">Email</Badge>}
                        {rule.alert_webhook_url && <Badge variant="outline">Webhook</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alert History
          </CardTitle>
          <CardDescription>Recent alerts triggered by your monitoring rules</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No alerts triggered</p>
              <p className="text-sm">Your aliases are being monitored</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Notifications</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id} className={alert.resolved ? "opacity-50" : ""}>
                    <TableCell>
                      {new Date(alert.created_at).toLocaleDateString()}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleTimeString()}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {alert.aliases?.alias_string || "Unknown"}
                    </TableCell>
                    <TableCell>{getAlertTypeLabel(alert.alert_type)}</TableCell>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell className="max-w-xs truncate">{alert.message}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {alert.email_sent && (
                          <Badge variant="outline" className="text-xs">
                            Email
                          </Badge>
                        )}
                        {alert.webhook_sent && (
                          <Badge variant="outline" className="text-xs">
                            Webhook
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {alert.resolved ? (
                        <Badge variant="outline">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!alert.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
