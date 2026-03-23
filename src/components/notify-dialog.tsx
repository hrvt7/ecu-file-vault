"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, MessageCircle, X } from "lucide-react";

interface NotifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  carDescription: string;
  shareUrl?: string;
  businessName: string;
}

export function NotifyDialog({
  open,
  onOpenChange,
  customerName,
  customerEmail,
  customerPhone,
  carDescription,
  shareUrl,
  businessName,
}: NotifyDialogProps) {
  const [sending, setSending] = useState(false);

  const whatsappMessage = encodeURIComponent(
    `Szia ${customerName || ""}! 🚗 Az autód (${carDescription}) elkészült!${
      shareUrl ? ` Az eredményeket itt nézheted meg: ${shareUrl}` : ""
    } Kérdésed van? Hívj nyugodtan! — ${businessName}`
  );

  const cleanPhone = customerPhone?.replace(/[\s-()]/g, "") || "";
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappMessage}`;

  async function handleEmailSend() {
    if (!customerEmail) return;
    setSending(true);
    try {
      const res = await fetch("/api/notify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: customerEmail,
          customerName,
          carDescription,
          shareUrl,
          businessName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Email küldés sikertelen");
      }

      toast.success("Email elküldve!", {
        description: `${customerEmail} címre`,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error("Hiba az email küldés során", {
        description: err instanceof Error ? err.message : "Ismeretlen hiba",
      });
    }
    setSending(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Az autó kész! 🎉</DialogTitle>
          <DialogDescription>
            Értesítsed az ügyfelet a kész munkáról?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="text-sm text-[#64748b]">
            <span className="font-medium text-[#e2e8f0]">{carDescription}</span>
            {customerName && (
              <span> · {customerName}</span>
            )}
          </div>

          {shareUrl && (
            <div className="bg-[#111620] rounded-lg p-3 text-xs font-[var(--font-jetbrains)]">
              <span className="text-[#334155]">Ügyfél portál: </span>
              <span className="text-[#0ea5e9]">{shareUrl}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {customerEmail && (
            <Button
              onClick={handleEmailSend}
              disabled={sending}
              className="w-full bg-[#0ea5e9] hover:bg-[#38bdf8] text-white"
            >
              <Mail className="mr-2 h-4 w-4" />
              {sending ? "Küldés..." : `Email küldés (${customerEmail})`}
            </Button>
          )}

          {customerPhone && (
            <Button
              onClick={() => window.open(whatsappUrl, "_blank")}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp üzenet ({customerPhone})
            </Button>
          )}

          {!customerEmail && !customerPhone && (
            <p className="text-sm text-[#64748b] text-center py-2">
              Nincs ügyfél elérhetőség megadva ehhez a járműhöz.
            </p>
          )}

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-[#64748b]"
          >
            Nem most
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
