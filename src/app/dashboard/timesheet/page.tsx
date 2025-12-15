"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";

import {
  Lock,
  Unlock,
  Download,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Pencil,
  Save,
  X,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

type PayPeriod = {
  id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  period_type: "weekly" | "biweekly";
  is_locked: boolean;
  created_by: string;
};

type EntryRaw = {
  id: string;
  employee_id: string;
  property_id: string;
  clock_in: string;
  clock_out: string | null;
  status: "pending" | "approved" | string;
  approved_by: string | null;
  approved_at: string | null;
  pay_period_id: string | null;
  employee?: any; // join
  property?: any; // join
};

type Entry = {
  id: string;
  employee_id: string;
  property_id: string;
  clock_in: string;
  clock_out: string | null;
  status: "pending" | "approved" | string;
  approved_by: string | null;
  approved_at: string | null;
  pay_period_id: string | null;

  employee_name: string;
  property_name: string;

  // computed (per-day rule applied)
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;

  // for UI grouping
  date_key: string;
};

type Profile = {
  id: string;
  role: string | null;
};

type ExpandedKey = { employeeId: string; dateKey: string };

type GridRow = {
  employee_id: string;
  employee_name: string;
  days: Record<string, Entry[]>;
  totals: { reg: number; ot: number; total: number };
};

/* -------------------------------------------------------------------------- */
/* HELPERS */
/* -------------------------------------------------------------------------- */

function safeRelName(rel: any) {
  if (!rel) return "";
  if (Array.isArray(rel)) return rel?.[0]?.name ?? "";
  return rel?.name ?? "";
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toDateKeyLocal(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatDayLabel(dateKey: string) {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function clamp0(n: number) {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function hoursBetween(clockIn: string, clockOut: string | null) {
  if (!clockOut) return 0;
  const start = new Date(clockIn).getTime();
  const end = new Date(clockOut).getTime();
  const diffHours = (end - start) / 36e5;
  return clamp0(diffHours);
}

function dateRangeInclusive(start: string, end: string) {
  const out: string[] = [];
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`);
  }
  return out;
}

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function isDateBetweenInclusive(dateKey: string, from?: string, to?: string) {
  if (from && dateKey < from) return false;
  if (to && dateKey > to) return false;
  return true;
}

/**
 * ✅ Correct OT rule:
 * Per Employee + Per Day:
 * - First 8.00 hours = Regular
 * - Remaining = OT
 * Applied across multiple punches (sorted by time).
 */
function applyDailyRegOt(entries: Entry[]) {
  // Group by employee + date
  const groups = new Map<string, Entry[]>();

  for (const e of entries) {
    const key = `${e.employee_id}__${e.date_key}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }

  for (const list of groups.values()) {
    list.sort((a, b) => new Date(a.clock_in).getTime() - new Date(b.clock_in).getTime());

    let remainingReg = 8; // hours left for that day

    for (const e of list) {
      const duration = round2(hoursBetween(e.clock_in, e.clock_out)); // 0 if open punch

      const reg = round2(Math.min(remainingReg, duration));
      const ot = round2(Math.max(0, duration - reg));

      e.total_hours = round2(duration);
      e.regular_hours = reg;
      e.overtime_hours = ot;

      remainingReg = round2(Math.max(0, remainingReg - reg));
    }
  }

  return entries;
}

/* -------------------------------------------------------------------------- */
/* PAGE */
/* -------------------------------------------------------------------------- */

export default function TimesheetPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);

  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  const [propertyIds, setPropertyIds] = useState<string[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const [search, setSearch] = useState("");

  const [expandedCell, setExpandedCell] = useState<ExpandedKey | null>(null);

  const [overrideEdit, setOverrideEdit] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editClockIn, setEditClockIn] = useState<string>("");
  const [editClockOut, setEditClockOut] = useState<string>("");

  // ✅ Date range filter
  const [dateFrom, setDateFrom] = useState<string>(""); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState<string>(""); // YYYY-MM-DD

  /* -------------------------------------------------------------------------- */
  /* LOAD PROFILE + PROPERTIES + PAY PERIODS */
  /* -------------------------------------------------------------------------- */

  async function loadBootstrap() {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;

    const { data: prof } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .single();

    setProfile((prof as any) ?? { id: userId, role: "admin" });

    const { data: props } = await supabase
      .from("properties")
      .select("id")
      .eq("created_by", userId);

    setPropertyIds((props ?? []).map((p: any) => p.id));

    const { data: periods } = await supabase
      .from("pay_periods")
      .select("*")
      .eq("created_by", userId)
      .order("start_date", { ascending: false });

    const list = (periods ?? []) as PayPeriod[];
    setPayPeriods(list);

    const firstId = list?.[0]?.id ?? null;
    setSelectedPeriod((prev) => prev ?? firstId);

    // default filter range to current pay period
    const first = list?.[0];
    if (first) {
      setDateFrom((v) => v || first.start_date);
      setDateTo((v) => v || first.end_date);
    }
  }

  useEffect(() => {
    loadBootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------------------------------- */
  /* LOCK / UNLOCK + OVERRIDE */
  /* -------------------------------------------------------------------------- */

  const activePeriod = payPeriods.find((p) => p.id === selectedPeriod) || null;
  const isLocked = activePeriod?.is_locked ?? false;

  const isAdmin = (profile?.role ?? "admin") === "admin";
  const canEdit = !isLocked || (isAdmin && overrideEdit);

  async function toggleLock(lock: boolean) {
    if (!selectedPeriod) return;
    await supabase.from("pay_periods").update({ is_locked: lock }).eq("id", selectedPeriod);
    if (lock) setOverrideEdit(false);
    await loadBootstrap();
  }

  /* -------------------------------------------------------------------------- */
  /* LOAD ENTRIES (NAMES + CORRECT TIME CALC) */
  /* -------------------------------------------------------------------------- */

  async function loadEntries(periodId: string) {
    if (!propertyIds.length) {
      setEntries([]);
      return;
    }

    setLoadingEntries(true);

    const { data } = await supabase
      .from("time_entries")
      .select(
        `
        id,
        employee_id,
        property_id,
        clock_in,
        clock_out,
        status,
        approved_by,
        approved_at,
        pay_period_id,
        employee:employees(name),
        property:properties(name)
      `
      )
      .in("property_id", propertyIds)
      .or(`pay_period_id.eq.${periodId},pay_period_id.is.null`)
      .order("clock_in", { ascending: true });

    const raw = (data ?? []) as EntryRaw[];

    let normalized: Entry[] = raw.map((e) => {
      const date_key = toDateKeyLocal(e.clock_in);

      return {
        id: e.id,
        employee_id: e.employee_id,
        property_id: e.property_id,
        clock_in: e.clock_in,
        clock_out: e.clock_out,
        status: e.status,
        approved_by: e.approved_by,
        approved_at: e.approved_at,
        pay_period_id: e.pay_period_id,

        employee_name: safeRelName(e.employee) || "",
        property_name: safeRelName(e.property) || "",

        total_hours: 0,
        regular_hours: 0,
        overtime_hours: 0,

        date_key,
      };
    });

    // fallback maps for missing names
    const missingEmployeeIds = Array.from(
      new Set(normalized.filter((n) => !n.employee_name && n.employee_id).map((n) => n.employee_id))
    );

    const missingPropertyIds = Array.from(
      new Set(normalized.filter((n) => !n.property_name && n.property_id).map((n) => n.property_id))
    );

    const employeeMap: Record<string, string> = {};
    const propertyMap: Record<string, string> = {};

    if (missingEmployeeIds.length) {
      const { data: emps } = await supabase
        .from("employees")
        .select("id, name, property_id")
        .in("id", missingEmployeeIds)
        .in("property_id", propertyIds);
      (emps ?? []).forEach((r: any) => (employeeMap[r.id] = r.name));
    }

    if (missingPropertyIds.length) {
      const { data: props } = await supabase.from("properties").select("id, name").in("id", missingPropertyIds);
      (props ?? []).forEach((r: any) => (propertyMap[r.id] = r.name));
    }

    normalized = normalized.map((n) => ({
      ...n,
      employee_name: n.employee_name || employeeMap[n.employee_id] || "—",
      property_name: n.property_name || propertyMap[n.property_id] || "—",
    }));

    // ✅ Apply correct daily rule across punches
    normalized = applyDailyRegOt(normalized);

    setEntries(normalized);
    setLoadingEntries(false);
  }

  useEffect(() => {
    if (selectedPeriod) loadEntries(selectedPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, propertyIds]);

  /* -------------------------------------------------------------------------- */
  /* REALTIME */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!selectedPeriod) return;

    const ch = supabase
      .channel("timesheet-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "time_entries" }, () => {
        loadEntries(selectedPeriod);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pay_periods" }, () => {
        loadBootstrap();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, propertyIds]);

  /* -------------------------------------------------------------------------- */
  /* FILTERS */
  /* -------------------------------------------------------------------------- */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return entries.filter((e) => {
      if (!isDateBetweenInclusive(e.date_key, dateFrom || undefined, dateTo || undefined)) return false;

      if (!q) return true;
      return (
        (e.employee_name || "").toLowerCase().includes(q) ||
        (e.property_name || "").toLowerCase().includes(q)
      );
    });
  }, [entries, search, dateFrom, dateTo]);

  /* -------------------------------------------------------------------------- */
  /* GRID DATES (FROM FILTER RANGE IF SET, ELSE PERIOD RANGE) */
  /* -------------------------------------------------------------------------- */

  const dateColumns = useMemo(() => {
    const from = dateFrom || activePeriod?.start_date;
    const to = dateTo || activePeriod?.end_date;

    if (from && to) return dateRangeInclusive(from, to);

    const keys = Array.from(new Set(filtered.map((e) => e.date_key)));
    keys.sort();
    return keys;
  }, [dateFrom, dateTo, activePeriod?.start_date, activePeriod?.end_date, filtered]);

  /* -------------------------------------------------------------------------- */
  /* GROUP -> employee rows, date buckets */
  /* -------------------------------------------------------------------------- */

  const gridRows = useMemo(() => {
    const map = new Map<string, GridRow>();

    for (const e of filtered) {
      const dateKey = e.date_key;
      const key = e.employee_id;

      if (!map.has(key)) {
        map.set(key, {
          employee_id: e.employee_id,
          employee_name: e.employee_name || "—",
          days: {},
          totals: { reg: 0, ot: 0, total: 0 },
        });
      }

      const row = map.get(key)!;
      row.employee_name = row.employee_name || e.employee_name || "—";
      row.days[dateKey] ??= [];
      row.days[dateKey].push(e);

      row.totals.reg += e.regular_hours;
      row.totals.ot += e.overtime_hours;
      row.totals.total += e.total_hours;
    }

    for (const r of map.values()) {
      for (const k of Object.keys(r.days)) {
        r.days[k].sort((a, b) => new Date(a.clock_in).getTime() - new Date(b.clock_in).getTime());
      }
      r.totals.reg = round2(r.totals.reg);
      r.totals.ot = round2(r.totals.ot);
      r.totals.total = round2(r.totals.total);
    }

    const rows = Array.from(map.values());
    rows.sort((a, b) => a.employee_name.localeCompare(b.employee_name));
    return rows;
  }, [filtered]);

  const columnTotals = useMemo(() => {
    const totals: Record<string, { reg: number; ot: number; total: number }> = {};
    for (const d of dateColumns) totals[d] = { reg: 0, ot: 0, total: 0 };

    for (const e of filtered) {
      const d = e.date_key;
      totals[d] ??= { reg: 0, ot: 0, total: 0 };
      totals[d].reg += e.regular_hours;
      totals[d].ot += e.overtime_hours;
      totals[d].total += e.total_hours;
    }

    for (const k of Object.keys(totals)) {
      totals[k].reg = round2(totals[k].reg);
      totals[k].ot = round2(totals[k].ot);
      totals[k].total = round2(totals[k].total);
    }

    return totals;
  }, [filtered, dateColumns]);

  const grandTotals = useMemo(() => {
    return filtered.reduce(
      (acc, e) => {
        acc.reg += e.regular_hours;
        acc.ot += e.overtime_hours;
        acc.total += e.total_hours;
        return acc;
      },
      { reg: 0, ot: 0, total: 0 }
    );
  }, [filtered]);

  const activeEmployees = useMemo(() => filtered.filter((e) => e.clock_out === null), [filtered]);

  /* -------------------------------------------------------------------------- */
  /* EXPAND / COLLAPSE CELL */
  /* -------------------------------------------------------------------------- */

  function toggleExpand(employeeId: string, dateKey: string) {
    setExpandedCell((prev) => {
      if (prev?.employeeId === employeeId && prev?.dateKey === dateKey) return null;
      return { employeeId, dateKey };
    });
  }

  /* -------------------------------------------------------------------------- */
  /* INLINE APPROVAL */
  /* -------------------------------------------------------------------------- */

  async function toggleApproval(entry: Entry) {
    if (!canEdit) return;

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id ?? null;

    const approve = entry.status !== "approved";

    await supabase
      .from("time_entries")
      .update({
        status: approve ? "approved" : "pending",
        approved_by: approve ? userId : null,
        approved_at: approve ? new Date().toISOString() : null,
      })
      .eq("id", entry.id);
  }

  /* -------------------------------------------------------------------------- */
  /* BULK APPROVALS */
  /* -------------------------------------------------------------------------- */

  async function bulkApprove(entryIds: string[]) {
    if (!canEdit || entryIds.length === 0) return;

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id ?? null;

    await supabase
      .from("time_entries")
      .update({
        status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .in("id", entryIds);
  }

  async function approvePayroll() {
    await bulkApprove(filtered.filter((e) => e.status !== "approved").map((e) => e.id));
  }

  async function approveEmployee(employeeId: string) {
    await bulkApprove(
      filtered.filter((e) => e.employee_id === employeeId && e.status !== "approved").map((e) => e.id)
    );
  }

  async function approveEmployeeDay(employeeId: string, dateKey: string) {
    await bulkApprove(
      filtered
        .filter((e) => e.employee_id === employeeId && e.date_key === dateKey && e.status !== "approved")
        .map((e) => e.id)
    );
  }

  /* -------------------------------------------------------------------------- */
  /* INLINE EDIT PUNCH TIMES (+ recompute using daily rule by reloading) */
  /* -------------------------------------------------------------------------- */

  function startEdit(e: Entry) {
    setEditingId(e.id);
    setEditClockIn(toDatetimeLocalValue(e.clock_in));
    setEditClockOut(e.clock_out ? toDatetimeLocalValue(e.clock_out) : "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditClockIn("");
    setEditClockOut("");
  }

  async function saveEdit(entry: Entry) {
    if (!canEdit) return;

    const newClockIn = new Date(editClockIn).toISOString();
    const newClockOut = editClockOut ? new Date(editClockOut).toISOString() : null;

    await supabase
      .from("time_entries")
      .update({
        clock_in: newClockIn,
        clock_out: newClockOut,
        status: "pending",
        approved_by: null,
        approved_at: null,
      })
      .eq("id", entry.id);

    cancelEdit();

    // ✅ reload entries so daily rule recalculates properly for that employee/day
    if (selectedPeriod) loadEntries(selectedPeriod);
  }

  /* -------------------------------------------------------------------------- */
  /* EXPORTS */
  /* -------------------------------------------------------------------------- */

  function exportCSV() {
    const rows = [
      ["Employee", "Property", "Date", "Clock In", "Clock Out", "Reg", "OT", "Total", "Status"],
      ...filtered.map((e) => [
        e.employee_name,
        e.property_name,
        e.date_key,
        e.clock_in,
        e.clock_out ?? "",
        e.regular_hours.toFixed(2),
        e.overtime_hours.toFixed(2),
        e.total_hours.toFixed(2),
        e.status,
      ]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "payroll.csv";
    a.click();
  }

  function exportGridPDF() {
    const doc = new jsPDF("landscape");

    const title = activePeriod
      ? `Payroll Timesheet (${activePeriod.start_date} → ${activePeriod.end_date})`
      : "Payroll Timesheet";

    doc.setFontSize(12);
    doc.text(title, 14, 14);

    const head = [["Employee", ...dateColumns.map((d) => formatDayLabel(d)), "Reg", "OT", "Total"]];

    const body = gridRows.map((row) => {
      const dayCells = dateColumns.map((d) => {
        const punches = row.days[d] ?? [];
        if (!punches.length) return "—";
        return punches
          .map(
            (p) =>
              `${formatTime(p.clock_in)}-${formatTime(p.clock_out)} (${p.total_hours.toFixed(2)}h)`
          )
          .join("\n");
      });

      return [
        row.employee_name,
        ...dayCells,
        row.totals.reg.toFixed(2),
        row.totals.ot.toFixed(2),
        row.totals.total.toFixed(2),
      ];
    });

    autoTable(doc, {
      startY: 20,
      head,
      body,
      styles: { fontSize: 7, cellPadding: 2, valign: "top" },
      headStyles: { fillColor: [30, 41, 59] },
      theme: "grid",
      margin: { left: 8, right: 8 },
    });

    doc.save("payroll-timesheet-grid.pdf");
  }

  /* -------------------------------------------------------------------------- */
  /* UI */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4">
      {/* HEADER */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold">Timesheet & Payroll</h1>
          {activePeriod && (
            <p className="text-sm text-muted-foreground mt-1">
              {activePeriod.start_date} → {activePeriod.end_date}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button onClick={approvePayroll} disabled={!canEdit}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approve Payroll
          </Button>

          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>

          <Button variant="outline" onClick={exportGridPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Grid PDF
          </Button>

          {activePeriod && (
            <Button variant={isLocked ? "outline" : "destructive"} onClick={() => toggleLock(!isLocked)}>
              {isLocked ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
              {isLocked ? "Unlock Payroll" : "Lock Payroll"}
            </Button>
          )}

          {isLocked && <Badge variant="destructive">Payroll Locked</Badge>}

          {isLocked && isAdmin && (
            <Button
              variant={overrideEdit ? "default" : "outline"}
              onClick={() => setOverrideEdit((v) => !v)}
            >
              {overrideEdit ? "Editing Locked Payroll" : "Edit Locked Payroll"}
            </Button>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 pt-6 items-center">
          {/* Pay period */}
          <Select
            value={selectedPeriod ?? ""}
            onValueChange={(v) => {
              setSelectedPeriod(v);
              const p = payPeriods.find((x) => x.id === v);
              if (p) {
                setDateFrom(p.start_date);
                setDateTo(p.end_date);
              }
            }}
          >
            <SelectTrigger className="w-[360px]">
              <SelectValue placeholder="Select Pay Period" />
            </SelectTrigger>
            <SelectContent>
              {payPeriods.map((p, idx) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="inline-flex items-center gap-2">
                    {p.start_date} → {p.end_date}
                    {idx === 0 && <Badge>Current</Badge>}
                    {p.is_locked && <Badge variant="destructive">Locked</Badge>}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">From</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[170px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">To</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[170px]"
            />
          </div>

          {/* Search */}
          <Input
            placeholder="Search employee or property…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      {/* CURRENTLY CLOCKED IN */}
      {activeEmployees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Currently Clocked In
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {activeEmployees.map((e) => (
              <Badge key={e.id} variant="secondary" className="flex flex-col items-start">
                <span className="font-medium">{e.employee_name}</span>
                <span className="text-xs">{e.property_name}</span>
                <span className="text-xs opacity-70">{formatTime(e.clock_in)}</span>
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TOTALS */}
      <Card>
        <CardContent className="grid grid-cols-3 gap-4 pt-6 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Regular</p>
            <p className="text-xl font-bold">{round2(grandTotals.reg).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Overtime</p>
            <p className="text-xl font-bold text-amber-600">{round2(grandTotals.ot).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{round2(grandTotals.total).toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* MOBILE VIEW */}
      <div className="md:hidden space-y-4">
        {gridRows.map((row) => (
          <Card key={row.employee_id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{row.employee_name}</CardTitle>
              <Button size="sm" onClick={() => approveEmployee(row.employee_id)} disabled={!canEdit}>
                Approve
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {dateColumns.map((d) => {
                const punches = row.days[d];
                if (!punches?.length) return null;

                const dayReg = round2(punches.reduce((a, p) => a + p.regular_hours, 0));
                const dayOt = round2(punches.reduce((a, p) => a + p.overtime_hours, 0));
                const dayTotal = round2(punches.reduce((a, p) => a + p.total_hours, 0));

                return (
                  <div key={d} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{formatDayLabel(d)}</div>
                      <div className="font-semibold">{dayTotal.toFixed(2)}h</div>
                    </div>

                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>R {dayReg.toFixed(2)}</span>
                      <span className={dayOt > 0 ? "text-amber-600 font-medium" : ""}>
                        OT {dayOt.toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {punches.map((p) => (
                        <div key={p.id} className="rounded-md border px-3 py-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate">
                              {formatTime(p.clock_in)} → {formatTime(p.clock_out)}
                            </span>
                            <Badge
                              variant={p.status === "approved" ? "default" : "secondary"}
                              className="capitalize"
                            >
                              {p.status}
                            </Badge>
                          </div>

                          <div className="mt-1 flex justify-between text-xs">
                            <span>
                              R {p.regular_hours.toFixed(2)} • O {p.overtime_hours.toFixed(2)}
                            </span>
                            <span className="font-semibold">{p.total_hours.toFixed(2)}h</span>
                          </div>

                          <div className="mt-1 text-xs text-muted-foreground">{p.property_name}</div>

                          <div className="mt-2 flex gap-2">
                            <Button size="sm" onClick={() => toggleApproval(p)} disabled={!canEdit} className="flex-1">
                              {p.status === "approved" ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Unapprove
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Approve
                                </>
                              )}
                            </Button>

                            <Button size="sm" variant="outline" onClick={() => startEdit(p)} disabled={!canEdit}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => approveEmployeeDay(row.employee_id, d)}
                      disabled={!canEdit}
                    >
                      Approve Day
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DESKTOP GRID TABLE */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Payroll Grid</CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <div className="rounded-lg border overflow-hidden">
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="sticky left-0 z-20 bg-muted/40 w-64">Employee</TableHead>

                  {dateColumns.map((d) => (
                    <TableHead key={d} className="text-center whitespace-nowrap">
                      {formatDayLabel(d)}
                    </TableHead>
                  ))}

                  <TableHead className="text-center">Reg</TableHead>
                  <TableHead className="text-center">OT</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loadingEntries ? (
                  <TableRow>
                    <TableCell colSpan={1 + dateColumns.length + 3} className="text-center py-10 text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : gridRows.length ? (
                  <>
                    {gridRows.map((row) => (
                      <TableRow key={row.employee_id} className="odd:bg-muted/15">
                        <TableCell className="sticky left-0 z-10 bg-background">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium truncate">{row.employee_name}</div>
                              <div className="text-xs text-muted-foreground">
                                Reg {row.totals.reg.toFixed(2)} •{" "}
                                <span className={row.totals.ot > 0 ? "text-amber-600 font-medium" : ""}>
                                  OT {row.totals.ot.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => approveEmployee(row.employee_id)}
                              disabled={!canEdit}
                            >
                              Approve
                            </Button>
                          </div>
                        </TableCell>

                        {dateColumns.map((d) => {
                          const punches = row.days[d] ?? [];
                          const isExpanded =
                            expandedCell?.employeeId === row.employee_id && expandedCell?.dateKey === d;

                          const dayReg = round2(punches.reduce((a, p) => a + p.regular_hours, 0));
                          const dayOt = round2(punches.reduce((a, p) => a + p.overtime_hours, 0));
                          const dayTotal = round2(punches.reduce((a, p) => a + p.total_hours, 0));

                          return (
                            <TableCell key={d} className="align-top">
                              {punches.length ? (
                                <>
                                  <button
                                    className="w-full rounded-lg p-3 text-left hover:bg-muted/40 transition"
                                    onClick={() => toggleExpand(row.employee_id, d)}
                                    type="button"
                                  >
                                    <div className="flex justify-between items-baseline">
                                      <span className="text-lg font-semibold">{dayTotal.toFixed(2)}h</span>
                                      {dayOt > 0 && (
                                        <span className="text-xs font-medium text-amber-600">
                                          +{dayOt.toFixed(2)} OT
                                        </span>
                                      )}
                                    </div>

                                    <div className="mt-1 text-xs text-muted-foreground">
                                      R {dayReg.toFixed(2)} • O {dayOt.toFixed(2)}
                                    </div>

                                    <div className="mt-1 text-xs text-muted-foreground">
                                      {formatTime(punches[0].clock_in)} →{" "}
                                      {formatTime(punches[punches.length - 1].clock_out)}
                                    </div>
                                  </button>

                                  {isExpanded && (
                                    <div className="mt-2 space-y-2 border-t pt-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => approveEmployeeDay(row.employee_id, d)}
                                        disabled={!canEdit}
                                        className="w-full"
                                      >
                                        Approve Day
                                      </Button>

                                      {punches.map((p) => {
                                        const isEditing = editingId === p.id;

                                        return (
                                          <div key={p.id} className="rounded-xl border p-3 space-y-2 bg-background shadow-sm">
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="min-w-0">
                                                <div className="font-medium text-sm">
                                                  {formatTime(p.clock_in)} → {formatTime(p.clock_out)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{p.property_name}</div>
                                              </div>

                                              <Badge
                                                variant={p.status === "approved" ? "default" : "secondary"}
                                                className="capitalize"
                                              >
                                                {p.status}
                                              </Badge>
                                            </div>

                                            <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                                              <span>Reg: {p.regular_hours.toFixed(2)}</span>
                                              <span className={p.overtime_hours > 0 ? "text-amber-600 font-medium" : ""}>
                                                OT: {p.overtime_hours.toFixed(2)}
                                              </span>
                                              <span className="font-semibold text-foreground">
                                                Total: {p.total_hours.toFixed(2)}h
                                              </span>
                                            </div>

                                            {isEditing ? (
                                              <div className="space-y-2">
                                                <div className="grid grid-cols-1 gap-2">
                                                  <label className="text-xs text-muted-foreground">
                                                    Clock In
                                                    <Input
                                                      type="datetime-local"
                                                      value={editClockIn}
                                                      onChange={(e) => setEditClockIn(e.target.value)}
                                                      disabled={!canEdit}
                                                      className="mt-1"
                                                    />
                                                  </label>

                                                  <label className="text-xs text-muted-foreground">
                                                    Clock Out
                                                    <Input
                                                      type="datetime-local"
                                                      value={editClockOut}
                                                      onChange={(e) => setEditClockOut(e.target.value)}
                                                      disabled={!canEdit}
                                                      className="mt-1"
                                                    />
                                                  </label>
                                                </div>

                                                <div className="flex gap-2">
                                                  <Button size="sm" onClick={() => saveEdit(p)} disabled={!canEdit || !editClockIn}>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Save
                                                  </Button>
                                                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                                                    <X className="h-4 w-4 mr-2" />
                                                    Cancel
                                                  </Button>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="flex flex-wrap gap-2">
                                                <Button
                                                  size="sm"
                                                  variant={p.status === "approved" ? "outline" : "default"}
                                                  onClick={() => toggleApproval(p)}
                                                  disabled={!canEdit}
                                                >
                                                  {p.status === "approved" ? (
                                                    <>
                                                      <XCircle className="h-4 w-4 mr-2" />
                                                      Unapprove
                                                    </>
                                                  ) : (
                                                    <>
                                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                                      Approve
                                                    </>
                                                  )}
                                                </Button>

                                                <Button size="sm" variant="outline" onClick={() => startEdit(p)} disabled={!canEdit}>
                                                  <Pencil className="h-4 w-4 mr-2" />
                                                  Edit
                                                </Button>

                                                {!canEdit && (
                                                  <Badge variant="secondary" className="h-8 flex items-center">
                                                    Locked
                                                  </Badge>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-xs text-muted-foreground text-center py-4">—</div>
                              )}
                            </TableCell>
                          );
                        })}

                        <TableCell className="text-center font-medium">{row.totals.reg.toFixed(2)}</TableCell>
                        <TableCell className="text-center font-medium text-amber-600">{row.totals.ot.toFixed(2)}</TableCell>
                        <TableCell className="text-center font-bold">{row.totals.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}

                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell className="sticky left-0 z-20 bg-muted/50">TOTAL</TableCell>

                      {dateColumns.map((d) => (
                        <TableCell key={d} className="text-center">
                          {(columnTotals[d]?.total ?? 0).toFixed(2)}h
                          <div className="text-xs text-muted-foreground mt-0.5">
                            R:{(columnTotals[d]?.reg ?? 0).toFixed(2)} O:{(columnTotals[d]?.ot ?? 0).toFixed(2)}
                          </div>
                        </TableCell>
                      ))}

                      <TableCell className="text-center">{round2(grandTotals.reg).toFixed(2)}</TableCell>
                      <TableCell className="text-center text-amber-600">{round2(grandTotals.ot).toFixed(2)}</TableCell>
                      <TableCell className="text-center font-bold">{round2(grandTotals.total).toFixed(2)}</TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={1 + dateColumns.length + 3} className="text-center py-10 text-muted-foreground">
                      No time entries found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {isLocked && !overrideEdit && (
            <p className="text-sm text-muted-foreground mt-4">
              Payroll is locked. Approvals and edits are disabled.
              {isAdmin ? " Use “Edit Locked Payroll” to make corrections." : ""}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
