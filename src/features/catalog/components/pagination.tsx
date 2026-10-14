import { ArrowRightSmallIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function range(page: number, totalPages: number): number[] {
  const window = 4;
  let start = Math.max(1, Math.min(page - 1, totalPages - window + 1));
  const end = Math.min(totalPages, start + window - 1);
  start = Math.max(1, end - window + 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

/** Paginação do Figma: quadrados de 35px, página atual preenchida em laranja, seta para a próxima. */
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = range(page, totalPages);
  const buttonBase =
    'flex size-[35px] items-center justify-center rounded-[4px] text-[18px] leading-4 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none';
  return (
    <nav aria-label="Paginação do catálogo" className="flex items-center gap-2">
      {page > 1 ? (
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          className={cn(buttonBase, 'border-border text-cream hover:border-primary border')}
          aria-label="Página anterior"
        >
          <ArrowRightSmallIcon className="size-[18px] rotate-180" />
        </button>
      ) : null}
      {pages.map((item) => {
        const active = item === page;
        return (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={active ? 'page' : undefined}
            aria-label={`Página ${item}`}
            className={cn(
              buttonBase,
              active
                ? 'bg-primary text-ink font-bold'
                : 'border-border text-cream hover:border-primary border font-normal',
            )}
          >
            {item}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          buttonBase,
          'border-border text-cream hover:border-primary border disabled:opacity-40',
        )}
        aria-label="Próxima página"
      >
        <ArrowRightSmallIcon className="size-[18px]" />
      </button>
    </nav>
  );
}
