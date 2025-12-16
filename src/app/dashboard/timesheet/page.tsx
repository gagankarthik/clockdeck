"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Pencil, Save, X, Download, ChevronLeft, ChevronRight, Trash2
} from "lucide-react";

/* ================= HELPERS ================= */

const hoursBetween = (a: string, b: string | null) =>
  b ? Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 36e5) : 0;

const fmt = (t?: string | null) =>
  t ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

function startOfWeek(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function weekDates(base: Date) {
  const s = startOfWeek(base);
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(s);
    d.setDate(s.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

/* ================= PAGE ================= */

export default function TimesheetPage() {
  const supabase = createClient();

  const [weekBase, setWeekBase] = useState(new Date());
  const dates = weekDates(weekBase);
  const todayKey = new Date().toISOString().slice(0, 10);

  const [entries, setEntries] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [editIn, setEditIn] = useState("");
  const [editOut, setEditOut] = useState("");

  const [from, setFrom] = useState(dates[0]);
  const [to, setTo] = useState(dates[6]);
  const [search, setSearch] = useState("");
  const [property, setProperty] = useState("all");

  /* ============ LOAD DATA ============ */

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const { data } = await supabase
      .from("time_entries")
      .select(`
        id,
        clock_in,
        clock_out,
        employee:employees(id,name,role),
        property:properties(id,name)
      `)
      .eq("created_by", auth.user.id)
      .gte("clock_in", from)
      .lte("clock_in", `${to}T23:59:59`)
      .order("clock_in");

    setEntries(data ?? []);
  }

  useEffect(() => { load(); }, [from, to]);

  /* ============ FILTERING ============ */

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (!e.employee || !e.property) return false;
      if (search && !e.employee.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (property !== "all" && e.property.name !== property) return false;
      return true;
    });
  }, [entries, search, property]);

  const properties = [...new Set(entries.map(e => e.property?.name).filter(Boolean))];

  const todayEntries = filtered.filter(e => e.clock_in.startsWith(todayKey));

  /* ============ WEEK GRID (MULTI-SHIFT) ============ */

  const grid = useMemo(() => {
    const map: any = {};

    filtered.forEach(e => {
      const empId = e.employee.id;
      const day = e.clock_in.slice(0, 10);

      map[empId] ??= {
        name: e.employee.name,
        role: e.employee.role,
        days: {},
        total: 0,
      };

      map[empId].days[day] ??= [];

      const hrs = hoursBetween(e.clock_in, e.clock_out);
      map[empId].days[day].push({ ...e, hrs });
      map[empId].total += hrs;
    });

    return Object.values(map);
  }, [filtered]);

  /* ============ EDIT / DELETE ============ */

  const startEdit = (e: any) => {
    setEditing(e);
    setEditIn(e.clock_in.slice(0, 16));
    setEditOut(e.clock_out ? e.clock_out.slice(0, 16) : "");
  };

  const saveEdit = async () => {
    await supabase.from("time_entries").update({
      clock_in: new Date(editIn).toISOString(),
      clock_out: editOut ? new Date(editOut).toISOString() : null,
    }).eq("id", editing.id);

    setEditing(null);
    load();
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Delete this time entry?")) return;
    await supabase.from("time_entries").delete().eq("id", id);
    load();
  };

  /* ================= UI ================= */

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6">
      <h1 className="text-3xl font-semibold">Timesheets</h1>

      {/* FILTERS */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">From</label>
              <Input type="date" value={from} onChange={e=>setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">To</label>
              <Input type="date" value={to} onChange={e=>setTo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Employee</label>
              <Input placeholder="Search employee" value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Property</label>
              <Select value={property} onValueChange={setProperty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {properties.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              const d = new Date(weekBase);
              d.setDate(d.getDate() - 7);
              setWeekBase(d);
              setFrom(weekDates(d)[0]);
              setTo(weekDates(d)[6]);
            }}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>

            <Button variant="outline" onClick={() => {
              const d = new Date(weekBase);
              d.setDate(d.getDate() + 7);
              setWeekBase(d);
              setFrom(weekDates(d)[0]);
              setTo(weekDates(d)[6]);
            }}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* TODAY */}
      <Card>
        <CardHeader><CardTitle>Today</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>In</TableHead>
                <TableHead>Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayEntries.map(e => (
                <TableRow key={e.id}>
                  <TableCell>{e.employee.name}</TableCell>
                  <TableCell>{e.employee.role ?? "—"}</TableCell>
                  <TableCell>{e.property.name}</TableCell>
                  <TableCell>{fmt(e.clock_in)}</TableCell>
                  <TableCell>{fmt(e.clock_out)}</TableCell>
                  <TableCell>{hoursBetween(e.clock_in,e.clock_out).toFixed(2)}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={()=>startEdit(e)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={()=>deleteEntry(e.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* WEEK GRID */}
      <Card>
        <CardHeader><CardTitle>Weekly Overview</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                {dates.map(d => <TableHead key={d} className="text-center">{d}</TableHead>)}
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grid.map((g:any)=>(
                <TableRow key={g.name}>
                  <TableCell>
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-muted-foreground">{g.role ?? "—"}</div>
                  </TableCell>

                  {dates.map(d => (
                    <TableCell key={d} className="align-top space-y-2">
                      {(g.days[d] ?? []).map((c:any) => (
                        <div key={c.id} className="border rounded-md p-2 text-xs">
                          <div>{fmt(c.clock_in)}–{fmt(c.clock_out)}</div>
                          <div className="flex justify-between items-center">
                            <span>{c.hrs.toFixed(2)}h</span>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={()=>startEdit(c)}><Pencil className="h-3 w-3" /></Button>
                              <Button size="sm" variant="ghost" onClick={()=>deleteEntry(c.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </TableCell>
                  ))}

                  <TableCell className="font-semibold">{g.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* EDITOR */}
      {editing && (
        <Card className="fixed bottom-4 right-4 w-[320px] shadow-xl">
          <CardContent className="pt-6 space-y-2">
            <Input type="datetime-local" value={editIn} onChange={e=>setEditIn(e.target.value)} />
            <Input type="datetime-local" value={editOut} onChange={e=>setEditOut(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={saveEdit}><Save className="h-4 w-4 mr-1" />Save</Button>
              <Button variant="outline" onClick={()=>setEditing(null)}><X className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
