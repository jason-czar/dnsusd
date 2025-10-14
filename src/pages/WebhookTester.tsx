import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Send, Webhook } from "lucide-react";

export default function WebhookTester() {
  const navigate = useNavigate();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [secretToken, setSecretToken] = useState("");
  const [testPayload, setTestPayload] = useState(JSON.stringify({
    event: "alias_changed",
    alias: "test.example.com",
    oldAddress: "bc1qold...",
    newAddress: "bc1qnew...",
    currency: "btc",
    timestamp: new Date().toISOString(),
  }, null, 2));
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!webhookUrl) {
      toast.error("Please enter a webhook URL");
      return;
    }

    setLoading(true);
    setResponse("");

    try {
      const payload = JSON.parse(testPayload);
      
      const startTime = Date.now();
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secretToken ? { "X-Webhook-Secret": secretToken } : {}),
        },
        body: JSON.stringify(payload),
      });
      const endTime = Date.now();

      const responseText = await res.text();
      
      setResponse(`Status: ${res.status} ${res.statusText}
Response Time: ${endTime - startTime}ms

Headers:
${Array.from(res.headers.entries()).map(([key, value]) => `${key}: ${value}`).join('\n')}

Body:
${responseText}`);

      if (res.ok) {
        toast.success("Webhook test successful");
      } else {
        toast.error("Webhook returned an error");
      }
    } catch (error: any) {
      setResponse(`Error: ${error.message}`);
      toast.error("Failed to send webhook: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Webhook Tester</h1>
            <p className="text-muted-foreground">Test your webhook integrations</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/docs/api")}>
            <ArrowLeft size={16} className="mr-2" />
            Back to API Docs
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook size={20} />
              Webhook Configuration
            </CardTitle>
            <CardDescription>
              Test your webhook endpoint before registering it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                placeholder="https://your-app.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="secret-token">Secret Token (Optional)</Label>
              <Input
                id="secret-token"
                type="password"
                placeholder="your-secret-token"
                value={secretToken}
                onChange={(e) => setSecretToken(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Will be sent as X-Webhook-Secret header
              </p>
            </div>

            <div>
              <Label htmlFor="test-payload">Test Payload (JSON)</Label>
              <Textarea
                id="test-payload"
                rows={12}
                className="font-mono text-sm"
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
              />
            </div>

            <Button onClick={handleTest} disabled={loading} className="w-full">
              <Send size={16} className="mr-2" />
              {loading ? "Sending..." : "Send Test Webhook"}
            </Button>
          </CardContent>
        </Card>

        {response && (
          <Card>
            <CardHeader>
              <CardTitle>Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap">
                {response}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Webhook Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>1. Respond Quickly</strong>
              <p className="text-muted-foreground">
                Return a 200 OK status within 5 seconds. Process data asynchronously if needed.
              </p>
            </div>
            <div>
              <strong>2. Verify Signatures</strong>
              <p className="text-muted-foreground">
                Always check the X-Webhook-Secret header matches your registered secret.
              </p>
            </div>
            <div>
              <strong>3. Handle Duplicates</strong>
              <p className="text-muted-foreground">
                Webhooks may be sent multiple times. Use idempotency keys to prevent duplicate processing.
              </p>
            </div>
            <div>
              <strong>4. Log Everything</strong>
              <p className="text-muted-foreground">
                Keep logs of all webhook deliveries for debugging and audit purposes.
              </p>
            </div>
            <div>
              <strong>5. Use HTTPS</strong>
              <p className="text-muted-foreground">
                Only use HTTPS endpoints for webhooks to ensure data security.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Example Webhook Handler (Node.js)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`const express = require('express');
const app = express();

app.post('/webhook', express.json(), (req, res) => {
  // Verify secret token
  const signature = req.headers['x-webhook-secret'];
  if (signature !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook
  const { event, alias, newAddress } = req.body;
  console.log(\`Received \${event} for \${alias}: \${newAddress}\`);

  // Respond quickly
  res.json({ received: true });

  // Handle asynchronously
  processWebhookAsync(req.body);
});

app.listen(3000);`}
            </pre>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
