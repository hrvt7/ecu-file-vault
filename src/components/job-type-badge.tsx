import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  "Stage 1": "bg-blue-500/15 text-blue-400 border-blue-500/20",
  "Stage 2": "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  "Stage 3": "bg-orange-500/15 text-orange-400 border-orange-500/20",
  "DPF off": "bg-red-500/15 text-red-400 border-red-500/20",
  "EGR off": "bg-pink-500/15 text-pink-400 border-pink-500/20",
  "AdBlue off": "bg-purple-500/15 text-purple-400 border-purple-500/20",
  "DTC off": "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  "TCU tune": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "Egyéb": "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

export function JobTypeBadge({ type }: { type: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] font-medium",
        typeColors[type] ?? typeColors["Egyéb"]
      )}
    >
      {type}
    </Badge>
  );
}
