import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { sessionStore } from '@/features/auth/session-store';
import { useReturnFocus } from '@/hooks/use-return-focus';
import { MOCKS_ENABLED } from '@/mocks/enable';
import type { MockScenario } from '@/mocks/scenarios';

/**
 * Painel de cenários da simulação (só com mocks ativos). Seleciona o cenário determinístico,
 * reinicia os dados e expõe atalhos para disparar eventos pelo socket. Tudo passa pela
 * API de controle dos mocks (`window.__kurio.mocks`), nunca pela UI diretamente.
 */
export function ScenarioPanel() {
  const [open, setOpen] = useState(false);
  const [scenarios, setScenarios] = useState<readonly MockScenario[]>([]);
  const [current, setCurrent] = useState<string>('default');
  const queryClient = useQueryClient();
  const selectId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useReturnFocus(buttonRef);

  useEffect(() => {
    const api = window.__kurio?.mocks;
    if (!api) return;
    setScenarios(api.scenario.list());
    setCurrent(api.scenario.get().id);
  }, [open]);

  if (!MOCKS_ENABLED) return null;
  const api = window.__kurio?.mocks;

  const change = (id: string) => {
    if (!api) return;
    api.scenario.set(id);
    setCurrent(id);
    toast.info(`Cenário "${api.scenario.get().label}" ativado.`);
  };

  const reset = async () => {
    if (!api) return;
    await api.reset();
    sessionStore.end('logout');
    queryClient.clear();
    window.location.assign('/');
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        className="border-border-soft bg-surface-dark text-text-accent shadow-float hover:border-primary focus-visible:ring-ring fixed bottom-4 left-4 z-40 flex h-9 items-center gap-2 rounded-full border px-3 text-[12px] font-bold focus-visible:ring-2 focus-visible:outline-none md:bottom-6 md:left-6"
        aria-label="Abrir painel de cenários da simulação"
        data-testid="scenario-panel-button"
      >
        <span aria-hidden="true" className="bg-primary size-2 rounded-full" />
        Cenário: {current}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          onCloseAutoFocus={returnFocus}
          className="border-border bg-surface-card text-cream max-w-[560px] gap-5 p-6"
        >
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="text-cream text-[20px] leading-6 font-bold">
              Cenários da simulação
            </DialogTitle>
            <DialogDescription className="text-text-secondary text-[13px] leading-5">
              Os mocks (MSW) respondem conforme o cenário escolhido. Também é possível ativar pela
              URL com <code>?mock=&lt;id&gt;</code>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <label htmlFor={selectId} className="text-[14px] font-bold">
              Cenário ativo
            </label>
            <select
              id={selectId}
              value={current}
              onChange={(event) => change(event.target.value)}
              className="border-border bg-surface-dark text-cream focus-visible:border-primary h-10 rounded-[4px] border px-3 text-[14px] focus-visible:outline-none"
              data-testid="scenario-select"
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.id} — {scenario.label}
                </option>
              ))}
            </select>
            <p className="text-text-secondary text-[13px] leading-5">
              {scenarios.find((item) => item.id === current)?.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => api?.nft.increasePrice('emerald-ape-0042', 1.1)}
            >
              Subir preço do Emerald Ape
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => api?.nft.setAvailability('emerald-ape-0042', '1-50', 0)}
            >
              Esgotar edição 1/50
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toast.info(`${api?.socket.dropConnections() ?? 0} conexão(ões) derrubada(s).`)
              }
            >
              Derrubar socket
            </Button>
            <Button size="sm" variant="outline" onClick={() => api?.session.expireAll()}>
              Expirar sessões
            </Button>
          </div>
          <div className="border-primary/30 flex items-center justify-between border-t pt-4">
            <p className="text-text-secondary text-[13px] leading-5">
              Reinicia catálogo, contas, carrinhos e pedidos para o estado inicial.
            </p>
            <Button
              size="sm"
              variant="danger"
              onClick={() => void reset()}
              data-testid="scenario-reset"
            >
              Resetar dados
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
