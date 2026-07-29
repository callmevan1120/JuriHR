"use client";

import * as React from "react";
import dynamic from "next/dynamic";
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
import { todayISODate, parseGoogleMapsCoordinates } from "@/lib/utils";
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
  KeyRound,
  PlusCircle,
  Navigation,
} from "lucide-react";

const EmployeeMiniMap = dynamic(
  () => import("./employee-mini-map").then((m) => m.EmployeeMiniMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
        Memuat peta interaktif...
      </div>
    ),
  },
);

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
  const [birthDate, setBirthDate] = React.useState(data?.birthDate ?? "1998-05-20");
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
  
  // Data Bank & Rekening + Custom Bank Support
  const [selectedBank, setSelectedBank] = React.useState(data?.bankName ?? "BCA");
  const [customBankName, setCustomBankName] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState(data?.accountNumber ?? "");
  const [accountHolderName, setAccountHolderName] = React.useState(data?.accountHolderName ?? "");
  
  // Kontrak & Domisili + Koordinat LU/LT (Lintang & Bujur)
  const [contractType, setContractType] = React.useState(data?.contractType ?? "PKWT");
  const [contractDurationMonths, setContractDurationMonths] = React.useState(String(data?.contractDurationMonths ?? 12));
  const [homeAddress, setHomeAddress] = React.useState(data?.homeAddress ?? "");
  const [mapsUrl, setMapsUrl] = React.useState(data?.mapsUrl ?? "");
  const [latitude, setLatitude] = React.useState(String(data?.latitude ?? -6.2088));
  const [longitude, setLongitude] = React.useState(String(data?.longitude ?? 106.8456));

  const [error, setError] = React.useState<string>();

  const standardBanks = ["BCA", "Bank Mandiri", "BNI", "BRI", "CIMB Niaga", "Bank Syariah Indonesia", "Permata Bank", "Bank Danamon"];

  React.useEffect(() => {
    if (!open) return;
    setNik(data?.nik ?? "");
    setFullName(data?.fullName ?? "");
    setPhone(data?.phone ?? "");
    setEmail(data?.email ?? "");
    setBirthDate(data?.birthDate ?? "1998-05-20");
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

    // Cek apakah bank terdaftar atau custom bank
    const b = data?.bankName ?? "BCA";
    if (standardBanks.includes(b)) {
      setSelectedBank(b);
      setCustomBankName("");
    } else {
      setSelectedBank("CUSTOM");
      setCustomBankName(b);
    }

    setAccountNumber(data?.accountNumber ?? "");
    setAccountHolderName(data?.accountHolderName ?? data?.fullName ?? "");
    setContractType(data?.contractType ?? "PKWT");
    setContractDurationMonths(String(data?.contractDurationMonths ?? 12));
    setHomeAddress(data?.homeAddress ?? "");
    setMapsUrl(data?.mapsUrl ?? "");
    setLatitude(String(data?.latitude ?? -6.2088));
    setLongitude(String(data?.longitude ?? 106.8456));
    setError(undefined);
  }, [open, data]);

  // Otomatis mengekstrak Koordinat (LU/LT) saat link Google Maps diinput (Mendukung semua format link & koordinat Google Maps)
  const handleMapsUrlChange = (url: string) => {
    setMapsUrl(url);
    const coords = parseGoogleMapsCoordinates(url);
    if (coords) {
      setLatitude(coords.lat.toFixed(6));
      setLongitude(coords.lon.toFixed(6));
      toast.info(`Koordinat peta terdeteksi: Lat ${coords.lat.toFixed(5)}, Lon ${coords.lon.toFixed(5)}`);
    }
  };

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

    const finalBankName = selectedBank === "CUSTOM" ? customBankName.trim() : selectedBank;
    if (!finalBankName) {
      setError("Nama bank wajib diisi.");
      return;
    }

    const latNum = Number(latitude) || -6.2088;
    const lonNum = Number(longitude) || 106.8456;

    // Generasi link maps otomatis bila link kosong tapi lat/lon diisi
    let finalMapsUrl = mapsUrl.trim();
    if (!finalMapsUrl && (latitude || longitude)) {
      finalMapsUrl = `https://maps.google.com/?q=${latNum},${lonNum}`;
    }

    const payload: Partial<Employee> = {
      nik: nik.trim(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      birthDate,
      startDate,
      category,
      positionId,
      divisionId,
      primaryOutletId: category === "OUTLET" ? primaryOutletId : undefined,
      status,
      salaryType,
      salaryAmount: Number(salaryAmount) || 0,
      shiftGroupId: shiftGroupId || undefined,
      holidayGroupId: holidayGroupId || undefined,
      leaveBalanceDays: Number(leaveBalance) || 0,
      supervisorId: supervisorId || undefined,
      note: note.trim() || undefined,
      bankName: finalBankName,
      accountNumber: accountNumber.trim(),
      accountHolderName: accountHolderName.trim() || fullName.trim(),
      contractType,
      contractDurationMonths: Number(contractDurationMonths) || 12,
      homeAddress: homeAddress.trim() || undefined,
      mapsUrl: finalMapsUrl || undefined,
      latitude: latNum,
      longitude: lonNum,
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
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <User className="size-5 text-primary" />
            {mode === "edit" ? "Edit Data Karyawan" : "Tambah Karyawan Baru"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Lengkapi data diri, kategori penempatan, tanggal lahir (login v2), rekening bank, serta detail koordinat domisili.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Info Callout Login Credential Versi 2 */}
          <div className="flex items-start gap-2.5 rounded-xl border border-info/30 bg-info/10 p-3 text-xs text-info dark:text-info-foreground">
            <KeyRound className="size-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Info Kredensial Akun (Persiapan Versi 2):</span>
              <p className="mt-0.5 leading-relaxed text-[11px]">
                Email dan Tanggal Lahir karyawan ini akan digunakan sebagai kredensial utama saat fitur <i>Employee Self-Service App</i> diaktifkan pada Versi 2.
              </p>
            </div>
          </div>

          {/* Section 1: Kategori & Penempatan Lokasi */}
          <section className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-primary flex items-center gap-1.5">
              <Building2 className="size-4" /> Kategori &amp; Lokasi Penempatan
            </h3>
            
            <FormRow>
              <Field label="Kategori Karyawan" required hint="Tentukan jenis lokasi kerja utama">
                <Select
                  value={category}
                  onValueChange={(v) => {
                    const newCat = v as EmployeeCategory;
                    setCategory(newCat);
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
              <div className="rounded-lg bg-background/90 border border-border/80 p-2.5 text-xs text-muted-foreground flex items-center justify-between">
                <span>Penempatan Lokasi Kerja:</span>
                <span className="font-semibold text-foreground">
                  {category === "PH_KLATEN" && "Pabrik Produksi PH Klaten"}
                  {category === "GUDANG_JAKARTA" && "Gudang Logistik & QC Jakarta"}
                  {category === "NON_OUTLET" && "Head Office (HQ Jakarta)"}
                </span>
              </div>
            )}
          </section>

          {/* Section 2: Identitas Diri & Kredensial Login v2 */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Identitas Diri &amp; Kontak
            </h3>
            <FormRow>
              <Field label="NIK" required>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={nik} onChange={(e) => setNik(e.target.value)} placeholder="JBD00001" className="pl-8 font-mono" />
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
              <Field label="Email (Login v2)" required hint="Digunakan untuk login akun karyawan">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="karyawan@juribun.co.id" className="pl-8" />
                </div>
              </Field>
              <Field label="Tanggal Lahir (Login v2)" required hint="Digunakan sebagai verifikasi sandi awal">
                <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </Field>
            </FormRow>

            <FormRow>
              <Field label="No. Telepon / WA">
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081234567890" className="pl-8 font-mono" />
                </div>
              </Field>
              <Field label="Tanggal Bergabung / Mulai Kerja">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
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

            <Field label="Atasan / Supervisor Direct">
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

          {/* Section 3: Data Bank Payroll (+ Support Tambah Bank Custom) */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
              <CreditCard className="size-4 text-primary" /> Data Rekening Bank (Payroll)
            </h3>
            
            <FormRow>
              <Field label="Nama Bank">
                <Select
                  value={selectedBank}
                  onValueChange={(v) => {
                    setSelectedBank(v);
                    if (v !== "CUSTOM") setCustomBankName("");
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Pilih bank..." /></SelectTrigger>
                  <SelectContent>
                    {standardBanks.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                    <SelectItem value="CUSTOM">+ Tambah Bank Lainnya...</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {selectedBank === "CUSTOM" ? (
                <Field label="Tulis Nama Bank Baru" required hint="Nama bank kustom yang akan disimpan">
                  <Input
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    placeholder="Misal: Bank Jateng, Bank Jabar, dll"
                  />
                </Field>
              ) : (
                <Field label="Nomor Rekening">
                  <Input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Contoh: 8830918239"
                    className="font-mono tabular-nums"
                  />
                </Field>
              )}
            </FormRow>

            {selectedBank === "CUSTOM" && (
              <Field label="Nomor Rekening">
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Contoh: 8830918239"
                  className="font-mono tabular-nums"
                />
              </Field>
            )}

            <Field label="Atas Nama Rekening Tabungan">
              <Input
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Nama sesuai buku tabungan"
              />
            </Field>
          </section>

          {/* Section 4: Detail Kontrak Kerja & Gaji */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
              <FileText className="size-4 text-primary" /> Kontrak Kerja &amp; Kompensasi
            </h3>
            <FormRow>
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

              <Field label="Durasi Kontrak (Bulan)">
                <Select value={contractDurationMonths} onValueChange={setContractDurationMonths}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Bulan (Probation)</SelectItem>
                    <SelectItem value="6">6 Bulan</SelectItem>
                    <SelectItem value="12">12 Bulan (1 Tahun)</SelectItem>
                    <SelectItem value="24">24 Bulan (2 Tahun)</SelectItem>
                    <SelectItem value="0">Tidak Ada Akhir (Tetap)</SelectItem>
                  </SelectContent>
                </Select>
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
                <Input type="number" value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)} className="tabular-nums font-semibold" />
              </Field>
            </FormRow>

            <Field label="Saldo Cuti Tahunan (hari)">
              <Input type="number" value={leaveBalance} onChange={(e) => setLeaveBalance(e.target.value)} className="tabular-nums" />
            </Field>
          </section>

          {/* Section 5: Domisili & Peta Lokasi + Pratinjau Peta Interaktif Langsung */}
          <section className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
              <MapPin className="size-4 text-primary" /> Alamat Domisili &amp; Peta Lokasi
            </h3>

            <Field label="Alamat Rumah Lengkap">
              <Textarea
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                rows={2}
                placeholder="Jl. Raya Kemerdekaan No. 12, RT 01/RW 02..."
              />
            </Field>

            <Field label="Link Google Maps" hint="Tempel link Google Maps (semua format link & titik koordinat otomatis terhubung ke peta)">
              <Input
                value={mapsUrl}
                onChange={(e) => handleMapsUrlChange(e.target.value)}
                placeholder="https://maps.google.com/?q=-6.1953,106.8231 atau -6.1953, 106.8231"
              />
            </Field>

            <FormRow>
              <Field label="Latitude (LU / Lintang)" hint="Derajat Lintang (-6.xxxx)">
                <div className="relative">
                  <Navigation className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="-6.2088"
                    className="pl-8 font-mono tabular-nums text-xs"
                  />
                </div>
              </Field>

              <Field label="Longitude (LT / Bujur)" hint="Derajat Bujur Timur (106.xxxx)">
                <div className="relative">
                  <Navigation className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="106.8456"
                    className="pl-8 font-mono tabular-nums text-xs"
                  />
                </div>
              </Field>
            </FormRow>

            {/* Pratinjau Peta Interaktif Langsung */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                <span>Pratinjau Peta Domisili Karyawan (Real-time):</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  Lat: {Number(latitude).toFixed(5)}, Lon: {Number(longitude).toFixed(5)}
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                <EmployeeMiniMap
                  lat={Number(latitude) || -6.2088}
                  lon={Number(longitude) || 106.8456}
                  outlet={outlets.find((o) => o.id === primaryOutletId)}
                  employeeName={fullName || "Calon Karyawan"}
                  editable={true}
                  height={220}
                  onPick={(newLat, newLon) => {
                    setLatitude(newLat.toFixed(6));
                    setLongitude(newLon.toFixed(6));
                    setMapsUrl(`https://maps.google.com/?q=${newLat.toFixed(6)},${newLon.toFixed(6)}`);
                    toast.success(`Lokasi disesuaikan dari peta: Lat ${newLat.toFixed(5)}, Lon ${newLon.toFixed(5)}`);
                  }}
                />
              </div>
            </div>
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
