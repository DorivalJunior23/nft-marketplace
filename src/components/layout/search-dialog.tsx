import { useNavigate } from '@tanstack/react-router';
import { useId, useState, type FormEvent, type RefObject } from 'react';

import { SearchIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useReturnFocus } from '@/hooks/use-return-focus';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: RefObject<HTMLElement | null>;
}

/** Busca global: envia o termo para o catálogo (`/mercado?q=`), reiniciando a paginação. */
export function SearchDialog({ open, onOpenChange, triggerRef }: SearchDialogProps) {
  const navigate = useNavigate();
  const returnFocus = useReturnFocus(triggerRef);
  const inputId = useId();
  const [term, setTerm] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = term.trim();
    onOpenChange(false);
    await navigate({ to: '/mercado', search: q ? { q } : {} });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={returnFocus}
        className="border-border bg-surface-card text-cream max-w-[520px] gap-6 p-8"
      >
        <DialogHeader className="gap-2 text-left">
          <DialogTitle className="text-cream text-[22px] leading-[29px] font-bold">
            Buscar NFTs
          </DialogTitle>
          <DialogDescription className="text-text-secondary text-[14px] leading-6">
            Procure por nome, ID do token ou coleção.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor={inputId} className="sr-only">
            Termo de busca
          </label>
          <div className="border-border-soft bg-surface-dark focus-within:border-primary flex h-11 items-center gap-3 rounded-[6px] border px-3">
            <SearchIcon className="text-brand-secondary size-5 shrink-0" />
            <input
              id={inputId}
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Ex.: Emerald Ape, #0042"
              className="text-cream placeholder:text-brand-secondary h-full min-w-0 flex-1 bg-transparent text-[15px] focus-visible:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm">
              Buscar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
