"use client";

import * as React from "react";

/** Escape HTML special characters to prevent XSS in Excel HTML export. */
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Upload,
  Download,
  FileSpreadsheet,
  SlidersHorizontal,
  X,
} from "lucide-react";

export interface ImportExportField {
  key: string;
  label: string;
  priority: "wajib" | "disarankan" | "opsional";
  defaultChecked: boolean;
  sampleValue: string;
}

interface UniversalImportDialogProps {
  moduleTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: ImportExportField[];
  onImport?: (data: Record<string, any>[]) => void;
}

interface UniversalExportDialogProps {
  moduleTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: ImportExportField[];
  exportData?: Record<string, any>[];
}

// ------------------------------------------------------------
// 1. Separate Universal Import Dialog
// ------------------------------------------------------------

/** Parser CSV sederhana: handle quote, koma dalam quote, BOM, newline. */
function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\ufeff/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') { cell += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && clean[i + 1] === "\n") i++;
        row.push(cell); cell = "";
        if (row.length > 0 && row.some((c) => c !== "")) { rows.push(row); }
        row = [];
      } else {
        cell += ch;
      }
    }
  }
  if (cell !== "" || row.length > 0) { row.push(cell); if (row.some((c) => c !== "")) rows.push(row); }
  return rows;
}

/** Parser HTML table untuk file .xls yang sebenarnya adalah HTML. */
function parseHtmlTable(html: string): { headers: string[]; rows: string[][] } {
  const cleanCell = (s: string) => s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
  const thMatch = [...html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)];
  const headers = thMatch.map((m) => cleanCell(m[1]!));
  const trMatches = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const rows: string[][] = [];
  for (const tr of trMatches) {
    const tdMatches = [...tr[1]!.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)];
    if (tdMatches.length === 0) continue;
    const cells = tdMatches.map((m) => cleanCell(m[1]!));
    // Skip header row (already captured)
    if (cells.every((c, i) => headers[i] && c === headers[i])) continue;
    rows.push(cells);
  }
  return { headers, rows };
}

export function UniversalImportDialog({
  moduleTitle,
  open,
  onOpenChange,
  fields,
  onImport,
}: UniversalImportDialogProps) {
  const [fileFormat, setFileFormat] = React.useState<"excel" | "csv">("excel");
  const [selectedColumns, setSelectedColumns] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    fields.forEach((f) => {
      init[f.key] = f.defaultChecked;
    });
    return init;
  });

  const [fileName, setFileName] = React.useState<string>("");
  const [fileObj, setFileObj] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const init: Record<string, boolean> = {};
      fields.forEach((f) => {
        init[f.key] = f.defaultChecked;
      });
      setSelectedColumns(init);
      setFileName("");
      setFileObj(null);
      setIsProcessing(false);
    }
  }, [open, fields]);

  const toggleAll = (checked: boolean) => {
    const updated: Record<string, boolean> = {};
    fields.forEach((f) => {
      updated[f.key] = checked;
    });
    setSelectedColumns(updated);
  };

  const handleDownloadTemplate = () => {
    const activeFields = fields.filter((f) => selectedColumns[f.key]);
    if (activeFields.length === 0) {
      toast.error("Pilih minimal 1 kolom untuk mengunduh template.");
      return;
    }

    const headers = activeFields.map((f) => f.label);
    const sampleRow = activeFields.map((f) => f.sampleValue);

    if (fileFormat === "excel") {
      const htmlTable = `\ufeff<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Template ${moduleTitle}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head>
<body>
<table>
<thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
<tbody><tr>${sampleRow.map((s) => `<td>${escapeHtml(s)}</td>`).join("")}</tr></tbody>
</table>
</body>
</html>`;

      const blob = new Blob([htmlTable], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template_import_${moduleTitle.toLowerCase().replace(/\s+/g, "_")}.xls`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const csvContent = [headers.join(","), sampleRow.map((c) => `"${c}"`).join(",")].join("\n");
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template_import_${moduleTitle.toLowerCase().replace(/\s+/g, "_")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast.success(`Template ${fileFormat.toUpperCase()} ${moduleTitle} diunduh!`);
  };

  const handleImport = async () => {
    if (!fileObj) {
      toast.error("Pilih file spreadsheet terlebih dahulu.");
      return;
    }
    setIsProcessing(true);
    try {
      const text = await fileObj.text();
      const isHtml = text.includes("<table") || text.includes("<Table");
      let headers: string[] = [];
      let rows: string[][] = [];

      if (isHtml) {
        const parsed = parseHtmlTable(text);
        headers = parsed.headers;
        rows = parsed.rows;
      } else {
        const parsed = parseCsv(text);
        headers = parsed[0] ?? [];
        rows = parsed.slice(1);
      }

      if (rows.length === 0) {
        toast.error("File tidak berisi data. Pastikan file memiliki header dan minimal 1 baris data.");
        setIsProcessing(false);
        return;
      }

      // Map header labels → field keys
      const labelToKey = new Map<string, string>();
      fields.forEach((f) => {
        labelToKey.set(f.label.trim().toLowerCase(), f.key);
        labelToKey.set(f.key.trim().toLowerCase(), f.key);
      });

      const selectedKeys = new Set(fields.filter((f) => selectedColumns[f.key]).map((f) => f.key));
      const colKeyMap: (string | null)[] = headers.map((h) => {
        const key = labelToKey.get(h.trim().toLowerCase());
        return key && selectedKeys.has(key) ? key : null;
      });

      const dataRows: Record<string, string>[] = rows
        .filter((row) => row.some((c) => c.trim() !== ""))
        .map((row) => {
          const obj: Record<string, string> = {};
          colKeyMap.forEach((key, i) => {
            if (key) obj[key] = (row[i] ?? "").trim();
          });
          return obj;
        });

      if (dataRows.length === 0) {
        toast.error("Tidak ada baris yang valid. Pastikan header kolom sesuai template.");
        setIsProcessing(false);
        return;
      }

      if (onImport) {
        onImport(dataRows);
        toast.success(`${dataRows.length} data ${moduleTitle} berhasil diimport dari file "${fileName}"!`);
      } else {
        toast.warning(`Import berhasil diparse (${dataRows.length} baris), tetapi handler import belum dikonfigurasi untuk modul ini.`);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(`Gagal memproses file: ${err instanceof Error ? err.message : "kesalahan tidak diketahui"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-[540px] w-[92vw] max-h-[90vh] overflow-y-auto rounded-2xl p-0 shadow-2xl border-border bg-card">
        <div className="flex items-center justify-between border-b border-border/80 p-4 bg-muted/20 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Upload className="size-5 text-info" />
            <DialogTitle className="text-base font-bold text-foreground">Import Data — {moduleTitle}</DialogTitle>
          </div>
          <Button variant="ghost" size="icon" className="size-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => onOpenChange(false)}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <SlidersHorizontal className="size-3.5 text-primary" /> Pilih Kolom Mana Saja yang Ingin Di-Import:
            </span>
            <div className="flex items-center gap-2 text-xs">
              <button type="button" onClick={() => toggleAll(true)} className="text-primary hover:underline font-bold">Pilih Semua</button>
              <span className="text-muted-foreground">•</span>
              <button type="button" onClick={() => toggleAll(false)} className="text-muted-foreground hover:underline">Batal</button>
            </div>
          </div>

          {/* Kolom dengan Warna Font Sesuai Prioritas (Wajib=Destructive Red, Disarankan=Amber, Opsional=Muted) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto rounded-xl border border-border/80 p-3 bg-muted/20">
            {fields.map((f) => (
              <label
                key={f.key}
                className="flex items-center gap-2.5 rounded-lg p-2 border border-border/60 bg-background hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={!!selectedColumns[f.key]}
                  onCheckedChange={(checked) =>
                    setSelectedColumns((prev) => ({ ...prev, [f.key]: !!checked }))
                  }
                  className="size-4"
                />
                <span
                  className={`text-xs truncate ${
                    f.priority === "wajib"
                      ? "text-destructive font-bold"
                      : f.priority === "disarankan"
                      ? "text-amber-600 dark:text-amber-400 font-semibold"
                      : "text-muted-foreground font-normal"
                  }`}
                >
                  {f.label}
                  {f.priority === "wajib" && <span className="text-destructive font-bold ml-0.5">*</span>}
                </span>
              </label>
            ))}
          </div>

          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Unduh File Template Kustom:</span>
              <div className="flex items-center gap-2">
                <Select value={fileFormat} onValueChange={(v) => setFileFormat(v as any)}>
                  <SelectTrigger className="h-8 w-24 text-xs rounded-xl bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xls)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="h-8 gap-1.5 text-xs rounded-xl font-semibold">
                  <Download className="size-3.5 text-primary" /> Download Template
                </Button>
              </div>
            </div>

            <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 py-6 px-4 text-center hover:bg-muted/40 transition-colors">
              <FileSpreadsheet className="size-8 text-primary/70 mb-2" />
              <p className="text-xs font-bold text-foreground">
                {fileName ? `File Terpilih: ${fileName}` : "Unggah File Spreadsheet Terisi"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Format Excel (.xls / .xlsx) atau CSV (.csv)</p>
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFileObj(e.target.files[0]);
                    setFileName(e.target.files[0].name);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/80 p-4 bg-muted/20">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl text-xs">Batal</Button>
          <Button onClick={handleImport} disabled={isProcessing || !fileObj} className="rounded-xl font-semibold text-xs gap-1.5 px-5">
            <Upload className="size-4" /> {isProcessing ? "Memproses..." : "Proses Import Data"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// 2. Separate Universal Export Dialog
// ------------------------------------------------------------
export function UniversalExportDialog({
  moduleTitle,
  open,
  onOpenChange,
  fields,
  exportData = [],
}: UniversalExportDialogProps) {
  const [fileFormat, setFileFormat] = React.useState<"excel" | "csv">("excel");
  const [selectedColumns, setSelectedColumns] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    fields.forEach((f) => {
      init[f.key] = f.defaultChecked;
    });
    return init;
  });

  React.useEffect(() => {
    if (open) {
      const init: Record<string, boolean> = {};
      fields.forEach((f) => {
        init[f.key] = f.defaultChecked;
      });
      setSelectedColumns(init);
    }
  }, [open, fields]);

  const toggleAll = (checked: boolean) => {
    const updated: Record<string, boolean> = {};
    fields.forEach((f) => {
      updated[f.key] = checked;
    });
    setSelectedColumns(updated);
  };

  const handleExportData = () => {
    const activeFields = fields.filter((f) => selectedColumns[f.key]);
    if (activeFields.length === 0) {
      toast.error("Pilih minimal 1 kolom untuk di-export.");
      return;
    }

    const headers = activeFields.map((f) => f.label);
    const rows = exportData.map((dataRow) =>
      activeFields.map((f) => String(dataRow[f.key] ?? ""))
    );

    if (fileFormat === "excel") {
      const htmlTable = `\ufeff<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Export ${moduleTitle}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head>
<body>
<table>
<thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}</tbody>
</table>
</body>
</html>`;

      const blob = new Blob([htmlTable], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_${moduleTitle.toLowerCase().replace(/\s+/g, "_")}.xls`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_${moduleTitle.toLowerCase().replace(/\s+/g, "_")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast.success(`${rows.length} data ${moduleTitle} berhasil diekspor ke ${fileFormat.toUpperCase()}!`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-[540px] w-[92vw] max-h-[90vh] overflow-y-auto rounded-2xl p-0 shadow-2xl border-border bg-card">
        <div className="flex items-center justify-between border-b border-border/80 p-4 bg-muted/20 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Download className="size-5 text-primary" />
            <DialogTitle className="text-base font-bold text-foreground">Export Data — {moduleTitle}</DialogTitle>
          </div>
          <Button variant="ghost" size="icon" className="size-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => onOpenChange(false)}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <SlidersHorizontal className="size-3.5 text-primary" /> Pilih Kolom Yang Ingin Diekspor:
            </span>
            <div className="flex items-center gap-2 text-xs">
              <button type="button" onClick={() => toggleAll(true)} className="text-primary hover:underline font-bold">Pilih Semua</button>
              <span className="text-muted-foreground">•</span>
              <button type="button" onClick={() => toggleAll(false)} className="text-muted-foreground hover:underline">Batal</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto rounded-xl border border-border/80 p-3 bg-muted/20">
            {fields.map((f) => (
              <label
                key={f.key}
                className="flex items-center gap-2.5 rounded-lg p-2 border border-border/60 bg-background hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={!!selectedColumns[f.key]}
                  onCheckedChange={(checked) =>
                    setSelectedColumns((prev) => ({ ...prev, [f.key]: !!checked }))
                  }
                  className="size-4"
                />
                <span className="text-xs font-semibold text-foreground truncate">{f.label}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <span className="text-xs font-bold text-foreground">Pilih Format File Export:</span>
            <Select value={fileFormat} onValueChange={(v) => setFileFormat(v as any)}>
              <SelectTrigger className="h-8 w-32 text-xs rounded-xl bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xls)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            Siap mengekspor <strong className="text-foreground">{exportData.length}</strong> data {moduleTitle} dengan format <strong>{fileFormat.toUpperCase()}</strong>.
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/80 p-4 bg-muted/20">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl text-xs">Batal</Button>
          <Button onClick={handleExportData} className="rounded-xl font-semibold text-xs gap-1.5 px-5">
            <Download className="size-4" /> Export ke {fileFormat.toUpperCase()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
