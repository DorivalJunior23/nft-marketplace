import { Link } from '@tanstack/react-router';
import { useId, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  YoutubeIcon,
} from '@/components/icons';
import { COLLECTIONS } from '@/contracts';
import { cn } from '@/lib/utils';

import { BrandLogo } from './brand-logo';

const SERVICES = [
  {
    mark: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    mark: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    mark: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
];

const PROFILE_LINKS = [
  { label: 'Meu perfil', to: '/perfil' },
  { label: 'Minha coleção', to: '/pedidos' },
  { label: 'Atividade', to: '/em-breve' },
  { label: 'Estúdio do criador', to: '/em-breve' },
  { label: 'Lista de interesse', to: '/favoritos' },
];

const HELP_LINKS = [
  'Central de ajuda',
  'Como comprar NFTs',
  'Carteira e segurança',
  'Política do mercado',
  'Denunciar item',
];

const SOCIAL = [
  { label: 'Facebook', Icon: FacebookIcon, className: 'h-4 w-2' },
  { label: 'Instagram', Icon: InstagramIcon, className: 'size-4' },
  { label: 'Twitter', Icon: TwitterIcon, className: 'h-[13px] w-4' },
  { label: 'LinkedIn', Icon: LinkedinIcon, className: 'h-[15px] w-4' },
  { label: 'YouTube', Icon: YoutubeIcon, className: 'h-[14px] w-[19px]' },
];

function NewsletterForm() {
  const id = useId();
  const [email, setEmail] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Fora do escopo da entrega: nunca aparenta sucesso funcional.
    toast.info('A assinatura da newsletter não está disponível nesta demonstração.');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label htmlFor={id} className="text-cream text-[18px] leading-4 font-bold">
        Antecipe-se ao próximo lançamento
      </label>
      <div className="bg-surface-dark shadow-float flex h-10 items-center justify-between overflow-hidden rounded-[6px]">
        <input
          id={id}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="digite seu e-mail..."
          autoComplete="email"
          className="text-cream placeholder:text-brand-secondary h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] leading-4 focus-visible:outline-none"
        />
        <button
          type="submit"
          className="bg-primary text-ink hover:bg-primary-light focus-visible:ring-ring flex h-full shrink-0 items-center rounded-r-[6px] pr-1 pl-4 text-[18px] leading-4 font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
        >
          Enviar
        </button>
      </div>
    </form>
  );
}

/** Rodapé do Figma: serviços, barra de contato, colunas de links, redes sociais e carteiras. */
export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('flex flex-col', className)} aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Rodapé
      </h2>

      <div className="bg-surface-card rounded-t-none p-8">
        <div className="grid gap-7 md:grid-cols-[265px_1px_265px_1px_265px_1px_minmax(0,1fr)] md:gap-0">
          {SERVICES.map((service, index) => (
            <div key={service.title} className="contents">
              {index > 0 ? (
                <div aria-hidden="true" className="bg-primary hidden w-px md:block" />
              ) : null}
              <div className="flex flex-col gap-3 px-4">
                <div
                  className="bg-primary text-ink flex size-[74px] items-center justify-center rounded-full text-[24px] leading-8 font-bold"
                  aria-hidden="true"
                >
                  {service.mark}
                </div>
                <h3 className="text-cream text-[17px] leading-4 font-bold">{service.title}</h3>
                <p className="text-text-secondary max-w-[204px] text-[14px] leading-[22px]">
                  {service.text}
                </p>
              </div>
            </div>
          ))}
          <div aria-hidden="true" className="bg-primary hidden w-px md:block" />
          <div className="flex flex-col gap-3 px-4">
            <NewsletterForm />
            <p className="text-text-secondary text-[13px] leading-[22px]">
              Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface-dark px-8 py-8">
        <div className="text-cream grid items-center gap-4 text-[14px] leading-[22px] md:grid-cols-4 md:gap-[92px]">
          <BrandLogo />
          <p>
            Feito para colecionadores,
            <br />
            criadores e cultura
          </p>
          <a href="mailto:contato@email.com" className="hover:text-text-accent">
            contato@email.com
          </a>
          <a href="tel:+551140028922" className="hover:text-text-accent">
            +55 11 4002 8922
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="bg-surface-card p-8">
          <div className="grid gap-8 md:grid-cols-[1fr_1fr_1fr_228px] md:gap-[124px]">
            <nav aria-labelledby="footer-perfil" className="flex flex-col gap-2">
              <h3 id="footer-perfil" className="text-cream text-[18px] leading-4 font-bold">
                Meu perfil
              </h3>
              <ul className="text-cream text-[14px] leading-[30px]">
                {PROFILE_LINKS.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className="hover:text-text-accent">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-labelledby="footer-ajuda" className="flex flex-col gap-2">
              <h3 id="footer-ajuda" className="text-cream text-[18px] leading-4 font-bold">
                Central de ajuda
              </h3>
              <ul className="text-cream text-[14px] leading-[30px]">
                {HELP_LINKS.map((label) => (
                  <li key={label}>
                    <Link to="/em-breve" className="hover:text-text-accent">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-labelledby="footer-colecoes" className="flex flex-col gap-2">
              <h3 id="footer-colecoes" className="text-cream text-[18px] leading-4 font-bold">
                Coleções
              </h3>
              <ul className="text-cream text-[14px] leading-[30px]">
                {COLLECTIONS.filter((c) =>
                  ['arte-digital', 'fotografia', 'musica', 'arte-3d', 'utilidade'].includes(c.id),
                ).map((collection) => (
                  <li key={collection.id}>
                    <Link
                      to="/mercado"
                      search={{ collection: [collection.id] }}
                      className="hover:text-text-accent"
                    >
                      {collection.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-5">
                <h3 className="text-cream text-[18px] leading-4 font-bold">Redes sociais</h3>
                <ul className="flex items-center gap-2.5">
                  {SOCIAL.map(({ label, Icon, className: iconClass }) => (
                    <li key={label}>
                      <button
                        type="button"
                        onClick={() =>
                          toast.info(`O perfil no ${label} não está disponível nesta demonstração.`)
                        }
                        aria-label={label}
                        className="border-primary text-primary hover:bg-primary hover:text-ink focus-visible:ring-ring focus-visible:ring-offset-surface-card flex size-[30px] cursor-pointer items-center justify-center rounded-[4px] border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        <Icon className={iconClass} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-cream text-[18px] leading-4 font-bold">
                  Carteiras compatíveis
                </h3>
                <p className="border-border-soft bg-surface-dark text-text-accent flex h-[26px] items-center justify-center rounded-[6px] border pl-2 text-[9px] leading-3 font-bold tracking-[0.1px]">
                  METAMASK&nbsp;&nbsp;•&nbsp;&nbsp;WALLETCONNECT&nbsp;&nbsp;•&nbsp;&nbsp;COINBASE
                </p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-cream text-center text-[14px] leading-[30px]">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  );
}
