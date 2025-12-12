"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { User2, Plus } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type Employee = {
  id: string;
  name: string;
  pin: number | null;
  role: string | null;
  hourly_rate: number | null;
  is_active: boolean;
};

/* -------------------------------------------------------------------------- */
/*                                PAGE                                        */
/* -------------------------------------------------------------------------- */

export default function PropertyEmployeesPage() {
  const supabase = createClient();
  const params = useParams<{ propertyId: string }>();

  const propertyId = params.propertyId;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  /* -------------------------------------------------------------------------- */
  /*                               FETCH DATA                                   */
  /* -------------------------------------------------------------------------- */

  async function loadEmployees() {
    setLoading(true);

    const { data, error } = await supabase
      .from("employees")
      .select(`
        id,
        name,
        pin,
        role,
        hourly_rate,
        is_active
      `)
      .eq("property_id", propertyId)
      .order("name");

    if (error) {
      console.error("Error loading employees:", error);
      setEmployees([]);
    } else {
      setEmployees(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (propertyId) loadEmployees();
  }, [propertyId]);

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employees</h1>

        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add employee
        </Button>
      </div>

      {/* TABLE CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Property Staff</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>PIN</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Hourly Rate</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    Loading employees…
                  </TableCell>
                </TableRow>
              ) : employees.length > 0 ? (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="flex items-center gap-2 font-medium">
                      <User2 className="h-4 w-4 text-slate-500" />
                      {emp.name}
                    </TableCell>

                    <TableCell>
                      {emp.pin ? (
                        <span className="font-mono">{emp.pin}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>

                    <TableCell>{emp.role || "—"}</TableCell>

                    <TableCell>
                      {emp.hourly_rate ? `$${emp.hourly_rate}/hr` : "—"}
                    </TableCell>

                    <TableCell>
                      {emp.is_active ? (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No employees found for this property.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
