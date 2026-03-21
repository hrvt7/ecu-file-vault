"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { updateProfile, updatePassword } from "@/app/actions";

export function SettingsForm({
  email,
  businessName: initialName,
}: {
  email: string;
  businessName: string;
}) {
  const [businessName, setBusinessName] = useState(initialName);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ business_name: businessName });
      toast.success("Műhely neve frissítve!");
    } catch (err) {
      toast.error("Hiba a mentés során", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
    setSavingProfile(false);
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("A jelszavak nem egyeznek!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A jelszó minimum 6 karakter legyen!");
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(newPassword);
      toast.success("Jelszó sikeresen módosítva!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error("Hiba a jelszó módosítás során", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
    setSavingPassword(false);
  }

  return (
    <div className="space-y-6">
      {/* Profile settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Műhely adatok</CardTitle>
          <CardDescription>A műhelyed neve megjelenik a dashboardon</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} disabled className="opacity-60" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="businessName">Műhely neve</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Mentés..." : "Mentés"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password change */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Jelszó módosítás</CardTitle>
          <CardDescription>Add meg az új jelszavadat</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Új jelszó</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 karakter"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Jelszó megerősítés</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Jelszó újra"
                required
              />
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? "Módosítás..." : "Jelszó módosítása"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
