"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { findNavGroupAndItem } from "@/lib/router/routes";
import { useRoute, navigate } from "@/lib/router/use-route";
import { Home } from "lucide-react";

export function AppBreadcrumb() {
  const route = useRoute();
  const { group, item } = findNavGroupAndItem(route.path);
  const isDashboard = route.path === "#/" || route.path === "#" || !route.path;

  return (
    <Breadcrumb className="min-w-0 flex-1">
      <BreadcrumbList className="text-xs font-medium flex-nowrap overflow-hidden">
        <BreadcrumbItem className="shrink-0">
          {isDashboard ? (
            <BreadcrumbPage className="font-semibold text-foreground flex items-center gap-1">
              <Home className="size-3.5 text-primary shrink-0" /> Dashboard
            </BreadcrumbPage>
          ) : (
            <BreadcrumbLink
              className="cursor-pointer hover:text-foreground flex items-center gap-1 transition-colors text-muted-foreground shrink-0"
              onClick={() => navigate("#/")}
            >
              <Home className="size-3.5 shrink-0" />
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {!isDashboard && group && group.label !== "Utama" && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="hidden sm:flex shrink-0">
              <span className="text-muted-foreground">{group.label}</span>
            </BreadcrumbItem>
          </>
        )}

        {!isDashboard && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="font-semibold text-foreground truncate">
                {item?.label ?? "Halaman"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
