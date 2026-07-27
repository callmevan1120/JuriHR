"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { AppBreadcrumb } from "./app-breadcrumb";
import { NotificationPopover } from "./notification-popover";

export function AppTopbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
      <SidebarTrigger className="size-9" />
      <Separator orientation="vertical" className="mr-1 h-6" />
      <AppBreadcrumb />

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Ganti tema"
        >
          {mounted && theme === "dark" ? (
            <Sun className="size-5" />
          ) : (
            <Moon className="size-5" />
          )}
        </Button>

        <NotificationPopover />

        {/* Profil HRD (mock) */}
        <div className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            HR
          </div>
          <div className="hidden leading-none sm:block">
            <p className="text-xs font-medium text-foreground">HRD Admin</p>
            <p className="text-[10px] text-muted-foreground">Human Resources</p>
          </div>
        </div>
      </div>
    </header>
  );
}
