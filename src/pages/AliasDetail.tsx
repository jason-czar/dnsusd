import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { VerificationStatusIcon } from "@/components/VerificationStatusIcon";
import { toast } from "sonner";
import { format } from "date-fns";
import { RefreshCw, ArrowLeft, Trash2 } from "lucide-react";

interface AliasData {
  id: string;
  alias_string: string;
  current_address: string | null;
  current_currency: string | null;
  verification_method: string | null;
  dns_verified: boolean;
  https_verified: boolean;
  dnssec_enabled: boolean;
  trust_score: number;
  last_verification_at: string | null;
  created_at: string;
  updated_at: string;
}

interface HistoryEntry {
  id: string;
  address: string;
  currency: string;
  resolved_at: string;
  confidence: number | null;
  source_type: string;
}

export default function AliasDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alias, setAlias] = useState<AliasData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAliasData();
  }, [id]);

  const fetchAliasData = async () => {
    try {
      const { data: aliasData, error: aliasError } = await supabase
        .from("aliases")
        .select("*")
        .eq("id", id)
        .single();

      if (aliasError) throw aliasError;
      setAlias(aliasData);

      const { data: historyData, error: historyError } = await supabase
        .from("alias_history")
        .select("*")
        .eq("alias_id", id)
        .order("resolved_at", { ascending: false });

      if (historyError) throw historyError;
      setHistory(historyData || []);
    } catch (error: any) {
      toast.error("Failed to load alias: " + error.message);
      navigate("/dashboard/aliases");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this alias?")) return;

    try {
      const { error } = await supabase.from("aliases").delete().eq("id", id);
      if (error) throw error;
      
      toast.success("Alias deleted successfully");
      navigate("/dashboard/aliases");
    } catch (error: any) {
      toast.error("Failed to delete alias: " + error.message);
    }
  };

  const handleReVerify = async () => {
    if (!alias) return;
    navigate(`/dashboard/aliases/${alias.id}/verify`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!alias) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{alias.alias_string}</h1>
            <p className="text-muted-foreground">Alias Details</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard/aliases")}>
            <ArrowLeft size={16} className="mr-2" />
            Back to List
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Trust Score</span>
              <div className="flex items-center gap-2">
                <TrustScoreBadge score={alias.trust_score} size="md" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/dashboard/aliases/${id}/trust`)}
                >
                  View Report
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Address</span>
              <code className="text-sm">{alias.current_address || "N/A"}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Chain</span>
              <span>{alias.current_currency || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Verification Method</span>
              <span className="capitalize">{alias.verification_method || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Verified</span>
              <span>
                {alias.last_verification_at
                  ? format(new Date(alias.last_verification_at), "MMM d, yyyy 'at' h:mm a")
                  : "Never"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification Proofs</CardTitle>
            <CardDescription>Status of different verification layers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <VerificationStatusIcon
              verified={alias.dns_verified}
              label="DNS TXT Record"
            />
            <VerificationStatusIcon
              verified={alias.https_verified}
              label="HTTPS JSON File"
            />
            <VerificationStatusIcon
              verified={alias.dnssec_enabled}
              label="DNSSEC Enabled"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change History</CardTitle>
            <CardDescription>Timeline of address changes with diffs</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-muted-foreground">No history available</p>
            ) : (
              <div className="space-y-4">
                {history.map((entry, index) => {
                  const prevEntry = index < history.length - 1 ? history[index + 1] : null;
                  const addressChanged = prevEntry && prevEntry.address !== entry.address;
                  
                  return (
                    <div key={entry.id} className="pb-4 border-b last:border-0">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(entry.resolved_at), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-muted">
                              {entry.source_type}
                            </span>
                            {addressChanged && (
                              <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive">
                                Address Changed
                              </span>
                            )}
                          </div>
                          
                          {addressChanged && prevEntry ? (
                            <div className="bg-muted/50 p-3 rounded-md space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Previous:</span>
                                <code className="text-destructive line-through">{prevEntry.address}</code>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">New:</span>
                                <code className="text-green-600 dark:text-green-400 font-semibold">
                                  {entry.address}
                                </code>
                              </div>
                            </div>
                          ) : (
                            <code className="text-sm block">{entry.address}</code>
                          )}
                          
                          <div className="text-xs text-muted-foreground">
                            {entry.currency} • Confidence: {entry.confidence || "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 size={16} className="mr-2" />
            Delete Alias
          </Button>
          <Button onClick={handleReVerify}>
            <RefreshCw size={16} className="mr-2" />
            Re-verify
          </Button>
        </div>
      </main>
    </div>
  );
}
