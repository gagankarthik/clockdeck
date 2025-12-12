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
import { Trash2, Building2 } from "lucide-react";

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

  if (!user) redirect("/auth/login");

  if (!name) redirect("/dashboard/properties");

  await supabase.from("properties").insert({
    name,
    created_by: user.id,
  });

  redirect("/dashboard/properties");
}

export async function deleteProperty(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const id = String(formData.get("id") || "");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!id) redirect("/dashboard/properties");

  await supabase.from("properties").delete().eq("id", id);

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

  // Fetch properties
  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <>
      <h1 className="text-2xl font-semibold mb-6">Manage Properties</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ---------------------------------------------------------------------- */}
        {/*                             ADD PROPERTY                              */}
        {/* ---------------------------------------------------------------------- */}
        <Card className="border">
          <CardHeader>
            <CardTitle>Add New Property</CardTitle>
          </CardHeader>

          <CardContent>
            <form action={addProperty} className="space-y-3">
              <Input
                name="name"
                placeholder="e.g. Hilton Downtown"
                required
              />

              <Button type="submit" className="w-full">
                Add Property
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------------- */}
        {/*                           LIST OF PROPERTIES                           */}
        {/* ---------------------------------------------------------------------- */}
        <Card className="border">
          <CardHeader>
            <CardTitle>Your Properties</CardTitle>
          </CardHeader>

          <CardContent>
            {(!properties || properties.length === 0) && (
              <div className="text-slate-500 text-sm">
                No properties created yet.
              </div>
            )}

            {/* property list */}
            <div className="space-y-3 mt-2">
              {properties?.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-white"
                >
                  {/* Name */}
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-emerald-100">
                      <Building2 className="h-4 w-4 text-emerald-700" />
                    </div>

                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/properties/${p.id}/employees`}
                      className="text-sm text-emerald-600 hover:underline"
                    >
                      Employees →
                    </Link>

                    {/* Delete property */}
                    <form action={deleteProperty}>
                      <input type="hidden" name="id" value={p.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
