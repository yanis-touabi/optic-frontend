import React, { useState, useEffect, useCallback } from 'react';
import { useInfiniteClients, useClient } from '@/lib/data';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Client } from '@/lib/types';

interface ClientSelectProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ClientSelect({ value, onChange, disabled }: ClientSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteClients(debouncedSearch);

  // For hydration: if the selected value is not in the loaded list, fetch it
  const { data: selectedClient } = useClient(value);

  const clients = data?.pages.flatMap((page) => page.content) || [];

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const bottom =
        e.currentTarget.scrollHeight - e.currentTarget.scrollTop <=
        e.currentTarget.clientHeight + 20; // 20px threshold
      if (bottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  // If a value exists, find it in the current list or use the hydrated one
  const selectedClientDisplay = value
    ? clients.find((c) => c.id === value) || selectedClient
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selectedClientDisplay
            ? `${selectedClientDisplay.prenom} ${selectedClientDisplay.nom}`
            : 'Choisir un client...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Rechercher un client..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList onScroll={handleScroll}>
            {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">Chargement...</div>}
            {!isLoading && clients.length === 0 && (
              <CommandEmpty>Aucun client trouvé.</CommandEmpty>
            )}
            <CommandGroup>
              {clients.map((c: Client) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === c.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {c.prenom} {c.nom}
                </CommandItem>
              ))}
              {isFetchingNextPage && (
                <div className="flex justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
