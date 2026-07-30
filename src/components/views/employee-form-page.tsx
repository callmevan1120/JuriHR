"use client";

import * as React from "react";
import dynamic from "next/dynamic";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FormRow } from "@/components/common/field";
import { useStore } from "@/hooks/use-store";
import { employeeService } from "@/lib/services/master-data";
import { todayISODate, parseGoogleMapsCoordinates, addMonthsISO, formatDateLong, cn } from "@/lib/utils";
import type { Employee, EmployeeCategory, EmployeeStatus, SalaryType, Gender, MaritalStatus } from "@/lib/types";
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
  Navigation,
  ArrowLeft,
  Save,
  CheckCircle2,
  Users,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const EmployeeMiniMap = dynamic(
  () => import("./employee-mini-map").then((m) => m.EmployeeMiniMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
        Memuat peta interaktif...
      </div>
    ),
  },
);

interface EmployeeFormPageProps {
  mode: "create" | "edit";
  data?: Employee;
  onBack: () => void;
}

type SectionTab = "penempatan" | "identitas" | "kontrak" | "rekening" | "domisili";

export function EmployeeFormPage({ mode, data, onBack }: EmployeeFormPageProps) {
  const positions = useStore((s) => s.positions);
  const divisions = useStore((s) => s.divisions);
  const outlets = useStore((s) => s.outlets);
  const shiftGroups = useStore((s) => s.shiftGroups);
  const holidayGroups = useStore((s) => s.holidayGroups);
  const employees = useStore((s) => s.employees);

  const [activeTab, setActiveTab] = React.useState<SectionTab>("penempatan");

  const [nik, setNik] = React.useState(data?.nik ?? "");
  const [fullName, setFullName] = React.useState(data?.fullName ?? "");
  const [gender, setGender] = React.useState<Gender>(data?.gender ?? "LAKILAKI");
  const [maritalStatus, setMaritalStatus] = React.useState<MaritalStatus>(data?.maritalStatus ?? "SINGLE");
  const [phone, setPhone] = React.useState(data?.phone ?? "");
  const [email, setEmail] = React.useState(data?.email ?? "");
  const [birthDate, setBirthDate] = React.useState(data?.birthDate ?? "1998-05-20");
  const [startDate, setStartDate] = React.useState(data?.startDate ?? todayISODate());
  const [endOfEmploymentDate, setEndOfEmploymentDate] = React.useState(data?.endOfEmploymentDate ?? "");
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
  
  const [selectedBank, setSelectedBank] = React.useState(data?.bankName ?? "BCA");
  const [customBankName, setCustomBankName] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState(data?.accountNumber ?? "");
  const [accountHolderName, setAccountHolderName] = React.useState(data?.accountHolderName ?? "");
  
  const [contractType, setContractType] = React.useState(data?.contractType ?? "PKWT");
  const [contractDurationMonths, setContractDurationMonths] = React.useState(String(data?.contractDurationMonths ?? 12));
  const [contractEndDate, setContractEndDate] = React.useState(
    data?.contractEndDate ?? addMonthsISO(data?.startDate ?? todayISODate(), 12)
  );
  const [homeAddress, setHomeAddress] = React.useState(data?.homeAddress ?? "");
  const [mapsUrl, setMapsUrl] = React.useState(data?.mapsUrl ?? "");
  const [rawCoords, setRawCoords] = React.useState("");
  const [latitude, setLatitude] = React.useState(String(data?.latitude ?? -6.2088));
  const [longitude, setLongitude] = React.useState(String(data?.longitude ?? 106.8456));

  const [error, setError] = React.useState<string>();

  const standardBanks = ["BCA", "Bank Mandiri", "BNI", "BRI", "CIMB Niaga", "Bank Syariah Indonesia", "Permata Bank", "Bank Danamon"];

  React.useEffect(() => {
    setNik(data?.nik ?? "");
    setFullName(data?.fullName ?? "");
    setGender(data?.gender ?? "LAKILAKI");
    setMaritalStatus(data?.maritalStatus ?? "SINGLE");
    setPhone(data?.phone ?? "");
    setEmail(data?.email ?? "");
    setBirthDate(data?.birthDate ?? "1998-05-20");
    const stDate = data?.startDate ?? todayISODate();
    setStartDate(stDate);
    setEndOfEmploymentDate(data?.endOfEmploymentDate ?? "");
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
    const dur = data?.contractDurationMonths ?? 12;
    setContractDurationMonths(String(dur));
    setContractEndDate(data?.contractEndDate ?? (dur > 0 ? addMonthsISO(stDate, dur) : ""));
    setHomeAddress(data?.homeAddress ?? "");
    setMapsUrl(data?.mapsUrl ?? "");
    setRawCoords(data?.latitude && data?.longitude ? `${data.latitude}, ${data.longitude}` : "");
    setLatitude(String(data?.latitude ?? -6.2088));
    setLongitude(String(data?.longitude ?? 106.8456));
    setError(undefined);
  }, [data]);

  const handleDurationChange = (durStr: string) => {
    setContractDurationMonths(durStr);
    const months = Number(durStr);
    if (months > 0 && startDate) {
      setContractEndDate(addMonthsISO(startDate, months));
    } else if (months === 0) {
      setContractEndDate("");
    }
  };

  const handleStartDateChange = (stDate: string) => {
    setStartDate(stDate);
    const months = Number(contractDurationMonths);
    if (months > 0 && stDate) {
      setContractEndDate(addMonthsISO(stDate, months));
    }
  };

  const handleCategoryChange = (cat: EmployeeCategory) => {
    setCategory(cat);
    if (cat === "PH_KLATEN") {
      const klatenSg = shiftGroups.find((sg) => sg.id === "sg-ph-klaten");
      if (klatenSg) {
        setShiftGroupId(klatenSg.id);
        toast.info("Shift Group otomatis terhubung: Pabrik PH Klaten (Sen-Kam 07:30-16:30, Jum 07:30-17:00)");
      }
    } else if (cat === "NON_OUTLET") {
      const officeSg = shiftGroups.find((sg) => sg.id === "sg-office");
      if (officeSg) setShiftGroupId(officeSg.id);
    }
  };

  const handleOutletChange = (outletId: string) => {
    setPrimaryOutletId(outletId);
    const matchSg = shiftGroups.find((sg) => sg.outletIds?.includes(outletId) || sg.scopeIds?.includes(outletId) || (sg.scopeType === "OUTLET" && sg.scopeId === outletId))
      || shiftGroups.find((sg) => sg.id === "sg-outlet-5day");
    if (matchSg) {
      setShiftGroupId(matchSg.id);
      toast.info(`Shift Group terhubung ke outlet terpilih (${matchSg.name})`);
    }
    const matchHg = holidayGroups.find((hg) => hg.outletIds?.includes(outletId))
      || holidayGroups.find((hg) => hg.id === "hg-nasional")
      || holidayGroups[0];
    if (matchHg) {
      setHolidayGroupId(matchHg.id);
    }
  };

  const handleMapsUrlChange = (url: string) => {
    setMapsUrl(url);
    const coords = parseGoogleMapsCoordinates(url);
    if (coords) {
      setLatitude(coords.lat.toFixed(6));
      setLongitude(coords.lon.toFixed(6));
      setRawCoords(`${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`);
      toast.info(`Koordinat peta terdeteksi: Lat ${coords.lat.toFixed(5)}, Lon ${coords.lon.toFixed(5)}`);
    }
  };

  const handleRawCoordsChange = (text: string) => {
    setRawCoords(text);
    const match = text.match(/(-?\d+\.\d+)\s*[%2C,\s]\s*(-?\d+\.\d+)/);
    if (match) {
      const parsedLat = match[1];
      const parsedLon = match[2];
      setLatitude(parsedLat);
      setLongitude(parsedLon);
      setMapsUrl(`https://maps.google.com/?q=${parsedLat},${parsedLon}`);
      toast.success(`Koordinat terpisah oleh Regex: LU ${parsedLat}, LT ${parsedLon}`);
    }
  };

  const filteredPositions = positions.filter((p) => p.status === "active");
  const filteredDivisions = divisions.filter((d) => d.status === "active");
  const filteredOutlets = outlets.filter((o) => o.status === "active");
  const supervisorCandidates = employees.filter((e) => e.status === "AKTIF" && e.id !== data?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    if (!nik.trim()) {
      setError("NIK karyawan wajib diisi.");
      setActiveTab("identitas");
      return;
    }
    if (!fullName.trim()) {
      setError("Nama lengkap karyawan wajib diisi.");
      setActiveTab("identitas");
      return;
    }
    if (!positionId) {
      setError("Posisi / Jabatan wajib dipilih.");
      setActiveTab("identitas");
      return;
    }
    if (!divisionId) {
      setError("Divisi wajib dipilih.");
      setActiveTab("identitas");
      return;
    }

    if (category === "OUTLET" && !primaryOutletId) {
      setError("Penempatan outlet wajib dipilih untuk Karyawan Outlet.");
      setActiveTab("penempatan");
      return;
    }

    if (!email.trim()) {
      setError("Email wajib diisi.");
      setActiveTab("identitas");
      return;
    }
    if (!birthDate) {
      setError("Tanggal lahir wajib diisi.");
      setActiveTab("identitas");
      return;
    }

    const dup = employees.find((e) => e.nik === nik.trim() && e.id !== data?.id);
    if (dup) {
      setError(`NIK "${nik.trim()}" sudah digunakan oleh ${dup.fullName}.`);
      setActiveTab("identitas");
      return;
    }

    const finalBankName = selectedBank === "CUSTOM" ? customBankName.trim() : selectedBank;
    if (!finalBankName) {
      setError("Nama bank wajib diisi.");
      setActiveTab("rekening");
      return;
    }

    const latNum = Number(latitude) || -6.2088;
    const lonNum = Number(longitude) || 106.8456;

    let finalMapsUrl = mapsUrl.trim();
    if (!finalMapsUrl && (latitude || longitude)) {
      finalMapsUrl = `https://maps.google.com/?q=${latNum},${lonNum}`;
    }

    const payload: Partial<Employee> = {
      nik: nik.trim(),
      fullName: fullName.trim(),
      gender,
      maritalStatus,
      phone: phone.trim(),
      email: email.trim(),
      birthDate,
      startDate,
      endOfEmploymentDate: endOfEmploymentDate || undefined,
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
      contractEndDate: contractEndDate || undefined,
      homeAddress: homeAddress.trim() || undefined,
      mapsUrl: finalMapsUrl || undefined,
      latitude: latNum,
      longitude: lonNum,
    };

    if (mode === "edit" && data) {
      employeeService.update(data.id, payload);
      toast.success(`Data karyawan "${fullName}" berhasil diperbarui.`);
    } else {
      try {
        employeeService.create(payload as any);
        toast.success(`Karyawan baru "${fullName}" berhasil ditambahkan.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menambah karyawan");
        return;
      }
    }

    onBack();
  };

  const scrollToSection = (tab: SectionTab) => {
    setActiveTab(tab);
    const el = document.getElementById(`section-${tab}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-12">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 flex flex-col gap-3 border-b border-border/60 bg-background/95 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" type="button" onClick={onBack} className="size-8 text-muted-foreground hover:text-foreground rounded-xl" title="Kembali" aria-label="Kembali">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="size-5 text-primary" />
              {mode === "edit" ? `Edit Data Karyawan \u2014 ${data?.fullName}` : "Tambah Karyawan Baru"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Formulir manajemen data karyawan JURI HR.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" type="button" size="sm" onClick={onBack} className="rounded-xl text-xs font-semibold">
            Batal
          </Button>
          <Button type="submit" size="sm" className="gap-1.5 font-semibold rounded-xl">
            <Save className="size-4" />
            {mode === "edit" ? "Simpan Perubahan" : "Simpan Data Karyawan"}
          </Button>
        </div>
      </div>

      {/* Error Callout */}
      {error && (
        <div className="mx-4 sm:mx-0 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Segmented Control */}
      <div className="px-1">
        <div className="flex overflow-x-auto rounded-2xl bg-muted/40 p-1 border border-border/60 max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab("penempatan")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap",
              activeTab === "penempatan"
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
            )}
          >
            <Building2 className="size-3.5 text-primary" /> 1. Penempatan & Status
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("identitas")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap",
              activeTab === "identitas"
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
            )}
          >
            <User className="size-3.5 text-primary" /> 2. Identitas & Masa Kerja
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("kontrak")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap",
              activeTab === "kontrak"
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
            )}
          >
            <FileText className="size-3.5 text-primary" /> 3. Kontrak & Gaji
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rekening")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap",
              activeTab === "rekening"
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
            )}
          >
            <CreditCard className="size-3.5 text-primary" /> 4. Rekening Bank
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("domisili")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap",
              activeTab === "domisili"
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
            )}
          >
            <MapPin className="size-3.5 text-primary" /> 5. Domisili & Peta
          </button>
        </div>
      </div>

      <div className="space-y-5 px-1">
        {/* SECTION 1: Penempatan */}
        {activeTab === "penempatan" && (
          <Card id="section-penempatan" className="rounded-2xl border border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Building2 className="size-4" /> 1. Penempatan Lokasi & Status Kepegawaian
              </CardTitle>
              <CardDescription className="text-xs">
                Pilih kategori unit penempatan kerja (Outlet, Pabrik PH Klaten, Gudang Jakarta, atau HQ).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <FormRow>
                <Field label="Kategori Karyawan / Unit Kerja" required hint="Kategori penempatan lokasi kerja utama">
                  <Select value={category} onValueChange={(v) => handleCategoryChange(v as EmployeeCategory)}>
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
                <Field label="Penempatan Outlet Cabang" required hint="Pilih cabang outlet JURI Bun tempat karyawan ditugaskan (Shift & Holiday Group terhubung otomatis)">
                  <Select value={primaryOutletId} onValueChange={handleOutletChange}>
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
                <div className="rounded-xl bg-muted/30 border border-border p-3.5 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Penempatan Lokasi Kerja Non-Outlet:</span>
                  <Badge variant="outline" className="font-bold text-foreground">
                    {category === "PH_KLATEN" && "Pabrik Produksi PH Klaten"}
                    {category === "GUDANG_JAKARTA" && "Gudang Logistik & QC Jakarta"}
                    {category === "NON_OUTLET" && "Head Office (HQ Jakarta)"}
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-end border-t border-border pt-4 mt-6">
                <Button type="button" size="sm" onClick={() => setActiveTab("identitas")} className="gap-1.5 font-semibold rounded-xl text-xs">
                  Langkah 2: Identitas & Masa Kerja <ChevronRight className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION 2: Identitas */}
        {activeTab === "identitas" && (
          <Card id="section-identitas" className="rounded-2xl border border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
                <User className="size-4" /> 2. Identitas Diri, Kontak & Masa Kerja
              </CardTitle>
              <CardDescription className="text-xs">
                Lengkapi ID Karyawan, NIK, Nama Lengkap, Jenis Kelamin, Tanggal Bergabung, dan Tanggal Berakhir Masa Kerja.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
            <FormRow>
              <Field label="ID Karyawan (System ID)">
                <Input value={data?.id ?? "Otomatis dibuat oleh sistem"} disabled className="font-mono text-xs text-muted-foreground bg-muted/30" />
              </Field>
              <Field label="NIK (Nomor Induk Karyawan)" required hint="Nomor unik registrasi karyawan">
                <Input value={nik} onChange={(e) => setNik(e.target.value)} placeholder="JBD00001" className="font-mono font-bold" />
              </Field>
            </FormRow>

            <FormRow>
              <Field label="Nama Lengkap Karyawan" required>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama lengkap karyawan" className="font-semibold" />
              </Field>
              <Field label="Jenis Kelamin">
                <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAKILAKI">Laki-laki</SelectItem>
                    <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FormRow>

            <FormRow>
              <Field label="Status Pernikahan">
                <Select value={maritalStatus} onValueChange={(v) => setMaritalStatus(v as MaritalStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">Lajang / Belum Menikah</SelectItem>
                    <SelectItem value="MENIKAH">Menikah</SelectItem>
                    <SelectItem value="CERAI">Cerai</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="No. Telepon / WA">
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081234567890" className="pl-8 font-mono" />
                </div>
              </Field>
            </FormRow>

            <FormRow>
              <Field label="Email Perusahaan (Login v2)" required hint="Digunakan untuk login akun Employee App">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="karyawan@juribun.co.id" className="pl-8 font-mono" />
                </div>
              </Field>
              <Field label="Tanggal Lahir (Verifikasi Login v2)" required hint="Digunakan sebagai verifikasi sandi awal">
                <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </Field>
            </FormRow>

            <FormRow>
              <Field label="Tanggal Bergabung / Mulai Kerja" required hint="Tanggal pertama kali resmi bekerja">
                <Input type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} />
              </Field>
              <Field label="Tanggal Berakhir Bekerja / Kontrak" hint="Terhitung otomatis dari durasi kontrak atau dapat diisi jika ada tanggal berakhir">
                <Input
                  type="date"
                  value={contractEndDate || endOfEmploymentDate}
                  onChange={(e) => {
                    setContractEndDate(e.target.value);
                    setEndOfEmploymentDate(e.target.value);
                  }}
                  disabled={contractDurationMonths === "0" || contractType === "PKWTT"}
                />
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
            </FormRow>

            <FormRow>
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
              <Field label="Atasan Direct / Supervisor">
                <Select value={supervisorId} onValueChange={setSupervisorId}>
                  <SelectTrigger><SelectValue placeholder="Tanpa atasan langsung" /></SelectTrigger>
                  <SelectContent>
                    {supervisorCandidates.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.fullName} \u2014 {e.nik}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FormRow>

            <div className="flex items-center justify-between border-t border-border pt-4 mt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("penempatan")} className="gap-1.5 rounded-xl text-xs font-semibold">
                <ChevronLeft className="size-4" /> Sebelumnya
              </Button>
              <Button type="button" size="sm" onClick={() => setActiveTab("kontrak")} className="gap-1.5 rounded-xl text-xs font-semibold">
                Langkah 3: Kontrak & Gaji <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        )}

        {/* SECTION 3: Kontrak & Gaji */}
        {activeTab === "kontrak" && (
        <Card id="section-kontrak" className="rounded-2xl border border-border/60">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
              <FileText className="size-4" /> 3. Detail Kontrak Kerja & Kompensasi Gaji
            </CardTitle>
            <CardDescription className="text-xs">
              Atur tipe kontrak, durasi bulan, skema gaji & saldo cuti.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <FormRow>
              <Field label="Tipe Kontrak Kerja">
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

              <Field label="Durasi Kontrak (Bulan)" hint="Otomatis menghitung tanggal berakhir pada Seksi 2">
                <Select value={contractDurationMonths} onValueChange={handleDurationChange}>
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

            <div className="flex items-center justify-between border-t border-border pt-4 mt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("identitas")} className="gap-1.5 rounded-xl text-xs font-semibold">
                <ChevronLeft className="size-4" /> Sebelumnya
              </Button>
              <Button type="button" size="sm" onClick={() => setActiveTab("rekening")} className="gap-1.5 rounded-xl text-xs font-semibold">
                Langkah 4: Rekening Bank <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        )}

        {/* SECTION 4: Rekening */}
        {activeTab === "rekening" && (
        <Card id="section-rekening" className="rounded-2xl border border-border/60">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
              <CreditCard className="size-4" /> 4. Data Rekening Bank (Payroll)
            </CardTitle>
            <CardDescription className="text-xs">
              Tentukan nama bank (termasuk penambahan bank kustom baru) dan nomor rekening pembayaran gaji.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
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

            <div className="flex items-center justify-between border-t border-border pt-4 mt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("kontrak")} className="gap-1.5 rounded-xl text-xs font-semibold">
                <ChevronLeft className="size-4" /> Sebelumnya
              </Button>
              <Button type="button" size="sm" onClick={() => setActiveTab("domisili")} className="gap-1.5 rounded-xl text-xs font-semibold">
                Langkah 5: Domisili & Peta <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        )}

        {/* SECTION 5: Domisili */}
        {activeTab === "domisili" && (
        <Card id="section-domisili" className="rounded-2xl border border-border/60">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
              <MapPin className="size-4" /> 5. Alamat Domisili & Peta Lokasi Rumah (Leaflet Real-time)
            </CardTitle>
            <CardDescription className="text-xs">
              Input alamat rumah, tautan peta Google Maps, atau pasang pasangan koordinat mentah dengan parser Regex.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
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

            <Field label="Tempel Teks Koordinat Google Maps" hint="Otomatis dipisah oleh Regex untuk mengisi LU dan LT di bawah (misal: -7.592203, 110.649421)">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-primary" />
                <Input
                  value={rawCoords}
                  onChange={(e) => handleRawCoordsChange(e.target.value)}
                  placeholder="-7.592203, 110.649421"
                  className="pl-8 font-mono tabular-nums text-xs font-semibold text-foreground border-primary/40 bg-primary/5 focus:border-primary"
                />
              </div>
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

            {/* Pratinjau Peta */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span>Pratinjau Peta Lokasi Rumah Karyawan (Real-time):</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  Lat: {Number(latitude).toFixed(5)}, Lon: {Number(longitude).toFixed(5)}
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                <EmployeeMiniMap
                  lat={Number(latitude) || -6.2088}
                  lon={Number(longitude) || 106.8456}
                  employeeName={fullName || "Calon Karyawan"}
                  editable
                  onPick={(latVal, lonVal) => {
                    setLatitude(latVal.toFixed(6));
                    setLongitude(lonVal.toFixed(6));
                    setRawCoords(`${latVal.toFixed(6)}, ${lonVal.toFixed(6)}`);
                  }}
                  height={260}
                />
              </div>
            </div>

            <Field label="Catatan Internal HRD">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Catatan tambahan internal HRD mengenai karyawan ini..."
              />
            </Field>

            <div className="flex items-center justify-between border-t border-border pt-4 mt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("rekening")} className="gap-1.5 rounded-xl text-xs font-semibold">
                <ChevronLeft className="size-4" /> Sebelumnya
              </Button>
              <Button type="submit" size="sm" className="gap-2 font-bold rounded-xl text-xs">
                <Save className="size-4" />
                {mode === "edit" ? "Simpan Perubahan" : "Simpan Data Karyawan"}
              </Button>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </form>
  );
}
