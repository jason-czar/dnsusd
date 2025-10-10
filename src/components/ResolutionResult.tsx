import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, XCircle, Info } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ResolverResult, ResolvedResult } from "@/types/resolver";

interface ResolutionResultProps {
  result: ResolverResult;
}

export const ResolutionResult = ({ result }: ResolutionResultProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    const level = confidence >= 0.9 ? 'high' : confidence >= 0.7 ? 'medium' : 'low';
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      high: 'default',
      medium: 'secondary',
      low: 'destructive'
    };

    return (
      <Badge variant={variants[level]} className="capitalize">
        {level} Confidence ({Math.round(confidence * 100)}%)
      </Badge>
    );
  };

  if (result.error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" />
            <CardTitle>Resolution Failed</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{result.error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!result.chosen) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-muted-foreground" />
            <CardTitle>No Result</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No address found for this alias</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/50 bg-primary/5 glow-cyan">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <CardTitle>Resolution Successful</CardTitle>
            </div>
            <CardDescription>Found wallet address for {result.alias}</CardDescription>
          </div>
          <div className="flex gap-2">
            {result.cached && <Badge variant="outline">Cached</Badge>}
            <Badge variant="outline" className="capitalize">{result.chosen.source_type}</Badge>
            {getConfidenceBadge(result.chosen.confidence)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resolved Address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Resolved Address:</span>
            <span className="text-xs text-muted-foreground uppercase">{result.chosen.currency}</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 p-3 rounded-lg bg-background border border-border overflow-x-auto">
              <code className="mono text-sm text-foreground break-all">{result.chosen.address}</code>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(result.chosen.address)}
              className="shrink-0"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Conflict Warning */}
        {result.sources_conflict && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/50">
            <p className="text-sm text-destructive">⚠️ Multiple conflicting sources found. Showing highest confidence result.</p>
          </div>
        )}

        {/* Proof Metadata */}
        {result.chosen.raw_data && Object.keys(result.chosen.raw_data).length > 0 && (
          <div className="space-y-2 pt-4 border-t border-border">
            <span className="text-sm font-medium text-muted-foreground">Proof Metadata:</span>
            <div className="p-3 rounded-lg bg-background border border-border">
              <pre className="mono text-xs overflow-x-auto">{JSON.stringify(result.chosen.raw_data, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
