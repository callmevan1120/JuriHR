"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NAV_GROUPS } from "@/lib/router/routes";
import { useRoute } from "@/lib/router/use-route";
import { Wheat } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const route = useRoute();
  const currentPath = route.path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/60">
      <SidebarHeader className="px-3 pt-3 pb-1">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex items-center gap-2.5 min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wheat className="size-4" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tight">JURI</span>
              <span className="text-[10px] text-sidebar-foreground/50 font-medium">HR Management</span>
            </div>
          </div>
          <SidebarTrigger className="size-7 hover:bg-muted/60 text-sidebar-foreground/70 shrink-0 rounded-lg" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label} className="px-0">
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 px-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label + (!item.available ? ` (Fase ${item.phase})` : "")}
                        className={cn(
                          "rounded-lg transition-all duration-200",
                          isActive && "shadow-none",
                        )}
                      >
                        <Link href={item.path}>
                          <Icon className="size-4" />
                          <span className="text-[13px]">{item.label}</span>
                          {!item.available && (
                            <Badge variant="outline" className="ml-auto h-4 px-1.5 text-[9px] font-medium text-muted-foreground/50 border-muted-foreground/20 group-data-[collapsible=icon]:hidden">
                              F{item.phase}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-3 pb-3">
        <div className="rounded-xl border border-sidebar-border/60 bg-muted/40 p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2">
            <span className="flex size-1.5 rounded-full bg-success animate-pulse" />
            <p className="text-[11px] font-semibold">v1.0</p>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">
            17 modul aktif · Sistem HR Multi-Outlet
          </p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
