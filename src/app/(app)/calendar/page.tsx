import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "./calendar-view";
import type { Appointment } from "@/lib/types";

function getWeekBounds(referenceDate: Date): { start: string; end: string } {
  const d = new Date(referenceDate);
  // Monday = 1, Sunday = 0 → shift so Monday is day 0
  const day = d.getDay(); // 0=Sun, 1=Mon … 6=Sat
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

export default async function CalendarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { start, end } = getWeekBounds(new Date());

  const { data } = await supabase
    .from("appointments")
    .select("*")
    .eq("profile_id", user.id)
    .gte("date", start)
    .lte("date", end)
    .order("time_slot", { ascending: true });

  const appointments: Appointment[] = (data ?? []) as Appointment[];

  return (
    <div className="flex flex-col h-full bg-[#06080d] bg-grid-pattern">
      <CalendarView initialAppointments={appointments} initialWeekStart={start} />
    </div>
  );
}
