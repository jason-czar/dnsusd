import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface AliasData {
  id: string;
  alias_string: string;
  verification_method: string | null;
  dns_verified: boolean;
  https_verified: boolean;
  dnssec_enabled: boolean;
  trust_score: number;
  last_verification_at: string | null;
}

interface ProofDetail {
  name: string;
  status: "pass" | "fail" | "warning";
  score: number;
  message: string;
}

export default function TrustReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alias, setAlias] = useState<AliasData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAliasData();
  }, [id]);

  const fetchAliasData = async () => {
    try {
      const { data, error } = await supabase
        .from("aliases")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setAlias(data);
    } catch (error: any) {
      toast.error("Failed to load trust report: " + error.message);
      navigate("/dashboard/aliases");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading trust report...</p>
      </div>
    );
  }

  if (!alias) return null;

  const proofDetails: ProofDetail[] = [
    {
      name: "DNS TXT Record Verification",
      status: alias.dns_verified ? "pass" : "fail",
      score: 20,
      message: alias.dns_verified
        ? "OpenAlias TXT record found and validated"
        : "No valid OpenAlias TXT record detected",
    },
    {
      name: "DNSSEC Protection",
      status: alias.dnssec_enabled ? "pass" : alias.dns_verified ? "warning" : "fail",
      score: 10,
      message: alias.dnssec_enabled
        ? "Domain has DNSSEC authentication enabled"
        : alias.dns_verified
        ? "DNSSEC is recommended for enhanced security"
        : "DNSSEC validation not available",
    },
    {
      name: "HTTPS JSON Verification",
      status: alias.https_verified ? "pass" : "fail",
      score: 15,
      message: alias.https_verified
        ? "Valid alias.json file found at .well-known/alias.json"
        : "No alias.json file found or validation failed",
    },
    {
      name: "Multi-Layer Verification",
      status: alias.dns_verified && alias.https_verified ? "pass" : "warning",
      score: 5,
      message:
        alias.dns_verified && alias.https_verified
          ? "Both DNS and HTTPS verification layers present"
          : "Consider implementing both verification methods for maximum trust",
    },
  ];

  const getStatusIcon = (status: "pass" | "fail" | "warning") => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="text-green-600" size={20} />;
      case "fail":
        return <XCircle className="text-red-600" size={20} />;
      case "warning":
        return <AlertTriangle className="text-yellow-600" size={20} />;
    }
  };

  const recommendations: string[] = [];
  if (!alias.dns_verified) {
    recommendations.push("Add OpenAlias TXT records to your domain's DNS settings");
  }
  if (!alias.dnssec_enabled && alias.dns_verified) {
    recommendations.push("Enable DNSSEC on your domain for enhanced security");
  }
  if (!alias.https_verified) {
    recommendations.push("Host an alias.json file at .well-known/alias.json");
  }
  if (!(alias.dns_verified && alias.https_verified)) {
    recommendations.push("Implement both DNS and HTTPS verification for maximum trust score");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Trust Report</h1>
            <p className="text-muted-foreground">{alias.alias_string}</p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/dashboard/aliases/${id}`)}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Details
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Overall Trust Score</CardTitle>
            <CardDescription>
              Composite score based on multiple verification layers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <TrustScoreBadge score={alias.trust_score} size="lg" />
              <span className="text-4xl font-bold">{alias.trust_score}/100</span>
            </div>
            <Progress value={alias.trust_score} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {alias.trust_score >= 80
                ? "Excellent - All major verification layers are in place"
                : alias.trust_score >= 60
                ? "Good - Most verification layers present, some improvements possible"
                : alias.trust_score >= 40
                ? "Fair - Basic verification present, significant improvements recommended"
                : "Poor - Insufficient verification, immediate action required"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification Breakdown</CardTitle>
            <CardDescription>Detailed analysis of each trust factor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {proofDetails.map((proof, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                <div className="mt-1">{getStatusIcon(proof.status)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">{proof.name}</h4>
                    <span className="text-sm text-muted-foreground">+{proof.score} points</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{proof.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Ways to improve your trust score</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Trust Score Calculation</CardTitle>
            <CardDescription>How your score is calculated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Base Score:</strong> 50 points
            </p>
            <p>
              <strong>DNS TXT Verification:</strong> +20 points
            </p>
            <p>
              <strong>DNSSEC Enabled:</strong> +10 points
            </p>
            <p>
              <strong>HTTPS JSON Verification:</strong> +15 points
            </p>
            <p>
              <strong>Both DNS + HTTPS:</strong> +5 bonus points
            </p>
            <p className="pt-2 border-t">
              <strong>Maximum Possible Score:</strong> 100 points
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
