# Arquitetura

Este documento registra as decisões, os contratos, as políticas de sessão, carrinho e cache, a reconciliação entre REST e Socket.IO, as limitações e os desvios do Figma.

## Visão geral

- **SPA em Vite + React 19**, rotas por arquivo com TanStack Router, estado remoto com TanStack Query, transporte com Axios e Socket.IO.
- **Camada de mocks na rede** (MSW no navegador): handlers REST e um handler WebSocket compatível com o protocolo Socket.IO. Componentes, hooks e o cliente Axios não têm dados fictícios nem caminhos alternativos; eles só conhecem os contratos.
- **Contratos tipados** em `src/contracts` são a única fonte de verdade para mocks, API client, cache e UI.
- **Dinheiro** trafega como string decimal (`EthAmount`) e é calculado com `big.js`; quantidades são inteiras. Nunca há `number` em ponto flutuante para valores.

### Fluxo de inicialização

1. `src/main.tsx` carrega fontes e CSS e chama `enableMocks()`, que inicializa o banco simulado, registra o service worker do MSW e instala a interceptação de WebSocket.
2. Só então importa dinamicamente `src/app/render.tsx`, que cria o QueryClient, o Router e monta `RealtimeProvider`. O motivo: o `socket.io-client` guarda a referência global de `WebSocket` ao ser avaliado; se fosse importado antes do MSW, conectaria por fora da interceptação.

### Organização

```
src/api         http.ts (Axios + interceptors + ApiClientError), endpoints/*.ts
src/app         query-client.ts, router.tsx, search.ts (serialização legível da URL), render.tsx
src/contracts   common, nft, auth, cart, quote, order, profile, wallet, events
src/features    uma pasta por domínio: queries/mutations, páginas e componentes
src/mocks       db/ (store persistido, fixtures, seed), services/ (regras), handlers/ (REST), socket.ts, scenarios.ts, runtime.ts, dev-api.ts, panel/
src/realtime    socket.ts (cliente), realtime-provider.tsx (versões, duplicatas, reconciliação), hooks.ts
src/routes      rotas por arquivo; rotas privadas usam beforeLoad com requireSession
```

## Contratos REST

Base `/api`. Erros têm corpo único `{ type, message, details? }` com `details` por campo quando for validação. Tipos de erro: `validation_error` (422), `unauthorized` (401), `forbidden` (403), `not_found` (404), `conflict` (409), `availability_conflict` (409), `quote_outdated` (409), `idempotency_conflict` (409), `wallet_rejected` (409), `transient_error` (503). O cliente ainda normaliza `network_error` e `timeout`.

| Recurso        | Operações                                                                                                                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sessão e conta | `POST /auth/register`, `POST /auth/login` (aceita `guestCartId` para mesclar o carrinho), `GET /auth/session`, `POST /auth/logout`, `GET /me`                                                                                                                                                           |
| NFTs           | `GET /nfts?q&collection&network&priceMin&priceMax&sort&tab&page` (itens, paginação e facetas), `GET /nfts/featured`, `GET /nfts/:id`, `GET /nfts/:id/related`                                                                                                                                           |
| Favoritos      | `GET /favorites`, `PUT /favorites/:nftId`, `DELETE /favorites/:nftId`                                                                                                                                                                                                                                   |
| Carrinho       | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:lineId`, `DELETE /cart/items/:lineId` (visitante identificado por `X-Guest-Cart`; usuário por `Authorization: Bearer`)                                                                                                                             |
| Cotação        | `POST /quote?context=cart\|checkout` → itens com preço corrente, subtotal, desconto, taxa de rede, total, estado do cupom (`applied`, `invalid`, `expired`), `issues` (`sold_out`, `insufficient_availability`, `edition_unavailable`; mudança de preço é detectada pelo `fingerprint`) e `fingerprint` |
| Pedidos        | `POST /orders` com header `Idempotency-Key`, `GET /orders`, `GET /orders/:id`                                                                                                                                                                                                                           |
| Perfil         | `GET /profile`, `PATCH /profile`, `PUT /profile/avatar` (data URL), `DELETE /profile/avatar`, `POST /profile/password`                                                                                                                                                                                  |
| Carteiras      | `GET /wallets`, `POST /wallets`, `PUT /wallets/:id`, `POST /wallets/:id/connect`, `POST /wallets/:id/disconnect`                                                                                                                                                                                        |

### Idempotência dos pedidos

- O cliente gera uma chave por tentativa e a guarda em `sessionStorage` junto com o hash do conteúdo (itens, cupom, carteira, rede) e o id do usuário. Clique repetido, reenvio após timeout ou refresh reutilizam a chave enquanto o conteúdo e o usuário forem os mesmos.
- A simulação guarda `chave → (usuário, hash, pedido)`. Mesma chave com o mesmo conteúdo devolve o mesmo pedido (200); conteúdo diferente responde `idempotency_conflict`; chave de outro usuário responde `forbidden`.
- Antes de criar, a simulação recalcula a cotação e compara o `fingerprint` enviado: diferença responde `quote_outdated`; item indisponível responde `availability_conflict`. Ao criar, as unidades são reservadas; se o pedido for recusado, elas voltam.

## Eventos Socket.IO

Transporte: `socket.io-client` com `transports: ['websocket']`, path `/socket.io/`, `auth: { token }` no handshake. Envelope comum:

```ts
{ eventId: string; type: 'nft.updated' | 'order.updated'; resource: { type: 'nft' | 'order'; id: string }; version: number; occurredAt: string; data: ... }
```

- `nft.updated`: preço, preço anterior, edições (disponibilidade) e total disponível. Broadcast para todas as conexões.
- `order.updated`: estado, recibo e motivo de recusa. Entregue só às conexões autenticadas como o dono do pedido.

### Cliente (RealtimeProvider)

- Mantém `versions` por recurso e um conjunto de `eventId` vistos. Um evento só é aplicado se for inédito e com versão maior que a conhecida; duplicatas e eventos antigos são descartados sem reaplicar efeitos.
- `nft.updated` atualiza, sem refetch, o detalhe, todas as listagens e todos os carrinhos em cache (preço unitário, total da linha, edições), e invalida as cotações. Listeners de tela (ex.: avisos no carrinho) recebem o evento com o valor anterior.
- `order.updated` atualiza o pedido em cache e invalida a lista; confirmação também invalida o carrinho (a simulação remove só os itens e quantidades comprados).
- Reconexão: invalida todas as consultas ativas para reconciliar com o REST. Pedidos pendentes também são consultados a cada 3 s até um estado terminal, cobrindo refresh e perda de eventos.
- Login, logout e troca de usuário reconectam o socket com as credenciais atuais; o servidor filtra eventos privados pelo token do handshake, e o cliente limpa caches privados, então eventos de uma sessão anterior nunca atualizam outro usuário.
- Listeners são removidos no unmount e uma região `aria-live` anuncia atualizações relevantes.

### Simulação do socket com MSW

- `ws.link` do MSW mais `@mswjs/socket.io-binding` fazem o handshake do Engine.IO e codificam os pacotes do Socket.IO. O MSW remove o prefixo `/socket.io/` da URL antes de casar o padrão, por isso o handler casa a raiz da origem; em desenvolvimento o HMR do Vite foi movido para `/__vite_hmr` para não colidir.
- Limitações documentadas: só WebSocket (sem long-polling), sem namespaces, salas nem ACKs; a binding não envia pings, então o handler mantém o heartbeat (`2`) a cada 20 s para o cliente não encerrar por timeout; a autenticação é lida do pacote `40{...}` enviado pelo cliente.
- Qualquer mudança nos dados simulados passa pelos serviços, que persistem no `localStorage` e publicam no barramento interno; o handler entrega aos clientes conectados. O painel e a API `window.__kurio.mocks` chamam esses mesmos serviços: nada é disparado diretamente na UI. O `db.snapshot()` dessa API omite hashes e salts de senha, sessões e chaves de idempotência.

## Política de sessão

- Token opaco (`sess_…`) com validade definida pelo cenário (12 h por padrão, 20 s em `session-expiring`), guardado em `localStorage` com o usuário. Ao abrir o app, a sessão persistida é validada em `GET /auth/session`.
- O interceptor do Axios envia `Authorization: Bearer`; um 401 fora dos endpoints de login e cadastro encerra a sessão com motivo `expired`, mas só se a requisição recusada levava o token atual: respostas atrasadas de uma sessão anterior (ou sem token) não derrubam um login feito depois. Consultas privadas (`useProfile`, `useWallets`, `useOrders`) ficam desligadas sem sessão. Em rota privada, `SessionSync` leva ao login com `redirect` para a rota atual e `motivo=sessao-expirada`, e a tela de login mostra o aviso; em rota pública, o aviso é um toast.
- Rotas privadas (`/perfil`, `/carteiras`, `/favoritos`, `/pedidos`, `/pagamento`) usam `beforeLoad` com redirect para `/entrar?redirect=…`. Após autenticar, o app volta à rota de origem (apenas caminhos internos).
- Logout e troca de usuário: `POST /auth/logout`, limpeza total do cache do Query e do estado privado da aba (rascunho do checkout, chave de idempotência e cupom em `sessionStorage`), novo id de carrinho de visitante e reconexão do socket sem credenciais. Chaves privadas incluem o id do usuário (`['favorites', userId]`, `['cart', 'user:<id>']`), o que também isola dados por conta. O rascunho do checkout grava o id do dono e é ignorado por qualquer outro usuário, mesmo que a sessão tenha expirado sem logout.
- Senhas: hash SHA-256 com salt no banco simulado; nunca em claro nem em logs.

## Estado do carrinho

- Carrinho do visitante é identificado por `X-Guest-Cart` (UUID em `localStorage`); do usuário, pelo token. Ambos vivem na simulação, por isso sobrevivem a refresh.
- No login ou cadastro, o cliente envia `guestCartId` e a simulação soma os itens do visitante ao carrinho do usuário respeitando disponibilidade e limite por pedido; o id de visitante é renovado.
- A API devolve os itens com snapshot corrente do NFT e da edição; preço unitário e total da linha sempre refletem o catálogo atual. Subtotal, desconto, taxa e total vêm de `POST /quote`, nunca são calculados na UI.
- Cupom digitado fica em `sessionStorage` e acompanha o checkout. Avisos de alteração (preço, esgotamento) vêm dos eventos em tempo real.
- Quantidades e remoções usam atualização otimista com rollback; adicionar ao carrinho usa a resposta da API.

## Estratégia de cache (TanStack Query)

- `staleTime` padrão 30 s; cotação sempre `staleTime: 0` com chave que inclui itens, versões dos NFTs, cupom e contexto; detalhe 60 s; relacionados e destaque 5 min.
- Retry só para falhas transitórias (rede, timeout, 5xx), no máximo 2 tentativas com backoff; 4xx não repete. Mutations não repetem (a idempotência cobre o reenvio manual do pedido).
- `refetchOnReconnect` ligado e `refetchOnWindowFocus` desligado (eventos cobrem a atualização em segundo plano). Listagens usam `placeholderData: keepPreviousData` para manter a página anterior visível com estado de atualização, e `signal` cancela requisições obsoletas ao mudar parâmetros.
- Invalidação: mutations de carrinho, favoritos, perfil e carteiras invalidam seus recursos; eventos atualizam o cache diretamente e invalidam cotações/pedidos; logout limpa tudo; trocar de cenário no painel refaz todas as consultas (inclusive as que falharam).
- Carregamento: uma consulta nova (busca, filtros, página) mostra skeleton; só o refetch da mesma consulta fica em segundo plano com o conteúdo esmaecido. Retries ficam pausados enquanto a aba não está visível (comportamento padrão do TanStack Query) e retomam ao voltar.
- Atualização otimista com rollback: favoritos (cenário `favorites-fail` demonstra o rollback), quantidade e remoção no carrinho.

## Mocks

- Banco em `localStorage` (`kurio.mockdb.v1`) semeado de forma determinística (PRNG com seed fixa): 120 NFTs, 9 coleções, 3 redes, 4 edições por NFT com disponibilidade variada, 2 usuários, carteiras da Nova, cupons. Os 9 primeiros NFTs reproduzem os do Figma.
- Cenários (`src/mocks/scenarios.ts`) controlam latência, rede, catálogo, TTL da sessão, favoritos, conexão de carteira, interrupção no checkout, timeout na criação e liquidação do pedido. Seleção por `?mock=<id>`, painel ou API; reset restaura as fixtures.
- Pedidos pendentes são liquidados por timer; após um refresh, `resumePendingOrders()` reagenda os pendentes para que a recuperação funcione.

## Acessibilidade

- HTML semântico, landmarks, skip link, foco visível em todos os controles, alvo de toque mínimo de 44 px nas barras mobile.
- Diálogos e drawers (Radix) prendem o foco, fecham com Escape e devolvem o foco ao gatilho (hook `useReturnFocus` para gatilhos fora do Radix).
- Formulários com `label`, `aria-required`, `aria-invalid` e `aria-describedby` apontando para a mensagem de erro (`role="alert"`); erros da API caem nos campos correspondentes.
- Estados não dependem só de cor: filtros selecionados ganham marca de check, status de pedido tem ponto + texto, avisos têm ícone.
- `aria-live` para contadores, cotação, conexão da carteira, pedido e eventos em tempo real; `prefers-reduced-motion` desliga shimmer, transições e o avanço automático do carrossel.
- Toasts usam a própria mensagem como id: repetir uma ação substitui o aviso em vez de empilhar, com no máximo três visíveis.
- O anel de foco global vale para links e botões; campos de formulário sinalizam foco pela borda laranja, evitando contorno duplo.
- Imagens de arte decorativas têm `alt=""` quando o texto ao lado já descreve o item; a arte principal do detalhe tem alternativa textual.

## Decisões de UX e desvios do Figma

- **Filtros**: o Figma mostra listas de texto; os filtros são combináveis, então cada linha é um checkbox real (input transparente cobrindo a linha) com marca de check e cor para o estado selecionado.
- **Usuário autenticado no cabeçalho**: o Figma só mostra "Entrar"; logado, o botão vira um menu com o primeiro nome (perfil, carteiras, pedidos, sair).
- **Larguras intermediárias**: o Figma só tem 1440 e mobile. A composição desktop entra em 768 px e é fluida até 1280 px, quando passa a reproduzir o frame de 1440 pixel a pixel: entre 768 e 1279 a grade do catálogo tem 2 colunas, a sidebar encolhe (240/260 px), o herói empilha abaixo de 1024, a galeria do detalhe, o carrinho e o pagamento ficam em coluna única abaixo de 1024, e o rodapé usa 2 colunas. O teste de acessibilidade verifica ausência de rolagem horizontal em 768, 1024, 1180, 1280 e 1440.
- **Mobile**: os frames têm 414 px; a implementação foi validada em 390 e 768 também. Não há frames mobile de Perfil, Carteiras, Confirmação e Pedidos: eles seguem o padrão das demais telas mobile (cabeçalho com voltar, campos de 50 px, cards de 14 px de raio). O rodapé e o cabeçalho desktop não aparecem no mobile, como nos frames.
- **Pagamento mobile**: o Figma não traz o formulário do colecionador; ele existe numa seção recolhível "Dados do colecionador", pré-preenchida, que abre automaticamente quando há erro.
- **Nome ENS no pagamento**: o frame mostra só o seletor ".eth"; a implementação usa prefixo ".eth" + campo de texto, como nas telas de Perfil e Carteiras.
- **Descrição do NFT**: no frame os rótulos "Contrato" e "Direitos autorais" aparecem trocados com seus textos; a implementação pareia cada rótulo ao texto correto.
- **Estados não desenhados** (pendente, recusado, vazio, erro, 404, skeletons) seguem os mesmos tokens, tipografia e composição.
- **Links fora do escopo** (editorial, suporte, redes sociais, newsletter, criação de NFT, social login, recuperação de senha) levam a páginas "em breve" ou mostram aviso; nunca aparentam sucesso.
- **Animações**: o arquivo não tem fluxos de protótipo. O herói da Início virou um carrossel com os três NFTs indicados pelos três pontos do Figma: crossfade a cada 5 s, pausa em hover e foco, indicadores navegáveis por teclado e sem avanço automático com `prefers-reduced-motion`. Hover e foco são discretos.

## Assets

- As 4 artes do Figma foram exportadas pela API e otimizadas em WebP/AVIF em 5 larguras (`scripts/optimize-images.mjs`, `public/images/nfts`). O Figma reaproveita essas 4 imagens em todos os cards.
- Ícones vetoriais exportados do Figma como SVG e importados como componentes (`src/assets/icons`). Substituições: o logo do Google é desenhado inline com as cores do arquivo; o ícone de carteira da opção Coinbase (mobile) usa a inicial em círculo, como as demais opções; a barra inferior mobile usa máscara CSS para o recorte central.
- Fonte Roboto Mono variável via `@fontsource-variable/roboto-mono`, servida localmente.

## Limitações conhecidas

- Sem backend real: pagamento, carteiras e blockchain são simulados; o link "Ver no Etherscan" aponta para um hash fictício.
- Long-polling do Socket.IO não é interceptado; em ambientes que bloqueiam WebSocket o tempo real não funciona (o polling de pedidos pendentes continua cobrindo a recuperação).
- O banco simulado é por navegador (localStorage); duas abas compartilham dados, mas o socket de cada aba só recebe eventos gerados na própria aba.
- Upload de avatar converte a imagem para WebP de até 256 px no cliente e guarda como data URL (limite de 1 MB).
