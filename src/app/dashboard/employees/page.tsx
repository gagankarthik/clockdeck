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

import { Trash2, User2 } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                ACTIONS                                     */
/* -------------------------------------------------------------------------- */

export async function addEmployee(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  const pin = Number(formData.get("pin") || "");
  const propertyId = String(formData.get("propertyId") || "");

  if (!name || !propertyId || !pin) redirect("/dashboard/employees");

  await supabase.from("employees").insert({
    name,
    pin,
    property_id: propertyId,
  });

  redirect(`/dashboard/employees?property=${propertyId}`);
}

export async function deleteEmployee(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const id = String(formData.get("id"));
  const filter = String(formData.get("filter") || "");

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

  const selectedProperty = searchParams.property || "";

  /* Fetch properties */
  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .order("name");

  /* Fetch employees WITH property relation */
  let { data: employees } = await supabase
    .from("employees")
    .select(`
      id,
      name,
      pin,
      property_id,
      properties(name)
    `)
    .order("created_at");

  // Guarantee array
  employees = employees ?? [];

  /* Filter by property */
  if (selectedProperty && selectedProperty !== "all") {
    employees = employees.filter((e) => e.property_id === selectedProperty);
  }

  /* -------------------------------------------------------------------------- */

  return (
    <>
      <h1 className="text-2xl font-semibold mb-6">Employees</h1>

      {/* FILTER + ADD BUTTON */}
      <div className="flex items-center justify-between mb-6">

        {/* PROPERTY FILTER */}
        <form method="GET" className="flex items-center gap-3">
          <Select name="property" defaultValue={selectedProperty || "all"}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All properties" />
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

        {/* CREATE EMPLOYEE */}
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create Employee</Button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>

            <form action={addEmployee} className="space-y-4">

              {/* NAME */}
              <Input name="name" placeholder="Employee name" required />

              {/* PIN */}
              <Input name="pin" type="number" placeholder="PIN (unique)" required />

              {/* PROPERTY SELECT */}
              <Select name="propertyId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose property" />
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
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* TABLE LIST OF EMPLOYEES */}
      <Card className="border">
        <CardHeader>
          <CardTitle>Employees</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>PIN</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {employees.length ? (
                employees.map((emp: any) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <User2 className="h-4 w-4 text-slate-600" />
                      {emp.name}
                    </TableCell>

                    <TableCell>{emp.properties?.name || "-"}</TableCell>

                    <TableCell>{emp.pin}</TableCell>

                    <TableCell className="text-right">
                      <form action={deleteEmployee}>
                        <input type="hidden" name="id" value={emp.id} />
                        <input type="hidden" name="filter" value={selectedProperty} />

                        <Button
                          variant="ghost"
                          size="icon"
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
                    colSpan={4}
                    className="text-center py-6 text-slate-500"
                  >
                    No employees found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
