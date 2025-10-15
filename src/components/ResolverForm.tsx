import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Chain, ResolverResult } from "@/types/resolver";

interface ResolverFormProps {
  onResult: (result: ResolverResult) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const ResolverForm = ({ onResult, isLoading, setIsLoading }: ResolverFormProps) => {
  const [alias, setAlias] = useState("");
  const [chain, setChain] = useState<Chain>("all");
  const { toast } = useToast();

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!alias.trim()) {
      toast({
        title: "Input required",
        description: "Please enter an alias or domain name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('resolve-alias', {
        body: { alias: alias.trim(), chain }
      });

      if (error) throw error;

      onResult(data);

      if (data.errorMessage) {
        toast({
          title: "Resolution failed",
          description: data.errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Resolved ${alias} to ${data.resolvedAddress}`,
        });
      }
    } catch (error) {
      console.error('Resolution error:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alias. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleResolve} className="space-y-6">
      <div className="p-8 rounded-2xl bg-card border border-border shadow-lg">
        <div className="space-y-6">
          {/* Alias Input */}
          <div className="space-y-2">
            <Label htmlFor="alias" className="text-sm font-medium">
              Alias or Domain / ENS Name
            </Label>
            <Input
              id="alias"
              type="text"
              placeholder="x.crypto or vitalik.eth"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="h-12 text-lg border-border focus:border-primary focus:ring-primary"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Enter a domain with DNS TXT records or an ENS .eth name
            </p>
          </div>

          {/* Chain Selector */}
          <div className="space-y-2">
            <Label htmlFor="chain" className="text-sm font-medium">
              Select Chain
            </Label>
            <Select value={chain} onValueChange={(value) => setChain(value as Chain)} disabled={isLoading}>
              <SelectTrigger id="chain" className="h-12 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Auto Detect - All Chains</SelectItem>
                <SelectItem value="bitcoin">Bitcoin</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="zilliqa">Zilliqa</SelectItem>
                <SelectItem value="stacks">Bitcoin Name System (Stacks)</SelectItem>
                <SelectItem value="fio">FIO Protocol</SelectItem>
                <SelectItem value="lightning">Lightning Network</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 glow-cyan transition-smooth"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Resolving...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Resolve Alias
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
