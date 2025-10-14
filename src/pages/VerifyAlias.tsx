import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Copy,
  Shield,
  Globe,
  Lock,
} from "lucide-react";
import { VerificationStatusIcon } from "@/components/VerificationStatusIcon";

interface Alias {
  id: string;
  alias_string: string;
  current_address: string | null;
  current_currency: string | null;
  dns_verified: boolean;
  https_verified: boolean;
  dnssec_enabled: boolean;
  trust_score: number;
  last_verification_at: string | null;
}

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "running" | "success" | "error";
  error?: string;
}

export default function VerifyAlias() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [alias, setAlias] = useState<Alias | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<VerificationStep[]>([
    {
      id: "dns",
      title: "DNS TXT Record Verification",
      description: "Checking for OpenAlias TXT records in DNS",
      status: "pending",
    },
    {
      id: "https",
      title: "HTTPS Endpoint Verification",
      description: "Verifying .well-known/openalias.txt file",
      status: "pending",
    },
    {
      id: "dnssec",
      title: "DNSSEC Check",
      description: "Validating DNSSEC security",
      status: "pending",
    },
  ]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchAlias();
  };

  const fetchAlias = async () => {
    try {
      const { data, error } = await supabase
        .from("aliases")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setAlias(data);
      
      // Initialize step statuses based on current verification state
      if (data) {
        updateStepStatus("dns", data.dns_verified ? "success" : "pending");
        updateStepStatus("https", data.https_verified ? "success" : "pending");
        updateStepStatus("dnssec", data.dnssec_enabled ? "success" : "pending");
      }
    } catch (error: any) {
      toast.error("Failed to load alias: " + error.message);
      navigate("/dashboard/aliases");
    } finally {
      setLoading(false);
    }
  };

  const updateStepStatus = (
    stepId: string,
    status: VerificationStep["status"],
    error?: string
  ) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, status, error } : step
      )
    );
  };

  const handleVerify = async () => {
    if (!alias) return;

    setVerifying(true);
    setCurrentStep(0);

    // Reset all steps to pending
    setSteps((prev) =>
      prev.map((step) => ({ ...step, status: "pending" as const, error: undefined }))
    );

    try {
      // Step 1: DNS Verification
      setCurrentStep(0);
      updateStepStatus("dns", "running");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 2: HTTPS Verification
      setCurrentStep(1);
      updateStepStatus("https", "running");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 3: DNSSEC Check
      setCurrentStep(2);
      updateStepStatus("dnssec", "running");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Call verification edge function
      const { data, error } = await supabase.functions.invoke("verify-domain", {
        body: {
          aliasId: alias.id,
          domain: alias.alias_string,
          expectedAddress: alias.current_address,
          expectedCurrency: alias.current_currency,
        },
      });

      if (error) throw error;

      const result = data.result;

      // Update step statuses based on results
      updateStepStatus(
        "dns",
        result.dns_verified ? "success" : "error",
        result.dns_error
      );
      updateStepStatus(
        "https",
        result.https_verified ? "success" : "error",
        result.https_error
      );
      updateStepStatus(
        "dnssec",
        result.dnssec_enabled ? "success" : "error",
        !result.dnssec_enabled ? "DNSSEC not enabled" : undefined
      );

      // Refresh alias data
      await fetchAlias();

      if (result.dns_verified || result.https_verified) {
        toast.success(
          `Verification complete! Trust score: ${data.trustScore}`
        );
      } else {
        toast.error("Verification failed. Please check the errors below.");
      }
    } catch (error: any) {
      toast.error("Verification failed: " + error.message);
      updateStepStatus("dns", "error", error.message);
    } finally {
      setVerifying(false);
    }
  };

  const copyDNSRecord = () => {
    if (!alias) return;
    const record = `${alias.alias_string}. IN TXT "oa1:${alias.current_currency} recipient_address=${alias.current_address}; recipient_name=${alias.current_currency};"`;
    navigator.clipboard.writeText(record);
    toast.success("DNS record copied to clipboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading verification...</p>
      </div>
    );
  }

  if (!alias) {
    return null;
  }

  const overallProgress = steps.filter((s) => s.status === "success").length * 33.33;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Verify Alias</h1>
            <p className="text-muted-foreground">{alias.alias_string}</p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/dashboard/aliases/${id}`)}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Details
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={20} />
              Current Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Trust Score</span>
              <Badge variant={alias.trust_score >= 80 ? "default" : "secondary"}>
                {alias.trust_score}/100
              </Badge>
            </div>
            <Progress value={alias.trust_score} />

            <Separator />

            <div className="grid gap-3">
              <VerificationStatusIcon
                verified={alias.dns_verified}
                label="DNS Verified"
              />
              <VerificationStatusIcon
                verified={alias.https_verified}
                label="HTTPS Verified"
              />
              <VerificationStatusIcon
                verified={alias.dnssec_enabled}
                label="DNSSEC Enabled"
                warning={!alias.dnssec_enabled ? "Optional but recommended" : undefined}
              />
            </div>

            {alias.last_verification_at && (
              <p className="text-sm text-muted-foreground">
                Last verified: {new Date(alias.last_verification_at).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Verification Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Process</CardTitle>
            <CardDescription>
              Follow these steps to verify your domain ownership
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.id} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {step.status === "success" && (
                      <CheckCircle2 className="text-green-600" size={20} />
                    )}
                    {step.status === "error" && (
                      <XCircle className="text-red-600" size={20} />
                    )}
                    {step.status === "running" && (
                      <Loader2 className="text-primary animate-spin" size={20} />
                    )}
                    {step.status === "pending" && (
                      <AlertCircle className="text-muted-foreground" size={20} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.error && (
                      <p className="text-sm text-destructive mt-1">{step.error}</p>
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && <Separator className="ml-8" />}
              </div>
            ))}

            <Button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full"
              size="lg"
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={20} />
                  Verifying...
                </>
              ) : (
                "Start Verification"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe size={20} />
              DNS Setup Instructions
            </CardTitle>
            <CardDescription>
              Add this TXT record to your DNS configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg font-mono text-sm break-all">
              {alias.alias_string}. IN TXT "oa1:{alias.current_currency}{" "}
              recipient_address={alias.current_address}; recipient_name=
              {alias.current_currency};"
            </div>
            <Button variant="outline" onClick={copyDNSRecord} className="w-full">
              <Copy size={16} className="mr-2" />
              Copy DNS Record
            </Button>
          </CardContent>
        </Card>

        {/* HTTPS Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={20} />
              HTTPS Setup Instructions
            </CardTitle>
            <CardDescription>
              Alternative: Host an OpenAlias file on your domain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm mb-2">
                Create a file at:{" "}
                <code className="bg-muted px-2 py-1 rounded">
                  https://{alias.alias_string}/.well-known/openalias.txt
                </code>
              </p>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                oa1:{alias.current_currency} recipient_address=
                {alias.current_address}; recipient_name={alias.current_currency};
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
