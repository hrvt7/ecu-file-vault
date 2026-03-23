"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PriceListItem, Vehicle } from "@/lib/types";
import { createQuote } from "@/app/actions-quotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Zap,
  User,
  Car,
  FileText,
  CalendarDays,
  Save,
  ChevronLeft,
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

const VAT = 0.27;

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

interface LineItem {
  name: string;
  quantity: number;
  price_net: number;
}

// ─── Price suggestion pill ────────────────────────────────────────────────────

function PriceSuggestion({
  item,
  onAdd,
}: {
  item: PriceListItem;
  onAdd: (item: PriceListItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd(item)}
      className="flex items-center gap-1.5 rounded-lg border border-[rgba(14,165,233,0.2)] bg-[rgba(14,165,233,0.06)] px-2.5 py-1.5 text-left transition-all hover:border-[rgba(14,165,233,0.4)] hover:bg-[rgba(14,165,233,0.1)]"
    >
      <Zap className="h-3 w-3 text-[#0ea5e9] shrink-0" />
      <span className="text-xs text-[#94a3b8]">
        {item.brand} {item.engine_pattern} –{" "}
        <span className="text-[#0ea5e9] font-medium">{item.stage}</span>
      </span>
      <span className="ml-auto pl-2 font-[var(--font-mono)] text-xs text-[#e2e8f0] tabular-nums shrink-0">
        {formatPrice(item.price_net)}
      </span>
    </button>
  );
}

// ─── Line item row ────────────────────────────────────────────────────────────

function LineItemRow({
  item,
  index,
  onChange,
  onDelete,
}: {
  item: LineItem;
  index: number;
  onChange: (index: number, field: keyof LineItem, value: string | number) => void;
  onDelete: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_80px_120px_36px] gap-2 items-end">
      <div className="space-y-1">
        {index === 0 && (
          <Label className="text-[10px] uppercase tracking-[0.06em] text-[#64748b]">
            Megnevezés
          </Label>
        )}
        <Input
          value={item.name}
          onChange={(e) => onChange(index, "name", e.target.value)}
          placeholder="pl. Stage 1 tuning"
          className="h-8 text-sm bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)]"
        />
      </div>
      <div className="space-y-1">
        {index === 0 && (
          <Label className="text-[10px] uppercase tracking-[0.06em] text-[#64748b]">
            Db
          </Label>
        )}
        <Input
          type="number"
          min={1}
          value={item.quantity}
          onChange={(e) => onChange(index, "quantity", parseInt(e.target.value) || 1)}
          className="h-8 text-sm text-center bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] font-[var(--font-mono)]"
        />
      </div>
      <div className="space-y-1">
        {index === 0 && (
          <Label className="text-[10px] uppercase tracking-[0.06em] text-[#64748b]">
            Nettó ár (Ft)
          </Label>
        )}
        <Input
          type="number"
          min={0}
          value={item.price_net || ""}
          onChange={(e) => onChange(index, "price_net", parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="h-8 text-sm text-right bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] font-[var(--font-mono)]"
        />
      </div>
      <div className={index === 0 ? "pt-5" : ""}>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="h-8 w-8 text-[#475569] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)]"
          onClick={() => onDelete(index)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function NewQuoteForm({
  vehicles,
  priceList,
}: {
  vehicles: Vehicle[];
  priceList: PriceListItem[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Customer
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Car
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [useManualCar, setUseManualCar] = useState(false);
  const [manualCar, setManualCar] = useState("");

  // Items
  const [items, setItems] = useState<LineItem[]>([
    { name: "", quantity: 1, price_net: 0 },
  ]);

  // Other
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");

  // Derived car description
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const carDescription = useManualCar
    ? manualCar
    : selectedVehicle
    ? `${selectedVehicle.brand} ${selectedVehicle.model}${
        selectedVehicle.engine ? ` ${selectedVehicle.engine}` : ""
      }${selectedVehicle.year ? ` (${selectedVehicle.year})` : ""}`
    : "";

  // Suggested prices filtered by selected vehicle's brand
  const suggestions = priceList.filter((p) => {
    if (!selectedVehicle) return false;
    return (
      p.brand.toLowerCase() === selectedVehicle.brand.toLowerCase() ||
      p.brand.toLowerCase() === "bármely"
    );
  });

  // Totals
  const totalNet = items.reduce((sum, i) => sum + i.price_net * i.quantity, 0);
  const totalGross = Math.round(totalNet * (1 + VAT));
  const vatAmount = totalGross - totalNet;

  function addSuggestion(p: PriceListItem) {
    const name = `${p.brand} ${p.engine_pattern} – ${p.stage}`;
    const exists = items.findIndex((i) => i.name === name);
    if (exists !== -1) {
      toast.info("Ez a tétel már szerepel az ajánlatban.");
      return;
    }
    // Replace the first empty row if it exists, otherwise append
    const emptyIdx = items.findIndex((i) => !i.name && i.price_net === 0);
    if (emptyIdx !== -1) {
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === emptyIdx ? { name, quantity: 1, price_net: p.price_net } : item
        )
      );
    } else {
      setItems((prev) => [...prev, { name, quantity: 1, price_net: p.price_net }]);
    }
  }

  function addEmptyItem() {
    setItems((prev) => [...prev, { name: "", quantity: 1, price_net: 0 }]);
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function deleteItem(index: number) {
    if (items.length === 1) {
      setItems([{ name: "", quantity: 1, price_net: 0 }]);
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!carDescription.trim()) {
      toast.error("Add meg a jármű leírását!");
      return;
    }

    const validItems = items.filter((i) => i.name.trim());
    if (validItems.length === 0) {
      toast.error("Adj hozzá legalább egy tételt!");
      return;
    }

    setSaving(true);
    try {
      await createQuote({
        vehicle_id: !useManualCar && selectedVehicleId ? selectedVehicleId : null,
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null,
        customer_email: customerEmail.trim() || null,
        car_description: carDescription.trim(),
        items: validItems,
        total_net: totalNet,
        total_gross: totalGross,
        vat_percent: 27,
        valid_until: validUntil || null,
        notes: notes.trim() || null,
      });
      toast.success("Árajánlat elmentve piszkozatként!");
      router.push("/quotes");
      router.refresh();
    } catch (err) {
      toast.error("Hiba a mentés során", {
        description: err instanceof Error ? err.message : undefined,
      });
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Customer */}
      <Card className="bg-[rgba(12,16,23,0.8)] border-[rgba(255,255,255,0.06)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.06em] text-[#94a3b8]">
            <User className="h-4 w-4 text-[#0ea5e9]" />
            Ügyfél adatok
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="customerName" className="text-xs text-[#64748b]">
                Név
              </Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Kiss János"
                className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customerPhone" className="text-xs text-[#64748b]">
                Telefonszám
              </Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+36 30 123 4567"
                className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customerEmail" className="text-xs text-[#64748b]">
                Email
              </Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="kiss.janos@email.hu"
                className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle */}
      <Card className="bg-[rgba(12,16,23,0.8)] border-[rgba(255,255,255,0.06)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.06em] text-[#94a3b8]">
            <Car className="h-4 w-4 text-[#0ea5e9]" />
            Jármű
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUseManualCar(false)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                !useManualCar
                  ? "border-[rgba(14,165,233,0.3)] bg-[rgba(14,165,233,0.08)] text-[#0ea5e9]"
                  : "border-[rgba(255,255,255,0.07)] text-[#64748b] hover:text-[#94a3b8]"
              )}
            >
              Meglévő jármű
            </button>
            <button
              type="button"
              onClick={() => setUseManualCar(true)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                useManualCar
                  ? "border-[rgba(14,165,233,0.3)] bg-[rgba(14,165,233,0.08)] text-[#0ea5e9]"
                  : "border-[rgba(255,255,255,0.07)] text-[#64748b] hover:text-[#94a3b8]"
              )}
            >
              Manuális megadás
            </button>
          </div>

          {!useManualCar ? (
            vehicles.length > 0 ? (
              <Select
                value={selectedVehicleId}
                onValueChange={(val) => setSelectedVehicleId(val ?? "")}
              >
                <SelectTrigger className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)]">
                  <SelectValue placeholder="Válassz meglévő járművet..." />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.license_plate && `[${v.license_plate}] `}
                      {v.brand} {v.model}
                      {v.engine ? ` – ${v.engine}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-[#64748b] py-2">
                Még nincs jármű rögzítve.{" "}
                <button
                  type="button"
                  onClick={() => setUseManualCar(true)}
                  className="text-[#0ea5e9] hover:underline"
                >
                  Manuális megadás
                </button>
              </p>
            )
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="manualCar" className="text-xs text-[#64748b]">
                Jármű leírás *
              </Label>
              <Input
                id="manualCar"
                value={manualCar}
                onChange={(e) => setManualCar(e.target.value)}
                placeholder="BMW 320d 2.0d (2019)"
                className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)]"
                required
              />
            </div>
          )}

          {carDescription && (
            <p className="text-xs text-[#64748b]">
              Ajánlat neve:{" "}
              <span className="text-[#94a3b8] font-medium">{carDescription}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="bg-[rgba(12,16,23,0.8)] border-[rgba(255,255,255,0.06)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.06em] text-[#94a3b8]">
            <FileText className="h-4 w-4 text-[#0ea5e9]" />
            Tételek
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto-suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.06em] text-[#475569] font-semibold">
                Javaslatok az árlistából
              </p>
              <div className="flex flex-col gap-1.5">
                {suggestions.map((p) => (
                  <PriceSuggestion key={p.id} item={p} onAdd={addSuggestion} />
                ))}
              </div>
            </div>
          )}

          {suggestions.length > 0 && <Separator className="bg-[rgba(255,255,255,0.06)]" />}

          {/* Manual items */}
          <div className="space-y-2">
            {items.map((item, idx) => (
              <LineItemRow
                key={idx}
                item={item}
                index={idx}
                onChange={updateItem}
                onDelete={deleteItem}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEmptyItem}
            className="w-full gap-1.5 text-xs border-[rgba(255,255,255,0.08)] text-[#64748b] hover:text-[#e2e8f0] hover:border-[rgba(255,255,255,0.15)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Tétel hozzáadása
          </Button>

          {/* Totals */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Nettó összeg</span>
              <span className="font-[var(--font-mono)] text-[#94a3b8] tabular-nums">
                {formatPrice(totalNet)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">ÁFA (27%)</span>
              <span className="font-[var(--font-mono)] text-[#94a3b8] tabular-nums">
                {formatPrice(vatAmount)}
              </span>
            </div>
            <Separator className="bg-[rgba(255,255,255,0.06)]" />
            <div className="flex justify-between">
              <span className="font-semibold text-[#e2e8f0]">Bruttó összeg</span>
              <span className="font-[var(--font-mono)] font-bold text-lg text-[#0ea5e9] tabular-nums">
                {formatPrice(totalGross)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meta */}
      <Card className="bg-[rgba(12,16,23,0.8)] border-[rgba(255,255,255,0.06)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.06em] text-[#94a3b8]">
            <CalendarDays className="h-4 w-4 text-[#0ea5e9]" />
            Érvényesség és megjegyzés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="validUntil" className="text-xs text-[#64748b]">
              Érvényes eddig
            </Label>
            <Input
              id="validUntil"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] w-full sm:w-48"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs text-[#64748b]">
              Megjegyzés
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Az ajánlathoz fűzött megjegyzések, feltételek..."
              rows={3}
              className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 pb-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/quotes")}
          className="gap-1.5 border-[rgba(255,255,255,0.08)] text-[#64748b] hover:text-[#e2e8f0]"
        >
          <ChevronLeft className="h-4 w-4" />
          Vissza
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="flex-1 gap-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-semibold"
        >
          <Save className="h-4 w-4" />
          {saving ? "Mentés..." : "Mentés piszkozatként"}
        </Button>
      </div>
    </form>
  );
}
