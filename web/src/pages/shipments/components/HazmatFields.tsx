import type { Control } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ShipmentFormValues } from '@/lib/schemas/shipment'

export function HazmatFields({ control }: { control: Control<ShipmentFormValues> }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <FormField
        control={control}
        name="hazmatUnNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>UN number</FormLabel>
            <FormControl>
              <Input placeholder="UN1234" value={field.value ?? ''} onChange={field.onChange} />
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
            <Select value={field.value ?? undefined} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select packing group" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="I">I</SelectItem>
                <SelectItem value="II">II</SelectItem>
                <SelectItem value="III">III</SelectItem>
              </SelectContent>
            </Select>
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
              <Input placeholder="+1-555-0100" value={field.value ?? ''} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
