"use client";

import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function EditPropertyDialog({ property }: { property: any }) {
  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Property</DialogTitle>
      </DialogHeader>

      <form action="/dashboard/properties" className="space-y-4">
        <input type="hidden" name="id" value={property.id} />
        <Input name="name" defaultValue={property.name} placeholder="Property name" required />
        <DialogFooter>
          <Button type="submit">Update</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
