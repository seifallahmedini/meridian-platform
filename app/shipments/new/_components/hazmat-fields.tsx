"use client";

import type { Control } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ShipmentInput } from "@/server/schemas/shipment";

export function HazmatFields({
  control,
  isHazmat,
}: {
  control: Control<ShipmentInput>;
  isHazmat: boolean;
}) {
  return (
    <div className="grid gap-3">
      <FormField
        control={control}
        name="isHazmat"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div className="grid gap-0.5">
              <FormLabel>Hazardous material</FormLabel>
              <FormDescription>Toggle on if this shipment contains hazmat cargo.</FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Conditionally rendered (not just hidden), so these fields are never
          keyboard/tab-reachable while the toggle is off — AC #7. */}
      {isHazmat && (
        <div className="grid gap-3 rounded-lg border border-dashed p-3">
          <FormField
            control={control}
            name="hazmatUnNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UN number</FormLabel>
                <FormControl>
                  <Input placeholder="UN1234" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="hazmatPackingGroup"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Packing group</FormLabel>
                <FormControl>
                  <Input placeholder="I, II, or III" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="hazmatEmergencyContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency contact</FormLabel>
                <FormControl>
                  <Input placeholder="Name and phone number" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}
