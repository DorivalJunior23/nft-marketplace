/**
 * Auditoria Lighthouse: Início e Detalhe do NFT, perfis mobile e desktop, 3 medições cada,
 * contra o build otimizado servido pelo `vite preview` com o cenário padrão dos mocks.
 * Gera relatórios HTML/JSON em lighthouse/reports e o resumo com medianas em lighthouse/RESULTS.md.
 *
 * Uso: npm run lighthouse (sobe o preview sozinho) ou LH_URL=https://... npm run lighthouse
 */
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';

const BASE_URL = process.env.LH_URL ?? 'http://localhost:4173';
const RUNS = Number(process.env.LH_RUNS ?? 3);
const PAGES = [
  { id: 'inicio', label: 'Início', path: '/' },
  { id: 'detalhe', label: 'Detalhes do NFT', path: '/nft/emerald-ape-0042' },
];
const PROFILES = [
  { id: 'mobile', config: undefined },
  { id: 'desktop', config: desktopConfig },
];
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const TARGETS = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 };
const REPORTS_DIR = path.resolve('lighthouse/reports');

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Servidor não respondeu em ${url}`);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function main() {
  let preview = null;
  if (!process.env.LH_URL) {
    preview = spawn('npm', ['run', 'preview', '--', '--strictPort'], { stdio: 'ignore' });
    await waitForServer(BASE_URL);
  }
  await mkdir(REPORTS_DIR, { recursive: true });

  // Usa o Chromium do Playwright (já instalado para os testes) quando não houver Chrome no sistema.
  const chromePath = process.env.CHROME_PATH ?? chromium.executablePath();
  const chromeVersion = await chromium.launch().then(async (b) => {
    const v = b.version();
    await b.close();
    return v;
  });
  const chrome = await launch({
    chromePath,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  });
  const results = [];
  try {
    for (const page of PAGES) {
      for (const profile of PROFILES) {
        const samples = [];
        for (let run = 1; run <= RUNS; run++) {
          const result = await lighthouse(
            `${BASE_URL}${page.path}`,
            {
              port: chrome.port,
              output: ['html', 'json'],
              logLevel: 'error',
              onlyCategories: CATEGORIES,
            },
            profile.config,
          );
          const lhr = result.lhr;
          const name = `${page.id}-${profile.id}-${run}`;
          await writeFile(path.join(REPORTS_DIR, `${name}.html`), result.report[0]);
          await writeFile(path.join(REPORTS_DIR, `${name}.json`), result.report[1]);
          const sample = {
            run,
            scores: Object.fromEntries(
              CATEGORIES.map((c) => [c, Math.round((lhr.categories[c]?.score ?? 0) * 100)]),
            ),
            lcp: lhr.audits['largest-contentful-paint']?.numericValue ?? 0,
            cls: lhr.audits['cumulative-layout-shift']?.numericValue ?? 0,
            tbt: lhr.audits['total-blocking-time']?.numericValue ?? 0,
          };
          samples.push(sample);
          console.log(
            name,
            sample.scores,
            `LCP ${Math.round(sample.lcp)}ms CLS ${sample.cls.toFixed(3)} TBT ${Math.round(sample.tbt)}ms`,
          );
        }
        results.push({
          page,
          profile,
          samples,
          lighthouseVersion: (await import('lighthouse/package.json', { with: { type: 'json' } }))
            .default.version,
        });
      }
    }
  } finally {
    await chrome.kill();
    preview?.kill();
  }

  const pkg = JSON.parse(await readFile(path.resolve('package.json'), 'utf8'));
  const lines = [
    '# Resultados do Lighthouse',
    '',
    `Gerado em ${new Date().toISOString()} · ${RUNS} medições por página e perfil · medianas por categoria.`,
    '',
    '## Ambiente',
    '',
    `- Lighthouse ${results[0]?.lighthouseVersion ?? '?'} (API Node) · Chromium headless ${chromeVersion}`,
    `- Node ${process.version} · ${os.type()} ${os.release()} · ${os.cpus()[0]?.model ?? 'cpu'} (${os.cpus().length} núcleos)`,
    `- Build: \`vite build\` (${pkg.name}@${pkg.version}) servido por \`vite preview\` em ${BASE_URL}, mocks MSW ativos no cenário padrão`,
    '- Perfil mobile: configuração padrão do Lighthouse (Moto G Power emulado, throttling simulado 4G lento). Perfil desktop: preset `desktop-config` (sem throttling de CPU, rede 10 Mbps)',
    '',
    '## Medianas',
    '',
    '| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  const failures = [];
  for (const { page, profile, samples } of results) {
    const med = (key) => median(samples.map((s) => s.scores[key]));
    const row = CATEGORIES.map((c) => {
      const value = med(c);
      if (value < TARGETS[c])
        failures.push(`${page.label} (${profile.id}) · ${c}: ${value} < ${TARGETS[c]}`);
      return value;
    });
    lines.push(
      `| ${page.label} | ${profile.id} | ${row.join(' | ')} | ${Math.round(median(samples.map((s) => s.lcp)))} | ${median(samples.map((s) => s.cls)).toFixed(3)} | ${Math.round(median(samples.map((s) => s.tbt)))} |`,
    );
  }
  lines.push(
    '',
    '## Metas',
    '',
    'Performance ≥ 90 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 90',
    '',
  );
  lines.push(
    failures.length
      ? `### Abaixo da meta\n\n${failures.map((f) => `- ${f}`).join('\n')}\n`
      : 'Todas as medianas atingiram as metas.\n',
  );
  lines.push('## Medições individuais', '');
  for (const { page, profile, samples } of results) {
    lines.push(
      `### ${page.label} · ${profile.id}`,
      '',
      '| Medição | Perf | A11y | BP | SEO | LCP (ms) | CLS | TBT (ms) | Relatório |',
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    );
    for (const s of samples) {
      lines.push(
        `| ${s.run} | ${s.scores.performance} | ${s.scores.accessibility} | ${s.scores['best-practices']} | ${s.scores.seo} | ${Math.round(s.lcp)} | ${s.cls.toFixed(3)} | ${Math.round(s.tbt)} | [html](reports/${page.id}-${profile.id}-${s.run}.html) · [json](reports/${page.id}-${profile.id}-${s.run}.json) |`,
      );
    }
    lines.push('');
  }
  await writeFile(path.resolve('lighthouse/RESULTS.md'), lines.join('\n'));
  console.log('Resumo em lighthouse/RESULTS.md');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
