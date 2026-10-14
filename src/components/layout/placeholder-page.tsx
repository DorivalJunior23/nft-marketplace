import { Container } from '@/components/common/container';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

/** Páginas fora do escopo (editoriais, suporte, etc.): comportamento coerente, sem simular sucesso. */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Container className="pt-20 pb-12">
      <section
        className="mx-auto flex max-w-[560px] flex-col gap-4 text-center"
        aria-labelledby="placeholder-title"
      >
        <h1 id="placeholder-title" className="text-cream text-[28px] leading-[37px] font-bold">
          {title}
        </h1>
        <p className="text-text-secondary text-[14px] leading-6">{description}</p>
      </section>
    </Container>
  );
}
