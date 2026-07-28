import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { AddLocationDialog } from '@/pages/shipments/components/AddLocationDialog'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useApiClient } from '@/lib/api-client/useApiClient'

interface LocationComboboxProps {
  id?: string
  value: string | null
  selectedLabel: string | null
  onChange: (locationId: string | null, label: string | null) => void
  placeholder: string
}

export function LocationCombobox({ id, value, selectedLabel, onChange, placeholder }: LocationComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const client = useApiClient()
  const queryClient = useQueryClient()

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 150)
    return () => clearTimeout(timeout)
  }, [search])

  const locationsQuery = useQuery({
    queryKey: ['locations', debouncedSearch],
    queryFn: () => client!.getLocations(debouncedSearch || undefined),
    enabled: !!client && open,
  })

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selectedLabel ?? placeholder}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search saved addresses..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {locationsQuery.isLoading ? 'Searching...' : 'No saved addresses found.'}
              </CommandEmpty>
              <CommandGroup>
                {locationsQuery.data?.map((location) => (
                  <CommandItem
                    key={location.id}
                    value={location.id}
                    onSelect={() => {
                      onChange(location.id, location.label)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn('mr-2', value === location.id ? 'opacity-100' : 'opacity-0')} />
                    {location.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    setAddDialogOpen(true)
                  }}
                >
                  <Plus className="mr-2" />
                  Add new address
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AddLocationDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onCreated={(location) => {
          queryClient.invalidateQueries({ queryKey: ['locations'] })
          onChange(location.id, location.label)
        }}
      />
    </>
  )
}
