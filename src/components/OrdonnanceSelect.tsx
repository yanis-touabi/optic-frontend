import React, { useState, useCallback } from 'react';
import { useInfiniteOrdonnances, useOrdonnance } from '@/lib/data';
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
import type { Ordonnance } from '@/lib/types';

interface OrdonnanceSelectProps {
  clientId?: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OrdonnanceSelect({ clientId, value, onChange, disabled }: OrdonnanceSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteOrdonnances(clientId, debouncedSearch);

  const { data: selectedOrdonnance } = useOrdonnance(value !== 'none' ? value : undefined);

  const ordonnances = data?.pages.flatMap((page) => page.content) || [];

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const bottom =
        e.currentTarget.scrollHeight - e.currentTarget.scrollTop <=
        e.currentTarget.clientHeight + 20;
      if (bottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  const getDisplayValue = () => {
    if (value === 'none') return 'Aucune';
    const ordDisplay = value ? ordonnances.find((o) => o.id === value) || selectedOrdonnance : null;
    if (ordDisplay) {
      return `Dr ${ordDisplay.nomMedecin || 'Sans médecin'} — OD ${ordDisplay.odSphere ?? '—'} / OG ${ordDisplay.ogSphere ?? '—'}`;
    }
    return 'Choisir une ordonnance...';
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled || !clientId}
        >
          {getDisplayValue()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Rechercher une ordonnance..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList onScroll={handleScroll}>
            {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">Chargement...</div>}
            {!isLoading && ordonnances.length === 0 && (
              <CommandEmpty>Aucune ordonnance trouvée.</CommandEmpty>
            )}
            <CommandGroup>
              <CommandItem
                value="none"
                onSelect={() => {
                  onChange('none');
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === 'none' ? 'opacity-100' : 'opacity-0',
                  )}
                />
                Aucune
              </CommandItem>
              {ordonnances.map((o: Ordonnance) => (
                <CommandItem
                  key={o.id}
                  value={o.id}
                  onSelect={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === o.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {o.nomMedecin || 'Sans médecin'} — OD {o.odSphere ?? '—'} / OG {o.ogSphere ?? '—'}
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
