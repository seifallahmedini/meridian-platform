"use client";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc/client";
import type { LocationSummary } from "@/lib/trpc/types";
import { cn } from "@/lib/utils";
import { AddLocationDialog } from "./add-location-dialog";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function LocationAutocomplete({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: LocationSummary | null;
  onChange: (location: LocationSummary) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data: results = [], isFetching } = trpc.location.search.useQuery(
    { query: debouncedQuery },
    { enabled: open },
  );

  return (
    <div className="grid gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              aria-invalid={!!error}
              className="w-full justify-between font-normal"
            />
          }
        >
          <span className="truncate">
            {value ? value.label : `Select ${label.toLowerCase()}...`}
          </span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-(--anchor-width) p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Search ${label.toLowerCase()}...`}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>
                {isFetching ? (
                  <span className="block px-2 py-1.5 text-sm text-muted-foreground">
                    Searching...
                  </span>
                ) : (
                  <button
                    type="button"
                    className="w-full px-2 py-1.5 text-left text-sm text-primary hover:underline"
                    onClick={() => {
                      setOpen(false);
                      setAddDialogOpen(true);
                    }}
                  >
                    No matches. Add a new address?
                  </button>
                )}
              </CommandEmpty>
              <CommandGroup>
                {results.map((location) => (
                  <CommandItem
                    key={location.id}
                    value={location.id}
                    onSelect={() => {
                      onChange(location);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 size-4",
                        value?.id === location.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {location.label} — {location.city}, {location.region}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <AddLocationDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onCreated={(location) => onChange(location)}
      />
    </div>
  );
}
