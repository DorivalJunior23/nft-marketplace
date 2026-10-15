import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  COLLECTIONS,
  NETWORKS,
  type CollectionId,
  type NetworkId,
  type NftListFacets,
} from '@/contracts';
import { formatEth, parseEthInput } from '@/lib/money';
import { cn } from '@/lib/utils';

import type { CatalogSearch } from '../search-params';

interface CatalogFiltersProps {
  search: CatalogSearch;
  facets: NftListFacets | undefined;
  onChange: (patch: Partial<CatalogSearch>) => void;
  className?: string;
}

function toggle<T extends string>(list: T[] | undefined, value: T): T[] {
  const current = list ?? [];
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

function FilterGroup({
  title,
  children,
  id,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-3">
      <h3 id={id} className="text-cream text-[18px] leading-4 font-bold">
        {title}
      </h3>
      {children}
    </div>
  );
}

function CheckRow({
  checked,
  label,
  count,
  boldCount,
  onChange,
}: {
  checked: boolean;
  label: string;
  count: number;
  boldCount: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        'hover:text-text-accent has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-surface-card relative flex h-10 cursor-pointer items-center justify-between text-[15px] leading-10 transition-colors has-[:focus-visible]:rounded-[4px] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2',
        checked ? 'text-text-accent' : 'text-text-secondary',
      )}
    >
      <span className="flex items-center gap-2.5">
        {/* O input cobre a linha inteira (transparente): acessível, focável e clicável. */}
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="absolute inset-0 m-0 size-full cursor-pointer appearance-none opacity-0"
        />
        {/* A seleção não depende só da cor: a linha ganha uma marca de check. */}
        <span
          aria-hidden="true"
          className={cn('w-3 text-[13px] font-bold', !checked && 'invisible')}
        >
          ✓
        </span>
        {label}
      </span>
      <span className={cn('tabular-nums', boldCount && 'font-bold')}>({count})</span>
    </label>
  );
}

/** Sidebar de filtros do Figma (310px, Surface Card, padding 20): coleções, faixa de preço e rede. */
export function CatalogFilters({ search, facets, onChange, className }: CatalogFiltersProps) {
  const ids = { collections: useId(), price: useId(), network: useId() };
  const min = Number(facets?.priceRange.min ?? '0');
  const max = Number(facets?.priceRange.max ?? '12.3');
  // O slider é um rascunho local; quando a URL (ou os limites) muda, o rascunho é descartado.
  const external = `${search.priceMin ?? ''}|${search.priceMax ?? ''}|${min}|${max}`;
  const [draft, setDraft] = useState<{ key: string; range: [number, number] } | null>(null);
  const range: [number, number] =
    draft && draft.key === external
      ? draft.range
      : [Number(search.priceMin ?? min), Number(search.priceMax ?? max)];
  const setRange = (next: [number, number]) => setDraft({ key: external, range: next });

  const applyPrice = () => {
    const [low, high] = range;
    onChange({
      priceMin: low > min ? (parseEthInput(low.toFixed(2)) ?? undefined) : undefined,
      priceMax: high < max ? (parseEthInput(high.toFixed(2)) ?? undefined) : undefined,
    });
  };

  return (
    <div
      className={cn('bg-surface-card flex flex-col gap-10 p-5', className)}
      data-testid="catalog-filters"
    >
      <FilterGroup title="Coleções" id={ids.collections}>
        <div className="-ml-[22px] flex flex-col px-3">
          {COLLECTIONS.map((collection) => (
            <CheckRow
              key={collection.id}
              label={collection.name}
              count={facets?.collections[collection.id] ?? 0}
              boldCount
              checked={search.collection?.includes(collection.id) ?? false}
              onChange={() =>
                onChange({ collection: toggle<CollectionId>(search.collection, collection.id) })
              }
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Faixa de preço" id={ids.price}>
        <div className="flex flex-col gap-3 pl-3">
          <Slider
            min={min}
            max={max}
            step={0.01}
            value={range}
            onValueChange={(value) => setRange([value[0] ?? min, value[1] ?? max])}
            aria-label="Faixa de preço em ETH"
            className="py-[3px]"
          />
          <p className="text-cream text-[15px] leading-5" aria-live="polite">
            Preço: {formatEth(range[0].toFixed(2), { suffix: false }).replace('.', ',')} -{' '}
            {formatEth(range[1].toFixed(2)).replace('.', ',')}
          </p>
          <Button size="sm" className="w-[92px]" onClick={applyPrice}>
            Aplicar
          </Button>
        </div>
      </FilterGroup>

      <FilterGroup title="Rede" id={ids.network}>
        <div className="-ml-[22px] flex flex-col pl-3">
          {Object.values(NETWORKS).map((network) => (
            <CheckRow
              key={network.id}
              label={network.name}
              count={facets?.networks[network.id] ?? 0}
              boldCount={false}
              checked={search.network?.includes(network.id) ?? false}
              onChange={() => onChange({ network: toggle<NetworkId>(search.network, network.id) })}
            />
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}
