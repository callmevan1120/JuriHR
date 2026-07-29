"use client";

import * as React from "react";
import { PageHeader } from "@/components/common/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InfoRow } from "@/components/common/info-row";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/states";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DomicileEditor } from "./domicile-editor";
import { EmployeeFormDialog } from "@/components/views/employee-form-dialog";
import { useStore } from "@/hooks/use-store";
import {
  lookupService,
  contractService,
  employeeService,
} from "@/lib/services/master-data";
import {
  formatRupiah,
  formatDateLong,
  formatDateMed,
  formatDateTimeMed,
  formatDuration,
  formatDistance,
  initials,
  haversineKm,
  cn,
} from "@/lib/utils";
import type { Employee } from "@/lib/types";
import { toast } from "sonner";
import {
  Pencil,
  ChevronRight,
  Phone,
  Mail,
  CalendarDays,
  Briefcase,
  Building2,
  Wallet,
  Clock,
  History,
  MapPin,
  FileText,
  Calendar,
  Plane,
  Coffee,
  ScrollText,
  CreditCard,
  User,
  ExternalLink,
  KeyRound,
  Cake,
  Trash2,
} from "lucide-react";

interface Props {
  employee: Employee;
  onEdit: () => void;
  onBack: () => void;
}

export function EmployeeDetail({ employee, onEdit, onBack }: Props) {
  const [tab, setTab] = React.useState("profil");
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState(false);

  const categoryLabels: Record<string, string> = {
    OUTLET: "Karyawan Outlet",
    PH_KLATEN: "Karyawan PH Klaten",
    GUDANG_JAKARTA: "Karyawan Gudang Jakarta",
    NON_OUTLET: "Karyawan HQ",
  };

  const handleOpenEdit = () => {
    setEditOpen(true);
    if (onEdit) onEdit();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-muted-foreground">
          <ChevronRight className="size-4 rotate-180" /> Kembali
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">Detail Karyawan</span>
      </div>

      {/* Header card dengan info utama */}
      <Card className="overflow-hidden border-border shadow-soft">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold shadow-sm">
                {initials(employee.fullName)}
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">{employee.fullName}</h2>
                  <StatusBadge status={employee.status} />
                  <Badge
                    className={cn(
                      employee.category === "OUTLET"
                        ? "bg-primary/15 text-primary-foreground border-primary/30"
                        : "bg-info/15 text-info border-info/30",
                    )}
                  >
                    {categoryLabels[employee.category] || employee.category}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-mono font-bold text-foreground">{employee.nik}</span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="size-3 text-primary" /> {lookupService.positionName(employee.positionId)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="size-3 text-primary" />{" "}
                    {employee.category === "OUTLET"
                      ? lookupService.outletName(employee.primaryOutletId)
                      : employee.category === "PH_KLATEN"
                      ? "Pabrik Produksi PH Klaten"
                      : employee.category === "GUDANG_JAKARTA"
                      ? "Gudang Logistik Jakarta"
                      : "Head Office HQ"}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons: Edit & Hapus */}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleOpenEdit} className="gap-1.5">
                <Pencil className="size-4 text-primary" /> Edit Data Karyawan
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(true)}
                className="gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                <Trash2 className="size-4" /> Hapus Karyawan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="flex w-max gap-1 bg-muted/40 p-1">
            <TabTrigger value="profil" icon={FileText} label="Profil Lengkap" />
            <TabTrigger value="domisili" icon={MapPin} label="Domisili" />
            <TabTrigger value="kontrak" icon={ScrollText} label="Kontrak" />
            <TabTrigger value="jadwal" icon={Calendar} label="Jadwal" />
            <TabTrigger value="absensi" icon={Clock} label="Absensi" />
            <TabTrigger value="cuti" icon={Plane} label="Cuti" />
            <TabTrigger value="lembur" icon={Coffee} label="Lembur" />
            <TabTrigger value="payroll" icon={Wallet} label="Payroll" />
            <TabTrigger value="histori" icon={History} label="Histori" />
          </TabsList>
        </ScrollArea>

        <TabsContent value="profil"><ProfilTab employee={employee} /></TabsContent>
        <TabsContent value="domisili"><DomicileTab employee={employee} /></TabsContent>
        <TabsContent value="kontrak"><KontrakTab employee={employee} /></TabsContent>
        <TabsContent value="jadwal"><JadwalTab employee={employee} /></TabsContent>
        <TabsContent value="absensi"><AbsensiTab employee={employee} /></TabsContent>
        <TabsContent value="cuti"><CutiTab employee={employee} /></TabsContent>
        <TabsContent value="lembur"><LemburTab employee={employee} /></TabsContent>
        <TabsContent value="payroll"><PayrollTab employee={employee} /></TabsContent>
        <TabsContent value="histori"><HistoriTab employee={employee} /></TabsContent>
      </Tabs>

      {/* Edit Form Dialog */}
      <EmployeeFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        data={employee}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        title="Hapus Karyawan?"
        description={`Apakah Anda yakin ingin menghapus data karyawan "${employee.fullName}" (${employee.nik})? Data yang dihapus tidak dapat dikembalikan.`}
        destructive
        confirmLabel="Hapus Karyawan"
        onConfirm={() => {
          employeeService.delete(employee.id);
          toast.success("Karyawan berhasil dihapus");
          window.location.hash = "#/karyawan";
        }}
      />
    </div>
  );
}

function TabTrigger({
  value,
  icon: Icon,
  label,
}: {
  value: string;
  icon: typeof FileText;
  label: string;
}) {
  return (
    <TabsTrigger value={value} className="gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-soft">
      <Icon className="size-3.5" />
      {label}
    </TabsTrigger>
  );
}

// ------------------------------------------------------------
// Tab Profil (REVISI ITEM 5: Flow Vertikal Turun ke Bawah 1 Kolom)
// ------------------------------------------------------------
function ProfilTab({ employee }: { employee: Employee }) {
  const categoryLabels: Record<string, string> = {
    OUTLET: "Karyawan Outlet (Jabodetabek)",
    PH_KLATEN: "Karyawan PH Klaten (Pabrik Produksi)",
    GUDANG_JAKARTA: "Karyawan Gudang Logistik & QC Jakarta",
    NON_OUTLET: "Karyawan HQ / Head Office",
  };

  return (
    <Card className="border-border shadow-soft overflow-hidden">
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <User className="size-4 text-primary" /> Profil Karyawan Terintegrasi
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Rangkuman identitas diri, penempatan kerja, rekening payroll, serta kontrak dalam alur vertikal yang rapi.
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {employee.nik}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Callout Info Kredensial Login v2 */}
        <div className="flex items-center gap-3 rounded-xl border border-info/30 bg-info/5 p-3.5 text-xs text-info dark:text-info-foreground">
          <KeyRound className="size-4 shrink-0 text-info" />
          <span>
            <b>Kredensial Login (Persiapan v2):</b> Email (<code>{employee.email || "—"}</code>) dan Tanggal Lahir (<code>{employee.birthDate ? formatDateLong(employee.birthDate) : "20 Mei 1998"}</code>) akan berfungsi untuk login akun <i>Employee App</i>.
          </span>
        </div>

        {/* Section Vertikal 1: Identitas Diri & Kredensial Login */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-1.5 flex items-center gap-1.5">
            <User className="size-3.5" /> 1. Identitas Diri &amp; Kontak Karyawan
          </h4>
          <div className="divide-y divide-border/60 text-xs bg-muted/10 rounded-xl border border-border/60 px-4">
            <InfoRow label="NIK (Nomor Induk)" value={<span className="font-mono font-bold text-foreground">{employee.nik}</span>} />
            <InfoRow label="Nama Lengkap" value={employee.fullName} />
            <InfoRow
              label="Jenis Kelamin"
              value={employee.gender === "PEREMPUAN" ? "Perempuan" : "Laki-laki"}
            />
            <InfoRow
              label="Status Pernikahan"
              value={
                employee.maritalStatus === "MENIKAH"
                  ? "Menikah"
                  : employee.maritalStatus === "CERAI"
                  ? "Cerai"
                  : "Lajang / Belum Menikah"
              }
            />
            <InfoRow
              label="Tanggal Lahir (Kredensial Login v2)"
              value={
                <span className="inline-flex items-center gap-1 text-foreground font-medium">
                  <Cake className="size-3.5 text-primary" /> {employee.birthDate ? formatDateLong(employee.birthDate) : "20 Mei 1998"}
                </span>
              }
            />
            <InfoRow
              label="Email Perusahaan (Kredensial Login v2)"
              value={
                employee.email ? (
                  <span className="inline-flex items-center gap-1 text-foreground font-mono">
                    <Mail className="size-3.5 text-muted-foreground" /> {employee.email}
                  </span>
                ) : (
                  "—"
                )
              }
            />
            <InfoRow
              label="Telepon / WA"
              value={
                employee.phone ? (
                  <span className="inline-flex items-center gap-1 text-foreground font-mono">
                    <Phone className="size-3.5 text-muted-foreground" /> {employee.phone}
                  </span>
                ) : (
                  "—"
                )
              }
            />
            <InfoRow
              label="Tanggal Bergabung / Mulai Bekerja"
              value={
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <CalendarDays className="size-3.5 text-muted-foreground" /> {formatDateLong(employee.startDate)}
                </span>
              }
            />
          </div>
        </div>

        {/* Section Vertikal 2: Penempatan & Struktur Organisasi */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-1.5 flex items-center gap-1.5">
            <Building2 className="size-3.5" /> 2. Penempatan &amp; Struktur Organisasi
          </h4>
          <div className="divide-y divide-border/60 text-xs bg-muted/10 rounded-xl border border-border/60 px-4">
            <InfoRow
              label="Kategori Karyawan"
              value={
                <Badge variant="outline" className="font-semibold text-primary border-primary/30">
                  {categoryLabels[employee.category] || employee.category}
                </Badge>
              }
            />
            <InfoRow label="Posisi / Jabatan" value={lookupService.positionName(employee.positionId)} />
            <InfoRow label="Divisi" value={lookupService.divisionName(employee.divisionId)} />
            <InfoRow
              label="Penempatan Lokasi Kerja"
              value={
                employee.category === "OUTLET"
                  ? lookupService.outletName(employee.primaryOutletId)
                  : employee.category === "PH_KLATEN"
                  ? "Pabrik Produksi PH Klaten"
                  : employee.category === "GUDANG_JAKARTA"
                  ? "Gudang Logistik & QC Jakarta"
                  : "Head Office (HQ Jakarta)"
              }
            />
            <InfoRow label="Atasan Langsung" value={lookupService.employeeName(employee.supervisorId) || "—"} />
            <InfoRow label="Status Kepegawaian" value={<StatusBadge status={employee.status} />} />
          </div>
        </div>

        {/* Section Vertikal 3: Rekening Bank Payroll */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1.5 flex items-center gap-1.5">
            <CreditCard className="size-3.5 text-primary" /> 3. Data Rekening Bank (Payroll)
          </h4>
          <div className="divide-y divide-border/60 text-xs bg-muted/10 rounded-xl border border-border/60 px-4">
            <InfoRow label="Nama Bank Payroll" value={<span className="font-semibold text-foreground">{employee.bankName || "BCA"}</span>} />
            <InfoRow label="Nomor Rekening" value={<span className="font-mono font-bold text-foreground">{employee.accountNumber || "1234567890"}</span>} />
            <InfoRow label="Atas Nama Rekening" value={employee.accountHolderName || employee.fullName} />
            <InfoRow label="Tipe Skema Gaji" value={employee.salaryType === "BULANAN" ? "Bulanan" : "Harian"} />
            <InfoRow label="Nominal Gaji" value={<span className="font-bold tabular-nums text-foreground">{formatRupiah(employee.salaryAmount)}</span>} />
            <InfoRow
              label="Saldo Cuti Tahunan"
              value={
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Plane className="size-3.5 text-muted-foreground" /> {employee.leaveBalanceDays} hari
                </span>
              }
            />
          </div>
        </div>

        {/* Section Vertikal 4: Kontrak Kerja & Domisili Rumah */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1.5 flex items-center gap-1.5">
            <ScrollText className="size-3.5 text-primary" /> 4. Detail Kontrak Kerja &amp; Lokasi Rumah
          </h4>
          <div className="divide-y divide-border/60 text-xs bg-muted/10 rounded-xl border border-border/60 px-4">
            <InfoRow label="Jenis / Tipe Kontrak" value={<Badge variant="outline">{employee.contractType || "PKWT"}</Badge>} />
            <InfoRow label="Durasi Kontrak" value={`${employee.contractDurationMonths || 12} Bulan`} />
            <InfoRow label="Shift Group" value={lookupService.outletName(employee.shiftGroupId) || "—"} />
            <InfoRow label="Alamat Rumah Lengkap" value={employee.homeAddress || "—"} block />
            <InfoRow
              label="Koordinat Lokasi (LU / LT)"
              value={
                employee.latitude && employee.longitude ? (
                  <span className="font-mono text-xs font-semibold text-foreground">
                    Lat: {employee.latitude.toFixed(5)}, Lon: {employee.longitude.toFixed(5)}
                  </span>
                ) : (
                  "—"
                )
              }
            />
            <InfoRow
              label="Lokasi Google Maps"
              value={
                employee.mapsUrl ? (
                  <a
                    href={employee.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                  >
                    <MapPin className="size-3.5" /> Buka Peta Google Maps <ExternalLink className="size-3.5" />
                  </a>
                ) : (
                  "—"
                )
              }
            />
          </div>
        </div>

        {/* Section Vertikal 5: Catatan Internal HRD & Metadata */}
        <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2">
          <h4 className="text-xs font-semibold text-foreground">Catatan Internal HRD:</h4>
          <p className="text-xs text-muted-foreground">
            {employee.note ? employee.note : "Tidak ada catatan khusus untuk karyawan ini."}
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
            <div>
              <span>Dibuat pada: </span>
              <span className="font-medium text-foreground">{formatDateMed(employee.createdAt)}</span>
            </div>
            <div>
              <span>Terakhir diperbarui: </span>
              <span className="font-medium text-foreground">{formatDateMed(employee.updatedAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------
// Tab Domisili
// ------------------------------------------------------------
function DomicileTab({ employee }: { employee: Employee }) {
  const [editing, setEditing] = React.useState(false);
  return (
    <div className="space-y-4">
      <Card className="border-border shadow-soft overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 bg-muted/15 px-6 py-4">
          <CardTitle className="text-base font-semibold">Alamat Domisili &amp; Pemetaan Lokasi</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
            <Pencil className="size-3.5" /> Edit Domisili
          </Button>
        </CardHeader>
        <div className="p-6">
          <DomicileEditor employee={employee} editing={editing} onClose={() => setEditing(false)} />
        </div>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------
// Tab Kontrak
// ------------------------------------------------------------
function KontrakTab({ employee }: { employee: Employee }) {
  const contracts = useStore((s) => s.contracts.filter((c) => c.employeeId === employee.id).sort((a, b) => b.startDate.localeCompare(a.startDate)));
  if (contracts.length === 0) {
    return <EmptyState title="Belum ada kontrak" description="Karyawan ini belum memiliki kontrak tercatat." />;
  }
  return (
    <div className="space-y-3">
      {contracts.map((c, i) => {
        const reminder = contractService.reminderCategory(c.endDate);
        const isLatest = i === 0;
        return (
          <Card key={c.id} className={cn("border-border shadow-soft", isLatest && "border-primary/40 ring-1 ring-primary/20")}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <span className="font-mono text-sm font-medium text-foreground">{c.contractNo}</span>
                  {isLatest ? <Badge className="bg-primary/15 text-primary-foreground border-primary/30">Terbaru</Badge> : null}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={c.status} />
                  {reminder.bucket !== "aman" && isLatest ? (
                    <Badge variant="outline" className={cn(
                      reminder.bucket === "lewat" ? "border-destructive/40 text-destructive" :
                      reminder.bucket === "3h" || reminder.bucket === "7h" ? "border-destructive/40 text-destructive" :
                      "border-warning/40 text-warning",
                    )}>
                      {reminder.label}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                <InfoRow label="Jenis" value={c.type} />
                <InfoRow label="Periode" value={`${formatDateMed(c.startDate)} — ${formatDateMed(c.endDate)}`} />
                <InfoRow label="Outlet" value={lookupService.outletName(c.outletId)} />
                <InfoRow label="Posisi" value={lookupService.positionName(c.positionId)} />
                <InfoRow label="PJ HRD" value={lookupService.employeeName(c.pjHrdId)} />
                <InfoRow label="Atasan" value={lookupService.employeeName(c.supervisorId)} />
              </div>
              {c.note ? <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">{c.note}</p> : null}
              {c.previousContractId ? (
                <p className="mt-2 text-[11px] text-muted-foreground">↳ Perpanjangan dari kontrak sebelumnya.</p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// Tab Jadwal
// ------------------------------------------------------------
function JadwalTab({ employee }: { employee: Employee }) {
  const schedules = useStore((s) => s.schedules.filter((sc) => sc.employeeId === employee.id).sort((a, b) => a.date.localeCompare(b.date)));
  const shiftTemplates = useStore((s) => s.shiftTemplates);
  if (schedules.length === 0) {
    return <EmptyState title="Belum ada jadwal" description="Karyawan ini belum memiliki jadwal." />;
  }
  return (
    <Card className="border-border shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Jadwal 7 Hari Terakhir</CardTitle>
        <CardDescription className="text-xs">Sumber: shift group &amp; jadwal manual</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {schedules.map((sc) => {
          const shift = shiftTemplates.find((st) => st.id === sc.shiftTemplateId);
          return (
            <div key={sc.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex size-9 flex-col items-center justify-center rounded-lg bg-muted text-center">
                  <span className="text-[9px] font-medium uppercase text-muted-foreground">{new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(new Date(sc.date))}</span>
                  <span className="text-sm font-bold leading-none text-foreground">{sc.date.slice(8)}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{shift ? shift.name : "Libur"}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDateMed(sc.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {shift ? (
                  <Badge variant="outline" className="font-mono text-xs">{shift.startTime}–{shift.endTime}</Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted text-muted-foreground">Libur</Badge>
                )}
                {sc.locked ? <Badge className="bg-muted text-muted-foreground">Terkunci</Badge> : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------
// Tab Absensi
// ------------------------------------------------------------
function AbsensiTab({ employee }: { employee: Employee }) {
  const attendances = useStore((s) => s.attendances.filter((a) => a.employeeId === employee.id).sort((a, b) => b.date.localeCompare(a.date)));
  if (attendances.length === 0) {
    return <EmptyState title="Belum ada absensi" description="Karyawan ini belum memiliki record absensi." />;
  }
  return (
    <Card className="border-border shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Riwayat Absensi</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {attendances.map((a) => (
          <div key={a.id} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 flex-col items-center justify-center rounded-lg bg-muted text-center">
                <span className="text-[9px] font-medium uppercase text-muted-foreground">{new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(new Date(a.date))}</span>
                <span className="text-sm font-bold leading-none text-foreground">{a.date.slice(8)}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{formatDateMed(a.date)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {a.checkIn ? `In: ${a.checkIn.slice(11, 16)}` : "—"} {a.checkOut ? `· Out: ${a.checkOut.slice(11, 16)}` : ""}
                  {a.lateMinutes > 0 ? ` · Telat ${a.lateMinutes}m` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={a.status} />
              {a.deduction > 0 ? <span className="text-xs font-medium text-destructive">-{formatRupiah(a.deduction)}</span> : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------
// Tab Cuti
// ------------------------------------------------------------
function CutiTab({ employee }: { employee: Employee }) {
  const leaves = useStore((s) => s.leaves.filter((l) => l.employeeId === employee.id).sort((a, b) => b.startDate.localeCompare(a.startDate)));
  if (leaves.length === 0) {
    return <EmptyState title="Belum ada pengajuan cuti" description="Karyawan ini belum pernah mengajukan cuti/izin/sakit." />;
  }
  return (
    <Card className="border-border shadow-soft">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Riwayat Cuti / Izin / Sakit</CardTitle>
        <Badge className="bg-primary/15 text-primary-foreground border-primary/30">Saldo: {employee.leaveBalanceDays} hari</Badge>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {leaves.map((l) => (
          <div key={l.id} className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge status={l.type} />
                <span className="text-sm font-medium text-foreground">{formatDateMed(l.startDate)} — {formatDateMed(l.endDate)}</span>
              </div>
              <StatusBadge status={l.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{l.reason}</p>
            {l.approvalNote ? <p className="mt-1 text-[11px] text-muted-foreground">Catatan approval: {l.approvalNote}</p> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------
// Tab Lembur
// ------------------------------------------------------------
function LemburTab({ employee }: { employee: Employee }) {
  const plannings = useStore((s) => s.overtimePlannings.filter((p) => p.employeeIds.includes(employee.id)).sort((a, b) => b.date.localeCompare(a.date)));
  const actuals = useStore((s) => s.overtimeActuals.filter((a) => a.employeeId === employee.id).sort((a, b) => b.date.localeCompare(a.date)));
  if (plannings.length === 0 && actuals.length === 0) {
    return <EmptyState title="Belum ada lembur" description="Karyawan ini belum memiliki record lembur." />;
  }
  return (
    <div className="space-y-4">
      <Card className="border-border shadow-soft">
        <CardHeader className="pb-3"><CardTitle className="text-base">Planning Lembur</CardTitle></CardHeader>
        <CardContent className="divide-y divide-border">
          {plannings.map((p) => (
            <div key={p.id} className="py-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-medium text-foreground">{p.requestNo}</span>
                <StatusBadge status={p.status} />
              </div>
              <p className="mt-1 text-sm text-foreground">{formatDateMed(p.date)} · {p.startTime}–{p.endTime} ({formatDuration(p.durationMinutes)})</p>
              <p className="text-[11px] text-muted-foreground">{p.reason}</p>
            </div>
          ))}
          {plannings.length === 0 ? <p className="py-3 text-center text-xs text-muted-foreground">Tidak ada planning.</p> : null}
        </CardContent>
      </Card>
      <Card className="border-border shadow-soft">
        <CardHeader className="pb-3"><CardTitle className="text-base">Actual Lembur</CardTitle></CardHeader>
        <CardContent className="divide-y divide-border">
          {actuals.map((a) => (
            <div key={a.id} className="py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{formatDateMed(a.date)}</span>
                <StatusBadge status={a.verificationStatus} />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {a.actualStart && a.actualEnd ? `${a.actualStart.slice(11, 16)}–${a.actualEnd.slice(11, 16)}` : "Belum diisi"}
                {a.actualDurationMinutes ? ` · ${formatDuration(a.actualDurationMinutes)}` : ""}
                {!a.planningId ? " · ⚠ Tanpa planning" : ""}
                {a.estimatedNominal > 0 ? ` · ${formatRupiah(a.estimatedNominal)}` : ""}
              </p>
            </div>
          ))}
          {actuals.length === 0 ? <p className="py-3 text-center text-xs text-muted-foreground">Tidak ada actual.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------
// Tab Payroll
// ------------------------------------------------------------
function PayrollTab({ employee }: { employee: Employee }) {
  const periods = useStore((s) => s.payrollPeriods);
  const payrolls = useStore((s) => s.payrolls.filter((p) => p.employeeId === employee.id));
  if (payrolls.length === 0) {
    return <EmptyState title="Belum ada payroll" description="Karyawan ini belum memiliki record payroll." />;
  }
  return (
    <div className="space-y-3">
      {payrolls.map((p) => {
        const period = periods.find((pp) => pp.id === p.periodId);
        return (
          <Card key={p.id} className="border-border shadow-soft">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Periode {period?.period ?? p.periodId}</CardTitle>
              <StatusBadge status={p.status} />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                <InfoRow label="Gaji Dasar" value={<span className="tabular-nums">{formatRupiah(p.baseSalary)}</span>} />
                <InfoRow label="Lembur Terverifikasi" value={<span className="tabular-nums">{formatRupiah(p.overtimeAmount)}</span>} />
                <InfoRow label="Potongan Terlambat" value={<span className="tabular-nums text-destructive">-{formatRupiah(p.lateDeduction)}</span>} />
                <InfoRow label="Tunjangan PH" value={<span className="tabular-nums">{formatRupiah(p.phAllowance)}</span>} />
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span className="text-lg font-bold tabular-nums text-foreground">{formatRupiah(p.total)}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// Tab Histori
// ------------------------------------------------------------
function HistoriTab({ employee }: { employee: Employee }) {
  const histories = useStore((s) => s.changeHistories.filter((h) => h.entityId === employee.id).sort((a, b) => b.changedAt.localeCompare(a.changedAt)));
  if (histories.length === 0) {
    return <EmptyState title="Belum ada histori" description="Belum ada perubahan tercatat untuk karyawan ini." />;
  }
  const entityTypeLabel: Record<string, string> = {
    EMPLOYEE: "Karyawan",
    POSITION: "Posisi",
    DIVISION: "Divisi",
    OUTLET: "Outlet",
    DOMICILE: "Domisili",
    CONTRACT: "Kontrak",
    SALARY: "Gaji",
    SHIFT_GROUP: "Shift Group",
    HOLIDAY_GROUP: "Holiday Group",
    STATUS: "Status",
  };
  const fieldLabel: Record<string, string> = {
    positionId: "Posisi",
    divisionId: "Divisi",
    primaryOutletId: "Outlet Utama",
    status: "Status",
    salaryAmount: "Nominal Gaji",
    shiftGroupId: "Shift Group",
    holidayGroupId: "Holiday Group",
    supervisorId: "Atasan",
  };
  return (
    <Card className="border-border shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="size-4 text-primary" /> Histori Perubahan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4 before:absolute before:left-3 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
          {histories.map((h) => (
            <div key={h.id} className="relative flex gap-4 pl-8">
              <div className="absolute left-0 top-1 flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-[9px] font-bold text-primary-foreground">
                {h.entityType === "SALARY" ? "Rp" : h.entityType.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{entityTypeLabel[h.entityType] ?? h.entityType}</Badge>
                  <span className="text-xs font-medium text-foreground">{fieldLabel[h.field] ?? h.field}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDateTimeMed(h.changedAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {h.oldValue ? <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-destructive line-through">{h.oldValue}</span> : null}
                  {h.newValue ? <span className="rounded bg-success/10 px-1.5 py-0.5 text-success">{h.newValue}</span> : null}
                </div>
                <p className="text-[11px] text-muted-foreground">Oleh: {h.changedBy}{h.reason ? ` · ${h.reason}` : ""}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
