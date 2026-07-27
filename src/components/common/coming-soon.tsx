"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hammer, ArrowLeft } from "lucide-react";
import { navigate } from "@/lib/router/use-route";
import type { NavItem } from "@/lib/router/routes";

interface ComingSoonProps {
  item: NavItem;
}

export function ComingSoon({ item }: ComingSoonProps) {
  const Icon = item.icon;
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-10 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Icon className="size-8" />
      </div>
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Hammer className="size-3" />
          Fase {item.phase} — Dalam Pengembangan
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">{item.label}</h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {item.description}
        </p>
      </div>
      <Card className="w-full border-dashed bg-muted/20">
        <CardContent className="space-y-3 p-5 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Catatan Prototipe
          </p>
          <p className="text-sm text-foreground">
            Modul ini dijadwalkan tersedia pada{" "}
            <span className="font-medium">Fase {item.phase}</span>. Data
            pendukung sudah tersedia di central data service dan akan ditampilkan
            di sini begitu modul dirilis. Navigasi & dashboard sudah menyiapkan
            integrasi modul ini.
          </p>
        </CardContent>
      </Card>
      <Button variant="outline" onClick={() => navigate("#/")}>
        <ArrowLeft className="size-4" />
        Kembali ke Dashboard
      </Button>
    </div>
  );
}
