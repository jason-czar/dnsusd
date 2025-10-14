import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Plus, Copy, Trash2, Key, AlertCircle, Check } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

const keyNameSchema = z.string()
  .trim()
  .min(1, "Key name is required")
  .max(100, "Key name must be less than 100 characters");

interface ApiKey {
  id: string;
  key_name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

export default function ApiKeys() {
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchApiKeys();
  };

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error: any) {
      toast.error("Failed to load API keys: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    try {
      // Validate input
      const validatedName = keyNameSchema.parse(newKeyName);
      
      setCreating(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("generate-api-key", {
        body: { keyName: validatedName },
      });

      if (response.error) throw response.error;

      if (response.data?.error) {
        toast.error(response.data.error);
        return;
      }

      setGeneratedKey(response.data.apiKey);
      setShowCreateDialog(false);
      setShowKeyDialog(true);
      setNewKeyName("");
      fetchApiKeys();
      toast.success("API key generated successfully");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to generate API key: " + error.message);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteKey = async (id: string, keyName: string) => {
    if (!confirm(`Are you sure you want to delete the API key "${keyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;

      toast.success("API key deleted successfully");
      fetchApiKeys();
    } catch (error: any) {
      toast.error("Failed to delete API key: " + error.message);
    }
  };

  const handleCloseKeyDialog = () => {
    setShowKeyDialog(false);
    setGeneratedKey("");
    setCopied(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading API keys...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">API Keys</h1>
            <p className="text-muted-foreground">Manage your API keys for programmatic access</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Your API Keys</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage API keys to authenticate API requests
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus size={16} className="mr-2" />
            Create API Key
          </Button>
        </div>

        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Key className="mx-auto mb-4 text-muted-foreground" size={48} />
              <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate your first API key to start using the API
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus size={16} className="mr-2" />
                Create First API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Active API Keys</CardTitle>
              <CardDescription>
                These keys allow programmatic access to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.key_name}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {key.key_prefix}...
                        </code>
                      </TableCell>
                      <TableCell>{format(new Date(key.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        {key.last_used_at
                          ? format(new Date(key.last_used_at), "MMM d, yyyy")
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteKey(key.id, key.key_name)}
                          title="Delete API Key"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="mt-6 border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle size={20} />
              Security Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• Never share your API keys publicly or commit them to version control</p>
            <p>• Rotate your keys regularly and delete unused keys</p>
            <p>• Use environment variables to store API keys in your applications</p>
            <p>• Monitor your API usage to detect unauthorized access</p>
          </CardContent>
        </Card>
      </main>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Give your API key a descriptive name to identify its purpose
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                placeholder="e.g., Production API, Mobile App, Test Environment"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                maxLength={100}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={creating || !newKeyName.trim()}>
              {creating ? "Generating..." : "Generate Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Generated Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={handleCloseKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Generated</DialogTitle>
            <DialogDescription>
              Make sure to copy your API key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg">
              <code className="text-sm break-all">{generatedKey}</code>
            </div>
            <Button onClick={handleCopyKey} className="w-full" variant={copied ? "default" : "outline"}>
              {copied ? (
                <>
                  <Check size={16} className="mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} className="mr-2" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseKeyDialog}>I've Saved My Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
