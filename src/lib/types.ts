export interface Profile {
  id: string;
  business_name: string;
  business_type: string;
  created_at: string;
}

export interface Customer {
  id: string;
  profile_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_returning: boolean;
  created_at: string;
}

export interface Vehicle {
  id: string;
  profile_id: string;
  customer_id: string | null;
  brand: string;
  model: string;
  year: number | null;
  engine: string | null;
  engine_code: string | null;
  ecu_type: string | null;
  license_plate: string | null;
  stock_hp: number | null;
  stock_nm: number | null;
  notes: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  profile_id: string;
  vehicle_id: string;
  job_date: string;
  job_types: string[];
  result_hp: number | null;
  result_nm: number | null;
  file_source: string | null;
  notes: string | null;
  status: "done" | "warranty" | "reclamation" | "in_progress";
  warranty_months: number | null;
  warranty_expires_at: string | null;
  warranty_conditions: string | null;
  warranty_claimed: boolean;
  warranty_claim_date: string | null;
  warranty_claim_notes: string | null;
  created_at: string;
}

export interface FileRecord {
  id: string;
  job_id: string;
  profile_id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  file_category: "original" | "modified" | "dyno_report" | "other";
  created_at: string;
}

export interface JobWithVehicle extends Job {
  vehicles: Vehicle;
  file_count?: number;
}

export interface PriceListItem {
  id: string;
  profile_id: string;
  brand: string;
  engine_pattern: string;
  stage: string;
  price_net: number;
  price_note: string | null;
  created_at: string;
}

export interface QuoteItem {
  name: string;
  quantity: number;
  price_net: number;
}

export interface Quote {
  id: string;
  profile_id: string;
  vehicle_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  car_description: string;
  items: QuoteItem[];
  total_net: number;
  total_gross: number;
  vat_percent: number;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  valid_until: string | null;
  notes: string | null;
  pdf_path: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  profile_id: string;
  vehicle_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  date: string;
  time_slot: string;
  service_type: string | null;
  notes: string | null;
  status: "confirmed" | "completed" | "cancelled" | "no_show";
  created_at: string;
}

export const JOB_TYPES = [
  "Stage 1",
  "Stage 2",
  "Stage 3",
  "DPF off",
  "EGR off",
  "AdBlue off",
  "DTC off",
  "TCU tune",
  "Egyéb",
] as const;

export const JOB_STATUS_LABELS: Record<Job["status"], string> = {
  done: "Kész",
  warranty: "Garanciás",
  reclamation: "Reklamáció",
  in_progress: "Folyamatban",
};

export const FILE_CATEGORIES = [
  { value: "original" as const, label: "Original (.bin/.ori)" },
  { value: "modified" as const, label: "Modified (.bin/.mod)" },
  { value: "dyno_report" as const, label: "Dyno riport" },
  { value: "other" as const, label: "Egyéb" },
];

export const QUOTE_STATUS_LABELS: Record<Quote["status"], string> = {
  draft: "Piszkozat",
  sent: "Elküldve",
  accepted: "Elfogadva",
  rejected: "Elutasítva",
  expired: "Lejárt",
};

export const APPOINTMENT_STATUS_LABELS: Record<Appointment["status"], string> = {
  confirmed: "Megerősítve",
  completed: "Teljesítve",
  cancelled: "Lemondva",
  no_show: "Nem jelent meg",
};

export const SERVICE_TYPES = [
  "Stage 1 tuning",
  "Stage 2 tuning",
  "Stage 3 tuning",
  "DPF/EGR/AdBlue",
  "Diagnosztika",
  "TCU tune",
  "Egyéb",
] as const;

export const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
] as const;

export const WARRANTY_OPTIONS = [
  { value: 0, label: "Nincs garancia" },
  { value: 3, label: "3 hónap" },
  { value: 6, label: "6 hónap" },
  { value: 12, label: "12 hónap" },
] as const;
