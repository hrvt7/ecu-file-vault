import { cn } from "@/lib/utils";

const typeConfig: Record<string, { bg: string; text: string; dot: string }> = {
  "Stage 1": { bg: "bg-[rgba(14,165,233,0.1)]", text: "text-[#38bdf8]", dot: "bg-[#0ea5e9]" },
  "Stage 2": { bg: "bg-[rgba(245,158,11,0.1)]", text: "text-[#fbbf24]", dot: "bg-[#f59e0b]" },
  "Stage 3": { bg: "bg-[rgba(249,115,22,0.1)]", text: "text-[#fb923c]", dot: "bg-[#f97316]" },
  "DPF off": { bg: "bg-[rgba(239,68,68,0.1)]", text: "text-[#f87171]", dot: "bg-[#ef4444]" },
  "EGR off": { bg: "bg-[rgba(167,139,250,0.1)]", text: "text-[#c4b5fd]", dot: "bg-[#a78bfa]" },
  "AdBlue off": { bg: "bg-[rgba(6,214,160,0.1)]", text: "text-[#34d399]", dot: "bg-[#06d6a0]" },
  "DTC off": { bg: "bg-[rgba(6,182,212,0.1)]", text: "text-[#22d3ee]", dot: "bg-[#06b6d4]" },
  "TCU tune": { bg: "bg-[rgba(16,185,129,0.1)]", text: "text-[#34d399]", dot: "bg-[#10b981]" },
  "Egyéb": { bg: "bg-[rgba(100,116,139,0.1)]", text: "text-[#94a3b8]", dot: "bg-[#64748b]" },
};

const defaultConfig = typeConfig["Egyéb"];

export function JobTypeBadge({ type, delay }: { type: string; delay?: number }) {
  const config = typeConfig[type] ?? defaultConfig;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] font-semibold animate-pop-in badge-hover",
        config.bg,
        config.text
      )}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <span className={cn("h-1 w-1 rounded-full shrink-0", config.dot)} />
      {type}
    </span>
  );
}
