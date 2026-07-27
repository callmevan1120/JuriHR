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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Wheat className="size-5" />
          </div>
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-base font-bold tracking-tight text-foreground">
              JURI HR
            </span>
            <span className="text-[11px] text-muted-foreground">
              HRD Management
            </span>
          </div>
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.label}
                          >
                            <Link href={item.path}>
                              <Icon className="size-4" />
                              <span>{item.label}</span>
                              {!item.available ? (
                                <span className="ml-auto flex items-center">
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
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                          {!item.available ? ` — Fase ${item.phase}` : ""}
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-lg border border-sidebar-border bg-muted/40 p-3 group-data-[collapsible=icon]:hidden">
          <p className="text-[11px] font-medium text-foreground">
            Prototipe JURI HR
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Fase 1 · Fondasi & Design System
          </p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
