"use client";

import { useState } from "react";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

export default function EmployeeTable({
  employees,
  properties,
  onDelete,
  onUpdate,
}: any) {
  const [showPin, setShowPin] = useState<Record<string, boolean>>({});
  const [rows, setRows] = useState<any[]>(employees ?? []);

  const supabase = createClient();

  useEffect(() => {
    setRows(employees ?? []);
  }, [employees]);

  useEffect(() => {
    // Subscribe to employees table changes and update rows in real-time
    const channel = supabase
      .channel("employees_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        (payload) => {
          const ev = payload.eventType;
          const newRow = payload.new as any;
          const oldRow = payload.old as any;
          // Only react to employees for properties we own
          const propIds = properties?.map((p: any) => p.id) ?? [];
          const affectedProp = (newRow?.property_id ?? oldRow?.property_id) as string | undefined;
          if (affectedProp && !propIds.includes(affectedProp)) return;

          if (ev === "INSERT" && newRow) {
            setRows((s) => [newRow, ...s]);
          } else if (ev === "UPDATE" && newRow) {
            setRows((s) => s.map((r) => (r.id === newRow.id ? { ...r, ...newRow } : r)));
          } else if (ev === "DELETE" && oldRow) {
            setRows((s) => s.filter((r) => r.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Property</TableHead>
          <TableHead>PIN</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((emp: any) => (
          <TableRow key={emp.id}>
            <TableCell>{emp.name}</TableCell>
            <TableCell>{emp.property?.name}</TableCell>

            {/* PIN with eye toggle */}
            <TableCell className="flex items-center gap-2 font-mono">
              <div className="px-3 py-1 bg-slate-50 rounded-md text-sm tracking-widest">
                {showPin[emp.id] ? String(emp.pin).padStart(4, "0") : "••••"}
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() =>
                  setShowPin((p) => ({ ...p, [emp.id]: !p[emp.id] }))
                }
                title={showPin[emp.id] ? "Hide PIN" : "Show PIN"}
              >
                {showPin[emp.id] ? <EyeOff /> : <Eye />}
              </Button>
            </TableCell>

            <TableCell>
              {emp.is_active ? "Active" : "Inactive"}
            </TableCell>

            <TableCell className="flex justify-end gap-2">
              {/* EDIT */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <Pencil />
                  </Button>
                </DialogTrigger>

                <DialogContent>
                  <form
                    action={onUpdate}
                    className="space-y-4"
                  >
                    <input type="hidden" name="id" value={emp.id} />

                    <Input name="name" defaultValue={emp.name} />
                    <Input name="pin" type="number" defaultValue={emp.pin} />

                    <Select
                      name="is_active"
                      defaultValue={emp.is_active ? "true" : "false"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button type="submit">Save</Button>
                  </form>
                </DialogContent>
              </Dialog>

              {/* DELETE */}
              <form action={onDelete}>
                <input type="hidden" name="id" value={emp.id} />
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-600"
                  title="Delete employee"
                >
                  <Trash2 />
                </Button>
              </form>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
