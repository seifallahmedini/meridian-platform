"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import type { LocationSummary, ShipmentDetail } from "@/lib/trpc/types";
import { shipmentInput, type ShipmentInput } from "@/server/schemas/shipment";
import { HazmatFields } from "./_components/hazmat-fields";
import { LocationAutocomplete } from "./_components/location-autocomplete";
import { ServiceLevelSelect } from "./_components/service-level-select";

const emptyValues: ShipmentInput = {
  originId: "",
  destinationId: "",
  weightLbs: 0,
  lengthIn: 0,
  widthIn: 0,
  heightIn: 0,
  freightClass: "",
  serviceLevel: "STANDARD",
  isHazmat: false,
  hazmatUnNumber: "",
  hazmatPackingGroup: "",
  hazmatEmergencyContact: "",
};

function valuesFromDraft(draft: ShipmentDetail): ShipmentInput {
  return {
    originId: draft.originId ?? "",
    destinationId: draft.destinationId ?? "",
    weightLbs: draft.weightLbs ?? 0,
    lengthIn: draft.lengthIn ?? 0,
    widthIn: draft.widthIn ?? 0,
    heightIn: draft.heightIn ?? 0,
    freightClass: draft.freightClass ?? "",
    serviceLevel: draft.serviceLevel ?? "STANDARD",
    isHazmat: draft.isHazmat,
    hazmatUnNumber: draft.hazmatUnNumber ?? "",
    hazmatPackingGroup: draft.hazmatPackingGroup ?? "",
    hazmatEmergencyContact: draft.hazmatEmergencyContact ?? "",
  };
}

export default function NewShipmentPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-2xl p-6">Loading...</main>}>
      <NewShipmentPageContent />
    </Suspense>
  );
}

function NewShipmentPageContent() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  const draftQuery = trpc.shipment.get.useQuery({ id: draftId ?? "" }, { enabled: !!draftId });

  if (draftId && draftQuery.isLoading) {
    return <main className="mx-auto max-w-2xl p-6">Loading draft...</main>;
  }

  // Remount (not sync-via-effect) when the draft identity changes, so the
  // form/origin/destination state below can be initialized once, directly
  // from the fetched data, instead of being synchronized after the fact.
  return (
    <NewShipmentForm
      key={draftId ?? "new"}
      draftId={draftId}
      initialDraft={draftQuery.data ?? null}
    />
  );
}

function NewShipmentForm({
  draftId,
  initialDraft,
}: {
  draftId: string | null;
  initialDraft: ShipmentDetail | null;
}) {
  const router = useRouter();

  const [origin, setOrigin] = useState<LocationSummary | null>(initialDraft?.origin ?? null);
  const [destination, setDestination] = useState<LocationSummary | null>(
    initialDraft?.destination ?? null,
  );
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null);

  const form = useForm<ShipmentInput>({
    resolver: zodResolver(shipmentInput),
    defaultValues: initialDraft ? valuesFromDraft(initialDraft) : emptyValues,
  });
  const isHazmat = useWatch({ control: form.control, name: "isHazmat" });

  const createShipment = trpc.shipment.create.useMutation({
    onSuccess: (shipment) => {
      setSubmitted(shipment);
      form.reset(emptyValues);
      setOrigin(null);
      setDestination(null);
    },
  });

  const saveDraft = trpc.shipment.saveDraft.useMutation({
    onSuccess: () => {
      router.push("/shipments/drafts");
    },
  });

  function handleSaveDraft() {
    const values = form.getValues();
    saveDraft.mutate({ ...values, id: draftId ?? undefined });
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">New shipment</h1>

      {submitted && (
        <div role="status" className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          Shipment created. Carrier selection isn&apos;t available yet — that&apos;s tracked
          separately.
        </div>
      )}

      <Form {...form}>
        <form
          className="mt-6 grid gap-6"
          onSubmit={form.handleSubmit((values) => createShipment.mutate(values))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-sm font-medium">Origin</span>
              <LocationAutocomplete
                label="Origin"
                value={origin}
                onChange={(location) => {
                  setOrigin(location);
                  form.setValue("originId", location.id, { shouldValidate: true });
                }}
                error={form.formState.errors.originId?.message}
              />
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-medium">Destination</span>
              <LocationAutocomplete
                label="Destination"
                value={destination}
                onChange={(location) => {
                  setDestination(location);
                  form.setValue("destinationId", location.id, { shouldValidate: true });
                }}
                error={form.formState.errors.destinationId?.message}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="weightLbs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (lb)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="freightClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Freight class</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 70" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="lengthIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Length (in)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="widthIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Width (in)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="heightIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height (in)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <ServiceLevelSelect control={form.control} />

          <HazmatFields control={form.control} isHazmat={isHazmat} />

          <div className="flex gap-3">
            <Button type="submit" disabled={createShipment.isPending}>
              {createShipment.isPending ? "Creating..." : "Create shipment"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saveDraft.isPending}
              onClick={handleSaveDraft}
            >
              {saveDraft.isPending ? "Saving..." : "Save as draft"}
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
}
