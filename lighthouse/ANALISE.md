# Análise da auditoria Lighthouse

Os números completos, com as três medições por página e perfil e os links para cada relatório HTML/JSON, estão em [RESULTS.md](RESULTS.md) (gerado por `npm run lighthouse`). Esta análise explica as medianas e o que fica abaixo de 100.

## Condições

- Build otimizado (`vite build`) servido por `vite preview`, mocks MSW ativos no cenário padrão (latência de 150 a 450 ms), service worker registrado antes da primeira consulta.
- Perfil mobile: emulação padrão do Lighthouse (Moto G Power, CPU 4x mais lenta, rede 4G lenta simulada). Perfil desktop: preset `desktop-config`.
- Nada foi simplificado para a auditoria: as mesmas imagens, fontes, mocks e funcionalidades da entrega são carregados.

## Leitura das métricas

- **CLS = 0** em todas as medições. Skeletons reservam as dimensões do conteúdo (inclusive descrição e relacionados no detalhe), imagens têm largura e altura explícitas e a fonte é carregada localmente.
- **TBT ≤ 45 ms** no mobile e 0 no desktop. O trabalho de inicialização é pequeno: a aplicação é importada após o MSW subir, o Router faz code splitting por rota e as fixtures são geradas de forma determinística uma única vez.
- **LCP mobile ≈ 3,1 s** é o único fator que segura Performance em 92. O elemento LCP é a arte do NFT, que só pode ser pedida depois que o JavaScript sobe, o service worker intercepta a chamada REST e a resposta chega com a latência simulada. Em 4G lenta simulada essa cadeia (HTML → JS → `/api` → imagem) custa cerca de 2 s antes do download da imagem. As imagens já são AVIF/WebP em cinco larguras com `fetchpriority="high"` na arte principal.
- **LCP desktop ≈ 0,8 a 1,0 s**, o que leva Performance a 98 e 99.

## Causas e possíveis melhorias

- A dependência do catálogo em uma resposta de API antes de conhecer a imagem é inerente ao desenho (destaques e detalhe vêm da API). Um backend real com SSR ou um `preload` da arte do herói eliminaria cerca de 0,5 s no mobile; na simulação, pré-carregar as quatro artes seria uma otimização exclusiva para a auditoria e foi evitada.
- Parte da latência do mobile vem do próprio cenário padrão dos mocks (150 a 450 ms por chamada), mantido para refletir o comportamento previsto da entrega.

## Acessibilidade, boas práticas e SEO

100 nas quatro combinações. Os ajustes feitos durante a auditoria: `role="img"` no bloco de avaliação com `aria-label`, `role="status"` nos contêineres de carregamento, área de toque de 44 px nas abas e no link do banner mobile, botão de cenários reposicionado para não sobrepor a barra inferior, e `robots.txt` válido servido fora do rewrite da SPA.
