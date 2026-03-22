"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Share2,
  Link2,
  Copy,
  ExternalLink,
  XCircle,
  Eye,
  Loader2,
} from "lucide-react";

interface ShareSectionProps {
  vehicleId: string;
  existingToken?: {
    id: string;
    token: string;
    view_count: number;
    is_active: boolean;
  } | null;
}

export function ShareSection({ vehicleId, existingToken }: ShareSectionProps) {
  const [shareData, setShareData] = useState<{
    token: string;
    tokenId: string;
    url: string;
    viewCount: number;
  } | null>(
    existingToken
      ? {
          token: existingToken.token,
          tokenId: existingToken.id,
          url: `${typeof window !== "undefined" ? window.location.origin : ""}/share/${existingToken.token}`,
          viewCount: existingToken.view_count,
        }
      : null
  );
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/share/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShareData({
        token: data.token,
        tokenId: data.tokenId,
        url: data.url,
        viewCount: data.viewCount,
      });
      toast.success("Link generálva!");
    } catch (err) {
      toast.error("Hiba a link generálásakor");
    }
    setGenerating(false);
  }

  async function handleRevoke() {
    if (!shareData) return;
    setRevoking(true);
    try {
      const res = await fetch("/api/share/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: shareData.tokenId }),
      });
      if (!res.ok) throw new Error("Failed");
      setShareData(null);
      toast.success("Link visszavonva");
    } catch {
      toast.error("Hiba a link visszavonásakor");
    }
    setRevoking(false);
  }

  async function handleCopy() {
    if (!shareData) return;
    try {
      await navigator.clipboard.writeText(shareData.url);
      toast.success("Link másolva a vágólapra!");
    } catch {
      toast.error("Nem sikerült másolni");
    }
  }

  return (
    <Card className="glass-card animate-fade-in-up stagger-3">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Share2 className="h-4 w-4 text-primary" />
          Ügyfél portál
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!shareData ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Generálj egy publikus linket, amit elküldhetsz az ügyfélnek.
              Ott megnézheti az autója tuning történetét és letöltheti a dyno riportot.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-gradient border-0 text-white"
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              {generating ? "Generálás..." : "Link generálása az ügyfélnek"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* URL display */}
            <div className="flex gap-2">
              <Input
                value={shareData.url}
                readOnly
                className="text-xs font-mono bg-secondary/30"
                onClick={handleCopy}
              />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Link másolása
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(shareData.url, "_blank")}
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Megnyitás
              </Button>
              <Dialog>
                <DialogTrigger
                  render={(props) => (
                    <Button
                      {...props}
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      Visszavonás
                    </Button>
                  )}
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Link visszavonása</DialogTitle>
                    <DialogDescription>
                      A visszavont linket az ügyfél többé nem tudja megnyitni. Biztosan visszavonod?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={handleRevoke}
                      disabled={revoking}
                    >
                      {revoking ? "Visszavonás..." : "Igen, visszavonom"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* View count */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
              <Eye className="h-3.5 w-3.5" />
              <span>Megtekintések: {shareData.viewCount}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
