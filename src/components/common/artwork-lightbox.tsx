import type { RefObject } from 'react';

import { ArtworkImage } from '@/components/common/artwork-image';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { ArtworkKey } from '@/contracts';
import { useReturnFocus } from '@/hooks/use-return-focus';

interface ArtworkLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artwork: ArtworkKey;
  name: string;
  triggerRef: RefObject<HTMLElement | null>;
}

/** Ampliação da arte (lupa do Figma): a imagem em 900px num diálogo, fechando com Escape ou clique fora. */
export function ArtworkLightbox({
  open,
  onOpenChange,
  artwork,
  name,
  triggerRef,
}: ArtworkLightboxProps) {
  const returnFocus = useReturnFocus(triggerRef);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={returnFocus}
        className="border-border bg-surface-card w-auto max-w-[min(92vw,900px)] gap-0 overflow-hidden rounded-[12px] p-0 sm:max-w-[min(92vw,900px)]"
      >
        <DialogTitle className="sr-only">{`Arte de ${name} ampliada`}</DialogTitle>
        <DialogDescription className="sr-only">
          Pressione Escape para fechar a imagem ampliada.
        </DialogDescription>
        <ArtworkImage
          artwork={artwork}
          size={900}
          alt={`Arte de ${name}`}
          priority
          className="max-h-[86vh] w-auto max-w-full"
        />
      </DialogContent>
    </Dialog>
  );
}
