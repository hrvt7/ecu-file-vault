"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createVehicle, createJob, createFileRecord, getSignedUploadUrl } from "@/app/actions";
import { JOB_TYPES, FILE_CATEGORIES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Upload, Check, X, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { FolderUpload, UploadProgress, type UploadableFile } from "@/components/folder-upload";
import { categorizeFile, formatFileSize, type FileCategory } from "@/lib/file-categories";

interface VehicleOption {
  id: string;
  brand: string;
  model: string;
  license_plate: string | null;
  ecu_type: string | null;
  stock_hp: number | null;
  stock_nm: number | null;
}

export function NewJobForm({
  vehicles,
  userId,
}: {
  vehicles: VehicleOption[];
  userId: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Vehicle
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    brand: "",
    model: "",
    year: "",
    engine: "",
    engine_code: "",
    ecu_type: "",
    license_plate: "",
    stock_hp: "",
    stock_nm: "",
  });

  // Step 2: Job data
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [resultHp, setResultHp] = useState("");
  const [resultNm, setResultNm] = useState("");
  const [fileSource, setFileSource] = useState("");
  const [status, setStatus] = useState("done");
  const [notes, setNotes] = useState("");

  // Step 3: Files
  const [files, setFiles] = useState<UploadableFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  function toggleJobType(type: string) {
    setJobTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      let vehicleId = selectedVehicleId;

      // Create vehicle if new
      if (showNewVehicle) {
        const vehicle = await createVehicle({
          brand: newVehicle.brand,
          model: newVehicle.model,
          year: newVehicle.year ? parseInt(newVehicle.year) : undefined,
          engine: newVehicle.engine || undefined,
          engine_code: newVehicle.engine_code || undefined,
          ecu_type: newVehicle.ecu_type || undefined,
          license_plate: newVehicle.license_plate || undefined,
          stock_hp: newVehicle.stock_hp ? parseInt(newVehicle.stock_hp) : undefined,
          stock_nm: newVehicle.stock_nm ? parseInt(newVehicle.stock_nm) : undefined,
        });
        vehicleId = vehicle.id;
      }

      if (!vehicleId) {
        toast.error("Válassz járművet!");
        setLoading(false);
        return;
      }

      // Create job
      const job = await createJob({
        vehicle_id: vehicleId,
        job_types: jobTypes,
        result_hp: resultHp ? parseInt(resultHp) : undefined,
        result_nm: resultNm ? parseInt(resultNm) : undefined,
        file_source: fileSource || undefined,
        notes: notes || undefined,
        status,
      });

      // Upload files (only selected ones)
      const filesToUpload = files.filter((f) => f.selected !== false);
      if (filesToUpload.length > 0) {
        setUploading(true);
        for (let i = 0; i < filesToUpload.length; i++) {
          const { file, category } = filesToUpload[i];
          const path = `${userId}/${job.id}/${file.name}`;

          const { signedUrl, token } = await getSignedUploadUrl(path);
          await fetch(signedUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
          });

          await createFileRecord({
            job_id: job.id,
            file_name: file.name,
            file_type: file.type || null,
            file_size: file.size,
            storage_path: path,
            file_category: category,
          });

          setUploadProgress(((i + 1) / filesToUpload.length) * 100);
        }
        setUploading(false);
      }

      toast.success("Munka sikeresen rögzítve!");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error("Hiba történt", {
        description: err instanceof Error ? err.message : "Ismeretlen hiba",
      });
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "flex-1 h-1.5 rounded-full transition-colors",
              s <= step ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Step 1: Vehicle Selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Jármű kiválasztása</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showNewVehicle ? (
              <>
                {vehicles.length > 0 && (
                  <Select value={selectedVehicleId} onValueChange={(val) => setSelectedVehicleId(val ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Válassz meglévő járművet..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.license_plate && `[${v.license_plate}] `}
                          {v.brand} {v.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowNewVehicle(true)}
                >
                  + Új jármű hozzáadása
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Márka *</Label>
                    <Input
                      value={newVehicle.brand}
                      onChange={(e) => setNewVehicle((p) => ({ ...p, brand: e.target.value }))}
                      placeholder="BMW"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Modell *</Label>
                    <Input
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle((p) => ({ ...p, model: e.target.value }))}
                      placeholder="320d"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Évjárat</Label>
                    <Input
                      value={newVehicle.year}
                      onChange={(e) => setNewVehicle((p) => ({ ...p, year: e.target.value }))}
                      placeholder="2019"
                      type="number"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Motor</Label>
                    <Input
                      value={newVehicle.engine}
                      onChange={(e) => setNewVehicle((p) => ({ ...p, engine: e.target.value }))}
                      placeholder="2.0 TDI"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Motorkód</Label>
                    <Input
                      value={newVehicle.engine_code}
                      onChange={(e) => setNewVehicle((p) => ({ ...p, engine_code: e.target.value }))}
                      placeholder="B47D20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ECU típus</Label>
                    <Input
                      value={newVehicle.ecu_type}
                      onChange={(e) => setNewVehicle((p) => ({ ...p, ecu_type: e.target.value }))}
                      placeholder="Bosch EDC17"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rendszám</Label>
                    <Input
                      value={newVehicle.license_plate}
                      onChange={(e) => setNewVehicle((p) => ({ ...p, license_plate: e.target.value }))}
                      placeholder="ABC-123"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Gyári LE</Label>
                    <Input
                      value={newVehicle.stock_hp}
                      onChange={(e) => setNewVehicle((p) => ({ ...p, stock_hp: e.target.value }))}
                      placeholder="190"
                      type="number"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Gyári Nm</Label>
                    <Input
                      value={newVehicle.stock_nm}
                      onChange={(e) => setNewVehicle((p) => ({ ...p, stock_nm: e.target.value }))}
                      placeholder="400"
                      type="number"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewVehicle(false)}
                >
                  Vissza a listához
                </Button>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!showNewVehicle && !selectedVehicleId}
              >
                Tovább
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Job Details */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Munka adatok</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Munka típusok</Label>
              <div className="grid grid-cols-3 gap-2">
                {JOB_TYPES.map((type) => {
                  const selected = jobTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleJobType(type)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 border",
                        selected
                          ? "bg-primary/15 border-primary/30 text-primary"
                          : "bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary/60"
                      )}
                    >
                      {selected && <Check className="h-3 w-3" />}
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Eredmény LE</Label>
                <Input
                  value={resultHp}
                  onChange={(e) => setResultHp(e.target.value)}
                  placeholder="250"
                  type="number"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Eredmény Nm</Label>
                <Input
                  value={resultNm}
                  onChange={(e) => setResultNm(e.target.value)}
                  placeholder="500"
                  type="number"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Fájl forrás</Label>
              <Input
                value={fileSource}
                onChange={(e) => setFileSource(e.target.value)}
                placeholder="WinOLS, ecufiles.com, saját..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Státusz</Label>
              <Select value={status} onValueChange={(val) => setStatus(val ?? "done")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="done">Kész</SelectItem>
                  <SelectItem value="in_progress">Folyamatban</SelectItem>
                  <SelectItem value="warranty">Garanciás</SelectItem>
                  <SelectItem value="reclamation">Reklamáció</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Megjegyzés</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Megjegyzések a munkáról..."
                rows={3}
              />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Vissza
              </Button>
              <Button onClick={() => setStep(3)} disabled={jobTypes.length === 0}>
                Tovább
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Files */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. Fájl feltöltés (opcionális)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="files">
              <TabsList className="w-full">
                <TabsTrigger value="files" className="flex-1">Fájlok</TabsTrigger>
                <TabsTrigger value="folder" className="flex-1">Mappa</TabsTrigger>
              </TabsList>

              {/* Individual files tab */}
              <TabsContent value="files" className="space-y-4 mt-4">
                <div
                  className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedFiles = Array.from(e.dataTransfer.files);
                    setFiles((prev) => [
                      ...prev,
                      ...droppedFiles.map((f) => ({ file: f, category: categorizeFile(f, f.name), relativePath: f.name, selected: true })),
                    ]);
                  }}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.multiple = true;
                    input.onchange = (e) => {
                      const selectedFiles = Array.from(
                        (e.target as HTMLInputElement).files || []
                      );
                      setFiles((prev) => [
                        ...prev,
                        ...selectedFiles.map((f) => ({ file: f, category: categorizeFile(f, f.name), relativePath: f.name, selected: true })),
                      ]);
                    };
                    input.click();
                  }}
                >
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Húzd ide a fájlokat vagy kattints a tallózáshoz
                  </p>
                  <p className="text-[11px] text-muted-foreground/50 mt-1">Max 50 MB / fájl</p>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 bg-muted/50 rounded-lg p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{f.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(f.file.size)}
                          </p>
                        </div>
                        <Select
                          value={f.category}
                          onValueChange={(val) => {
                            setFiles((prev) =>
                              prev.map((item, idx) =>
                                idx === i ? { ...item, category: (val ?? "other") as FileCategory } : item
                              )
                            );
                          }}
                        >
                          <SelectTrigger className="w-44">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FILE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Folder upload tab */}
              <TabsContent value="folder" className="mt-4">
                <FolderUpload
                  onFilesReady={(folderFiles) => setFiles(folderFiles)}
                  existingFiles={files}
                />
              </TabsContent>
            </Tabs>

            {uploading && (
              <UploadProgress
                total={files.filter(f => f.selected !== false).length}
                uploaded={Math.round((uploadProgress / 100) * files.filter(f => f.selected !== false).length)}
                currentFile=""
                errors={[]}
              />
            )}

            <Separator />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Vissza
              </Button>
              <Button onClick={handleSubmit} disabled={loading || uploading}>
                {loading ? "Mentés folyamatban..." : "Munka rögzítése"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
