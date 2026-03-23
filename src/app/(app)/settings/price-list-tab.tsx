"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { addPriceItem, deletePriceItem, seedDefaultPrices } from "@/app/actions-quotes";
import type { PriceListItem } from "@/lib/types";
import { Trash2, Plus, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface NewRowState {
  brand: string;
  engine_pattern: string;
  stage: string;
  price_net: string;
  price_note: string;
}

const EMPTY_ROW: NewRowState = {
  brand: "",
  engine_pattern: "",
  stage: "",
  price_net: "",
  price_note: "",
};

export function PriceListTab({
  initialItems,
}: {
  initialItems: PriceListItem[];
}) {
  const [items, setItems] = useState<PriceListItem[]>(initialItems);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newRow, setNewRow] = useState<NewRowState>(EMPTY_ROW);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  function handleRowChange(field: keyof NewRowState, value: string) {
    setNewRow((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const priceNum = parseFloat(newRow.price_net.replace(/\s/g, "").replace(",", "."));
    if (!newRow.brand || !newRow.engine_pattern || !newRow.stage || isNaN(priceNum) || priceNum <= 0) {
      toast.error("Töltsd ki az összes kötelező mezőt, és adj meg érvényes árat!");
      return;
    }

    startTransition(async () => {
      try {
        const item = await addPriceItem({
          brand: newRow.brand.trim(),
          engine_pattern: newRow.engine_pattern.trim(),
          stage: newRow.stage.trim(),
          price_net: priceNum,
          price_note: newRow.price_note.trim() || undefined,
        });
        setItems((prev) => [...prev, item]);
        setNewRow(EMPTY_ROW);
        setShowAddRow(false);
        toast.success("Ár hozzáadva!");
      } catch (err) {
        toast.error("Hiba a mentés során", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deletePriceItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Ár törölve.");
    } catch (err) {
      toast.error("Hiba a törlés során", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedDefaultPrices();
      // Reload items — server action revalidates but we need client-side refresh
      // We'll just prompt a page reload via window.location since this is a one-time action
      toast.success("Alap árak betöltve!", {
        description: "Az oldal frissül...",
      });
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      toast.error("Hiba az alap árak betöltése során", {
        description: err instanceof Error ? err.message : undefined,
      });
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[var(--font-heading)] font-semibold text-base uppercase tracking-[0.05em] text-[#e2e8f0]">
            Árlista
          </h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            Az ajánlatkészítőben ezek az árak jelennek meg automatikusan.
          </p>
        </div>
        <div className="flex gap-2">
          {items.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seeding}
              className="gap-1.5 text-xs border-[rgba(255,255,255,0.08)] text-[#94a3b8] hover:text-[#e2e8f0]"
            >
              {seeding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Alap árak betöltése
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              setShowAddRow(true);
              setNewRow(EMPTY_ROW);
            }}
            disabled={showAddRow}
            className="gap-1.5 text-xs bg-[#0ea5e9] hover:bg-[#0284c7] text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Új ár
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                  Márka
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                  Motor
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                  Stage
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                  Nettó ár
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                  Megjegyzés
                </th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && !showAddRow && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#64748b] text-sm">
                    <p className="mb-2">Még nincs ár felvéve.</p>
                    <p className="text-xs text-[#475569]">
                      Kattints az &quot;Alap árak betöltése&quot; gombra, vagy adj hozzá egyedi árakat.
                    </p>
                  </td>
                </tr>
              )}

              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(14,165,233,0.03)] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[#e2e8f0]">{item.brand}</td>
                  <td className="px-4 py-3 text-[#94a3b8]">{item.engine_pattern}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-[rgba(14,165,233,0.08)] px-2 py-0.5 text-xs font-medium text-[#0ea5e9] border border-[rgba(14,165,233,0.15)]">
                      {item.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-[var(--font-mono)] text-[#e2e8f0] tabular-nums">
                    {formatPrice(item.price_net)}
                  </td>
                  <td className="px-4 py-3 text-[#64748b] text-xs">{item.price_note ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[#475569] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)]"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </td>
                </tr>
              ))}

              {/* Inline add row */}
              {showAddRow && (
                <tr className="border-b border-[rgba(14,165,233,0.15)] bg-[rgba(14,165,233,0.03)]">
                  <td className="px-3 py-2">
                    <Input
                      value={newRow.brand}
                      onChange={(e) => handleRowChange("brand", e.target.value)}
                      placeholder="BMW"
                      className="h-7 text-xs bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]"
                      autoFocus
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={newRow.engine_pattern}
                      onChange={(e) => handleRowChange("engine_pattern", e.target.value)}
                      placeholder="2.0 TDI"
                      className="h-7 text-xs bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={newRow.stage}
                      onChange={(e) => handleRowChange("stage", e.target.value)}
                      placeholder="Stage 1"
                      className="h-7 text-xs bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={newRow.price_net}
                      onChange={(e) => handleRowChange("price_net", e.target.value)}
                      placeholder="35000"
                      type="number"
                      min={0}
                      className="h-7 text-xs text-right bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] font-[var(--font-mono)]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={newRow.price_note}
                      onChange={(e) => handleRowChange("price_note", e.target.value)}
                      placeholder="Megjegyzés (opcionális)"
                      className="h-7 text-xs bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        className="h-7 w-7 bg-[#0ea5e9] hover:bg-[#0284c7] text-white"
                        onClick={handleAdd}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#475569] hover:text-[#e2e8f0]"
                        onClick={() => {
                          setShowAddRow(false);
                          setNewRow(EMPTY_ROW);
                        }}
                      >
                        <span className="text-base leading-none">&times;</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {items.length > 0 && (
        <p className="text-xs text-[#475569] text-right">
          {items.length} tétel · ÁFA nélküli árak
        </p>
      )}
    </div>
  );
}
