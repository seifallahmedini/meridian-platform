import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import { CargoFields } from '@/pages/shipments/components/CargoFields'
import { LocationCombobox } from '@/pages/shipments/components/LocationCombobox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApiClient } from '@/lib/api-client/useApiClient'
import { SaveShipmentRequest } from '@/lib/api-client'
import { SERVICE_LEVELS, shipmentFormSchema, shipmentSubmitSchema, type ShipmentFormValues } from '@/lib/schemas/shipment'

const emptyValues: ShipmentFormValues = {
  originLocationId: null,
  destinationLocationId: null,
  weightKg: null,
  lengthCm: null,
  widthCm: null,
  heightCm: null,
  freightClass: null,
  isHazmat: false,
  hazmatUnNumber: null,
  hazmatPackingGroup: null,
  hazmatEmergencyContact: null,
  serviceLevel: null,
}

export function NewShipmentPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const client = useApiClient()
  const queryClient = useQueryClient()

  const [originLabel, setOriginLabel] = useState<string | null>(null)
  const [destinationLabel, setDestinationLabel] = useState<string | null>(null)
  const [errorAnnouncement, setErrorAnnouncement] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: emptyValues,
  })

  const existingShipmentQuery = useQuery({
    queryKey: ['shipment', id],
    queryFn: () => client!.getShipmentById(id!),
    enabled: !!client && !!id,
  })

  useEffect(() => {
    const shipment = existingShipmentQuery.data
    if (!shipment) return

    form.reset({
      originLocationId: shipment.originLocationId ?? null,
      destinationLocationId: shipment.destinationLocationId ?? null,
      weightKg: shipment.weightKg ?? null,
      lengthCm: shipment.lengthCm ?? null,
      widthCm: shipment.widthCm ?? null,
      heightCm: shipment.heightCm ?? null,
      freightClass: (shipment.freightClass as ShipmentFormValues['freightClass']) ?? null,
      isHazmat: shipment.isHazmat,
      hazmatUnNumber: shipment.hazmatUnNumber ?? null,
      hazmatPackingGroup: (shipment.hazmatPackingGroup as ShipmentFormValues['hazmatPackingGroup']) ?? null,
      hazmatEmergencyContact: shipment.hazmatEmergencyContact ?? null,
      serviceLevel: (shipment.serviceLevel as ShipmentFormValues['serviceLevel']) ?? null,
    })
    setOriginLabel(shipment.originLocationLabel ?? null)
    setDestinationLabel(shipment.destinationLocationLabel ?? null)
  }, [existingShipmentQuery.data, form])

  const saveMutation = useMutation({
    mutationFn: ({ values, isDraft }: { values: ShipmentFormValues; isDraft: boolean }) => {
      const request = new SaveShipmentRequest({
        originLocationId: values.originLocationId ?? undefined,
        destinationLocationId: values.destinationLocationId ?? undefined,
        weightKg: values.weightKg ?? undefined,
        lengthCm: values.lengthCm ?? undefined,
        widthCm: values.widthCm ?? undefined,
        heightCm: values.heightCm ?? undefined,
        freightClass: values.freightClass ?? undefined,
        isHazmat: values.isHazmat,
        hazmatUnNumber: values.isHazmat ? (values.hazmatUnNumber ?? undefined) : undefined,
        hazmatPackingGroup: values.isHazmat ? (values.hazmatPackingGroup ?? undefined) : undefined,
        hazmatEmergencyContact: values.isHazmat ? (values.hazmatEmergencyContact ?? undefined) : undefined,
        serviceLevel: values.serviceLevel ?? undefined,
        isDraft,
      })
      return id ? client!.updateShipment(id, request) : client!.createShipment(request)
    },
    onSuccess: (_, { isDraft }) => {
      setSaveError(null)
      queryClient.invalidateQueries({ queryKey: ['shipments'] })
      if (isDraft) {
        navigate('/shipments/drafts')
      } else {
        setSubmitted(true)
      }
    },
    onError: (error) => {
      setSaveError(error instanceof Error ? error.message : 'Failed to save the shipment. Please try again.')
    },
  })

  const onSaveDraft = form.handleSubmit((values) => {
    setErrorAnnouncement('')
    setSaveError(null)
    saveMutation.mutate({ values, isDraft: true })
  })

  const onCreateShipment = form.handleSubmit(() => {
    const values = form.getValues()
    const result = shipmentSubmitSchema.safeParse(values)

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ShipmentFormValues
        form.setError(field, { type: 'manual', message: issue.message })
      }
      setErrorAnnouncement(
        `${result.error.issues.length} error${result.error.issues.length === 1 ? '' : 's'} found. Please review the form.`,
      )
      const firstField = result.error.issues[0]?.path[0] as keyof ShipmentFormValues | undefined
      if (firstField) form.setFocus(firstField)
      return
    }

    setErrorAnnouncement('')
    setSaveError(null)
    saveMutation.mutate({ values, isDraft: false })
  })

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shipment created</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              form.reset(emptyValues)
              setOriginLabel(null)
              setDestinationLabel(null)
              setSubmitted(false)
            }}
          >
            Create another shipment
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New shipment</CardTitle>
      </CardHeader>
      <CardContent>
        <div role="status" aria-live="polite" className="sr-only">
          {errorAnnouncement}
        </div>
        <Form {...form}>
          <form className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="originLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin</FormLabel>
                    <FormControl>
                      <LocationCombobox
                        value={field.value}
                        selectedLabel={originLabel}
                        placeholder="Select an origin address"
                        onChange={(locationId, label) => {
                          field.onChange(locationId)
                          setOriginLabel(label)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destinationLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl>
                      <LocationCombobox
                        value={field.value}
                        selectedLabel={destinationLabel}
                        placeholder="Select a destination address"
                        onChange={(locationId, label) => {
                          field.onChange(locationId)
                          setDestinationLabel(label)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <CargoFields control={form.control} />

            <FormField
              control={form.control}
              name="serviceLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service level</FormLabel>
                  <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full sm:w-64">
                        <SelectValue placeholder="Select a service level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SERVICE_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {saveError && (
              <p role="alert" className="text-destructive text-sm">
                {saveError}
              </p>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onSaveDraft} disabled={saveMutation.isPending}>
                Save as Draft
              </Button>
              <Button type="button" onClick={onCreateShipment} disabled={saveMutation.isPending}>
                Create Shipment
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
