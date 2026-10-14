import { Link } from '@tanstack/react-router';

import { ArtworkImage } from '@/components/common/artwork-image';
import type { ArtworkKey } from '@/contracts';

const POSTS: ReadonlyArray<{ meta: string; title: string; text: string; artwork: ArtworkKey }> = [
  {
    meta: '12 de setembro  |  Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    text: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    artwork: 'ape-neon',
  },
  {
    meta: '13 de setembro  |  Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    text: 'Conheça criadores que moldam a cultura digital.',
    artwork: 'ape-emerald',
  },
  {
    meta: '15 de setembro  |  Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    text: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    artwork: 'ape-sage',
  },
  {
    meta: '15 de setembro  |  Leitura de 2 min',
    title: 'Como proteger sua carteira',
    text: 'Proteja sua carteira, seus ativos e sua identidade.',
    artwork: 'ape-golden',
  },
];

/** "Diário da Cunhagem": cabeçalho centralizado e 4 cards 268x369. Páginas editoriais estão fora do escopo. */
export function BlogSection() {
  return (
    <section aria-labelledby="blog-titulo" className="flex flex-col items-center gap-10">
      <div className="flex flex-col gap-3 text-center">
        <h2 id="blog-titulo" className="text-cream text-[28px] leading-[37px] font-bold">
          Diário da Cunhagem
        </h2>
        <p className="text-text-secondary text-[14px] leading-[18px]">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>
      <ul className="flex w-full gap-6">
        {POSTS.map((post) => (
          <li
            key={post.title}
            className="bg-surface-card flex h-[369px] w-[268px] flex-col overflow-hidden rounded-[8px]"
          >
            <ArtworkImage
              artwork={post.artwork}
              size={268}
              alt=""
              className="h-[195px] w-[268px] rounded-none object-top"
            />
            <div className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-4">
              <p className="text-text-secondary h-8 text-[12px] leading-4 font-medium">
                {post.meta}
              </p>
              <h3 className="text-cream h-[42px] text-[16px] leading-[21px] font-bold">
                {post.title}
              </h3>
              <p className="text-text-secondary h-8 text-[12px] leading-4 font-medium">
                {post.text}
              </p>
              <Link
                to="/em-breve"
                className="text-text-accent mt-auto flex items-center gap-1 text-[12px] font-bold hover:underline"
              >
                Ler mais <span aria-hidden="true">→</span>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
