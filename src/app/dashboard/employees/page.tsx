import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

import {
  Dialog,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Trash2, User2, Plus } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                ACTIONS                                     */
/* -------------------------------------------------------------------------- */

export async function addEmployee(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const pin = Number(formData.get("pin"));
  const role = String(formData.get("role") || "").trim();
  const hourlyRate = Number(formData.get("hourly_rate") || 0);
  const isActive = formData.get("is_active") === "true";
  const propertyId = String(formData.get("property_id") || "");

  if (!name || !pin || !propertyId) {
    redirect("/dashboard/employees");
  }

  await supabase.from("employees").insert({
    name,
    pin,
    role: role || null,
    hourly_rate: hourlyRate || null,
    is_active: isActive,
    property_id: propertyId,
  });

  redirect(`/dashboard/employees?property=${propertyId}`);
}

export async function deleteEmployee(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const id = String(formData.get("id"));
  const filter = String(formData.get("filter") || "all");

  await supabase.from("employees").delete().eq("id", id);

  redirect(`/dashboard/employees?property=${filter}`);
}

/* -------------------------------------------------------------------------- */
/*                                PAGE                                        */
/* -------------------------------------------------------------------------- */

export default async function EmployeesPage({ searchParams }: any) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const selectedProperty = searchParams.property || "all";

  /* Fetch properties */
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name")
    .order("name");

  /* Fetch employees */
  let { data: employees } = await supabase
    .from("employees")
    .select(`
      id,
      name,
      pin,
      role,
      hourly_rate,
      is_active,
      property_id,
      properties(name)
    `)
    .order("created_at", { ascending: false });

  employees = employees ?? [];

  if (selectedProperty !== "all") {
    employees = employees.filter(
      (e) => e.property_id === selectedProperty
    );
  }

  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employees</h1>

        {/* ADD EMPLOYEE */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex gap-2">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Employee</DialogTitle>
            </DialogHeader>

            <form action={addEmployee} className="space-y-4">

              <Input name="name" placeholder="Employee name" required />

              <Input
                name="pin"
                type="number"
                placeholder="Unique PIN"
                required
              />

              <Input
                name="role"
                placeholder="Role (optional)"
              />

              <Input
                name="hourly_rate"
                type="number"
                step="0.01"
                placeholder="Hourly rate (optional)"
              />

              {/* Status */}
              <Select name="is_active" defaultValue="true">
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {/* Property */}
              <Select name="property_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Assign property" />
                </SelectTrigger>
                <SelectContent>
                  {properties?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DialogFooter>
                <Button type="submit">Save Employee</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* FILTER */}
      <form method="GET" className="flex gap-3">
        <Select name="property" defaultValue={selectedProperty}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by property" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>PIN</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {employees.length ? (
                employees.map((emp: any) => (
                  <TableRow key={emp.id}>
                    <TableCell className="flex items-center gap-2 font-medium">
                      <User2 className="h-4 w-4 text-slate-500" />
                      {emp.name}
                    </TableCell>

                    <TableCell>{emp.properties?.name || "-"}</TableCell>
                    <TableCell className="font-mono">{emp.pin}</TableCell>
                    <TableCell>{emp.role || "-"}</TableCell>
                    <TableCell>
                      {emp.hourly_rate ? `$${emp.hourly_rate}/hr` : "-"}
                    </TableCell>
                    <TableCell>
                      {emp.is_active ? "Active" : "Inactive"}
                    </TableCell>

                    <TableCell className="text-right">
                      <form action={deleteEmployee}>
                        <input type="hidden" name="id" value={emp.id} />
                        <input
                          type="hidden"
                          name="filter"
                          value={selectedProperty}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-slate-500"
                  >
                    No employees found.
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
