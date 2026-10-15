import { DEFAULT_SCENARIO_ID, findScenario, type MockScenario } from './scenarios';

const STORAGE_KEY = 'kurio.mock.scenario';
const QUERY_PARAM = 'mock';

interface RuntimeState {
  scenario: MockScenario;
  /** Flags consumidas uma única vez por cenário (ex.: timeout só na primeira criação). */
  consumed: Set<string>;
}

const listeners = new Set<(scenario: MockScenario) => void>();

function readInitialScenarioId(): string {
  if (typeof window === 'undefined') return DEFAULT_SCENARIO_ID;
  const fromQuery = new URLSearchParams(window.location.search).get(QUERY_PARAM);
  if (fromQuery) {
    try {
      window.localStorage.setItem(STORAGE_KEY, fromQuery);
    } catch {
      // Armazenamento indisponível (modo privado): segue só em memória.
    }
    return fromQuery;
  }
  const fallback = import.meta.env.VITE_MOCK_SCENARIO || DEFAULT_SCENARIO_ID;
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? fallback;
  } catch {
    return fallback;
  }
}

const state: RuntimeState = {
  scenario: findScenario(readInitialScenarioId()),
  consumed: new Set(),
};

export function getScenario(): MockScenario {
  return state.scenario;
}

export function setScenario(id: string): MockScenario {
  state.scenario = findScenario(id);
  state.consumed.clear();
  try {
    window.localStorage.setItem(STORAGE_KEY, state.scenario.id);
  } catch {
    // ignorado
  }
  listeners.forEach((listener) => listener(state.scenario));
  return state.scenario;
}

export function onScenarioChange(listener: (scenario: MockScenario) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Retorna true apenas na primeira vez que a flag é consultada para o cenário atual. */
export function consumeOnce(flag: string): boolean {
  if (state.consumed.has(flag)) return false;
  state.consumed.add(flag);
  return true;
}

export function resetConsumedFlags(): void {
  state.consumed.clear();
}

export function scenarioLatency(): number {
  const { latency } = state.scenario;
  if (!latency) return 0;
  return Math.floor(latency.min + Math.random() * (latency.max - latency.min));
}
