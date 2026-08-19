import React, { useState, useCallback } from 'react';
import { useInfiniteProduits, useProduit } from '@/lib/data';
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
import { formatDZD } from '@/lib/format';
import type { Produit } from '@/lib/types';

interface ProduitSelectProps {
  value?: string;
  onChange: (produit: Produit | null) => void;
  disabled?: boolean;
}

export function ProduitSelect({ value, onChange, disabled }: ProduitSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteProduits(debouncedSearch);

  // For hydration: if the selected value is not in the loaded list, fetch it
  const { data: selectedProduit } = useProduit(value);

  const produits = data?.pages.flatMap((page) => page.content) || [];

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
  const selectedProduitDisplay = value
    ? produits.find((p) => p.id === value) || selectedProduit
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex-1 justify-between font-normal"
          disabled={disabled}
        >
          {selectedProduitDisplay
            ? `${selectedProduitDisplay.nom}${
                selectedProduitDisplay.marque ? ` — ${selectedProduitDisplay.marque}` : ''
              }`
            : 'Choisir un produit...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList onScroll={handleScroll}>
            {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">Chargement...</div>}
            {!isLoading && produits.length === 0 && (
              <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
            )}
            <CommandGroup>
              {produits.map((p: Produit) => (
                <CommandItem
                  key={p.id}
                  value={p.id}
                  onSelect={() => {
                    onChange(p);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === p.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{p.nom}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDZD(p.prix)} — Stock : {p.stock}
                      {p.sku ? ` — SKU : ${p.sku}` : ''}
                    </span>
                  </div>
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
