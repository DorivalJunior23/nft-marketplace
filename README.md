# Kurio · Marketplace de NFTs

Marketplace de NFTs em React + TypeScript construído para o Desafio Frontend, com fidelidade ao layout do Figma e fluxos completos de descoberta, compra e conta do colecionador. Toda a API, a autenticação, as carteiras e o pagamento funcionam com dados simulados por MSW, inclusive na versão publicada.

## Funcionalidades

- Início com destaques, catálogo, busca, filtros combináveis, ordenação e paginação no estado da URL
- Detalhe do NFT com galeria, edições, limite de quantidade, favoritos (atualização otimista) e compra
- Carrinho com quantidades, remoção, cupom, resumo vindo da cotação da API e atualização em tempo real
- Pagamento com dados do colecionador, carteira e rede, conexão simulada, revisão e envio idempotente
- Pedido pendente, confirmado (recibo imutável) ou recusado, com recuperação após refresh ou reconexão
- Cadastro, login, sessão recuperável, expiração, logout, perfil com avatar e senha, carteiras principal e secundária
- Eventos Socket.IO `nft.updated` e `order.updated` com controle de versão, duplicatas e reconciliação com o REST
- Cenários determinísticos de rede e falha (lentidão, offline, 5xx, sessão expirada, cupom inválido, preço alterado, timeout, recusa)
- Testes E2E e regressão visual com Playwright, auditoria Lighthouse, acessibilidade por teclado e leitores de tela

## Stack

React 19, TypeScript 6 (strict), Vite 8, TanStack Router, TanStack Query, Axios, Socket.IO (socket.io-client), Tailwind CSS 4, shadcn/ui (Radix), MSW 2 + @mswjs/socket.io-binding, Playwright, Lighthouse. Complementares: react-hook-form + zod (formulários), big.js (precisão decimal em ETH), sharp (otimização de imagens em build), vite-plugin-svgr (ícones do Figma como componentes).

## Setup

Requisitos: Node 22+ (desenvolvido com Node 24) e npm 10+.

```bash
npm ci
npx playwright install chromium   # apenas para os testes E2E
npm run dev                        # http://localhost:5173 com mocks
```

A aplicação roda a partir de um checkout limpo, sem serviços privados nem backend real.

## Variáveis de ambiente

| Variável            | Padrão | Uso                                                                                                                                             |
| ------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_ENABLE_MOCKS` | `true` | Ativa a camada MSW (REST + Socket.IO). `.env.development` e `.env.production` já vêm com `true`, então o build de demonstração mantém os mocks. |
| `VITE_API_URL`      | `/api` | Base das chamadas REST do Axios.                                                                                                                |
| `VITE_SOCKET_URL`   | `/`    | Origem do Socket.IO (path fixo `/socket.io/`).                                                                                                  |

Copie `.env.example` para `.env` para sobrescrever localmente. Nenhum segredo é necessário.

## Credenciais fictícias

| Usuário   | E-mail                | Senha        | Observações                                                                                           |
| --------- | --------------------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| Nova Sato | `nova.sato@kurio.app` | `Kurio@2026` | Já tem carteira principal (MetaMask, Ethereum) e secundária (WalletConnect, Polygon) e dois favoritos |
| Caio Lima | `caio.lima@kurio.app` | `Kurio@2026` | Sem carteiras cadastradas: útil para exercitar o cadastro de carteira e o bloqueio do pagamento       |

Senhas são guardadas como hash SHA-256 com salt no banco simulado (localStorage), nunca em claro. Novas contas podem ser criadas em **Criar conta**.

Cupons: `KURIO10` (10%), `GENESIS` (0.05 ETH fixo), `EXPIRADO` (expirado). Qualquer outro código é inválido.

## Cenários da simulação

Os mocks respondem conforme um cenário determinístico. Selecione pela URL (`?mock=<id>`), pelo painel flutuante **Cenário** no canto inferior esquerdo, ou por `window.__kurio.mocks.scenario.set('<id>')` no console. O cenário fica salvo no `localStorage` até ser trocado.

| Id                 | Efeito                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `default`          | Sucesso em tudo, latência de 150 a 450 ms, pedido confirmado após 2,5 s                                            |
| `empty`            | Catálogo vazio                                                                                                     |
| `slow`             | Latência de 2,5 a 4 s (skeletons)                                                                                  |
| `jitter`           | Latência de 100 ms a 2,5 s, respostas fora de ordem                                                                |
| `offline`          | Todas as requisições falham como erro de rede                                                                      |
| `server-error`     | Catálogo e detalhe respondem 503 (falha transitória, com nova tentativa)                                           |
| `session-expiring` | Sessões duram 20 s; depois a API responde 401 e o app leva ao login preservando a rota                             |
| `favorites-fail`   | Mutations de favoritos respondem 503 (rollback otimista)                                                           |
| `wallet-rejected`  | Conexão da carteira recusada no pagamento                                                                          |
| `price-change`     | Após a primeira cotação do checkout, o preço do primeiro item sobe via `nft.updated`                               |
| `sold-out`         | Após a primeira cotação do checkout, a edição do primeiro item esgota via `nft.updated`                            |
| `order-timeout`    | A primeira criação de pedido nunca responde; "Tentar novamente" recupera o mesmo pedido pela chave de idempotência |
| `payment-declined` | O pedido é recusado pela rede                                                                                      |

Conflito de cadastro e validação de formulário, cupom inválido ou expirado e disponibilidade insuficiente são regras naturais da simulação e valem em todos os cenários.

### Reset

Painel **Cenário → Resetar dados**, ou `await window.__kurio.mocks.reset()` no console, restaura integralmente catálogo, contas, carrinhos, carteiras e pedidos. Apagar o `localStorage` tem o mesmo efeito.

### Atalhos para reproduzir falhas

No console (ou pelo painel):

```js
window.__kurio.mocks.nft.increasePrice('emerald-ape-0042', 1.1); // dispara nft.updated com preço maior
window.__kurio.mocks.nft.setAvailability('emerald-ape-0042', '1-50', 0); // esgota a edição 1/50
window.__kurio.mocks.nft.republish('emerald-ape-0042'); // reenvia o evento (duplicata)
window.__kurio.mocks.orders.republish('<orderId>', { stale: true }); // evento antigo de pedido
window.__kurio.mocks.socket.dropConnections(); // derruba o socket (reconexão)
window.__kurio.mocks.session.expireAll(); // expira todas as sessões
```

Os eventos chegam ao app pelo `socket.io-client` real, interceptado pelo MSW.

Fluxos de falha passo a passo:

1. **Preço muda no checkout**: ative `price-change`, adicione um NFT, vá ao pagamento e aguarde 3 s. O resumo é atualizado, a confirmação exige aceitar os novos valores e o servidor recusa cotações desatualizadas com 409.
2. **Timeout com recuperação**: ative `order-timeout`, confirme um pedido. Após o timeout do cliente (8 s), clique em "Tentar novamente": o mesmo pedido é recuperado, sem duplicar.
3. **Pedido pendente e reconexão**: confirme um pedido no cenário padrão e recarregue a página ou derrube o socket antes dos 2,5 s. O estado é recuperado pelo REST e pelo evento.
4. **Sessão expirada no checkout**: ative `session-expiring`, entre, preencha o pagamento, aguarde 20 s (ou expire pelo painel) e confirme. O login retorna ao pagamento com o rascunho preservado.

## Scripts

| Comando                           | O que faz                                                                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Desenvolvimento com mocks em `http://localhost:5173`                                                                                |
| `npm run build`                   | Build otimizado em `dist/` (mocks ativos, pronto para a Vercel)                                                                     |
| `npm run preview`                 | Serve o build em `http://localhost:4173`                                                                                            |
| `npm run typecheck`               | `tsc` em modo strict                                                                                                                |
| `npm run lint`                    | ESLint (TypeScript, React Hooks, jsx-a11y)                                                                                          |
| `npm run format` / `format:check` | Prettier                                                                                                                            |
| `npm test`                        | Playwright: todos os fluxos em Chromium desktop (1440) e mobile (390), com regressão visual                                         |
| `npm run test:update`             | Atualiza as baselines visuais em `e2e/__screenshots__`                                                                              |
| `npm run test:report`             | Abre o relatório HTML da última execução (traces das falhas incluídos)                                                              |
| `npm run lighthouse`              | Auditoria Lighthouse (3 medições × 2 páginas × 2 perfis) com relatórios em `lighthouse/reports` e resumo em `lighthouse/RESULTS.md` |
| `npm run images`                  | Regenera as artes otimizadas (WebP/AVIF) a partir dos originais do Figma                                                            |
| `npm run icons`                   | Sincroniza os ícones SVG exportados do Figma                                                                                        |

Os testes sobem o build e o preview sozinhos. Para rodar um projeto: `npx playwright test --project=chromium-mobile`.

## Deploy

Recomendado: Vercel, importando o repositório com o preset Vite (`npm run build`, saída `dist/`). O `vercel.json` já traz o rewrite de SPA para acesso direto e refresh de qualquer rota, além dos cabeçalhos de cache. Como `.env.production` mantém `VITE_ENABLE_MOCKS=true`, a versão publicada funciona com os mocks e o tempo real sem configuração extra.

## Estrutura

```
src/
  api/            cliente Axios, erros normalizados e endpoints tipados
  app/            QueryClient, Router (serialização de busca) e render
  components/     ui (shadcn adaptado), forms, layout, common, icons
  contracts/      contratos REST e eventos Socket.IO compartilhados por mocks, estado e UI
  features/       catálogo, home, detalhe, conta, auth, carrinho, checkout, pedidos, favoritos
  mocks/          MSW: banco persistido, fixtures, serviços, handlers, socket, cenários e painel
  realtime/       cliente Socket.IO, provider com versões/duplicatas e hooks
  routes/         rotas por arquivo do TanStack Router
e2e/              testes Playwright, helpers e baselines visuais
lighthouse/       runner, relatórios e resultados
scripts/          otimização de imagens e sincronização de ícones
```

Detalhes de arquitetura, contratos, política de sessão, cache, reconciliação REST/Socket.IO, limitações e desvios do Figma estão em [ARCHITECTURE.md](ARCHITECTURE.md).
