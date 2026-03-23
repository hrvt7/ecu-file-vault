"use client";

import { useState, useTransition, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "@/app/actions-appointments";
import {
  Appointment,
  TIME_SLOTS,
  SERVICE_TYPES,
  APPOINTMENT_STATUS_LABELS,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Trash2, Clock, User, Phone, Wrench } from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────────────────

const HU_DAYS = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];
const HU_DAYS_SHORT = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
const HU_MONTHS = [
  "január", "február", "március", "április", "május", "június",
  "július", "augusztus", "szeptember", "október", "november", "december",
];

const STATUS_COLORS: Record<Appointment["status"], { bg: string; border: string; text: string; dot: string }> = {
  confirmed: {
    bg: "bg-[rgba(14,165,233,0.12)]",
    border: "border-[rgba(14,165,233,0.35)]",
    text: "text-[#7dd3fc]",
    dot: "bg-[#0ea5e9]",
  },
  completed: {
    bg: "bg-[rgba(6,214,160,0.12)]",
    border: "border-[rgba(6,214,160,0.35)]",
    text: "text-[#6ee7b7]",
    dot: "bg-[#06d6a0]",
  },
  cancelled: {
    bg: "bg-[rgba(239,68,68,0.10)]",
    border: "border-[rgba(239,68,68,0.30)]",
    text: "text-[#fca5a5]",
    dot: "bg-[#ef4444]",
  },
  no_show: {
    bg: "bg-[rgba(100,116,139,0.10)]",
    border: "border-[rgba(100,116,139,0.30)]",
    text: "text-[#94a3b8]",
    dot: "bg-[#64748b]",
  },
};

// ─── Date Helpers ────────────────────────────────────────────────────────────

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMondayOfWeek(dateStr: string): Date {
  const d = parseLocalDate(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(date.getDate() + days);
  return d;
}

function getWeekDays(mondayDate: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayDate, i));
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  if (monday.getMonth() === sunday.getMonth()) {
    return `${monday.getFullYear()}. ${HU_MONTHS[monday.getMonth()]} ${monday.getDate()}–${sunday.getDate()}.`;
  }
  return `${monday.getFullYear()}. ${HU_MONTHS[monday.getMonth()]} ${monday.getDate()} – ${HU_MONTHS[sunday.getMonth()]} ${sunday.getDate()}.`;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

// ─── Appointment Map ─────────────────────────────────────────────────────────

function buildAppointmentMap(
  appointments: Appointment[]
): Map<string, Appointment[]> {
  const map = new Map<string, Appointment[]>();
  for (const apt of appointments) {
    const key = `${apt.date}__${apt.time_slot}`;
    const existing = map.get(key) ?? [];
    map.set(key, [...existing, apt]);
  }
  return map;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusPill({ status }: { status: Appointment["status"] }) {
  const c = STATUS_COLORS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
        c.bg,
        c.text
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", c.dot)} />
      {APPOINTMENT_STATUS_LABELS[status]}
    </span>
  );
}

function AppointmentCard({
  appointment,
  onClick,
}: {
  appointment: Appointment;
  onClick: () => void;
}) {
  const c = STATUS_COLORS[appointment.status];
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "w-full text-left rounded-md px-2 py-1.5 border transition-all duration-150",
        "hover:brightness-125 active:scale-[0.98] cursor-pointer",
        c.bg,
        c.border
      )}
    >
      <p className={cn("text-[11px] font-semibold leading-tight truncate font-[var(--font-rajdhani)] tracking-wide", c.text)}>
        {appointment.customer_name}
      </p>
      {appointment.service_type && (
        <p className="text-[10px] text-[#64748b] truncate leading-tight mt-0.5">
          {appointment.service_type}
        </p>
      )}
    </button>
  );
}

// ─── Create/Edit Form State ───────────────────────────────────────────────────

interface FormState {
  customer_name: string;
  customer_phone: string;
  service_type: string;
  notes: string;
  status: Appointment["status"];
}

const EMPTY_FORM: FormState = {
  customer_name: "",
  customer_phone: "",
  service_type: "",
  notes: "",
  status: "confirmed",
};

function appointmentToForm(apt: Appointment): FormState {
  return {
    customer_name: apt.customer_name,
    customer_phone: apt.customer_phone ?? "",
    service_type: apt.service_type ?? "",
    notes: apt.notes ?? "",
    status: apt.status,
  };
}

// ─── Dialog: Create Appointment ───────────────────────────────────────────────

function CreateDialog({
  open,
  onOpenChange,
  date,
  timeSlot,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date: string;
  timeSlot: string;
  onCreated: (apt: Appointment) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(o: boolean) {
    if (!o) {
      setForm(EMPTY_FORM);
      setError(null);
    }
    onOpenChange(o);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.customer_name.trim()) {
      setError("Az ügyfél neve kötelező.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const apt = await createAppointment({
          customer_name: form.customer_name.trim(),
          customer_phone: form.customer_phone.trim() || null,
          service_type: form.service_type || null,
          notes: form.notes.trim() || null,
          date,
          time_slot: timeSlot,
          status: form.status,
        });
        onCreated(apt);
        handleOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hiba történt.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#0c1017] border-[rgba(255,255,255,0.08)] text-[#e2e8f0] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[var(--font-rajdhani)] text-[#0ea5e9] text-lg tracking-widest uppercase">
            Új időpont
          </DialogTitle>
          <p className="text-sm text-[#64748b] font-[var(--font-jetbrains)]">
            {parseLocalDate(date).toLocaleDateString("hu-HU", {
              year: "numeric", month: "long", day: "numeric",
            })}{" "}
            — {timeSlot}
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {error && (
            <p className="text-[#ef4444] text-sm bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid gap-1.5">
            <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">
              Ügyfél neve *
            </Label>
            <Input
              value={form.customer_name}
              onChange={(e) => setField("customer_name", e.target.value)}
              placeholder="Kovács János"
              className="bg-[#111620] border-[rgba(255,255,255,0.08)] text-[#e2e8f0] placeholder:text-[#334155] focus-visible:border-[#0ea5e9]"
            />
          </div>

          <div className="grid gap-1.5">
            <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">
              Telefonszám
            </Label>
            <Input
              value={form.customer_phone}
              onChange={(e) => setField("customer_phone", e.target.value)}
              placeholder="+36 30 123 4567"
              className="bg-[#111620] border-[rgba(255,255,255,0.08)] text-[#e2e8f0] placeholder:text-[#334155] focus-visible:border-[#0ea5e9]"
            />
          </div>

          <div className="grid gap-1.5">
            <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">
              Szolgáltatás
            </Label>
            <Select
              value={form.service_type}
              onValueChange={(val) => setField("service_type", val ?? "")}
            >
              <SelectTrigger className="w-full bg-[#111620] border-[rgba(255,255,255,0.08)] text-[#e2e8f0]">
                <SelectValue placeholder="Válassz szolgáltatást..." />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">
              Státusz
            </Label>
            <Select
              value={form.status}
              onValueChange={(val) =>
                setField("status", (val ?? "confirmed") as Appointment["status"])
              }
            >
              <SelectTrigger className="w-full bg-[#111620] border-[rgba(255,255,255,0.08)] text-[#e2e8f0]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(APPOINTMENT_STATUS_LABELS) as [Appointment["status"], string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">
              Megjegyzés
            </Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Egyéb tudnivalók..."
              rows={3}
              className="bg-[#111620] border-[rgba(255,255,255,0.08)] text-[#e2e8f0] placeholder:text-[#334155] focus-visible:border-[#0ea5e9] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="bg-transparent border-t-0 -mx-0 -mb-0 mt-2">
          <DialogClose
            render={
              <Button
                variant="outline"
                className="border-[rgba(255,255,255,0.1)] text-[#94a3b8] hover:text-[#e2e8f0]"
              />
            }
          >
            Mégsem
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="btn-gradient text-white"
          >
            {isPending ? "Mentés..." : "Mentés"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog: View/Edit Appointment ───────────────────────────────────────────

function EditDialog({
  open,
  onOpenChange,
  appointment,
  onUpdated,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  appointment: Appointment;
  onUpdated: (apt: Appointment) => void;
  onDeleted: (id: string) => void;
}) {
  const [form, setForm] = useState<FormState>(() => appointmentToForm(appointment));
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleOpenChange(o: boolean) {
    if (!o) {
      setError(null);
      setConfirmDelete(false);
    }
    onOpenChange(o);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.customer_name.trim()) {
      setError("Az ügyfél neve kötelező.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await updateAppointment(appointment.id, {
          customer_name: form.customer_name.trim(),
          customer_phone: form.customer_phone.trim() || null,
          service_type: form.service_type || null,
          notes: form.notes.trim() || null,
          status: form.status,
        });
        onUpdated({
          ...appointment,
          customer_name: form.customer_name.trim(),
          customer_phone: form.customer_phone.trim() || null,
          service_type: form.service_type || null,
          notes: form.notes.trim() || null,
          status: form.status,
        });
        handleOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hiba történt.");
      }
    });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startDeleteTransition(async () => {
      try {
        await deleteAppointment(appointment.id);
        onDeleted(appointment.id);
        handleOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Törlési hiba.");
      }
    });
  }

  const c = STATUS_COLORS[appointment.status];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#0c1017] border-[rgba(255,255,255,0.08)] text-[#e2e8f0] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[var(--font-rajdhani)] text-[#e2e8f0] text-lg tracking-widest uppercase">
            Időpont részletei
          </DialogTitle>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className="flex items-center gap-1.5 text-sm text-[#64748b] font-[var(--font-jetbrains)]">
              <Clock className="w-3.5 h-3.5" />
              {parseLocalDate(appointment.date).toLocaleDateString("hu-HU", {
                year: "numeric", month: "long", day: "numeric",
              })}{" "}
              — {appointment.time_slot}
            </span>
            <StatusPill status={appointment.status} />
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {error && (
            <p className="text-[#ef4444] text-sm bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid gap-1.5">
            <Label className="text-[#94a3b8] text-xs uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3 h-3" /> Ügyfél neve *
            </Label>
            <Input
              value={form.customer_name}
              onChange={(e) => setField("customer_name", e.target.value)}
              className="bg-[#111620] border-[rgba(255,255,255,0.08)] text-[#e2e8f0] focus-visible:border-[#0ea5e9]"
            />
          </div>

          <div className="grid gap-1.5">
            <Label className="text-[#94a3b8] text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3 h-3" /> Telefonszám
            </Label>
            <Input
              value={form.customer_phone}
              onChange={(e) => setField("customer_phone", e.target.value)}
              className="bg-[#111620] border-[rgba(255,255,255,0.08)] text-[#e2e8f0] focus-visible:border-[#0ea5e9]"
            />
          </div>

          <div className="grid gap-1.5">
            <Label className="text-[#94a3b8] text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-3 h-3" /> Szolgáltatás
            </Label>
            <Select
              value={form.service_type}
              onValueChange={(val) => setField("service_type", val ?? "")}
            >
              <SelectTrigger className="w-full bg-[#111620] border-[rgba(255,255,255,0.08)] text-[#e2e8f0]">
                <SelectValue placeholder="Válassz..." />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">
              Státusz
            </Label>
            <Select
              value={form.status}
              onValueChange={(val) =>
                setField("status", (val ?? "confirmed") as Appointment["status"])
              }
            >
              <SelectTrigger className="w-full bg-[#111620] border-[rgba(255,255,255,0.08)] text-[#e2e8f0]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(APPOINTMENT_STATUS_LABELS) as [
                    Appointment["status"],
                    string
                  ][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">
              Megjegyzés
            </Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={3}
              placeholder="Egyéb tudnivalók..."
              className="bg-[#111620] border-[rgba(255,255,255,0.08)] text-[#e2e8f0] placeholder:text-[#334155] focus-visible:border-[#0ea5e9] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="bg-transparent border-t-0 -mx-0 -mb-0 mt-2 flex-row justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className={cn(
              "gap-1.5",
              confirmDelete
                ? "bg-[#ef4444] text-white hover:bg-[#dc2626]"
                : "bg-[rgba(239,68,68,0.1)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.2)]"
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting ? "Törlés..." : confirmDelete ? "Biztosan?" : "Törlés"}
          </Button>

          <div className="flex gap-2">
            <DialogClose
              render={
                <Button
                  variant="outline"
                  className="border-[rgba(255,255,255,0.1)] text-[#94a3b8] hover:text-[#e2e8f0]"
                />
              }
            >
              Mégsem
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="btn-gradient text-white"
            >
              {isPending ? "Mentés..." : "Mentés"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Weekly Grid (desktop) ────────────────────────────────────────────────────

function WeeklyGrid({
  weekDays,
  appointmentMap,
  onSlotClick,
  onAppointmentClick,
}: {
  weekDays: Date[];
  appointmentMap: Map<string, Appointment[]>;
  onSlotClick: (date: string, timeSlot: string) => void;
  onAppointmentClick: (apt: Appointment) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Day headers */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-[rgba(255,255,255,0.06)]">
          <div className="h-12" />
          {weekDays.map((day, i) => {
            const today = isToday(day);
            return (
              <div
                key={i}
                className={cn(
                  "h-12 flex flex-col items-center justify-center border-l border-[rgba(255,255,255,0.06)]",
                  today && "bg-[rgba(14,165,233,0.04)]"
                )}
              >
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-widest font-[var(--font-rajdhani)] font-semibold",
                    today ? "text-[#0ea5e9]" : "text-[#64748b]"
                  )}
                >
                  {HU_DAYS_SHORT[i]}
                </span>
                <span
                  className={cn(
                    "text-sm font-bold font-[var(--font-rajdhani)]",
                    today ? "text-[#0ea5e9]" : "text-[#94a3b8]"
                  )}
                >
                  {day.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Time rows */}
        {TIME_SLOTS.map((slot) => (
          <div
            key={slot}
            className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-[rgba(255,255,255,0.04)] min-h-[56px]"
          >
            {/* Time label */}
            <div className="flex items-start justify-end pr-3 pt-2">
              <span className="text-[11px] text-[#334155] font-[var(--font-jetbrains)]">
                {slot}
              </span>
            </div>

            {/* Day cells */}
            {weekDays.map((day, i) => {
              const dateStr = toDateString(day);
              const key = `${dateStr}__${slot}`;
              const apts = appointmentMap.get(key) ?? [];
              const today = isToday(day);

              return (
                <div
                  key={i}
                  onClick={() => onSlotClick(dateStr, slot)}
                  className={cn(
                    "border-l border-[rgba(255,255,255,0.04)] p-1 cursor-pointer group/cell transition-colors duration-100",
                    "hover:bg-[rgba(14,165,233,0.03)]",
                    today && "bg-[rgba(14,165,233,0.02)]"
                  )}
                >
                  {apts.length === 0 && (
                    <div className="w-full h-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
                      <Plus className="w-3.5 h-3.5 text-[#0ea5e9]" />
                    </div>
                  )}
                  {apts.map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      onClick={() => onAppointmentClick(apt)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Day View (mobile) ────────────────────────────────────────────────────────

function DayView({
  day,
  appointmentMap,
  onSlotClick,
  onAppointmentClick,
  onPrev,
  onNext,
}: {
  day: Date;
  appointmentMap: Map<string, Appointment[]>;
  onSlotClick: (date: string, timeSlot: string) => void;
  onAppointmentClick: (apt: Appointment) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const dateStr = toDateString(day);
  const today = isToday(day);
  const dayIndex = (day.getDay() + 6) % 7; // Mon=0 … Sun=6

  return (
    <div>
      {/* Day navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <button
          onClick={onPrev}
          className="p-2 rounded-lg hover:bg-[#111620] text-[#64748b] hover:text-[#e2e8f0] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center">
          <span
            className={cn(
              "text-xs uppercase tracking-widest font-[var(--font-rajdhani)] font-semibold",
              today ? "text-[#0ea5e9]" : "text-[#64748b]"
            )}
          >
            {HU_DAYS[dayIndex]}
          </span>
          <span
            className={cn(
              "text-xl font-bold font-[var(--font-rajdhani)]",
              today ? "text-[#0ea5e9]" : "text-[#e2e8f0]"
            )}
          >
            {day.getDate()}. {HU_MONTHS[day.getMonth()]}
          </span>
        </div>
        <button
          onClick={onNext}
          className="p-2 rounded-lg hover:bg-[#111620] text-[#64748b] hover:text-[#e2e8f0] transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Time slots */}
      <div className="divide-y divide-[rgba(255,255,255,0.04)]">
        {TIME_SLOTS.map((slot) => {
          const key = `${dateStr}__${slot}`;
          const apts = appointmentMap.get(key) ?? [];
          return (
            <div
              key={slot}
              onClick={() => onSlotClick(dateStr, slot)}
              className="flex gap-3 px-4 py-3 cursor-pointer hover:bg-[rgba(14,165,233,0.03)] transition-colors group/row"
            >
              <span className="w-12 text-[12px] text-[#334155] font-[var(--font-jetbrains)] pt-0.5 flex-shrink-0">
                {slot}
              </span>
              <div className="flex-1 flex flex-col gap-1.5">
                {apts.length === 0 ? (
                  <div className="h-8 flex items-center opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <span className="flex items-center gap-1 text-[11px] text-[#0ea5e9]">
                      <Plus className="w-3 h-3" /> Időpont hozzáadása
                    </span>
                  </div>
                ) : (
                  apts.map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      onClick={() => onAppointmentClick(apt)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface CalendarViewProps {
  initialAppointments: Appointment[];
  initialWeekStart: string;
}

export function CalendarView({
  initialAppointments,
  initialWeekStart,
}: CalendarViewProps) {
  // ── State ──
  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);
  const [mondayDate, setMondayDate] = useState<Date>(() =>
    getMondayOfWeek(initialWeekStart)
  );

  // Mobile: current day index within the week (0=Mon … 6=Sun)
  const [mobileDayOffset, setMobileDayOffset] = useState<number>(() => {
    const today = new Date();
    const todayStr = toDateString(today);
    const monday = getMondayOfWeek(initialWeekStart);
    for (let i = 0; i < 7; i++) {
      if (toDateString(addDays(monday, i)) === todayStr) return i;
    }
    return 0;
  });

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createSlot, setCreateSlot] = useState<{ date: string; timeSlot: string } | null>(null);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);

  // ── Derived ──
  const weekDays = getWeekDays(mondayDate);
  const appointmentMap = buildAppointmentMap(appointments);

  // ── Navigation ──
  function goToPrevWeek() {
    setMondayDate((d) => addDays(d, -7));
  }
  function goToNextWeek() {
    setMondayDate((d) => addDays(d, 7));
  }
  function goToToday() {
    const today = new Date();
    setMondayDate(getMondayOfWeek(toDateString(today)));
    const todayStr = toDateString(today);
    const monday = getMondayOfWeek(toDateString(today));
    for (let i = 0; i < 7; i++) {
      if (toDateString(addDays(monday, i)) === todayStr) {
        setMobileDayOffset(i);
        break;
      }
    }
  }

  function goToPrevDay() {
    if (mobileDayOffset > 0) {
      setMobileDayOffset((o) => o - 1);
    } else {
      setMondayDate((d) => addDays(d, -7));
      setMobileDayOffset(6);
    }
  }
  function goToNextDay() {
    if (mobileDayOffset < 6) {
      setMobileDayOffset((o) => o + 1);
    } else {
      setMondayDate((d) => addDays(d, 7));
      setMobileDayOffset(0);
    }
  }

  // ── Slot / appointment click ──
  const handleSlotClick = useCallback((date: string, timeSlot: string) => {
    setCreateSlot({ date, timeSlot });
    setCreateOpen(true);
  }, []);

  const handleAppointmentClick = useCallback((apt: Appointment) => {
    setEditTarget(apt);
    setEditOpen(true);
  }, []);

  // ── CRUD callbacks ──
  function handleCreated(apt: Appointment) {
    setAppointments((prev) => [...prev, apt]);
  }

  function handleUpdated(apt: Appointment) {
    setAppointments((prev) => prev.map((a) => (a.id === apt.id ? apt : a)));
  }

  function handleDeleted(id: string) {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }

  // ── Today check for header ──
  const isCurrentWeek = weekDays.some(isToday);
  const mobileDay = addDays(mondayDate, mobileDayOffset);

  return (
    <div className="flex flex-col h-full">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0ea5e9] to-[#06b6d4] shadow-[0_2px_8px_rgba(14,165,233,0.3)]">
            <CalendarDays className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h1 className="font-[var(--font-rajdhani)] font-bold text-lg tracking-widest uppercase text-[#e2e8f0]">
              Naptár
            </h1>
            <p className="text-xs text-[#64748b] font-[var(--font-jetbrains)] hidden sm:block">
              {formatWeekRange(mondayDate)}
            </p>
          </div>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevWeek}
            className="hidden sm:flex p-2 rounded-lg hover:bg-[#111620] text-[#64748b] hover:text-[#e2e8f0] transition-colors border border-[rgba(255,255,255,0.06)]"
            aria-label="Előző hét"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToToday}
            className={cn(
              "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
              isCurrentWeek
                ? "border-[rgba(14,165,233,0.3)] text-[#0ea5e9] bg-[rgba(14,165,233,0.08)]"
                : "border-[rgba(255,255,255,0.06)] text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#111620]"
            )}
          >
            Mai nap
          </button>
          <button
            onClick={goToNextWeek}
            className="hidden sm:flex p-2 rounded-lg hover:bg-[#111620] text-[#64748b] hover:text-[#e2e8f0] transition-colors border border-[rgba(255,255,255,0.06)]"
            aria-label="Következő hét"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Mobile week navigation */}
          <button
            onClick={goToPrevWeek}
            className="sm:hidden p-2 rounded-lg hover:bg-[#111620] text-[#64748b] hover:text-[#e2e8f0] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="sm:hidden text-xs text-[#64748b] font-[var(--font-jetbrains)]">
            {mondayDate.getDate()}/{mondayDate.getMonth() + 1}–{addDays(mondayDate, 6).getDate()}/{addDays(mondayDate, 6).getMonth() + 1}
          </span>
          <button
            onClick={goToNextWeek}
            className="sm:hidden p-2 rounded-lg hover:bg-[#111620] text-[#64748b] hover:text-[#e2e8f0] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="hidden sm:flex items-center gap-4 px-6 py-2.5 border-b border-[rgba(255,255,255,0.04)] flex-shrink-0">
        {(Object.entries(STATUS_COLORS) as [Appointment["status"], typeof STATUS_COLORS[Appointment["status"]]][]).map(
          ([status, c]) => (
            <span key={status} className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", c.dot)} />
              {APPOINTMENT_STATUS_LABELS[status]}
            </span>
          )
        )}
        <span className="ml-auto text-[11px] text-[#334155]">
          Kattints egy üres cellára új időpont hozzáadásához
        </span>
      </div>

      {/* ── Calendar body ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Desktop: weekly grid */}
        <div className="hidden sm:block">
          <WeeklyGrid
            weekDays={weekDays}
            appointmentMap={appointmentMap}
            onSlotClick={handleSlotClick}
            onAppointmentClick={handleAppointmentClick}
          />
        </div>

        {/* Mobile: day view */}
        <div className="sm:hidden">
          <DayView
            day={mobileDay}
            appointmentMap={appointmentMap}
            onSlotClick={handleSlotClick}
            onAppointmentClick={handleAppointmentClick}
            onPrev={goToPrevDay}
            onNext={goToNextDay}
          />
        </div>
      </div>

      {/* ── Dialogs ── */}
      {createSlot && (
        <CreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          date={createSlot.date}
          timeSlot={createSlot.timeSlot}
          onCreated={handleCreated}
        />
      )}

      {editTarget && (
        <EditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          appointment={editTarget}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
