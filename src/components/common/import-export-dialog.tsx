"use client";

import * as React from "react";
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
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const init: Record<string, boolean> = {};
      fields.forEach((f) => {
        init[f.key] = f.defaultChecked;
      });
      setSelectedColumns(init);
      setFileName("");
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
<thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
<tbody><tr>${sampleRow.map((s) => `<td>${s}</td>`).join("")}</tr></tbody>
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

  const handleSimulateImport = () => {
    if (!fileName) {
      toast.error("Pilih file spreadsheet terlebih dahulu.");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (onImport) onImport([]);
      toast.success(`Import data ${moduleTitle} dari file "${fileName}" berhasil diproses!`);
      onOpenChange(false);
    }, 1000);
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
                  if (e.target.files && e.target.files[0]) setFileName(e.target.files[0].name);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/80 p-4 bg-muted/20">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl text-xs">Batal</Button>
          <Button onClick={handleSimulateImport} disabled={isProcessing || !fileName} className="rounded-xl font-semibold text-xs gap-1.5 px-5">
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
<thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
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
