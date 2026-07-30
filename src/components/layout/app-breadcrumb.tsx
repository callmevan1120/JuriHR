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
    <Breadcrumb>
      <BreadcrumbList className="text-xs sm:text-sm font-medium">
        {/* Home / Dashboard link */}
        <BreadcrumbItem>
          {isDashboard ? (
            <BreadcrumbPage className="font-bold text-foreground flex items-center gap-1.5">
              <Home className="size-3.5 text-primary" /> Dashboard
            </BreadcrumbPage>
          ) : (
            <BreadcrumbLink
              className="cursor-pointer hover:text-foreground flex items-center gap-1.5 transition-colors text-muted-foreground"
              onClick={() => navigate("#/")}
            >
              <Home className="size-3.5" /> Dashboard
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {/* Group Name (e.g. Master Data) */}
        {!isDashboard && group && group.label !== "Utama" ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-muted-foreground text-xs sm:text-sm">{group.label}</span>
            </BreadcrumbItem>
          </>
        ) : null}

        {/* Active Feature Name (Bold ERPNext style) */}
        {!isDashboard ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-bold text-foreground text-xs sm:text-sm">
                {item?.label ?? "Halaman"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
