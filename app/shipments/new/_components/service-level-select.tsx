"use client";

import type { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ShipmentInput } from "@/server/schemas/shipment";

const SERVICE_LEVELS = [
  { value: "STANDARD", label: "Standard" },
  { value: "EXPEDITED", label: "Expedited" },
  { value: "GUARANTEED", label: "Guaranteed" },
] as const;

export function ServiceLevelSelect({ control }: { control: Control<ShipmentInput> }) {
  return (
    <FormField
      control={control}
      name="serviceLevel"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Service level</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a service level" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {SERVICE_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
