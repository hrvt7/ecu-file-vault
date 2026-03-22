import { cn } from "@/lib/utils";

const typeConfig: Record<string, { bg: string; text: string; dot: string; glow: string }> = {
  "Stage 1": { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400", glow: "shadow-[0_0_6px_rgba(59,130,246,0.3)]" },
  "Stage 2": { bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-400", glow: "shadow-[0_0_6px_rgba(234,179,8,0.3)]" },
  "Stage 3": { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400", glow: "shadow-[0_0_6px_rgba(249,115,22,0.3)]" },
  "DPF off": { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400", glow: "shadow-[0_0_6px_rgba(239,68,68,0.3)]" },
  "EGR off": { bg: "bg-pink-500/10", text: "text-pink-400", dot: "bg-pink-400", glow: "shadow-[0_0_6px_rgba(236,72,153,0.3)]" },
  "AdBlue off": { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-400", glow: "shadow-[0_0_6px_rgba(168,85,247,0.3)]" },
  "DTC off": { bg: "bg-cyan-500/10", text: "text-cyan-400", dot: "bg-cyan-400", glow: "shadow-[0_0_6px_rgba(6,182,212,0.3)]" },
  "TCU tune": { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", glow: "shadow-[0_0_6px_rgba(52,211,153,0.3)]" },
  "Egyéb": { bg: "bg-gray-500/10", text: "text-gray-400", dot: "bg-gray-400", glow: "" },
};

const defaultConfig = typeConfig["Egyéb"];

export function JobTypeBadge({ type }: { type: string }) {
  const config = typeConfig[type] ?? defaultConfig;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium border border-transparent transition-shadow",
        config.bg,
        config.text,
        config.glow
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
      {type}
    </span>
  );
}
