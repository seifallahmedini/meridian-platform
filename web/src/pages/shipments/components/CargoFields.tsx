import type { ChangeEvent } from 'react'
import type { Control } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { HazmatFields } from '@/pages/shipments/components/HazmatFields'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { FREIGHT_CLASSES } from '@/lib/constants/freight-classes'
import type { ShipmentFormValues } from '@/lib/schemas/shipment'

function numberField(field: {
  value: number | null
  onChange: (value: number | null) => void
}) {
  return {
    value: field.value ?? '',
    onChange: (e: ChangeEvent<HTMLInputElement>) =>
      field.onChange(e.target.value === '' ? null : Number(e.target.value)),
  }
}

export function CargoFields({ control }: { control: Control<ShipmentFormValues> }) {
  const isHazmat = useWatch({ control, name: 'isHazmat' })

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <FormField
          control={control}
          name="weightKg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (kg)</FormLabel>
              <FormControl>
                <Input type="number" min={0} step="any" {...numberField(field)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="lengthCm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Length (cm)</FormLabel>
              <FormControl>
                <Input type="number" min={0} step="any" {...numberField(field)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="widthCm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Width (cm)</FormLabel>
              <FormControl>
                <Input type="number" min={0} step="any" {...numberField(field)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="heightCm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Height (cm)</FormLabel>
              <FormControl>
                <Input type="number" min={0} step="any" {...numberField(field)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="freightClass"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Freight class</FormLabel>
            <Select value={field.value ?? undefined} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select freight class" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {FREIGHT_CLASSES.map((freightClass) => (
                  <SelectItem key={freightClass} value={freightClass}>
                    {freightClass}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="isHazmat"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <FormLabel>Hazardous material</FormLabel>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {isHazmat && <HazmatFields control={control} />}
    </div>
  )
}
