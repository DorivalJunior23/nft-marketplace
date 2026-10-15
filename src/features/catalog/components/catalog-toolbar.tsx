import { ChevronDownIcon } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NFT_SORT_OPTIONS, NFT_TABS, type NftSort, type NftTab } from '@/contracts';
import { cn } from '@/lib/utils';

interface CatalogToolbarProps {
  tab: NftTab;
  sort: NftSort;
  onTabChange: (tab: NftTab) => void;
  onSortChange: (sort: NftSort) => void;
  /** Mobile: abas 14px com sublinhado abaixo do texto. */
  compact?: boolean;
}

/** Abas (Todos / Novos lançamentos / Em alta) e ordenação, como no topo da grade do Figma. */
export function CatalogToolbar({
  tab,
  sort,
  onTabChange,
  onSortChange,
  compact = false,
}: CatalogToolbarProps) {
  const current = NFT_SORT_OPTIONS.find((option) => option.id === sort) ?? NFT_SORT_OPTIONS[0]!;
  return (
    <div
      className={cn(
        'flex items-center justify-between',
        compact ? 'gap-4' : 'flex-wrap gap-x-6 gap-y-5 xl:h-[18px] xl:flex-nowrap',
      )}
    >
      <div
        role="tablist"
        aria-label="Seções do catálogo"
        className={cn('flex', compact ? 'gap-4' : 'gap-5')}
      >
        {NFT_TABS.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'hover:text-text-accent focus-visible:ring-ring focus-visible:ring-offset-background relative shrink-0 cursor-pointer leading-4 whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none',
                // Área de toque de 44px sem alterar o layout (margens negativas compensam o padding).
                compact ? '-my-3.5 py-3.5 text-[14px]' : 'text-[15px] font-medium',
                active ? 'text-text-accent font-bold' : 'text-cream',
                compact && !active && 'font-normal',
              )}
            >
              {item.label}
              {active ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'bg-primary absolute left-0 h-0.5',
                    compact ? '-bottom-1 w-full' : '-bottom-[7px] w-[101px]',
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {compact ? null : (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="text-cream hover:text-text-accent focus-visible:ring-ring focus-visible:ring-offset-background flex items-center gap-1 text-[15px] leading-5 whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none"
            aria-label={`Ordenar por: ${current.label}`}
          >
            <span className="hidden xl:inline">Ordenar por:</span>
            <span>{current.label}</span>
            <ChevronDownIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[220px]">
            <DropdownMenuRadioGroup
              value={sort}
              onValueChange={(value) => onSortChange(value as NftSort)}
            >
              {NFT_SORT_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.id} value={option.id}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
