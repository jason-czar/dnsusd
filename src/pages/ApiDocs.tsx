import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ArrowLeft, Code2, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function ApiDocs() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  const projectUrl = import.meta.env.VITE_SUPABASE_URL;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">API Documentation</h1>
            <p className="text-muted-foreground">Integrate AliasResolve into your application</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/docs/sdk")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 size={20} />
                SDK & Libraries
              </CardTitle>
              <CardDescription>Client libraries for easy integration</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/docs/webhooks")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen size={20} />
                Webhook Testing
              </CardTitle>
              <CardDescription>Test and configure webhooks</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Base URL and Authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Base URL</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 bg-muted p-2 rounded text-sm">{projectUrl}/functions/v1</code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(`${projectUrl}/functions/v1`, "base-url")}
                >
                  {copied === "base-url" ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Authentication</Label>
              <p className="text-sm text-muted-foreground mt-1">
                All API requests require the API key in the Authorization header:
              </p>
              <div className="bg-muted p-3 rounded mt-2 font-mono text-sm">
                Authorization: Bearer YOUR_API_KEY
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="resolve">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="resolve">Resolve Alias</TabsTrigger>
            <TabsTrigger value="trust">Trust Report</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="resolve" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>POST /resolve-alias</CardTitle>
                  <Badge>Public</Badge>
                </div>
                <CardDescription>Resolve a domain alias to wallet addresses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Request Body</Label>
                  <pre className="bg-muted p-4 rounded mt-2 text-sm overflow-x-auto">
{`{
  "alias": "alice.example.com",
  "chain": "btc" // optional, defaults to "all"
}`}
                  </pre>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Response</Label>
                  <pre className="bg-muted p-4 rounded mt-2 text-sm overflow-x-auto">
{`{
  "success": true,
  "alias": "alice.example.com",
  "addresses": [
    {
      "currency": "btc",
      "address": "bc1q...",
      "confidence": 95,
      "source": "dns"
    }
  ],
  "proofMetadata": {
    "dnssec": true,
    "httpsMatch": true
  }
}`}
                  </pre>
                </div>

                <div>
                  <Label className="text-sm font-semibold">cURL Example</Label>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded mt-2 text-sm overflow-x-auto">
{`curl -X POST ${projectUrl}/functions/v1/resolve-alias \\
  -H "Content-Type: application/json" \\
  -d '{"alias": "alice.example.com", "chain": "btc"}'`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        copyToClipboard(
                          `curl -X POST ${projectUrl}/functions/v1/resolve-alias -H "Content-Type: application/json" -d '{"alias": "alice.example.com", "chain": "btc"}'`,
                          "curl-resolve"
                        )
                      }
                    >
                      {copied === "curl-resolve" ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trust" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>POST /trust-report</CardTitle>
                  <Badge>Public</Badge>
                </div>
                <CardDescription>Get detailed trust analysis for an alias</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Request Body</Label>
                  <pre className="bg-muted p-4 rounded mt-2 text-sm overflow-x-auto">
{`{
  "domain": "alice.example.com"
  // or "aliasId": "uuid"
}`}
                  </pre>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Response</Label>
                  <pre className="bg-muted p-4 rounded mt-2 text-sm overflow-x-auto">
{`{
  "alias": "alice.example.com",
  "trustScore": 85,
  "verificationMethod": "both",
  "proofs": {
    "dnsVerified": true,
    "httpsVerified": true,
    "dnssecEnabled": true
  },
  "breakdown": {
    "baseScore": 50,
    "dnsBonus": 20,
    "dnssecBonus": 10,
    "httpsBonus": 15,
    "multiLayerBonus": 5
  },
  "status": "excellent",
  "recommendations": []
}`}
                  </pre>
                </div>

                <div>
                  <Label className="text-sm font-semibold">JavaScript Example</Label>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded mt-2 text-sm overflow-x-auto">
{`const response = await fetch('${projectUrl}/functions/v1/trust-report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ domain: 'alice.example.com' })
});
const trust = await response.json();
console.log('Trust Score:', trust.trustScore);`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        copyToClipboard(
                          `const response = await fetch('${projectUrl}/functions/v1/trust-report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ domain: 'alice.example.com' })
});
const trust = await response.json();
console.log('Trust Score:', trust.trustScore);`,
                          "js-trust"
                        )
                      }
                    >
                      {copied === "js-trust" ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>POST /webhook-register</CardTitle>
                  <Badge variant="secondary">Requires Auth</Badge>
                </div>
                <CardDescription>Register a webhook for alias change notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Request Body</Label>
                  <pre className="bg-muted p-4 rounded mt-2 text-sm overflow-x-auto">
{`{
  "aliasId": "uuid",
  "callbackUrl": "https://your-app.com/webhook",
  "secretToken": "your-secret-token"
}`}
                  </pre>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Webhook Payload</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    When an alias changes, we'll POST this to your callback URL:
                  </p>
                  <pre className="bg-muted p-4 rounded mt-2 text-sm overflow-x-auto">
{`{
  "event": "alias_changed",
  "alias": "alice.example.com",
  "oldAddress": "bc1q...",
  "newAddress": "bc1p...",
  "currency": "btc",
  "timestamp": "2025-10-14T12:00:00Z"
}`}
                  </pre>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Security</Label>
                  <p className="text-sm text-muted-foreground">
                    Verify webhook authenticity by checking the <code>X-Webhook-Secret</code> header matches your secret token.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Rate Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Public Endpoints:</strong> 100 requests per minute per IP
            </p>
            <p>
              <strong>Authenticated Endpoints:</strong> 1000 requests per minute per API key
            </p>
            <p className="text-muted-foreground">
              Rate limit headers are included in all responses: <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}`}
            </pre>
            <div className="mt-4 space-y-2 text-sm">
              <p><strong>400</strong> - Bad Request (invalid parameters)</p>
              <p><strong>401</strong> - Unauthorized (missing or invalid API key)</p>
              <p><strong>404</strong> - Not Found (alias doesn't exist)</p>
              <p><strong>429</strong> - Too Many Requests (rate limit exceeded)</p>
              <p><strong>500</strong> - Internal Server Error</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={`block ${className}`}>{children}</label>;
}
