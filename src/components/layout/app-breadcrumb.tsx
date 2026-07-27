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
import { findNavItem } from "@/lib/router/routes";
import { useRoute } from "@/lib/router/use-route";
import { navigate } from "@/lib/router/use-route";
import { Fragment } from "react";

export function AppBreadcrumb() {
  const route = useRoute();
  const item = findNavItem(route.path);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {route.path === "#/" ? (
            <BreadcrumbPage className="text-sm">Dashboard</BreadcrumbPage>
          ) : (
            <BreadcrumbLink
              className="cursor-pointer text-sm"
              onClick={() => navigate("#/")}
            >
              Dashboard
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {route.path !== "#/" ? (
          <Fragment>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm font-medium">
                {item?.label ?? "Halaman"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </Fragment>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
