import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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

import { Trash2, Building2, Pencil, Plus } from "lucide-react";
import PropertyGrid from "./PropertyGrid";

/* -------------------------------------------------------------------------- */
/*                                  ACTIONS                                   */
/* -------------------------------------------------------------------------- */

export async function addProperty(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !name) redirect("/dashboard/properties");

  await supabase.from("properties").insert({
    name,
    created_by: user.id,
  });

  redirect("/dashboard/properties");
}

export async function updateProperty(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !id || !name) redirect("/dashboard/properties");

  await supabase
    .from("properties")
    .update({ name })
    .eq("id", id)
    .eq("created_by", user.id);

  redirect("/dashboard/properties");
}

export async function deleteProperty(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const id = String(formData.get("id") || "");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !id) redirect("/dashboard/properties");

  await supabase
    .from("properties")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id);

  redirect("/dashboard/properties");
}

/* -------------------------------------------------------------------------- */
/*                                    PAGE                                    */
/* -------------------------------------------------------------------------- */

export default async function PropertiesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: true });

  const list = properties ?? [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-semibold">Properties</h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </DialogTrigger>

          <AddPropertyDialog />
        </Dialog>
      </div>

      {/* EMPTY STATE */}
      {!list.length && (
        <Card className="max-w-xl mx-auto">
          <CardContent className="py-16 text-center space-y-4">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">No properties yet</h2>
            <p className="text-muted-foreground">
              Create your first property to start managing employees.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Create Property</Button>
              </DialogTrigger>
              <AddPropertyDialog />
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* PROPERTY GRID (client-rendered for realtime updates) */}
      {list.length > 0 && <PropertyGrid initial={list} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 DIALOGS                                    */
/* -------------------------------------------------------------------------- */

function AddPropertyDialog() {
  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Add Property</DialogTitle>
      </DialogHeader>

      <form action={addProperty} className="space-y-4">
        <Input name="name" placeholder="Property name" required />
        <DialogFooter>
          <Button type="submit">Save</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EditPropertyDialog({ property }: { property: any }) {
  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Property</DialogTitle>
      </DialogHeader>

      <form action={updateProperty} className="space-y-4">
        <input type="hidden" name="id" value={property.id} />
        <Input
          name="name"
          defaultValue={property.name}
          placeholder="Property name"
          required
        />
        <DialogFooter>
          <Button type="submit">Update</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
