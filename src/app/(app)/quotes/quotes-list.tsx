"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Quote } from "@/lib/types";
import { QUOTE_STATUS_LABELS } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateQuoteStatus, deleteQuote } from "@/app/actions-quotes";
import {
  FileText,
  User,
  Car,
  CalendarDays,
  Trash2,
  ChevronRight,
  PlusCircle,
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatPrice(value: number): string {
  return (
    new Intl.NumberFormat("hu-HU", {
      useGrouping: true,
      minimumFractionDigits: 0,
    })
      .format(value)
      .replace(/\u00a0/g, "\u00a0") + " Ft"
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUS_STYLE: Record<
  Quote["status"],
  { bg: string; text: string; border: string }
> = {
  draft: {
    bg: "bg-[rgba(100,116,139,0.12)]",
    text: "text-[#94a3b8]",
    border: "border-[rgba(100,116,139,0.2)]",
  },
  sent: {
    bg: "bg-[rgba(14,165,233,0.1)]",
    text: "text-[#0ea5e9]",
    border: "border-[rgba(14,165,233,0.2)]",
  },
  accepted: {
    bg: "bg-[rgba(16,185,129,0.1)]",
    text: "text-[#10b981]",
    border: "border-[rgba(16,185,129,0.2)]",
  },
  rejected: {
    bg: "bg-[rgba(239,68,68,0.1)]",
    text: "text-[#ef4444]",
    border: "border-[rgba(239,68,68,0.2)]",
  },
  expired: {
    bg: "bg-[rgba(245,158,11,0.1)]",
    text: "text-[#f59e0b]",
    border: "border-[rgba(245,158,11,0.2)]",
  },
};

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Quote["status"] }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] border",
        s.bg,
        s.text,
        s.border
      )}
    >
      {QUOTE_STATUS_LABELS[status]}
    </span>
  );
}

// ─── Single quote card ────────────────────────────────────────────────────────

function QuoteCard({
  quote,
  onDeleted,
  onStatusChanged,
}: {
  quote: Quote;
  onDeleted: (id: string) => void;
  onStatusChanged: (id: string, status: Quote["status"]) => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteQuote(quote.id);
      onDeleted(quote.id);
      setDeleteOpen(false);
      toast.success("Ajánlat törölve.");
    } catch (err) {
      toast.error("Hiba a törlés során", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handleStatusChange(val: string | null) {
    if (!val) return;
    const status = val as Quote["status"];
    setUpdatingStatus(true);
    try {
      await updateQuoteStatus(quote.id, status);
      onStatusChanged(quote.id, status);
      toast.success("Státusz frissítve.");
    } catch (err) {
      toast.error("Hiba a státusz módosítás során", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <div className="glass-card card-hover p-4 space-y-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Car className="h-3.5 w-3.5 text-[#0ea5e9] shrink-0" />
            <span className="font-[var(--font-heading)] font-semibold text-sm uppercase tracking-[0.04em] text-[#e2e8f0] truncate">
              {quote.car_description}
            </span>
          </div>
          {quote.customer_name && (
            <div className="flex items-center gap-1.5 mt-1">
              <User className="h-3 w-3 text-[#475569]" />
              <span className="text-xs text-[#94a3b8]">{quote.customer_name}</span>
            </div>
          )}
        </div>
        <StatusBadge status={quote.status} />
      </div>

      {/* Items summary */}
      {quote.items.length > 0 && (
        <div className="space-y-0.5">
          {quote.items.slice(0, 3).map((item, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-[#64748b] truncate max-w-[60%]">{item.name}</span>
              <span className="font-[var(--font-mono)] text-[#94a3b8] tabular-nums">
                {formatPrice(item.price_net * item.quantity)}
              </span>
            </div>
          ))}
          {quote.items.length > 3 && (
            <p className="text-[10px] text-[#475569]">
              + {quote.items.length - 3} további tétel
            </p>
          )}
        </div>
      )}

      {/* Totals */}
      <div className="border-t border-[rgba(255,255,255,0.06)] pt-3 flex items-end justify-between">
        <div className="space-y-0.5">
          <div className="flex gap-3 text-xs text-[#64748b]">
            <span>
              Nettó:{" "}
              <span className="font-[var(--font-mono)] text-[#94a3b8]">
                {formatPrice(quote.total_net)}
              </span>
            </span>
            <span>
              ÁFA ({quote.vat_percent}%):{" "}
              <span className="font-[var(--font-mono)] text-[#94a3b8]">
                {formatPrice(quote.total_gross - quote.total_net)}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#64748b]">Bruttó:</span>
            <span className="font-[var(--font-mono)] font-semibold text-[#0ea5e9] text-base tabular-nums">
              {formatPrice(quote.total_gross)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[#475569]">
          <CalendarDays className="h-3 w-3" />
          <span className="text-[10px]">{formatDate(quote.created_at)}</span>
          {quote.valid_until && (
            <span className="text-[10px]">· érvényes: {formatDate(quote.valid_until)}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Select
          value={quote.status}
          onValueChange={handleStatusChange}
          disabled={updatingStatus}
        >
          <SelectTrigger className="h-7 text-xs flex-1 bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.07)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Piszkozat</SelectItem>
            <SelectItem value="sent">Elküldve</SelectItem>
            <SelectItem value="accepted">Elfogadva</SelectItem>
            <SelectItem value="rejected">Elutasítva</SelectItem>
            <SelectItem value="expired">Lejárt</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger
            render={(props) => (
              <Button
                {...props}
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#475569] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          />
          <DialogContent className="bg-[#0c1017] border-[rgba(255,255,255,0.08)]">
            <DialogHeader>
              <DialogTitle>Ajánlat törlése</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-[#94a3b8]">
              Biztosan törlöd az ajánlatot?{" "}
              <strong className="text-[#e2e8f0]">{quote.car_description}</strong> – ezt
              nem lehet visszavonni.
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteOpen(false)}
                className="border-[rgba(255,255,255,0.08)]"
              >
                Mégse
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
              >
                {deleting ? "Törlés..." : "Törlés"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// ─── Filtered list ────────────────────────────────────────────────────────────

function FilteredList({
  quotes,
  filter,
  onDeleted,
  onStatusChanged,
}: {
  quotes: Quote[];
  filter: string;
  onDeleted: (id: string) => void;
  onStatusChanged: (id: string, status: Quote["status"]) => void;
}) {
  const filtered =
    filter === "all" ? quotes : quotes.filter((q) => q.status === filter);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="h-10 w-10 text-[#334155] mb-4" />
        <p className="text-[#64748b] text-sm">Nincsenek ajánlatok ebben a kategóriában.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {filtered.map((q) => (
        <QuoteCard
          key={q.id}
          quote={q}
          onDeleted={onDeleted}
          onStatusChanged={onStatusChanged}
        />
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function QuotesList({ initialQuotes }: { initialQuotes: Quote[] }) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);

  function handleDeleted(id: string) {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }

  function handleStatusChanged(id: string, status: Quote["status"]) {
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status } : q))
    );
  }

  const counts = {
    all: quotes.length,
    draft: quotes.filter((q) => q.status === "draft").length,
    sent: quotes.filter((q) => q.status === "sent").length,
    accepted: quotes.filter((q) => q.status === "accepted").length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-heading)] text-2xl font-semibold tracking-[0.04em] uppercase text-[#e2e8f0]">
            Árajánlatok
          </h1>
          <p className="text-sm text-[#64748b]">
            {quotes.length} ajánlat összesen
          </p>
        </div>
        <Button
          onClick={() => router.push("/quotes/new")}
          className="gap-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white"
        >
          <PlusCircle className="h-4 w-4" />
          Új ajánlat
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList variant="line">
          <TabsTrigger value="all">
            Összes
            {counts.all > 0 && (
              <span className="ml-1.5 rounded-full bg-[rgba(255,255,255,0.08)] px-1.5 py-0.5 text-[10px] font-medium">
                {counts.all}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="draft">
            Piszkozat
            {counts.draft > 0 && (
              <span className="ml-1.5 rounded-full bg-[rgba(255,255,255,0.08)] px-1.5 py-0.5 text-[10px] font-medium">
                {counts.draft}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">
            Elküldve
            {counts.sent > 0 && (
              <span className="ml-1.5 rounded-full bg-[rgba(14,165,233,0.15)] px-1.5 py-0.5 text-[10px] font-medium text-[#0ea5e9]">
                {counts.sent}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Elfogadva
            {counts.accepted > 0 && (
              <span className="ml-1.5 rounded-full bg-[rgba(16,185,129,0.15)] px-1.5 py-0.5 text-[10px] font-medium text-[#10b981]">
                {counts.accepted}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <FilteredList
            quotes={quotes}
            filter="all"
            onDeleted={handleDeleted}
            onStatusChanged={handleStatusChanged}
          />
        </TabsContent>
        <TabsContent value="draft" className="mt-4">
          <FilteredList
            quotes={quotes}
            filter="draft"
            onDeleted={handleDeleted}
            onStatusChanged={handleStatusChanged}
          />
        </TabsContent>
        <TabsContent value="sent" className="mt-4">
          <FilteredList
            quotes={quotes}
            filter="sent"
            onDeleted={handleDeleted}
            onStatusChanged={handleStatusChanged}
          />
        </TabsContent>
        <TabsContent value="accepted" className="mt-4">
          <FilteredList
            quotes={quotes}
            filter="accepted"
            onDeleted={handleDeleted}
            onStatusChanged={handleStatusChanged}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
