import { Check, X, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface VerificationStatusIconProps {
  verified: boolean;
  label: string;
  warning?: string;
}

export function VerificationStatusIcon({ verified, label, warning }: VerificationStatusIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2">
          {verified ? (
            <Check className="text-green-600" size={16} />
          ) : warning ? (
            <AlertCircle className="text-yellow-600" size={16} />
          ) : (
            <X className="text-red-600" size={16} />
          )}
          <span className="text-sm">{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{verified ? "Verified" : warning || "Not verified"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
