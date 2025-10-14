import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Copy, Check, Loader2 } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";

export default function AddAlias() {
  const navigate = useNavigate();
  const { currentOrganization, isPersonalContext } = useOrganization();
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState("");
  const [verificationMethod, setVerificationMethod] = useState<"dns" | "https" | "both">("dns");
  const [walletAddresses, setWalletAddresses] = useState<{ chain: string; address: string }[]>([
    { chain: "btc", address: "" },
  ]);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const addWalletAddress = () => {
    setWalletAddresses([...walletAddresses, { chain: "", address: "" }]);
  };

  const updateWalletAddress = (index: number, field: "chain" | "address", value: string) => {
    const updated = [...walletAddresses];
    updated[index][field] = value;
    setWalletAddresses(updated);
  };

  const removeWalletAddress = (index: number) => {
    setWalletAddresses(walletAddresses.filter((_, i) => i !== index));
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateDNSInstructions = () => {
    return walletAddresses
      .filter((w) => w.chain && w.address)
      .map((w) => `oa1:${w.chain} recipient_address=${w.address}; recipient_name=${domain};`);
  };

  const generateOpenAliasText = () => {
    return walletAddresses
      .filter((w) => w.chain && w.address)
      .map((w) => `oa1:${w.chain} recipient_address=${w.address}; recipient_name=${domain};`)
      .join('\n');
  };

  const handleVerify = async () => {
    setVerifying(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to continue");
        navigate("/auth");
        return;
      }

      // Create the alias record
      const aliasInsert: any = {
        alias_string: domain,
        user_id: user.id,
        verification_method: verificationMethod,
        current_currency: walletAddresses[0]?.chain || null,
        current_address: walletAddresses[0]?.address || null,
      };

      // Add organization_id if in organization context
      if (!isPersonalContext && currentOrganization) {
        aliasInsert.organization_id = currentOrganization.id;
      }

      const { data: aliasData, error: aliasError } = await supabase
        .from("aliases")
        .insert(aliasInsert)
        .select()
        .single();

      if (aliasError) throw aliasError;

      // Prepare addresses for verification
      const expectedAddresses: { [key: string]: string } = {};
      walletAddresses.forEach((w) => {
        if (w.chain && w.address) {
          expectedAddresses[w.chain] = w.address;
        }
      });

      // Call verification edge function
      const { data: verificationResult, error: verifyError } = await supabase.functions.invoke(
        "verify-alias-ownership",
        {
          body: {
            aliasId: aliasData.id,
            domain,
            verificationMethod,
            expectedAddresses,
          },
        }
      );

      if (verifyError) throw verifyError;

      if (verificationResult.success) {
        toast.success("Alias verified successfully!");
        navigate(`/dashboard/aliases/${aliasData.id}`);
      } else {
        toast.error("Verification failed", {
          description: verificationResult.errors.join(", "),
        });
      }
    } catch (error: any) {
      toast.error("Failed to create alias: " + error.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Add New Alias</h1>
          <p className="text-muted-foreground">Register a domain alias for your wallet addresses</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Domain Information</CardTitle>
              <CardDescription>Enter your domain name</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="domain">Domain Name</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Verification Method</Label>
                <RadioGroup value={verificationMethod} onValueChange={(v: any) => setVerificationMethod(v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dns" id="dns" />
                    <Label htmlFor="dns" className="font-normal">DNS TXT Record (OpenAlias)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="https" id="https" />
                    <Label htmlFor="https" className="font-normal">HTTPS JSON File (.well-known)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both" className="font-normal">Both (Highest Trust Score)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => navigate("/dashboard/aliases")}>
                  Cancel
                </Button>
                <Button onClick={() => setStep(2)} disabled={!domain}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Wallet Addresses</CardTitle>
              <CardDescription>Add wallet addresses for each blockchain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {walletAddresses.map((wallet, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Label>Chain</Label>
                    <Input
                      placeholder="btc, eth, etc."
                      value={wallet.chain}
                      onChange={(e) => updateWalletAddress(index, "chain", e.target.value)}
                    />
                  </div>
                  <div className="flex-[2]">
                    <Label>Address</Label>
                    <Input
                      placeholder="Wallet address"
                      value={wallet.address}
                      onChange={(e) => updateWalletAddress(index, "address", e.target.value)}
                    />
                  </div>
                  {walletAddresses.length > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => removeWalletAddress(index)}
                      className="mt-8"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}

              <Button variant="outline" onClick={addWalletAddress}>
                Add Another Chain
              </Button>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {(verificationMethod === "dns" || verificationMethod === "both") && (
              <Card>
                <CardHeader>
                  <CardTitle>DNS TXT Record Setup</CardTitle>
                  <CardDescription>Add these TXT records to your domain's DNS settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {generateDNSInstructions().map((instruction, index) => (
                    <div key={index} className="bg-muted p-3 rounded font-mono text-sm flex justify-between items-center">
                      <code>{instruction}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(instruction, `dns-${index}`)}
                      >
                        {copied === `dns-${index}` ? <Check size={16} /> : <Copy size={16} />}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {(verificationMethod === "https" || verificationMethod === "both") && (
              <Card>
                <CardHeader>
                  <CardTitle>HTTPS File Setup</CardTitle>
                  <CardDescription>
                    Create a file at https://{domain}/.well-known/openalias.txt with this content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded font-mono text-sm relative">
                    <pre>{generateOpenAliasText()}</pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(generateOpenAliasText(), "openalias")}
                    >
                      {copied === "openalias" ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Verify & Activate</CardTitle>
                <CardDescription>
                  Once you've set up the DNS records and/or HTTPS file, click verify to activate your alias
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => navigate("/dashboard/aliases")}>
                  My Aliases
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button onClick={handleVerify} disabled={verifying}>
                    {verifying && <Loader2 className="mr-2 animate-spin" size={16} />}
                    Verify & Activate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
