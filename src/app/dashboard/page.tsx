"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

/* ===================== HELPERS ===================== */

const pad2 = (n: number) => String(n).padStart(2, "0");
const toYMD = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

function startOfWeek(base = new Date()) {
  const d = new Date(base);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfWeek(base = new Date()) {
  const e = new Date(startOfWeek(base));
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}
function weekLabel(from: string, to: string) {
  return `${from} → ${to}`;
}
function hoursBetween(aISO: string, bISO: string | null) {
  if (!bISO) return 0;
  const a = new Date(aISO).getTime();
  const b = new Date(bISO).getTime();
  return Math.max(0, (b - a) / 36e5);
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/* ===================== TYPES ===================== */

type TimeEntry = {
  id: string;
  employee_id: string;
  property_id: string;
  clock_in: string;
  clock_out: string | null;
  created_by: string | null;
};

type Employee = {
  id: string;
  name: string;
  role: string | null;
  hourly_rate: number | null;
  is_active: boolean | null;
};

type Property = {
  id: string;
  name: string;
};

type TodayRow = {
  id: string;
  employee: string;
  role: string;
  property: string;
  clock_in: string;
  clock_out: string;
  hours: number;
};

export default function DashboardPage() {
  const supabase = createClient();

  // range default: current week
  const [weekBase, setWeekBase] = useState<Date>(() => new Date());
  const [from, setFrom] = useState<string>(() => toYMD(startOfWeek()));
  const [to, setTo] = useState<string>(() => toYMD(endOfWeek()));

  const [loading, setLoading] = useState(false);

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<Record<string, Employee>>({});
  const [properties, setProperties] = useState<Record<string, Property>>({});

  // filters
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [employeeSearch, setEmployeeSearch] = useState<string>("");

  /* ===================== LOAD DATA ===================== */

  async function loadDashboard() {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;

    if (!uid) {
      setEntries([]);
      setEmployees({});
      setProperties({});
      setLoading(false);
      return;
    }

    // Pull time entries for this admin (created_by)
    // Use local-safe boundaries (avoid UTC week mismatch)
    const fromISO = `${from}T00:00:00`;
    const toISO = `${to}T23:59:59`;

    const { data: te, error: teErr } = await supabase
      .from("time_entries")
      .select("id, employee_id, property_id, clock_in, clock_out, created_by")
      .eq("created_by", uid)
      .gte("clock_in", fromISO)
      .lte("clock_in", toISO)
      .order("clock_in", { ascending: false });

    if (teErr) {
      console.error("time_entries error:", teErr);
      setEntries([]);
      setEmployees({});
      setProperties({});
      setLoading(false);
      return;
    }

    const timeEntries = (te ?? []) as TimeEntry[];
    setEntries(timeEntries);

    const employeeIds = Array.from(new Set(timeEntries.map((e) => e.employee_id))).filter(Boolean);
    const propertyIds = Array.from(new Set(timeEntries.map((e) => e.property_id))).filter(Boolean);

    // employees
    const { data: emps, error: empErr } = await supabase
      .from("employees")
      .select("id, name, role, hourly_rate, is_active")
      .in("id", employeeIds.length ? employeeIds : ["00000000-0000-0000-0000-000000000000"]);

    if (empErr) console.error("employees error:", empErr);

    const empMap: Record<string, Employee> = {};
    (emps ?? []).forEach((e: any) => {
      empMap[e.id] = {
        id: e.id,
        name: e.name ?? "—",
        role: e.role ?? null,
        hourly_rate: e.hourly_rate ?? null,
        is_active: e.is_active ?? null,
      };
    });
    setEmployees(empMap);

    // properties
    const { data: props, error: propErr } = await supabase
      .from("properties")
      .select("id, name")
      .in("id", propertyIds.length ? propertyIds : ["00000000-0000-0000-0000-000000000000"]);

    if (propErr) console.error("properties error:", propErr);

    const propMap: Record<string, Property> = {};
    (props ?? []).forEach((p: any) => {
      propMap[p.id] = { id: p.id, name: p.name ?? "—" };
    });
    setProperties(propMap);

    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  /* ===================== WEEK NAV ===================== */

  function goWeek(delta: number) {
    const base = new Date(weekBase);
    base.setDate(base.getDate() + delta * 7);
    setWeekBase(base);

    const s = startOfWeek(base);
    const e = endOfWeek(base);
    setFrom(toYMD(s));
    setTo(toYMD(e));
  }

  /* ===================== FILTERED ENTRIES ===================== */

  const propertyOptions = useMemo(() => {
    const list = Object.values(properties)
      .map((p) => p.name)
      .filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [properties]);

  const filteredEntries = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    return entries.filter((e) => {
      const emp = employees[e.employee_id];
      const prop = properties[e.property_id];

      if (propertyFilter !== "all") {
        const pname = prop?.name ?? "";
        if (pname !== propertyFilter) return false;
      }

      if (q) {
        const ename = (emp?.name ?? "").toLowerCase();
        const prole = (emp?.role ?? "").toLowerCase();
        const pname = (prop?.name ?? "").toLowerCase();
        if (!ename.includes(q) && !pname.includes(q) && !prole.includes(q)) return false;
      }

      return true;
    });
  }, [entries, employees, properties, propertyFilter, employeeSearch]);

  /* ===================== KPIs ===================== */

  const kpis = useMemo(() => {
    const totalHours = round2(
      filteredEntries.reduce((s, e) => s + hoursBetween(e.clock_in, e.clock_out), 0)
    );

    const activeShifts = filteredEntries.filter((e) => e.clock_out === null).length;

    const employeeSet = new Set(filteredEntries.map((e) => e.employee_id));
    const employeesWorked = employeeSet.size;

    const payroll = round2(
      filteredEntries.reduce((s, e) => {
        const hrs = hoursBetween(e.clock_in, e.clock_out);
        const rate = Number(employees[e.employee_id]?.hourly_rate ?? 0);
        return s + hrs * rate;
      }, 0)
    );

    return { totalHours, activeShifts, employeesWorked, payroll };
  }, [filteredEntries, employees]);

  /* ===================== CHARTS ===================== */

  // hours + payroll by day for selected range
  const byDay = useMemo(() => {
    // build day list from from..to
    const out: Record<string, { day: string; hours: number; payroll: number }> = {};

    const s = new Date(`${from}T00:00:00`);
    const e = new Date(`${to}T00:00:00`);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const key = toYMD(d);
      out[key] = { day: key.slice(5), hours: 0, payroll: 0 };
    }

    for (const t of filteredEntries) {
      const dayKey = toYMD(new Date(t.clock_in));
      if (!out[dayKey]) continue;
      const hrs = hoursBetween(t.clock_in, t.clock_out);
      const rate = Number(employees[t.employee_id]?.hourly_rate ?? 0);
      out[dayKey].hours += hrs;
      out[dayKey].payroll += hrs * rate;
    }

    return Object.values(out).map((x) => ({
      ...x,
      hours: round2(x.hours),
      payroll: round2(x.payroll),
    }));
  }, [filteredEntries, employees, from, to]);

  const byProperty = useMemo(() => {
    const out: Record<string, number> = {};
    for (const t of filteredEntries) {
      const pname = properties[t.property_id]?.name ?? "—";
      const hrs = hoursBetween(t.clock_in, t.clock_out);
      out[pname] = (out[pname] ?? 0) + hrs;
    }
    return Object.entries(out)
      .map(([name, value]) => ({ name, value: round2(value) }))
      .sort((a, b) => b.value - a.value);
  }, [filteredEntries, properties]);

  /* ===================== TODAY TABLE ===================== */

  const todayKey = toYMD(new Date());

  const todayRows: TodayRow[] = useMemo(() => {
    const list = filteredEntries
      .filter((e) => toYMD(new Date(e.clock_in)) === todayKey)
      .map((e) => {
        const emp = employees[e.employee_id];
        const prop = properties[e.property_id];

        return {
          id: e.id,
          employee: emp?.name ?? "—",
          role: emp?.role ?? "—",
          property: prop?.name ?? "—",
          clock_in: new Date(e.clock_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          clock_out: e.clock_out
            ? new Date(e.clock_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "—",
          hours: round2(hoursBetween(e.clock_in, e.clock_out)),
        };
      })
      .sort((a, b) => a.employee.localeCompare(b.employee));

    return list;
  }, [filteredEntries, employees, properties, todayKey]);

  /* ===================== EXPORT CSV ===================== */

  function exportCSV() {
    const header = ["Date", "Employee", "Role", "Property", "Clock In", "Clock Out", "Hours", "Rate", "Pay"];
    const rows = filteredEntries.map((e) => {
      const emp = employees[e.employee_id];
      const prop = properties[e.property_id];
      const hrs = round2(hoursBetween(e.clock_in, e.clock_out));
      const rate = Number(emp?.hourly_rate ?? 0);
      const pay = round2(hrs * rate);

      return [
        toYMD(new Date(e.clock_in)),
        emp?.name ?? "—",
        emp?.role ?? "",
        prop?.name ?? "—",
        e.clock_in,
        e.clock_out ?? "",
        hrs.toFixed(2),
        rate.toFixed(2),
        pay.toFixed(2),
      ];
    });

    const csv = [header, ...rows]
      .map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dashboard-${from}-to-${to}.csv`;
    a.click();
  }

  /* ===================== UI ===================== */

  return (
    <div className="max-w-7xl mx-auto px-4 pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4" />
            {weekLabel(from, to)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" onClick={() => goWeek(-1)}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Prev
          </Button>
          <Button variant="outline" onClick={() => goWeek(1)}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" onClick={loadDashboard} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={exportCSV}>Export CSV</Button>
          {loading ? <Badge variant="secondary">Loading…</Badge> : <Badge variant="secondary">Ready</Badge>}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-3">
              <label className="text-xs text-muted-foreground">From</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <label className="text-xs text-muted-foreground">To</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>

            <div className="md:col-span-3">
              <label className="text-xs text-muted-foreground">Property</label>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {propertyOptions.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <label className="text-xs text-muted-foreground">Search</label>
              <Input
                placeholder="Employee / Role / Property"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi title="Payroll" value={`$${kpis.payroll.toFixed(2)}`} icon={<DollarSign className="h-5 w-5" />} />
        <Kpi title="Total Hours" value={kpis.totalHours.toFixed(2)} icon={<Clock className="h-5 w-5" />} />
        <Kpi title="Active Shifts" value={kpis.activeShifts} icon={<Clock className="h-5 w-5" />} />
        <Kpi title="Employees Worked" value={kpis.employeesWorked} icon={<Users className="h-5 w-5" />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Hours by Day</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="hours" name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Payroll by Day</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line dataKey="payroll" name="Payroll ($)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-12">
          <CardHeader>
            <CardTitle>Hours by Property</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            {byProperty.length ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                <div className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip />
                      <Legend />
                      <Pie data={byProperty} dataKey="value" nameKey="name" outerRadius={110} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="border rounded-lg overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead className="text-right">Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byProperty.map((p) => (
                        <TableRow key={p.name}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right">{p.value.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No data for this range.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today’s Entries</CardTitle>
          <Badge variant="secondary">{todayKey}</Badge>
        </CardHeader>
        <CardContent className="overflow-auto">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead className="text-right">In</TableHead>
                  <TableHead className="text-right">Out</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : todayRows.length ? (
                  todayRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.employee}</TableCell>
                      <TableCell>{r.role}</TableCell>
                      <TableCell>{r.property}</TableCell>
                      <TableCell className="text-right">{r.clock_in}</TableCell>
                      <TableCell className="text-right">{r.clock_out}</TableCell>
                      <TableCell className="text-right font-semibold">{r.hours.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No entries today.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Raw entries preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Entries (Filtered Range)</CardTitle>
          <Badge variant="secondary">{filteredEntries.length} rows</Badge>
        </CardHeader>
        <CardContent className="overflow-auto">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Pay</TableHead>
                  <TableHead className="text-right">Clock In</TableHead>
                  <TableHead className="text-right">Clock Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : filteredEntries.length ? (
                  filteredEntries.slice(0, 50).map((e) => {
                    const emp = employees[e.employee_id];
                    const prop = properties[e.property_id];
                    const hrs = round2(hoursBetween(e.clock_in, e.clock_out));
                    const rate = Number(emp?.hourly_rate ?? 0);
                    const pay = round2(hrs * rate);
                    const date = toYMD(new Date(e.clock_in));

                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{date}</TableCell>
                        <TableCell>{emp?.name ?? "—"}</TableCell>
                        <TableCell>{prop?.name ?? "—"}</TableCell>
                        <TableCell className="text-right">{hrs.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">${pay.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{e.clock_in}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{e.clock_out ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No data in this range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredEntries.length > 50 && (
            <p className="text-xs text-muted-foreground mt-2">
              Showing first 50 rows. Export CSV to download everything.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ===================== UI ===================== */

function Kpi({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
