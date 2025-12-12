"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

import { CalendarClock, Printer } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                TYPES                                        */
/* -------------------------------------------------------------------------- */

type Entry = {
  id: string;
  clock_in: string;
  clock_out: string | null;
  employees: { name: string } | null;
  properties: { name: string } | null;
};

type Property = { id: string; name: string };
type Employee = { id: string; name: string; property_id: string };

/* -------------------------------------------------------------------------- */
/*                               MAIN PAGE                                     */
/* -------------------------------------------------------------------------- */

export default function TimesheetPage() {
  const supabase = createClient();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [propertyFilter, setPropertyFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* -------------------------------------------------------------------------- */
  /*                               LOAD DATA                                    */
  /* -------------------------------------------------------------------------- */

  async function loadData() {
    console.log("Fetching data...");

    const { data: props } = await supabase.from("properties").select("*");
    setProperties(props || []);

    const { data: emps } = await supabase.from("employees").select("*");
    setEmployees(emps || []);

    const { data: rawEntries, error } = await supabase
      .from("time_entries")
      .select(`
        id,
        clock_in,
        clock_out,
        employees:employee_id ( name ),
        properties:property_id ( name )
      `)
      .order("clock_in", { ascending: false });

    if (error) {
      console.error("Error loading entries:", error);
      setEntries([]);
      return;
    }

    // Normalize relation objects
    const normalized: Entry[] = (rawEntries || []).map((e: any) => ({
      id: e.id,
      clock_in: e.clock_in,
      clock_out: e.clock_out,
      employees: e.employees ? { name: e.employees.name } : null,
      properties: e.properties ? { name: e.properties.name } : null,
    }));

    console.log("Normalized entries:", normalized);
    setEntries(normalized);
  }

  useEffect(() => {
    loadData();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                        FILTER LOGIC WITH DATE RANGE                        */
  /* -------------------------------------------------------------------------- */

  const filteredEntries = entries.filter((e) => {
    const propertyOK =
      propertyFilter === "all" ||
      e.properties?.name === properties.find((p) => p.id === propertyFilter)?.name;

    const employeeOK =
      employeeFilter === "all" ||
      e.employees?.name === employees.find((emp) => emp.id === employeeFilter)?.name;

    const ci = new Date(e.clock_in).getTime();
    const co = e.clock_out ? new Date(e.clock_out).getTime() : null;

    let insideDate = true;

    if (fromDate) {
      const from = new Date(fromDate).setHours(0, 0, 0, 0);
      insideDate = ci >= from || (co !== null && co >= from);
    }
    if (toDate) {
      const to = new Date(toDate).setHours(23, 59, 59, 999);
      insideDate = insideDate && (ci <= to || (co !== null && co <= to));
    }

    return propertyOK && employeeOK && insideDate;
  });

  /* -------------------------------------------------------------------------- */
  /*                           CALCULATE TOTAL HOURS                             */
  /* -------------------------------------------------------------------------- */

  function getTotalHoursForEntry(e: Entry) {
    if (!e.clock_out) return 0;

    return (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000;
  }

  const totalHours = filteredEntries
    .reduce((sum, e) => sum + getTotalHoursForEntry(e), 0)
    .toFixed(2);

  /* -------------------------------------------------------------------------- */
  /*                          PRINT FUNCTION                                    */
  /* -------------------------------------------------------------------------- */

  const handlePrint = () => {
    const tableHTML = document.getElementById("timesheet-table")?.innerHTML;

    const printWindow = window.open("", "PRINT", "height=700,width=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
      <head>
        <title>Timesheet Report</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          h2 { margin-bottom: 4px; }
          .sub { margin-bottom: 20px; font-size: 14px; color: #444; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; border: 1px solid #ccc; }
          th { background: #f4f4f4; }
          tfoot td { font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>Timesheet Report</h2>
        <div class="sub">
          Date Range: ${fromDate || "—"} → ${toDate || "—"} <br/>
          Property: ${propertyFilter === "all" ? "All" : properties.find(p => p.id === propertyFilter)?.name} <br/>
          Employee: ${employeeFilter === "all" ? "All" : employees.find(e => e.id === employeeFilter)?.name}
        </div>
        <table>
          ${tableHTML}
        </table>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  /* -------------------------------------------------------------------------- */
  /*                                 UI                                         */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-semibold">Employee Timesheet Report</h1>

        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer size={18} />
          Export / Print
        </Button>
      </div>

      {/* FILTER CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">

          {/* Date From */}
          <div className="flex flex-col">
            <label className="text-sm text-slate-600">From Date</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>

          {/* Date To */}
          <div className="flex flex-col">
            <label className="text-sm text-slate-600">To Date</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>

          {/* Property */}
          <div className="flex flex-col">
            <label className="text-sm text-slate-600">Property</label>
            <Select defaultValue="all" onValueChange={setPropertyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map((p) => (
                  <SelectItem value={p.id} key={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employee */}
          <div className="flex flex-col">
            <label className="text-sm text-slate-600">Employee</label>
            <Select defaultValue="all" onValueChange={setEmployeeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((e) => (
                  <SelectItem value={e.id} key={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock size={20} /> Time Entries
          </CardTitle>
        </CardHeader>

        <CardContent>
          <ScrollArea className="max-h-[500px] rounded-md border">

            <Table id="timesheet-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Total Hours</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredEntries.length > 0 ? (
                  filteredEntries.map((entry) => {
                    const ci = new Date(entry.clock_in);
                    const co = entry.clock_out ? new Date(entry.clock_out) : null;

                    const hours = getTotalHoursForEntry(entry).toFixed(2);

                    return (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.employees?.name || "-"}</TableCell>
                        <TableCell>{entry.properties?.name || "-"}</TableCell>
                        <TableCell>{ci.toLocaleString()}</TableCell>
                        <TableCell>{co ? co.toLocaleString() : "In Progress"}</TableCell>
                        <TableCell>{co ? hours : "-"}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                      No entries found.
                    </TableCell>
                  </TableRow>
                )}

                {filteredEntries.length > 0 && (
                  <TableRow className="bg-slate-100 font-bold">
                    <TableCell colSpan={4}>Total Hours</TableCell>
                    <TableCell>{totalHours}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
