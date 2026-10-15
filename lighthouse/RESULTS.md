# Resultados do Lighthouse

Gerado em 2026-10-15T00:24:14.074Z · 3 medições por página e perfil · medianas por categoria.

## Ambiente

- Lighthouse 13.5.0 (API Node) · Chromium headless 156.0.8078.4
- Node v24.16.0 · Darwin 25.3.0 · Apple M1 Pro (8 núcleos)
- Build: `vite build` (nft-marketplace@0.0.0) servido por `vite preview` em http://localhost:4173, mocks MSW ativos no cenário padrão
- Perfil mobile: configuração padrão do Lighthouse (Moto G Power emulado, throttling simulado 4G lento). Perfil desktop: preset `desktop-config` (sem throttling de CPU, rede 10 Mbps)

## Medianas

| Página          | Perfil  | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS   | TBT (ms) |
| --------------- | ------- | ----------- | ------------- | -------------- | --- | -------- | ----- | -------- |
| Início          | mobile  | 92          | 100           | 100            | 100 | 3140     | 0.000 | 42       |
| Início          | desktop | 98          | 100           | 100            | 100 | 1017     | 0.000 | 0        |
| Detalhes do NFT | mobile  | 92          | 100           | 100            | 100 | 3097     | 0.000 | 27       |
| Detalhes do NFT | desktop | 99          | 100           | 100            | 100 | 847      | 0.000 | 0        |

## Metas

Performance ≥ 90 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 90

Todas as medianas atingiram as metas.

## Medições individuais

### Início · mobile

| Medição | Perf | A11y | BP  | SEO | LCP (ms) | CLS   | TBT (ms) | Relatório                                                                   |
| ------- | ---- | ---- | --- | --- | -------- | ----- | -------- | --------------------------------------------------------------------------- |
| 1       | 91   | 100  | 100 | 100 | 3244     | 0.000 | 42       | [html](reports/inicio-mobile-1.html) · [json](reports/inicio-mobile-1.json) |
| 2       | 92   | 100  | 100 | 100 | 3094     | 0.000 | 38       | [html](reports/inicio-mobile-2.html) · [json](reports/inicio-mobile-2.json) |
| 3       | 92   | 100  | 100 | 100 | 3140     | 0.000 | 43       | [html](reports/inicio-mobile-3.html) · [json](reports/inicio-mobile-3.json) |

### Início · desktop

| Medição | Perf | A11y | BP  | SEO | LCP (ms) | CLS   | TBT (ms) | Relatório                                                                     |
| ------- | ---- | ---- | --- | --- | -------- | ----- | -------- | ----------------------------------------------------------------------------- |
| 1       | 98   | 100  | 100 | 100 | 1043     | 0.000 | 0        | [html](reports/inicio-desktop-1.html) · [json](reports/inicio-desktop-1.json) |
| 2       | 98   | 100  | 100 | 100 | 1017     | 0.000 | 0        | [html](reports/inicio-desktop-2.html) · [json](reports/inicio-desktop-2.json) |
| 3       | 99   | 100  | 100 | 100 | 837      | 0.000 | 0        | [html](reports/inicio-desktop-3.html) · [json](reports/inicio-desktop-3.json) |

### Detalhes do NFT · mobile

| Medição | Perf | A11y | BP  | SEO | LCP (ms) | CLS   | TBT (ms) | Relatório                                                                     |
| ------- | ---- | ---- | --- | --- | -------- | ----- | -------- | ----------------------------------------------------------------------------- |
| 1       | 92   | 100  | 100 | 100 | 3097     | 0.000 | 28       | [html](reports/detalhe-mobile-1.html) · [json](reports/detalhe-mobile-1.json) |
| 2       | 92   | 100  | 100 | 100 | 3091     | 0.000 | 27       | [html](reports/detalhe-mobile-2.html) · [json](reports/detalhe-mobile-2.json) |
| 3       | 91   | 100  | 100 | 100 | 3255     | 0.000 | 26       | [html](reports/detalhe-mobile-3.html) · [json](reports/detalhe-mobile-3.json) |

### Detalhes do NFT · desktop

| Medição | Perf | A11y | BP  | SEO | LCP (ms) | CLS   | TBT (ms) | Relatório                                                                       |
| ------- | ---- | ---- | --- | --- | -------- | ----- | -------- | ------------------------------------------------------------------------------- |
| 1       | 99   | 100  | 100 | 100 | 847      | 0.000 | 0        | [html](reports/detalhe-desktop-1.html) · [json](reports/detalhe-desktop-1.json) |
| 2       | 99   | 100  | 100 | 100 | 784      | 0.000 | 0        | [html](reports/detalhe-desktop-2.html) · [json](reports/detalhe-desktop-2.json) |
| 3       | 99   | 100  | 100 | 100 | 849      | 0.000 | 0        | [html](reports/detalhe-desktop-3.html) · [json](reports/detalhe-desktop-3.json) |
