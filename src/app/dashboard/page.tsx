"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  DollarSign,
  Clock,
  Users,
  AlertCircle,
} from "lucide-react";

/* ================= HELPERS ================= */

const pad2 = (n: number) => String(n).padStart(2, "0");
const toYMD = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const startOfWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const s = new Date(d.setDate(diff));
  s.setHours(0, 0, 0, 0);
  return s;
};

const endOfWeek = () => {
  const e = new Date(startOfWeek());
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
};

const hoursBetween = (a: string, b: string | null) => {
  if (!b) return 0;
  return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 36e5);
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/* ================= TYPES ================= */

type Row = {
  employee_id: string;
  employee_name: string;
  property_name: string;
  rate: number;
  regular: number;
  overtime: number;
  gross_hours: number;
  gross_pay: number;
  status: string;
};

/* ================= PAGE ================= */

export default function PayrollDashboard() {
  const supabase = createClient();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const weekStart = startOfWeek();
  const weekEnd = endOfWeek();

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    (async () => {
      setLoading(true);

      /* ---------- CURRENT USER ---------- */
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        setRows([]);
        setLoading(false);
        return;
      }

      /* ---------- USER PROPERTIES ---------- */
      const { data: properties } = await supabase
        .from("properties")
        .select("id, name")
        .eq("created_by", userId);

      if (!properties?.length) {
        setRows([]);
        setLoading(false);
        return;
      }

      const propertyIds = properties.map(p => p.id);
      const propMap = Object.fromEntries(properties.map(p => [p.id, p.name]));

      /* ---------- TIME ENTRIES (CURRENT WEEK, USER DATA ONLY) ---------- */
      const { data: entries } = await supabase
        .from("time_entries")
        .select(`
          id,
          employee_id,
          property_id,
          clock_in,
          clock_out,
          status
        `)
        .in("property_id", propertyIds)
        .gte("clock_in", weekStart.toISOString())
        .lte("clock_in", weekEnd.toISOString());

      if (!entries?.length) {
        setRows([]);
        setLoading(false);
        return;
      }

      /* ---------- EMPLOYEES ---------- */
      const employeeIds = [...new Set(entries.map(e => e.employee_id))];

      const { data: employees } = await supabase
        .from("employees")
        .select("id, name, hourly_rate, property_id")
        .in("id", employeeIds);

      const empMap = Object.fromEntries(
        (employees ?? []).map(e => [e.id, e])
      );

      /* ---------- DAILY REG / OT LOGIC ---------- */
      const dailyBuckets = new Map<string, typeof entries>();

      for (const e of entries) {
        const day = toYMD(new Date(e.clock_in));
        const key = `${e.employee_id}_${day}`;
        if (!dailyBuckets.has(key)) dailyBuckets.set(key, []);
        dailyBuckets.get(key)!.push(e);
      }

      const result = new Map<string, Row>();

      for (const punches of dailyBuckets.values()) {
        punches.sort(
          (a, b) =>
            new Date(a.clock_in).getTime() -
            new Date(b.clock_in).getTime()
        );

        let remainingReg = 8;

        for (const p of punches) {
          const dur = round2(hoursBetween(p.clock_in, p.clock_out));
          if (dur === 0) continue;

          const reg = Math.min(remainingReg, dur);
          const ot = Math.max(0, dur - reg);
          remainingReg -= reg;

          const emp = empMap[p.employee_id];
          const rate = Number(emp?.hourly_rate ?? 0);
          const grossPay = reg * rate + ot * rate * 1.5;

          if (!result.has(p.employee_id)) {
            result.set(p.employee_id, {
              employee_id: p.employee_id,
              employee_name: emp?.name ?? "Unknown",
              property_name: propMap[p.property_id] ?? "—",
              rate,
              regular: 0,
              overtime: 0,
              gross_hours: 0,
              gross_pay: 0,
              status: p.status === "approved" ? "approved" : "pending",
            });
          }

          const r = result.get(p.employee_id)!;
          r.regular += reg;
          r.overtime += ot;
          r.gross_hours += reg + ot;
          r.gross_pay += grossPay;
          if (p.status !== "approved") r.status = "pending";
        }
      }

      setRows(
        Array.from(result.values()).map(r => ({
          ...r,
          regular: round2(r.regular),
          overtime: round2(r.overtime),
          gross_hours: round2(r.gross_hours),
          gross_pay: round2(r.gross_pay),
        }))
      );

      setLoading(false);
    })();
  }, []);

  /* ================= FILTER ================= */

  const filtered = useMemo(() => {
    if (!search) return rows;
    return rows.filter(
      r =>
        r.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        r.property_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  const totals = useMemo(
    () => ({
      payroll: filtered.reduce((s, r) => s + r.gross_pay, 0),
      hours: filtered.reduce((s, r) => s + r.gross_hours, 0),
      pending: filtered.filter(r => r.status === "pending").length,
      employees: filtered.length,
    }),
    [filtered]
  );

  /* ================= UI ================= */

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4">
      <Card>
        <CardContent className="p-4">
          <p className="font-semibold">Payroll Dashboard</p>
          <p className="text-xs text-muted-foreground">
            Current Week ({toYMD(weekStart)} → {toYMD(weekEnd)})
          </p>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi title="Payroll" value={`$${totals.payroll.toFixed(2)}`} icon={<DollarSign />} />
        <Kpi title="Gross Hours" value={totals.hours.toFixed(2)} icon={<Clock />} />
        <Kpi title="Pending" value={totals.pending} icon={<AlertCircle />} />
        <Kpi title="Employees" value={totals.employees} icon={<Users />} />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <Input
            placeholder="Search employee or property"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-sm"
          />

          <div className="border rounded-lg overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Employee</th>
                  <th className="px-4 py-2 text-left">Property</th>
                  <th className="px-4 py-2 text-right">Rate</th>
                  <th className="px-4 py-2 text-right">Reg</th>
                  <th className="px-4 py-2 text-right">OT</th>
                  <th className="px-4 py-2 text-right">Hours</th>
                  <th className="px-4 py-2 text-right">Gross</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-10">Loading…</td></tr>
                ) : filtered.length ? (
                  filtered.map(r => (
                    <tr key={r.employee_id} className="border-b">
                      <td className="px-4 py-2 font-medium">{r.employee_name}</td>
                      <td className="px-4 py-2">{r.property_name}</td>
                      <td className="px-4 py-2 text-right">${r.rate.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{r.regular.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{r.overtime.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{r.gross_hours.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-semibold">${r.gross_pay.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <Badge variant={r.status === "approved" ? "default" : "secondary"}>
                          {r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================= SMALL ================= */

function Kpi({ title, value, icon }: any) {
  return (
    <Card>
      <CardContent className="p-4 flex justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
