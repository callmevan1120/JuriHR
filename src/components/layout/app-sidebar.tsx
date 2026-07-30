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
  useSidebar,
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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border/60 pb-2">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex items-center gap-2.5 min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Wheat className="size-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tight text-foreground">
                JURI HR
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                HR Management
              </span>
            </div>
          </div>
          {/* Hamburger Icon Toggle - Centered when collapsed */}
          <SidebarTrigger className="size-8 hover:bg-sidebar-accent text-sidebar-foreground shrink-0 rounded-lg" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
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
                      >
                        <Link href={item.path}>
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                          {!item.available ? (
                            <span className="ml-auto flex items-center group-data-[collapsible=icon]:hidden">
                              <Badge
                                variant="outline"
                                className="h-4 px-1 text-[9px] font-medium text-muted-foreground"
                              >
                                F{item.phase}
                              </Badge>
                            </span>
                          ) : null}
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

      <SidebarFooter>
        <div className="rounded-lg border border-sidebar-border bg-gradient-to-br from-primary/5 to-muted/40 p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2">
            <span className="flex size-1.5 rounded-full bg-success" />
            <p className="text-[11px] font-semibold text-foreground">
              JURI HR v1.0
            </p>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            17 modul · 5 fase selesai
          </p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
