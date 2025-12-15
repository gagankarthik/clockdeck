"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { User2, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";

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
  const router = useRouter();
  const params = useParams();

  const propertyId = params?.propertyId as string;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  /* -------------------------------------------------------------------------- */
  /*                               FETCH DATA                                   */
  /* -------------------------------------------------------------------------- */

  async function loadEmployees() {
    if (!propertyId) return;

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
      console.error(error);
      setEmployees([]);
    } else {
      setEmployees(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadEmployees();
  }, [propertyId]);

  /* -------------------------------------------------------------------------- */
  /*                                ACTIONS                                     */
  /* -------------------------------------------------------------------------- */

  async function addEmployee(formData: FormData) {
    const name = String(formData.get("name") || "").trim();
    const pin = Number(formData.get("pin"));
    const role = String(formData.get("role") || "").trim();
    const hourlyRate = Number(formData.get("hourly_rate") || 0);

    if (!name || !pin) return;

    // 🔐 PIN uniqueness per property
    const { data: conflict } = await supabase
      .from("employees")
      .select("id")
      .eq("property_id", propertyId)
      .eq("pin", pin)
      .maybeSingle();

    if (conflict) {
      alert("PIN already exists for this property");
      return;
    }

    await supabase.from("employees").insert({
      name,
      pin,
      role: role || null,
      hourly_rate: hourlyRate || null,
      is_active: true,
      property_id: propertyId, // ✅ ALWAYS THIS PROPERTY
    });

    loadEmployees();
  }

  async function updateEmployee(id: string, formData: FormData) {
    const name = String(formData.get("name") || "").trim();
    const pin = Number(formData.get("pin"));
    const role = String(formData.get("role") || "").trim();
    const hourlyRate = Number(formData.get("hourly_rate") || 0);
    const isActive = formData.get("is_active") === "true";

    if (!name || !pin) return;

    const { data: conflict } = await supabase
      .from("employees")
      .select("id")
      .eq("property_id", propertyId)
      .eq("pin", pin)
      .neq("id", id)
      .maybeSingle();

    if (conflict) {
      alert("PIN already exists for this property");
      return;
    }

    await supabase
      .from("employees")
      .update({
        name,
        pin,
        role: role || null,
        hourly_rate: hourlyRate || null,
        is_active: isActive,
      })
      .eq("id", id);

    loadEmployees();
  }

  async function toggleStatus(emp: Employee) {
    await supabase
      .from("employees")
      .update({ is_active: !emp.is_active })
      .eq("id", emp.id);

    loadEmployees();
  }

  async function deleteEmployee(id: string) {
    if (!confirm("Delete this employee?")) return;

    await supabase.from("employees").delete().eq("id", id);
    loadEmployees();
  }

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/properties")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <h1 className="text-2xl font-semibold">Employees</h1>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>

          <AddEmployeeDialog onSubmit={addEmployee} />
        </Dialog>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Property Staff</CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>PIN</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : employees.length ? (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="flex items-center gap-2 font-medium">
                      <User2 className="h-4 w-4 text-muted-foreground" />
                      {emp.name}
                    </TableCell>

                    <TableCell className="font-mono">
                      {emp.pin ?? "—"}
                    </TableCell>

                    <TableCell>{emp.role || "—"}</TableCell>

                    <TableCell>
                      {emp.hourly_rate ? `$${emp.hourly_rate}/hr` : "—"}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={emp.is_active ? "default" : "secondary"}
                        className={
                          emp.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : ""
                        }
                      >
                        {emp.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatus(emp)}
                      >
                        {emp.is_active ? "Deactivate" : "Activate"}
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>

                        <EditEmployeeDialog
                          employee={emp}
                          onSubmit={updateEmployee}
                        />
                      </Dialog>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => deleteEmployee(emp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
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

/* -------------------------------------------------------------------------- */
/*                               DIALOGS                                      */
/* -------------------------------------------------------------------------- */

function AddEmployeeDialog({ onSubmit }: { onSubmit: (fd: FormData) => void }) {
  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Add Employee</DialogTitle>
      </DialogHeader>

      <form action={onSubmit} className="space-y-4">
        <Input name="name" placeholder="Name" required />
        <Input name="pin" type="number" placeholder="PIN" required />
        <Input name="role" placeholder="Role" />
        <Input
          name="hourly_rate"
          type="number"
          step="0.01"
          placeholder="Hourly rate"
        />

        <DialogFooter>
          <Button type="submit">Save</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EditEmployeeDialog({
  employee,
  onSubmit,
}: {
  employee: Employee;
  onSubmit: (id: string, fd: FormData) => void;
}) {
  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Employee</DialogTitle>
      </DialogHeader>

      <form
        action={(fd) => onSubmit(employee.id, fd)}
        className="space-y-4"
      >
        <Input name="name" defaultValue={employee.name} required />
        <Input
          name="pin"
          type="number"
          defaultValue={employee.pin ?? ""}
          required
        />
        <Input name="role" defaultValue={employee.role ?? ""} />
        <Input
          name="hourly_rate"
          type="number"
          step="0.01"
          defaultValue={employee.hourly_rate ?? ""}
        />

        <select
          name="is_active"
          defaultValue={employee.is_active ? "true" : "false"}
          className="w-full border rounded-md p-2"
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <DialogFooter>
          <Button type="submit">Update</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
