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
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ChevronDown,
  ChevronUp,
  Settings,
  GripVertical,
  Trash2,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Key unik tabel untuk menyimpan visibilitas & ukuran kolom per user di localStorage */
  tableKey?: string;
  /** Akses ke nilai untuk search global. */
  globalFilterFn?: (row: TData, query: string) => boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData) => string;
  toolbar?: React.ReactNode;
  bulkActions?: (selectedRows: TData[]) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  tableKey,
  globalFilterFn,
  searchPlaceholder = "Cari data...",
  pageSize = 10,
  onRowClick,
  getRowId,
  toolbar,
  bulkActions,
  emptyMessage = "Tidak ada data ditemukan.",
  className,
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

  const [stickyColumns, setStickyColumns] = React.useState<Record<string, boolean>>(() => {
    if (tableKey && typeof window !== "undefined") {
      const saved = localStorage.getItem(`juri_table_sticky_${tableKey}`);
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

  const [configDialogOpen, setConfigDialogOpen] = React.useState(false);
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

  const handleStickyChange = (colId: string, val: boolean) => {
    setStickyColumns((prev) => {
      const next = { ...prev, [colId]: val };
      if (tableKey && typeof window !== "undefined") {
        localStorage.setItem(`juri_table_sticky_${tableKey}`, JSON.stringify(next));
      }
      return next;
    });
  };

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

  const visibleCols = table.getAllColumns().filter((c) => c.getCanHide() && c.getIsVisible());
  const hiddenCols = table.getAllColumns().filter((c) => c.getCanHide() && !c.getIsVisible());

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

          {/* ERPNext Configure Columns Gear Icon Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfigDialogOpen(true)}
            className="h-9 gap-1.5 text-xs font-semibold rounded-xl border-border/80 hover:bg-muted/50"
            title="Configure Columns (Pengaturan Kolom Tabel)"
          >
            <Settings className="size-4 text-primary" />
            <span>Pengaturan Kolom</span>
          </Button>

          {/* ERPNext Configure Columns Dialog (Matching User Image) */}
          <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
            <DialogContent className="max-w-[540px] w-[95vw] p-0 rounded-2xl border-border bg-card shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/80 p-4 bg-muted/20">
                <DialogTitle className="text-base font-bold text-foreground">Configure Columns</DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={() => setConfigDialogOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="p-4 space-y-3">
                {/* Headers: Fieldname, Column Width, Sticky, Action */}
                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-muted-foreground px-2 pb-1 border-b border-border/60">
                  <div className="col-span-6">Fieldname</div>
                  <div className="col-span-3 text-center">Column Width</div>
                  <div className="col-span-2 text-center">Sticky</div>
                  <div className="col-span-1 text-right"></div>
                </div>

                {/* Visible Column Rows */}
                <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                  {visibleCols.map((col) => {
                    const label = typeof col.columnDef.header === "string" ? col.columnDef.header : col.id;
                    return (
                      <div
                        key={col.id}
                        className="grid grid-cols-12 gap-2 items-center rounded-xl border border-border/60 bg-muted/20 px-2.5 py-2 hover:bg-muted/40 transition-colors"
                      >
                        <div className="col-span-6 flex items-center gap-2 min-w-0">
                          <GripVertical className="size-4 text-muted-foreground cursor-grab shrink-0" />
                          <span className="text-xs font-bold text-foreground truncate">{label}</span>
                        </div>
                        <div className="col-span-3 flex justify-center">
                          <Input
                            type="number"
                            min={80}
                            max={600}
                            value={col.getSize()}
                            onChange={(e) => {
                              const val = Math.min(600, Math.max(80, Number(e.target.value) || 150));
                              handleColumnSizingChange((prev) => ({
                                ...prev,
                                [col.id]: val,
                              }));
                            }}
                            className="h-7 w-20 px-2 text-center font-mono font-bold text-xs rounded-lg bg-background"
                          />
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <Checkbox
                            checked={!!stickyColumns[col.id]}
                            onCheckedChange={(val) => handleStickyChange(col.id, !!val)}
                            className="size-4"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive rounded-lg"
                            onClick={() => col.toggleVisibility(false)}
                            title="Hapus Kolom Dari Tampilan"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add / Remove Columns Link at Bottom Left */}
                {hiddenCols.length > 0 && (
                  <div className="pt-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <Plus className="size-3.5" /> Add / Remove Columns ({hiddenCols.length} tersembunyi)
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-[240px] p-2 space-y-1 rounded-xl shadow-lg">
                        <div className="text-[11px] font-bold text-muted-foreground mb-1 px-1">Tambah Kolom:</div>
                        {hiddenCols.map((col) => (
                          <label key={col.id} className="flex items-center gap-2 rounded-lg p-1.5 text-xs hover:bg-muted/40 cursor-pointer">
                            <Checkbox checked={col.getIsVisible()} onCheckedChange={(v) => col.toggleVisibility(!!v)} className="size-3.5" />
                            <span className="font-semibold text-foreground">{typeof col.columnDef.header === "string" ? col.columnDef.header : col.id}</span>
                          </label>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {/* Dialog Footer */}
              <div className="flex items-center justify-between border-t border-border/80 p-4 bg-muted/20">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-semibold"
                  onClick={() => {
                    table.getAllColumns().forEach((c) => c.toggleVisibility(true));
                    table.resetColumnSizing();
                    setStickyColumns({});
                    if (tableKey && typeof window !== "undefined") {
                      localStorage.removeItem(`juri_table_vis_${tableKey}`);
                      localStorage.removeItem(`juri_table_sizes_${tableKey}`);
                      localStorage.removeItem(`juri_table_sticky_${tableKey}`);
                    }
                  }}
                >
                  Reset to default
                </Button>

                <Button
                  size="sm"
                  className="rounded-xl text-xs font-bold px-6"
                  onClick={() => {
                    toast.success("Pengaturan kolom berhasil disimpan");
                    setConfigDialogOpen(false);
                  }}
                >
                  Update
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-border shadow-xs bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/60">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    const isSorted = header.column.getIsSorted();
                    const isSticky = !!stickyColumns[header.column.id];
                    return (
                      <TableHead
                        key={header.id}
                        style={{
                          width: header.getSize() !== 150 ? header.getSize() : undefined,
                          position: isSticky ? "sticky" : undefined,
                          left: isSticky ? 0 : undefined,
                          zIndex: isSticky ? 10 : undefined,
                        }}
                        className={cn(
                          "relative select-none text-xs font-bold text-foreground py-3.5 border-b border-border/80",
                          isSticky && "bg-muted/90 backdrop-blur-xs shadow-xs"
                        )}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center gap-1.5",
                              header.column.getCanSort() &&
                                "cursor-pointer select-none hover:text-primary",
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {isSorted === "asc" ? (
                              <ChevronUp className="size-3.5 text-primary" />
                            ) : isSorted === "desc" ? (
                              <ChevronDown className="size-3.5 text-primary" />
                            ) : null}
                          </div>
                        )}

                        {/* Column Resizer Handle */}
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={cn(
                              "absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none hover:bg-primary/50",
                              header.column.getIsResizing() ? "bg-primary" : "bg-transparent"
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
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "transition-colors hover:bg-muted/40",
                      onRowClick && "cursor-pointer",
                    )}
                    onClick={() => onRowClick && onRowClick(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isSticky = !!stickyColumns[cell.column.id];
                      return (
                        <TableCell
                          key={cell.id}
                          style={{
                            width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined,
                            position: isSticky ? "sticky" : undefined,
                            left: isSticky ? 0 : undefined,
                            zIndex: isSticky ? 5 : undefined,
                          }}
                          className={cn(
                            "py-3 text-xs border-b border-border/40",
                            isSticky && "bg-card backdrop-blur-xs font-semibold shadow-xs"
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-xs text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Tampilkan</span>
          <Select
            value={String(currentLimit)}
            onValueChange={(val) => table.setPageSize(Number(val))}
          >
            <SelectTrigger className="h-8 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>
            {totalRows > 0
              ? `Menampilkan ${startRow}–${endRow} dari ${totalRows} data`
              : "0 data"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title="Halaman Pertama"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <span className="px-2 text-xs font-medium text-foreground">
            Halaman {pageIndex + 1} dari {table.getPageCount() || 1}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Halaman Selanjutnya"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            title="Halaman Terakhir"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function selectionColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Pilih semua"
        className="translate-y-0.5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Pilih baris"
        className="translate-y-0.5"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  };
}
