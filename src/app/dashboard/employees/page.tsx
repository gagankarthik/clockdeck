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
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { Plus } from "lucide-react";
import EmployeeTable from "./EmployeeTable";

/* -------------------------------------------------------------------------- */
/*                               SERVER ACTIONS                               */
/* -------------------------------------------------------------------------- */

export async function addEmployee(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const pin = Number(formData.get("pin"));
  const propertyId = String(formData.get("property_id"));

  if (!name || !pin || !propertyId) return;

  await supabase.from("employees").insert({
    name,
    pin,
    property_id: propertyId,
    is_active: true,
  });

  redirect("/dashboard/employees");
}

export async function updateEmployee(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const id = String(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const pin = Number(formData.get("pin"));
  const isActive = formData.get("is_active") === "true";

  if (!id || !name || !pin) return;

  await supabase
    .from("employees")
    .update({ name, pin, is_active: isActive })
    .eq("id", id);

  redirect("/dashboard/employees");
}

export async function deleteEmployee(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const id = String(formData.get("id"));
  if (!id) return;

  await supabase.from("employees").delete().eq("id", id);
  redirect("/dashboard/employees");
}

/* -------------------------------------------------------------------------- */
/*                                   PAGE                                     */
/* -------------------------------------------------------------------------- */

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: { search?: string; property?: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const search = searchParams.search?.toLowerCase() || "";
  const propertyFilter = searchParams.property || "all";

  /* ---------------- USER PROPERTIES ---------------- */
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name")
    .eq("created_by", user.id)
    .order("name");

  const propertyIds = properties?.map((p) => p.id) ?? [];

  /* ---------------- EMPLOYEES (USER ONLY) ---------------- */
  const { data: employees } = await supabase
    .from("employees")
    .select(
      `
      id,
      name,
      pin,
      is_active,
      property_id,
      property:properties(name)
    `
    )
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false });

  let filtered = employees ?? [];

  if (propertyFilter !== "all") {
    filtered = filtered.filter((e) => e.property_id === propertyFilter);
  }

  if (search) {
    filtered = filtered.filter((e) =>
      e.name.toLowerCase().includes(search)
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
        <h1 className="text-2xl font-semibold">Employees</h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Employee</DialogTitle>
            </DialogHeader>

            <form action={addEmployee} className="space-y-4">
              <Input name="name" placeholder="Name" required />
              <Input name="pin" type="number" placeholder="PIN" required />

              <Select name="property_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Property" />
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

      {/* FILTERS */}
      <form className="flex flex-col sm:flex-row gap-3">
        <Input
          name="search"
          placeholder="Search employee"
          defaultValue={search}
        />

        <Select name="property" defaultValue={propertyFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Property" />
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

      {/* CLIENT TABLE */}
      <EmployeeTable
        employees={filtered}
        properties={properties ?? []}
        onDelete={deleteEmployee}
        onUpdate={updateEmployee}
      />
    </div>
  );
}
