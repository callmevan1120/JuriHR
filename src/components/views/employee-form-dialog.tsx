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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FormRow } from "@/components/common/field";
import { useStore } from "@/hooks/use-store";
import { employeeService } from "@/lib/services/master-data";
import { todayISODate } from "@/lib/utils";
import type { Employee, EmployeeCategory, EmployeeStatus, SalaryType } from "@/lib/types";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  User,
  Hash,
  AlertCircle,
  Building2,
  CreditCard,
  FileText,
  MapPin,
  Calendar,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: "create" | "edit";
  data?: Employee;
}

export function EmployeeFormDialog({ open, onOpenChange, mode, data }: Props) {
  const positions = useStore((s) => s.positions);
  const divisions = useStore((s) => s.divisions);
  const outlets = useStore((s) => s.outlets);
  const shiftGroups = useStore((s) => s.shiftGroups);
  const holidayGroups = useStore((s) => s.holidayGroups);
  const employees = useStore((s) => s.employees);

  const [nik, setNik] = React.useState(data?.nik ?? "");
  const [fullName, setFullName] = React.useState(data?.fullName ?? "");
  const [phone, setPhone] = React.useState(data?.phone ?? "");
  const [email, setEmail] = React.useState(data?.email ?? "");
  const [startDate, setStartDate] = React.useState(data?.startDate ?? todayISODate());
  const [category, setCategory] = React.useState<EmployeeCategory>(data?.category ?? "OUTLET");
  const [positionId, setPositionId] = React.useState(data?.positionId ?? "");
  const [divisionId, setDivisionId] = React.useState(data?.divisionId ?? "");
  const [primaryOutletId, setPrimaryOutletId] = React.useState(data?.primaryOutletId ?? "");
  const [status, setStatus] = React.useState<EmployeeStatus>(data?.status ?? "AKTIF");
  const [salaryType, setSalaryType] = React.useState<SalaryType>(data?.salaryType ?? "BULANAN");
  const [salaryAmount, setSalaryAmount] = React.useState(String(data?.salaryAmount ?? 0));
  const [shiftGroupId, setShiftGroupId] = React.useState(data?.shiftGroupId ?? "");
  const [holidayGroupId, setHolidayGroupId] = React.useState(data?.holidayGroupId ?? "");
  const [leaveBalance, setLeaveBalance] = React.useState(String(data?.leaveBalanceDays ?? 12));
  const [supervisorId, setSupervisorId] = React.useState(data?.supervisorId ?? "");
  const [note, setNote] = React.useState(data?.note ?? "");
  
  // Data Bank & Rekening
  const [bankName, setBankName] = React.useState(data?.bankName ?? "BCA");
  const [accountNumber, setAccountNumber] = React.useState(data?.accountNumber ?? "");
  const [accountHolderName, setAccountHolderName] = React.useState(data?.accountHolderName ?? "");
  
  // Kontrak & Domisili
  const [contractType, setContractType] = React.useState(data?.contractType ?? "PKWT");
  const [contractDurationMonths, setContractDurationMonths] = React.useState(String(data?.contractDurationMonths ?? 12));
  const [homeAddress, setHomeAddress] = React.useState(data?.homeAddress ?? "");
  const [mapsUrl, setMapsUrl] = React.useState(data?.mapsUrl ?? "");

  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    if (!open) return;
    setNik(data?.nik ?? "");
    setFullName(data?.fullName ?? "");
    setPhone(data?.phone ?? "");
    setEmail(data?.email ?? "");
    setStartDate(data?.startDate ?? todayISODate());
    setCategory(data?.category ?? "OUTLET");
    setPositionId(data?.positionId ?? "");
    setDivisionId(data?.divisionId ?? "");
    setPrimaryOutletId(data?.primaryOutletId ?? "");
    setStatus(data?.status ?? "AKTIF");
    setSalaryType(data?.salaryType ?? "BULANAN");
    setSalaryAmount(String(data?.salaryAmount ?? 0));
    setShiftGroupId(data?.shiftGroupId ?? "");
    setHolidayGroupId(data?.holidayGroupId ?? "");
    setLeaveBalance(String(data?.leaveBalanceDays ?? 12));
    setSupervisorId(data?.supervisorId ?? "");
    setNote(data?.note ?? "");
    setBankName(data?.bankName ?? "BCA");
    setAccountNumber(data?.accountNumber ?? "");
    setAccountHolderName(data?.accountHolderName ?? data?.fullName ?? "");
    setContractType(data?.contractType ?? "PKWT");
    setContractDurationMonths(String(data?.contractDurationMonths ?? 12));
    setHomeAddress(data?.homeAddress ?? "");
    setMapsUrl(data?.mapsUrl ?? "");
    setError(undefined);
  }, [open, data]);

  // Kategori filter posisi & divisi
  const filteredPositions = positions.filter((p) => p.status === "active");
  const filteredDivisions = divisions.filter((d) => d.status === "active");
  const filteredOutlets = outlets.filter((o) => o.status === "active");

  const supervisorCandidates = employees.filter((e) => e.status === "AKTIF" && e.id !== data?.id);

  const submit = () => {
    if (!nik.trim() || !fullName.trim()) {
      setError("NIK dan nama lengkap wajib diisi.");
      return;
    }
    if (!positionId) {
      setError("Posisi wajib dipilih.");
      return;
    }
    if (!divisionId) {
      setError("Divisi wajib dipilih.");
      return;
    }
    // Jika Karyawan Outlet, wajib memilih outlet
    if (category === "OUTLET" && !primaryOutletId) {
      setError("Penempatan outlet wajib dipilih untuk Karyawan Outlet.");
      return;
    }
    
    // Cek NIK unik
    const dup = employees.find((e) => e.nik === nik.trim() && e.id !== data?.id);
    if (dup) {
      setError(`NIK "${nik.trim()}" sudah digunakan oleh ${dup.fullName}.`);
      return;
    }

    const payload: Partial<Employee> = {
      nik: nik.trim(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      startDate,
      category,
      positionId,
      divisionId,
      // Sembunyikan/kosongkan outlet bila bukan karyawan outlet
      primaryOutletId: category === "OUTLET" ? primaryOutletId : undefined,
      status,
      salaryType,
      salaryAmount: Number(salaryAmount) || 0,
      shiftGroupId: shiftGroupId || undefined,
      holidayGroupId: holidayGroupId || undefined,
      leaveBalanceDays: Number(leaveBalance) || 0,
      supervisorId: supervisorId || undefined,
      note: note.trim() || undefined,
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountHolderName: accountHolderName.trim() || fullName.trim(),
      contractType,
      contractDurationMonths: Number(contractDurationMonths) || 12,
      homeAddress: homeAddress.trim() || undefined,
      mapsUrl: mapsUrl.trim() || undefined,
    };

    if (mode === "edit" && data) {
      employeeService.update(data.id, payload);
      toast.success("Data karyawan berhasil diperbarui");
    } else {
      employeeService.create(payload as any);
      toast.success("Karyawan baru berhasil ditambahkan");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <User className="size-5 text-primary" />
            {mode === "edit" ? "Edit Data Karyawan" : "Tambah Karyawan Baru"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Lengkapi profil, kategori penempatan, rekening bank, serta detail kontrak kerja karyawan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Section 1: Kategori & Penempatan Lokasi */}
          <section className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-primary flex items-center gap-1.5">
              <Building2 className="size-4" /> Kategori &amp; Lokasi Penempatan
            </h3>
            
            <FormRow>
              <Field label="Kategori Karyawan" required hint="Tentukan jenis lokasi kerja utama karyawan">
                <Select
                  value={category}
                  onValueChange={(v) => {
                    const newCat = v as EmployeeCategory;
                    setCategory(newCat);
                    // Reset outlet id bila pindah ke non-outlet
                    if (newCat !== "OUTLET") setPrimaryOutletId("");
                  }}
                >
                  <SelectTrigger className="bg-background font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OUTLET">Karyawan Outlet (Jabodetabek)</SelectItem>
                    <SelectItem value="PH_KLATEN">Karyawan PH Klaten (Pabrik Produksi)</SelectItem>
                    <SelectItem value="GUDANG_JAKARTA">Karyawan Gudang Jakarta</SelectItem>
                    <SelectItem value="NON_OUTLET">Karyawan HQ / Head Office</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Status Kepegawaian">
                <Select value={status} onValueChange={(v) => setStatus(v as EmployeeStatus)}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AKTIF">Aktif</SelectItem>
                    <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
                    <SelectItem value="RESIGN">Resign</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FormRow>

            {/* Dropdown Penempatan Outlet HANYA MUNCUL jika Kategori = OUTLET */}
            {category === "OUTLET" ? (
              <Field label="Penempatan Outlet" required hint="Pilih lokasi cabang outlet JURI Bun">
                <Select value={primaryOutletId} onValueChange={setPrimaryOutletId}>
                  <SelectTrigger className="bg-background font-medium">
                    <SelectValue placeholder="Pilih cabang outlet..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredOutlets.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name} ({o.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : (
              <div className="rounded-lg bg-background/80 border border-border/60 p-2.5 text-xs text-muted-foreground flex items-center justify-between">
                <span>Penempatan Lokasi:</span>
                <span className="font-semibold text-foreground">
                  {category === "PH_KLATEN" && "Pabrik Produksi PH Klaten"}
                  {category === "GUDANG_JAKARTA" && "Gudang Logistik & QC Jakarta"}
                  {category === "NON_OUTLET" && "Head Office (HQ Jakarta)"}
                </span>
              </div>
            )}
          </section>

          {/* Section 2: Identitas Diri */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Identitas &amp; Kontak Diri
            </h3>
            <FormRow>
              <Field label="NIK" required>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={nik} onChange={(e) => setNik(e.target.value)} placeholder="JBD00001" className="pl-8" />
                </div>
              </Field>
              <Field label="Nama Lengkap" required>
                <div className="relative">
                  <User className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama lengkap karyawan" className="pl-8" />
                </div>
              </Field>
            </FormRow>

            <FormRow>
              <Field label="No. Telepon / WA">
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081234567890" className="pl-8" />
                </div>
              </Field>
              <Field label="Email Perusahaan / Pribadi">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="karyawan@juribun.co.id" className="pl-8" />
                </div>
              </Field>
            </FormRow>

            <FormRow>
              <Field label="Posisi / Jabatan" required>
                <Select value={positionId} onValueChange={setPositionId}>
                  <SelectTrigger><SelectValue placeholder="Pilih posisi..." /></SelectTrigger>
                  <SelectContent>
                    {filteredPositions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Divisi" required>
                <Select value={divisionId} onValueChange={setDivisionId}>
                  <SelectTrigger><SelectValue placeholder="Pilih divisi..." /></SelectTrigger>
                  <SelectContent>
                    {filteredDivisions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FormRow>

            <Field label="Atasan / Supervisor">
              <Select value={supervisorId} onValueChange={setSupervisorId}>
                <SelectTrigger><SelectValue placeholder="Tanpa atasan langsung" /></SelectTrigger>
                <SelectContent>
                  {supervisorCandidates.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.fullName} — {e.nik}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </section>

          {/* Section 3: Rekening Bank Payroll */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
              <CreditCard className="size-4 text-primary" /> Data Rekening Bank (Payroll)
            </h3>
            <FormRow>
              <Field label="Nama Bank">
                <Select value={bankName} onValueChange={setBankName}>
                  <SelectTrigger><SelectValue placeholder="Pilih bank..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BCA">Bank BCA</SelectItem>
                    <SelectItem value="Bank Mandiri">Bank Mandiri</SelectItem>
                    <SelectItem value="BNI">Bank BNI</SelectItem>
                    <SelectItem value="BRI">Bank BRI</SelectItem>
                    <SelectItem value="CIMB Niaga">CIMB Niaga</SelectItem>
                    <SelectItem value="Bank Syariah Indonesia">BSI (Bank Syariah Indonesia)</SelectItem>
                    <SelectItem value="Permata Bank">Permata Bank</SelectItem>
                    <SelectItem value="Bank Danamon">Bank Danamon</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Nomor Rekening">
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Contoh: 8830918239"
                  className="font-mono tabular-nums"
                />
              </Field>
            </FormRow>
            <Field label="Atas Nama Rekening">
              <Input
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Nama sesuai buku tabungan"
              />
            </Field>
          </section>

          {/* Section 4: Tanggal Mulai Bekerja & Kontrak */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
              <FileText className="size-4 text-primary" /> Masa Bekerja &amp; Kontrak
            </h3>
            <FormRow>
              <Field label="Tanggal Bergabung / Mulai Bekerja">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
              <Field label="Tipe Kontrak">
                <Select value={contractType} onValueChange={setContractType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PKWT">PKWT (Kontrak Waktu Tertentu)</SelectItem>
                    <SelectItem value="PKWTT">PKWTT (Karyawan Tetap)</SelectItem>
                    <SelectItem value="PROBATION">Probation (Masa Percobaan)</SelectItem>
                    <SelectItem value="HARIAN">Karyawan Harian</SelectItem>
                    <SelectItem value="MAGANG">Magang / Internship</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FormRow>
            <FormRow>
              <Field label="Durasi Kontrak (Bulan)">
                <Select value={contractDurationMonths} onValueChange={setContractDurationMonths}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Bulan (Probation / Pendek)</SelectItem>
                    <SelectItem value="6">6 Bulan</SelectItem>
                    <SelectItem value="12">12 Bulan (1 Tahun)</SelectItem>
                    <SelectItem value="24">24 Bulan (2 Tahun)</SelectItem>
                    <SelectItem value="0">Tidak Ada Masa Berakhir (Tetap)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Saldo Cuti Tahunan (hari)">
                <Input type="number" value={leaveBalance} onChange={(e) => setLeaveBalance(e.target.value)} className="tabular-nums" />
              </Field>
            </FormRow>

            <FormRow>
              <Field label="Tipe Skema Gaji">
                <Select value={salaryType} onValueChange={(v) => setSalaryType(v as SalaryType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BULANAN">Bulanan</SelectItem>
                    <SelectItem value="HARIAN">Harian</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Nominal Gaji" hint="Format Rupiah tanpa desimal.">
                <Input type="number" value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)} className="tabular-nums" />
              </Field>
            </FormRow>
          </section>

          {/* Section 5: Domisili & Peta Lokasi */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
              <MapPin className="size-4 text-primary" /> Alamat Rumah &amp; Peta Lokasi
            </h3>
            <Field label="Alamat Rumah Lengkap">
              <Textarea
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                rows={2}
                placeholder="Jl. Raya Kemerdekaan No. 12, RT 01/RW 02..."
              />
            </Field>
            <Field label="Link Google Maps / Koordinat Peta">
              <Input
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/?q=-6.195,106.823"
              />
            </Field>
          </section>

          {/* Section 6: Shift & Libur & Catatan */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shift, Libur &amp; Catatan</h3>
            <FormRow>
              <Field label="Shift Group">
                <Select value={shiftGroupId} onValueChange={setShiftGroupId}>
                  <SelectTrigger><SelectValue placeholder="Tanpa shift group" /></SelectTrigger>
                  <SelectContent>
                    {shiftGroups.filter((g) => g.status === "active").map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Holiday Group">
                <Select value={holidayGroupId} onValueChange={setHolidayGroupId}>
                  <SelectTrigger><SelectValue placeholder="Tanpa holiday group" /></SelectTrigger>
                  <SelectContent>
                    {holidayGroups.filter((g) => g.status === "active").map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FormRow>
            <Field label="Catatan Internal HRD">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Catatan khusus HRD..." />
            </Field>
          </section>

          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={submit}>
            {mode === "edit" ? "Simpan Perubahan" : "Tambah Karyawan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
