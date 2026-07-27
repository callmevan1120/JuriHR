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
import { Switch } from "@/components/ui/switch";
import { Field, FormRow } from "@/components/common/field";
import { useStore } from "@/hooks/use-store";
import { employeeService } from "@/lib/services/master-data";
import { todayISODate } from "@/lib/utils";
import type { Employee, EmployeeCategory, EmployeeStatus, SalaryType } from "@/lib/types";
import { toast } from "sonner";
import { Phone, Mail, User, Hash, AlertCircle } from "lucide-react";

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
    setError(undefined);
  }, [open, data]);

  // Saat posisi dipilih, set default division/outlet bila kosong
  React.useEffect(() => {
    if (positionId) {
      const pos = positions.find((p) => p.id === positionId);
      if (pos) {
        if (!category && pos.category) setCategory(pos.category);
        if (pos.category !== category) setCategory(pos.category);
        if (salaryType === "BULANAN" && !salaryAmount) setSalaryAmount(String(pos.defaultMonthlySalary));
        if (salaryType === "HARIAN" && !salaryAmount) setSalaryAmount(String(pos.defaultDailySalary));
      }
    }
  }, [positionId]);

  // Filter posisi/divisi/outlet berdasarkan kategori
  const filteredPositions = positions.filter((p) => p.category === category && p.status === "active");
  const filteredDivisions = divisions.filter((d) => d.category === category && d.status === "active");
  const filteredOutlets = outlets.filter((o) => o.status === "active");

  // Kandidat atasan: karyawan aktif selain diri sendiri
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
      setError("Outlet utama wajib dipilih untuk kategori OUTLET.");
      return;
    }
    // Cek NIK unik
    const dup = employees.find((e) => e.nik === nik.trim() && e.id !== data?.id);
    if (dup) {
      setError(`NIK "${nik.trim()}" sudah digunakan oleh ${dup.fullName}.`);
      return;
    }

    const payload = {
      nik: nik.trim(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
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
    };

    if (mode === "edit" && data) {
      employeeService.update(data.id, payload);
      toast.success("Data karyawan diperbarui");
    } else {
      employeeService.create(payload);
      toast.success("Karyawan ditambahkan");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="size-5 text-primary" />
            {mode === "edit" ? "Edit Karyawan" : "Tambah Karyawan"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi data karyawan. Perubahan posisi, divisi, outlet, status, gaji, shift group, dan holiday group akan dicatat di histori.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Identitas */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Identitas</h3>
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
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama karyawan" className="pl-8" />
                </div>
              </Field>
            </FormRow>
            <FormRow>
              <Field label="Telepon">
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812..." className="pl-8" />
                </div>
              </Field>
              <Field label="Email">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@juribun.co.id" className="pl-8" />
                </div>
              </Field>
            </FormRow>
            <Field label="Tanggal Mulai Bekerja">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
          </section>

          {/* Penempatan */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Penempatan</h3>
            <FormRow>
              <Field label="Kategori Karyawan">
                <Select value={category} onValueChange={(v) => setCategory(v as EmployeeCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OUTLET">Outlet</SelectItem>
                    <SelectItem value="NON_OUTLET">Non-Outlet</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={status} onValueChange={(v) => setStatus(v as EmployeeStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AKTIF">Aktif</SelectItem>
                    <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
                    <SelectItem value="RESIGN">Resign</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FormRow>
            <FormRow>
              <Field label="Posisi" required>
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
            <FormRow>
              <Field label="Outlet Utama" required={category === "OUTLET"} hint={category === "NON_OUTLET" ? "Opsional untuk kategori Non-Outlet" : undefined}>
                <Select value={primaryOutletId} onValueChange={setPrimaryOutletId} disabled={category === "NON_OUTLET"}>
                  <SelectTrigger><SelectValue placeholder="Pilih outlet..." /></SelectTrigger>
                  <SelectContent>
                    {filteredOutlets.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Atasan / Supervisor">
                <Select value={supervisorId} onValueChange={setSupervisorId}>
                  <SelectTrigger><SelectValue placeholder="Tanpa atasan" /></SelectTrigger>
                  <SelectContent>
                    {supervisorCandidates.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.fullName} — {e.nik}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FormRow>
          </section>

          {/* Gaji */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gaji & Cuti</h3>
            <FormRow>
              <Field label="Tipe Gaji">
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
            <Field label="Saldo Cuti (hari)">
              <Input type="number" value={leaveBalance} onChange={(e) => setLeaveBalance(e.target.value)} className="tabular-nums" />
            </Field>
          </section>

          {/* Shift & Holiday */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shift &amp; Libur</h3>
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
          </section>

          <Field label="Catatan">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Catatan internal HRD..." />
          </Field>

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
