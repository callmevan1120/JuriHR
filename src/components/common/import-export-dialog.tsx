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
import { Badge } from "@/components/ui/badge";
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
  CheckCircle2,
  SlidersHorizontal,
  FileText,
} from "lucide-react";

export interface ImportExportField {
  key: string;
  label: string;
  priority: "wajib" | "disarankan" | "opsional";
  defaultChecked: boolean;
  sampleValue: string;
}

interface UniversalImportExportDialogProps {
  moduleTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: ImportExportField[];
  exportData?: Record<string, any>[];
  onImport?: (data: Record<string, any>[]) => void;
}

export function UniversalImportExportDialog({
  moduleTitle,
  open,
  onOpenChange,
  fields,
  exportData = [],
  onImport,
}: UniversalImportExportDialogProps) {
  const [activeTab, setActiveTab] = React.useState<"export" | "import">("export");
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
      a.download = `template_${moduleTitle.toLowerCase().replace(/\s+/g, "_")}.xls`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const csvContent = [headers.join(","), sampleRow.map((c) => `"${c}"`).join(",")].join("\n");
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template_${moduleTitle.toLowerCase().replace(/\s+/g, "_")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast.success(`Template ${fileFormat.toUpperCase()} ${moduleTitle} berhasil diunduh!`);
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

    toast.success(`${rows.length} data ${moduleTitle} berhasil diekspor!`);
    onOpenChange(false);
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
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[620px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="size-5 text-primary" /> Import &amp; Export Data — {moduleTitle}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Format spreadsheet Excel (.xls) &amp; CSV dengan penanda tingkat prioritas pengisian field.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher Export vs Import */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="inline-flex rounded-xl bg-muted/60 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("export")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all ${
                activeTab === "export" ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground"
              }`}
            >
              <Download className="size-3.5 text-primary" /> Export Data
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("import")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all ${
                activeTab === "import" ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground"
              }`}
            >
              <Upload className="size-3.5 text-info" /> Import Data
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Format:</span>
            <Select value={fileFormat} onValueChange={(v) => setFileFormat(v as any)}>
              <SelectTrigger className="h-8 w-28 text-xs rounded-xl bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xls)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4 py-2">
          {/* Column selector with priority badges */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <SlidersHorizontal className="size-3.5 text-primary" /> Pilih Kolom ({fields.filter((f) => selectedColumns[f.key]).length} terpilih)
              </span>
              <div className="flex items-center gap-2 text-xs">
                <button type="button" onClick={() => toggleAll(true)} className="text-primary hover:underline font-medium">Pilih Semua</button>
                <span className="text-muted-foreground">•</span>
                <button type="button" onClick={() => toggleAll(false)} className="text-muted-foreground hover:underline">Reset</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto rounded-xl border border-border/80 p-3 bg-muted/20 text-xs">
              {fields.map((f) => (
                <label
                  key={f.key}
                  className="flex items-center justify-between gap-2 rounded-lg p-2 border border-border/60 bg-background hover:bg-muted/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Checkbox
                      checked={!!selectedColumns[f.key]}
                      onCheckedChange={(checked) =>
                        setSelectedColumns((prev) => ({ ...prev, [f.key]: !!checked }))
                      }
                      className="size-4"
                    />
                    <span className="text-foreground font-semibold text-xs truncate">{f.label}</span>
                  </div>

                  {f.priority === "wajib" ? (
                    <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[9px] font-bold shrink-0">🔴 Wajib</Badge>
                  ) : f.priority === "disarankan" ? (
                    <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[9px] font-bold shrink-0">🟡 Disarankan</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-muted/40 text-muted-foreground text-[9px] shrink-0">⚪ Opsional</Badge>
                  )}
                </label>
              ))}
            </div>
          </div>

          {activeTab === "import" ? (
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Unduh File Template Kustom:</span>
                <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="h-8 gap-1.5 text-xs rounded-xl">
                  <Download className="size-3.5 text-primary" /> Unduh Template ({fileFormat.toUpperCase()})
                </Button>
              </div>

              <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 py-6 px-4 text-center hover:bg-muted/40 transition-colors">
                <FileSpreadsheet className="size-8 text-primary/70 mb-2" />
                <p className="text-xs font-bold text-foreground">
                  {fileName ? `File terpilih: ${fileName}` : "Unggah File Spreadsheet Terisi"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Format .xls / .csv sesuai kolom di atas</p>
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
          ) : (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-center justify-between">
              <span>Siap mengekspor <strong>{exportData.length}</strong> data {moduleTitle} ke format {fileFormat.toUpperCase()}.</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Batal</Button>
          {activeTab === "export" ? (
            <Button onClick={handleExportData} className="rounded-xl font-semibold gap-1.5">
              <Download className="size-4" /> Export ke {fileFormat.toUpperCase()}
            </Button>
          ) : (
            <Button onClick={handleSimulateImport} disabled={isProcessing || !fileName} className="rounded-xl font-semibold gap-1.5">
              <Upload className="size-4" /> {isProcessing ? "Memproses..." : "Proses Import Data"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
