import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <main id="conteudo" className="min-h-dvh p-6">
      <h1 className="text-[43px] leading-[70px] font-bold">Kurio</h1>
    </main>
  );
}
