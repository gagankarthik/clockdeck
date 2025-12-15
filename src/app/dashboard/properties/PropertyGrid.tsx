"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Building2, Pencil } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import EditPropertyDialog from "./EditPropertyDialog";

export default function PropertyGrid({ initial }: { initial: any[] }) {
  const [list, setList] = useState(initial ?? []);
  const supabase = createClient();

  useEffect(() => setList(initial ?? []), [initial]);

  useEffect(() => {
    const channel = supabase
      .channel("properties_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "properties" },
        (payload) => {
          const ev = payload.eventType;
          const newRow = payload.new as any;
          const oldRow = payload.old as any;

          if (ev === "INSERT" && newRow) setList((s) => [newRow, ...s]);
          if (ev === "UPDATE" && newRow) setList((s) => s.map((p) => (p.id === newRow.id ? { ...p, ...newRow } : p)));
          if (ev === "DELETE" && oldRow) setList((s) => s.filter((p) => p.id !== oldRow.id));
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {list.map((p) => (
        <Card key={p.id} className="hover:shadow-md transition">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-100">
                  <Building2 className="h-5 w-5 text-emerald-700" />
                </div>

                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>

                <EditPropertyDialog property={p} />
              </Dialog>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href={`/dashboard/employees?property=${p.id}`}
                className="text-sm text-emerald-600 hover:underline"
              >
                View Employees →
              </Link>

              <form action="/dashboard/properties" method="post">
                <input type="hidden" name="id" value={p.id} />
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
