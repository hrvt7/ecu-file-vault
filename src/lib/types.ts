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
