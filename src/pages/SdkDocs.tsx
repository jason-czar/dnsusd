import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";

export default function SdkDocs() {
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
            <h1 className="text-2xl font-bold">SDK & Integration Examples</h1>
            <p className="text-muted-foreground">Client libraries and code examples</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/docs/api")}>
            <ArrowLeft size={16} className="mr-2" />
            Back to API Docs
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <Tabs defaultValue="javascript">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="javascript">JavaScript/TypeScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="curl">cURL</TabsTrigger>
          </TabsList>

          <TabsContent value="javascript" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>JavaScript/TypeScript SDK</CardTitle>
                <CardDescription>Easy-to-use client for browser and Node.js</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Installation</Label>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded mt-2 text-sm">
npm install @supabase/supabase-js
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard("npm install @supabase/supabase-js", "npm-install")}
                    >
                      {copied === "npm-install" ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Basic Usage</Label>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded mt-2 text-sm overflow-x-auto">
{`import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  '${projectUrl}',
  'YOUR_ANON_KEY'
);

// Resolve an alias
async function resolveAlias(alias: string, chain = 'all') {
  const { data, error } = await supabase.functions.invoke('resolve-alias', {
    body: { alias, chain }
  });
  
  if (error) throw error;
  return data;
}

// Usage
const result = await resolveAlias('alice.example.com', 'btc');
console.log('Address:', result.addresses[0].address);`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        copyToClipboard(
                          `import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  '${projectUrl}',
  'YOUR_ANON_KEY'
);

// Resolve an alias
async function resolveAlias(alias: string, chain = 'all') {
  const { data, error } = await supabase.functions.invoke('resolve-alias', {
    body: { alias, chain }
  });
  
  if (error) throw error;
  return data;
}

// Usage
const result = await resolveAlias('alice.example.com', 'btc');
console.log('Address:', result.addresses[0].address);`,
                          "js-basic"
                        )
                      }
                    >
                      {copied === "js-basic" ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">With Caching & Error Handling</Label>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded mt-2 text-sm overflow-x-auto">
{`class AliasResolver {
  private cache = new Map<string, { data: any; expires: number }>();
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async resolve(alias: string, chain = 'all', ttl = 3600000) {
    const cacheKey = \`\${alias}-\${chain}\`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      const { data, error } = await this.supabase.functions.invoke('resolve-alias', {
        body: { alias, chain }
      });

      if (error) throw error;

      this.cache.set(cacheKey, {
        data,
        expires: Date.now() + ttl
      });

      return data;
    } catch (error) {
      console.error('Resolution failed:', error);
      throw new Error(\`Failed to resolve \${alias}: \${error.message}\`);
    }
  }

  async getTrustReport(domain: string) {
    const { data, error } = await this.supabase.functions.invoke('trust-report', {
      body: { domain }
    });

    if (error) throw error;
    return data;
  }
}

// Usage
const resolver = new AliasResolver('${projectUrl}', 'YOUR_ANON_KEY');
const result = await resolver.resolve('alice.example.com', 'btc');`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        copyToClipboard(
                          `class AliasResolver {
  private cache = new Map<string, { data: any; expires: number }>();
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async resolve(alias: string, chain = 'all', ttl = 3600000) {
    const cacheKey = \`\${alias}-\${chain}\`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      const { data, error } = await this.supabase.functions.invoke('resolve-alias', {
        body: { alias, chain }
      });

      if (error) throw error;

      this.cache.set(cacheKey, {
        data,
        expires: Date.now() + ttl
      });

      return data;
    } catch (error) {
      console.error('Resolution failed:', error);
      throw new Error(\`Failed to resolve \${alias}: \${error.message}\`);
    }
  }

  async getTrustReport(domain: string) {
    const { data, error } = await this.supabase.functions.invoke('trust-report', {
      body: { domain }
    });

    if (error) throw error;
    return data;
  }
}`,
                          "js-advanced"
                        )
                      }
                    >
                      {copied === "js-advanced" ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="python" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Python SDK</CardTitle>
                <CardDescription>Simple integration for Python applications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Installation</Label>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded mt-2 text-sm">
pip install supabase
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard("pip install supabase", "pip-install")}
                    >
                      {copied === "pip-install" ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Basic Usage</Label>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded mt-2 text-sm overflow-x-auto">
{`from supabase import create_client, Client

supabase: Client = create_client(
    "${projectUrl}",
    "YOUR_ANON_KEY"
)

def resolve_alias(alias: str, chain: str = "all"):
    response = supabase.functions.invoke(
        "resolve-alias",
        {"alias": alias, "chain": chain}
    )
    return response.json()

# Usage
result = resolve_alias("alice.example.com", "btc")
print(f"Address: {result['addresses'][0]['address']}")`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        copyToClipboard(
                          `from supabase import create_client, Client

supabase: Client = create_client(
    "${projectUrl}",
    "YOUR_ANON_KEY"
)

def resolve_alias(alias: str, chain: str = "all"):
    response = supabase.functions.invoke(
        "resolve-alias",
        {"alias": alias, "chain": chain}
    )
    return response.json()

# Usage
result = resolve_alias("alice.example.com", "btc")
print(f"Address: {result['addresses'][0]['address']}")`,
                          "py-basic"
                        )
                      }
                    >
                      {copied === "py-basic" ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Advanced Class</Label>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded mt-2 text-sm overflow-x-auto">
{`import time
from typing import Optional, Dict
from supabase import create_client, Client

class AliasResolver:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.cache: Dict[str, Dict] = {}
    
    def resolve(self, alias: str, chain: str = "all", ttl: int = 3600) -> Dict:
        cache_key = f"{alias}-{chain}"
        cached = self.cache.get(cache_key)
        
        if cached and cached['expires'] > time.time():
            return cached['data']
        
        try:
            response = self.supabase.functions.invoke(
                "resolve-alias",
                {"alias": alias, "chain": chain}
            )
            data = response.json()
            
            self.cache[cache_key] = {
                'data': data,
                'expires': time.time() + ttl
            }
            
            return data
        except Exception as e:
            raise Exception(f"Failed to resolve {alias}: {str(e)}")
    
    def get_trust_report(self, domain: str) -> Dict:
        response = self.supabase.functions.invoke(
            "trust-report",
            {"domain": domain}
        )
        return response.json()

# Usage
resolver = AliasResolver("${projectUrl}", "YOUR_ANON_KEY")
result = resolver.resolve("alice.example.com", "btc")
trust = resolver.get_trust_report("alice.example.com")`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        copyToClipboard(
                          `import time
from typing import Optional, Dict
from supabase import create_client, Client

class AliasResolver:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.cache: Dict[str, Dict] = {}
    
    def resolve(self, alias: str, chain: str = "all", ttl: int = 3600) -> Dict:
        cache_key = f"{alias}-{chain}"
        cached = self.cache.get(cache_key)
        
        if cached and cached['expires'] > time.time():
            return cached['data']
        
        try:
            response = self.supabase.functions.invoke(
                "resolve-alias",
                {"alias": alias, "chain": chain}
            )
            data = response.json()
            
            self.cache[cache_key] = {
                'data': data,
                'expires': time.time() + ttl
            }
            
            return data
        except Exception as e:
            raise Exception(f"Failed to resolve {alias}: {str(e)}")
    
    def get_trust_report(self, domain: str) -> Dict:
        response = self.supabase.functions.invoke(
            "trust-report",
            {"domain": domain}
        )
        return response.json()`,
                          "py-advanced"
                        )
                      }
                    >
                      {copied === "py-advanced" ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="curl" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>cURL Examples</CardTitle>
                <CardDescription>Direct HTTP requests for testing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Resolve Alias</Label>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded mt-2 text-sm overflow-x-auto">
{`curl -X POST ${projectUrl}/functions/v1/resolve-alias \\
  -H "Content-Type: application/json" \\
  -d '{
    "alias": "alice.example.com",
    "chain": "btc"
  }'`}
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

                <div>
                  <Label className="text-sm font-semibold">Get Trust Report</Label>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded mt-2 text-sm overflow-x-auto">
{`curl -X POST ${projectUrl}/functions/v1/trust-report \\
  -H "Content-Type: application/json" \\
  -d '{"domain": "alice.example.com"}'`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        copyToClipboard(
                          `curl -X POST ${projectUrl}/functions/v1/trust-report -H "Content-Type: application/json" -d '{"domain": "alice.example.com"}'`,
                          "curl-trust"
                        )
                      }
                    >
                      {copied === "curl-trust" ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>1. Implement Caching</strong>
              <p className="text-muted-foreground">
                Cache resolved aliases for at least 1 hour to reduce API calls and improve performance
              </p>
            </div>
            <div>
              <strong>2. Handle Errors Gracefully</strong>
              <p className="text-muted-foreground">
                Always implement try-catch blocks and provide fallback mechanisms
              </p>
            </div>
            <div>
              <strong>3. Check Trust Scores</strong>
              <p className="text-muted-foreground">
                Before using an address, check its trust score and warn users about low-trust aliases
              </p>
            </div>
            <div>
              <strong>4. Monitor Webhooks</strong>
              <p className="text-muted-foreground">
                Set up webhooks for critical aliases to get real-time notifications of changes
              </p>
            </div>
            <div>
              <strong>5. Respect Rate Limits</strong>
              <p className="text-muted-foreground">
                Implement exponential backoff when hitting rate limits
              </p>
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
