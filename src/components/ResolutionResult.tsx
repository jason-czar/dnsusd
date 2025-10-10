import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, XCircle, Info } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ResolverResult } from "@/types/resolver";

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

  const getConfidenceBadge = (confidence: string | null) => {
    if (!confidence) return null;
    
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      high: 'default',
      medium: 'secondary',
      low: 'destructive'
    };

    return (
      <Badge variant={variants[confidence] || 'secondary'} className="capitalize">
        {confidence} Confidence
      </Badge>
    );
  };

  if (result.errorMessage) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" />
            <CardTitle>Resolution Failed</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{result.errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  if (!result.resolvedAddress) {
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
            {result.aliasType && (
              <Badge variant="outline" className="capitalize">
                {result.aliasType}
              </Badge>
            )}
            {getConfidenceBadge(result.confidence)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resolved Address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Resolved Address:</span>
            <span className="text-xs text-muted-foreground uppercase">{result.chain}</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 p-3 rounded-lg bg-background border border-border overflow-x-auto">
              <code className="mono text-sm text-foreground break-all">{result.resolvedAddress}</code>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(result.resolvedAddress!)}
              className="shrink-0"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Proof Metadata */}
        {result.proofMetadata && Object.keys(result.proofMetadata).length > 0 && (
          <div className="space-y-2 pt-4 border-t border-border">
            <span className="text-sm font-medium text-muted-foreground">Proof Metadata:</span>
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="space-y-2">
                {result.proofMetadata.source && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Source:</span>
                    <span className="mono">{result.proofMetadata.source}</span>
                  </div>
                )}
                {result.proofMetadata.recordType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Record Type:</span>
                    <span className="mono">{result.proofMetadata.recordType}</span>
                  </div>
                )}
                {result.proofMetadata.dnsRecords && result.proofMetadata.dnsRecords.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">DNS Records:</span>
                    {result.proofMetadata.dnsRecords.map((record, idx) => (
                      <div key={idx} className="mono text-xs p-2 rounded bg-muted break-all">
                        {record}
                      </div>
                    ))}
                  </div>
                )}
                {result.proofMetadata.ensResolver && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">ENS Resolver:</span>
                    <div className="mono text-xs p-2 rounded bg-muted break-all">
                      {result.proofMetadata.ensResolver}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
