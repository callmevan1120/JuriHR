"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
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
import { useRoute, navigate } from "@/lib/router/use-route";
import { Wheat } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const route = useRoute();
  const currentPath = route.path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/50">
      <SidebarHeader className="px-3 pt-4 pb-2">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div
            onClick={() => navigate("#/")}
            className="flex items-center gap-2.5 min-w-0 group-data-[collapsible=icon]:hidden cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wheat className="size-4" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tight">JURI HR</span>
              <span className="text-[10px] text-sidebar-foreground/40 font-medium">Bakery & Coffee Bun</span>
            </div>
          </div>
          <SidebarTrigger className="size-7 hover:bg-sidebar-accent/60 text-sidebar-foreground/50 shrink-0 rounded-lg" />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0.5 px-2 flex-1">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label} className="px-0 py-0.5">
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35 px-2 pb-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.path)}
                        isActive={isActive}
                        tooltip={item.label}
                        className="rounded-lg transition-all duration-150 cursor-pointer"
                      >
                        <Icon className="size-4" />
                        <span className="text-[13px]">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
