import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";

interface TrustScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function TrustScoreBadge({ score, size = "md" }: TrustScoreBadgeProps) {
  const getVariant = () => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    if (score >= 40) return "outline";
    return "destructive";
  };

  const getIcon = () => {
    const iconSize = size === "sm" ? 12 : size === "md" ? 14 : 16;
    
    if (score >= 80) return <ShieldCheck className="mr-1" size={iconSize} />;
    if (score >= 60) return <Shield className="mr-1" size={iconSize} />;
    if (score >= 40) return <ShieldQuestion className="mr-1" size={iconSize} />;
    return <ShieldAlert className="mr-1" size={iconSize} />;
  };

  const getLabel = () => {
    if (score >= 80) return "High Trust";
    if (score >= 60) return "Medium Trust";
    if (score >= 40) return "Low Trust";
    return "Unverified";
  };

  return (
    <Badge variant={getVariant()} className="flex items-center w-fit">
      {getIcon()}
      <span>{getLabel()} ({score})</span>
    </Badge>
  );
}
