import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { Plus, Search, RefreshCw, Trash2, Eye, Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Alias {
  id: string;
  alias_string: string;
  current_address: string | null;
  current_currency: string | null;
  trust_score: number;
  last_verification_at: string | null;
  verification_method: string | null;
  dns_verified: boolean;
  https_verified: boolean;
  created_at: string;
}

export default function AliasesList() {
  const navigate = useNavigate();
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    fetchAliases();
  };

  const fetchAliases = async () => {
    try {
      const { data, error } = await supabase
        .from("aliases")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAliases(data || []);
    } catch (error: any) {
      toast.error("Failed to load aliases: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this alias?")) return;

    try {
      const { error } = await supabase.from("aliases").delete().eq("id", id);
      if (error) throw error;
      
      toast.success("Alias deleted successfully");
      fetchAliases();
    } catch (error: any) {
      toast.error("Failed to delete alias: " + error.message);
    }
  };

  const handleVerify = async (id: string) => {
    toast.info("Re-verification started...");
    // This will be implemented when we add the verification logic
  };

  const filteredAliases = aliases.filter((alias) =>
    alias.alias_string.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading aliases...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">My Aliases</h1>
            <p className="text-muted-foreground">Manage your domain aliases and wallet addresses</p>
          </div>
          <Button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search aliases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button onClick={() => navigate("/dashboard/aliases/new")}>
            <Plus size={16} className="mr-2" />
            Add Alias
          </Button>
        </div>

        {filteredAliases.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-card">
            <h3 className="text-lg font-semibold mb-2">No aliases yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first domain alias
            </p>
            <Button onClick={() => navigate("/dashboard/aliases/new")}>
              <Plus size={16} className="mr-2" />
              Add First Alias
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Trust Score</TableHead>
                  <TableHead>Last Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAliases.map((alias) => (
                  <TableRow key={alias.id}>
                    <TableCell className="font-medium">{alias.alias_string}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {alias.current_address ? 
                        `${alias.current_address.substring(0, 10)}...${alias.current_address.substring(alias.current_address.length - 8)}` 
                        : "N/A"}
                    </TableCell>
                    <TableCell>{alias.current_currency || "N/A"}</TableCell>
                    <TableCell>
                      <TrustScoreBadge score={alias.trust_score || 0} size="sm" />
                    </TableCell>
                    <TableCell>
                      {alias.last_verification_at
                        ? format(new Date(alias.last_verification_at), "MMM d, yyyy")
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/dashboard/aliases/${alias.id}`)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/dashboard/aliases/${alias.id}/trust`)}
                      title="Trust Report"
                    >
                      <Shield size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleVerify(alias.id)}
                      title="Re-verify"
                    >
                      <RefreshCw size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(alias.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
