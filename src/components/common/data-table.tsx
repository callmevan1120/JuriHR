"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Settings,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Key unik tabel untuk menyimpan visibilitas & ukuran kolom per user di localStorage */
  tableKey?: string;
  /** Akses ke nilai untuk search global. */
  globalFilterFn?: (row: TData, query: string) => boolean;
  searchPlaceholder?: string;
  /** Konten di sebelah kiri search (filter kustom). */
  toolbar?: React.ReactNode;
  /** Aksi bulk yang muncul saat ada baris terpilih. */
  bulkActions?: (selectedRows: TData[]) => React.ReactNode;
  pageSize?: number;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  tableKey,
  globalFilterFn,
  searchPlaceholder = "Cari...",
  toolbar,
  bulkActions,
  pageSize = 10,
  emptyMessage = "Tidak ada data.",
  className,
  onRowClick,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() => {
    if (tableKey && typeof window !== "undefined") {
      const saved = localStorage.getItem(`juri_table_vis_${tableKey}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {};
  });

  const [columnSizing, setColumnSizing] = React.useState<Record<string, number>>(() => {
    if (tableKey && typeof window !== "undefined") {
      const saved = localStorage.getItem(`juri_table_sizes_${tableKey}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {};
  });

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const handleColumnVisibilityChange = React.useCallback(
    (updaterOrValue: React.SetStateAction<VisibilityState>) => {
      setColumnVisibility((prev) => {
        const next = typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
        if (tableKey && typeof window !== "undefined") {
          localStorage.setItem(`juri_table_vis_${tableKey}`, JSON.stringify(next));
        }
        return next;
      });
    },
    [tableKey],
  );

  const handleColumnSizingChange = React.useCallback(
    (updaterOrValue: React.SetStateAction<Record<string, number>>) => {
      setColumnSizing((prev) => {
        const next = typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
        if (tableKey && typeof window !== "undefined") {
          localStorage.setItem(`juri_table_sizes_${tableKey}`, JSON.stringify(next));
        }
        return next;
      });
    },
    [tableKey],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter, columnSizing },
    enableRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onColumnSizingChange: handleColumnSizingChange,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalFilterFn
      ? (row, _columnId, filterValue) =>
          globalFilterFn(row.original as TData, String(filterValue))
      : "auto",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId,
    initialState: { pagination: { pageSize } },
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const hasSelection = selectedRows.length > 0;

  const pageIndex = table.getState().pagination.pageIndex;
  const currentLimit = table.getState().pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = totalRows > 0 ? pageIndex * currentLimit + 1 : 0;
  const endRow = Math.min((pageIndex + 1) * currentLimit, totalRows);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-8"
            />
          </div>
          {toolbar}

          {/* ERPNext-style Column Settings Dropdown (Gear Icon) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs font-semibold rounded-xl border-border/80 hover:bg-muted/50"
                title="Pengaturan Tampilan & Ukuran Kolom (ERPNext Column Config)"
              >
                <Settings className="size-4 text-primary" />
                <span>Pengaturan Kolom</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[320px] p-3 space-y-3 rounded-2xl shadow-lg border-border">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <Settings className="size-4 text-primary" />
                  <h4 className="text-xs font-bold text-foreground">Kustomisasi Kolom Tabel</h4>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    table.getAllColumns().forEach((c) => c.toggleVisibility(true));
                    table.resetColumnSizing();
                    if (tableKey && typeof window !== "undefined") {
                      localStorage.removeItem(`juri_table_vis_${tableKey}`);
                      localStorage.removeItem(`juri_table_sizes_${tableKey}`);
                    }
                  }}
                >
                  <RotateCcw className="mr-1 size-3" /> Reset Bawaan
                </Button>
              </div>

              <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((col) => {
                    const label = typeof col.columnDef.header === "string" ? col.columnDef.header : col.id;
                    const isVis = col.getIsVisible();
                    const currentSize = col.getSize();

                    return (
                      <div
                        key={col.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 p-2 hover:bg-muted/40 transition-colors"
                      >
                        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground min-w-0 flex-1">
                          <Checkbox
                            checked={isVis}
                            onCheckedChange={(val) => col.toggleVisibility(!!val)}
                            className="size-3.5"
                          />
                          <span className="truncate font-semibold">{label}</span>
                        </label>

                        {isVis && (
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-muted-foreground font-mono">Lebar:</span>
                            <Input
                              type="number"
                              min={80}
                              max={600}
                              value={currentSize}
                              onChange={(e) => {
                                const val = Math.min(600, Math.max(80, Number(e.target.value) || 150));
                                handleColumnSizingChange((prev) => ({
                                  ...prev,
                                  [col.id]: val,
                                }));
                              }}
                              className="h-6 w-16 px-1.5 text-right font-mono text-[11px] rounded-md font-semibold"
                            />
                            <span className="text-[10px] text-muted-foreground">px</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {hasSelection && bulkActions ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5">
            <span className="text-xs font-medium text-foreground">
              {selectedRows.length} dipilih
            </span>
            {bulkActions(selectedRows)}
          </div>
        ) : null}
      </div>

      {/* Table (Clean & Sticky Header for Large Datasets) */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="max-h-[68vh] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/90 backdrop-blur-xs border-b border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                        className="relative h-10 text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap group/head"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center gap-1 pr-2",
                              header.column.getCanSort() && "cursor-pointer select-none hover:text-foreground",
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() ? (
                              <span className="flex flex-col">
                                <ChevronUp
                                  className={cn(
                                    "size-3 -mb-1",
                                    header.column.getIsSorted() === "asc"
                                      ? "text-primary font-bold"
                                      : "text-muted-foreground/40",
                                  )}
                                />
                                <ChevronDown
                                  className={cn(
                                    "size-3",
                                    header.column.getIsSorted() === "desc"
                                      ? "text-primary font-bold"
                                      : "text-muted-foreground/40",
                                  )}
                                />
                              </span>
                            ) : null}
                          </div>
                        )}
                        {/* Resizer handle for custom column width */}
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={cn(
                              "absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none hover:bg-primary/60 transition-colors",
                              header.column.getIsResizing() ? "bg-primary w-2" : "bg-transparent opacity-0 group-hover/head:opacity-100"
                            )}
                          />
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      "border-border/60 transition-colors",
                      idx % 2 === 1 ? "bg-muted/10" : "bg-card",
                      onRowClick && "cursor-pointer hover:bg-primary/5",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2.5 text-xs font-normal">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-28 text-center text-xs text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination (Clean ERPNext-style Summary & Controls) */}
      <div className="flex flex-col items-center justify-between gap-3 px-1 sm:flex-row">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>
            Menampilkan <strong className="font-semibold text-foreground">{startRow}–{endRow}</strong> dari <strong className="font-semibold text-foreground">{totalRows}</strong> data
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <span className="ml-1 text-primary">({table.getFilteredSelectedRowModel().rows.length} terpilih)</span>
            )}
          </span>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(v) => table.setPageSize(Number(v))}
          >
            <SelectTrigger className="h-8 w-[115px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s} / halaman
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="Halaman pertama"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="px-2 text-xs font-medium text-foreground tabular-nums">
            Hal. {table.getState().pagination.pageIndex + 1} /{" "}
            {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Halaman terakhir"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Helper: kolom checkbox selection untuk DataTable. */
export function selectionColumn<TData>() {
  return {
    id: "select",
    header: ({ table }: { table: any }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Pilih semua"
      />
    ),
    cell: ({ row }: { row: any }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Pilih baris"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 36,
  } as ColumnDef<TData, unknown>;
}
