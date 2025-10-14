import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Bell, Mail, Webhook, ArrowLeft, Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonitoringRule {
  id: string;
  alias_id: string;
  enabled: boolean;
  alert_email: boolean;
  alert_webhook_url: string | null;
  trust_threshold: number;
  alias?: {
    alias_string: string;
  };
}

interface Alias {
  id: string;
  alias_string: string;
}

export default function Monitoring() {
  const navigate = useNavigate();
  const [rules, setRules] = useState<MonitoringRule[]>([]);
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlias, setSelectedAlias] = useState("");
  const [newRule, setNewRule] = useState({
    alertEmail: true,
    webhookUrl: "",
    trustThreshold: 50,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  };

  const fetchData = async () => {
    try {
      const [rulesResponse, aliasesResponse] = await Promise.all([
        supabase
          .from("monitoring_rules")
          .select("*, aliases(alias_string)")
          .order("created_at", { ascending: false }),
        supabase.from("aliases").select("id, alias_string").order("alias_string"),
      ]);

      if (rulesResponse.error) throw rulesResponse.error;
      if (aliasesResponse.error) throw aliasesResponse.error;

      setRules(rulesResponse.data || []);
      setAliases(aliasesResponse.data || []);
    } catch (error: any) {
      toast.error("Failed to load monitoring rules: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!selectedAlias) {
      toast.error("Please select an alias");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("monitoring_rules").insert({
        user_id: user.id,
        alias_id: selectedAlias,
        enabled: true,
        alert_email: newRule.alertEmail,
        alert_webhook_url: newRule.webhookUrl || null,
        trust_threshold: newRule.trustThreshold,
      });

      if (error) throw error;

      toast.success("Monitoring rule created");
      setSelectedAlias("");
      setNewRule({ alertEmail: true, webhookUrl: "", trustThreshold: 50 });
      fetchData();
    } catch (error: any) {
      toast.error("Failed to create rule: " + error.message);
    }
  };

  const handleToggleRule = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("monitoring_rules")
        .update({ enabled })
        .eq("id", id);

      if (error) throw error;

      toast.success(enabled ? "Monitoring enabled" : "Monitoring disabled");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update rule: " + error.message);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this monitoring rule?")) return;

    try {
      const { error } = await supabase.from("monitoring_rules").delete().eq("id", id);

      if (error) throw error;

      toast.success("Monitoring rule deleted");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete rule: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const availableAliases = aliases.filter(
    (alias) => !rules.some((rule) => rule.alias_id === alias.id)
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Monitoring & Alerts</h1>
            <p className="text-muted-foreground">Configure change detection and notifications</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Monitoring Rule</CardTitle>
            <CardDescription>Set up alerts for alias changes or trust score drops</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="alias-select">Select Alias</Label>
              <Select value={selectedAlias} onValueChange={setSelectedAlias}>
                <SelectTrigger id="alias-select">
                  <SelectValue placeholder="Choose an alias to monitor" />
                </SelectTrigger>
                <SelectContent>
                  {availableAliases.map((alias) => (
                    <SelectItem key={alias.id} value={alias.id}>
                      {alias.alias_string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive alerts via email</p>
              </div>
              <Switch
                checked={newRule.alertEmail}
                onCheckedChange={(checked) =>
                  setNewRule({ ...newRule, alertEmail: checked })
                }
              />
            </div>

            <div>
              <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
              <Input
                id="webhook-url"
                placeholder="https://your-webhook-endpoint.com"
                value={newRule.webhookUrl}
                onChange={(e) => setNewRule({ ...newRule, webhookUrl: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="trust-threshold">Trust Score Threshold</Label>
              <Input
                id="trust-threshold"
                type="number"
                min="0"
                max="100"
                value={newRule.trustThreshold}
                onChange={(e) =>
                  setNewRule({ ...newRule, trustThreshold: parseInt(e.target.value) || 50 })
                }
              />
              <p className="text-sm text-muted-foreground mt-1">
                Alert when trust score drops below this value
              </p>
            </div>

            <Button onClick={handleCreateRule} disabled={!selectedAlias} className="w-full">
              <Plus size={16} className="mr-2" />
              Create Monitoring Rule
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Monitoring Rules</h2>

          {rules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="mx-auto mb-4 text-muted-foreground" size={48} />
                <h3 className="text-lg font-semibold mb-2">No monitoring rules yet</h3>
                <p className="text-muted-foreground">
                  Create your first monitoring rule to get alerts about alias changes
                </p>
              </CardContent>
            </Card>
          ) : (
            rules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {rule.alias?.alias_string || "Unknown alias"}
                      </CardTitle>
                      <CardDescription>
                        Alert threshold: {rule.trust_threshold} trust score
                      </CardDescription>
                    </div>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail size={16} className="text-muted-foreground" />
                      <span>
                        Email notifications: {rule.alert_email ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    {rule.alert_webhook_url && (
                      <div className="flex items-center gap-2 text-sm">
                        <Webhook size={16} className="text-muted-foreground" />
                        <span className="truncate">Webhook: {rule.alert_webhook_url}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-4"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete Rule
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
