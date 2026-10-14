import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';

export function NotFoundPage({
  title = 'Página não encontrada',
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section
      className="flex min-h-[50vh] flex-col items-center justify-center gap-6 py-16 text-center"
      aria-labelledby="not-found-title"
    >
      <p className="text-text-accent text-[14px] leading-4 font-medium tracking-[1.4px] uppercase">
        Erro 404
      </p>
      <h1 id="not-found-title" className="text-cream text-[28px] leading-[37px] font-bold">
        {title}
      </h1>
      <p className="text-text-secondary max-w-[460px] text-[14px] leading-6">
        {description ??
          'O endereço que você acessou não existe ou foi removido. Volte para o início e continue explorando o catálogo.'}
      </p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </section>
  );
}
