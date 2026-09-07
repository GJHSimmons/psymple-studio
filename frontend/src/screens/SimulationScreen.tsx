import { Button } from '../ui/Button';
import { useModelStore } from '../store/useModelStore';
import styles from './EngineDemo.module.css';

/**
 * PROVISIONAL demonstrator (issue #4, Engine stream). Runs the seed model
 * through the real backend at fixed initial conditions and plots nothing yet —
 * it just proves the round-trip and the loading/error path. The Screens stream
 * replaces this with parameter controls and SVG charts, consuming the same
 * `useModelStore` API. Series are read against the returned `times`.
 */

// Seed initial conditions, keyed by the surface variable symbols (x, y).
const SEED_INITIAL_VALUES = { x: 1, y: 0.1 };
const SEED_T_END = 100;

export function SimulationScreen() {
  const simulate = useModelStore((s) => s.simulate);
  const status = useModelStore((s) => s.simulateStatus);
  const simulation = useModelStore((s) => s.simulation);
  const error = useModelStore((s) => s.simulateError);

  const run = () =>
    void simulate({
      initialValues: SEED_INITIAL_VALUES,
      tEnd: SEED_T_END,
      solver: 'continuous',
    });

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>numerical integration</p>
        <h1 className={styles.title}>Simulation</h1>
        <p className={styles.provisional}>
          Provisional engine demonstrator (#4). Simulates the seed ecosystem via
          the backend at fixed conditions. The Screens stream replaces this with
          parameter controls and charts.
        </p>
      </div>

      <div className={styles.controls}>
        <Button variant="primary" onClick={run} disabled={status === 'loading'}>
          {status === 'loading' ? 'Simulating…' : 'Run seed simulation'}
        </Button>
        {status === 'ready' && simulation && (
          <span className={styles.status}>
            {simulation.times.length} samples · t ∈ [
            {simulation.times[0]}, {simulation.times[simulation.times.length - 1]}]
          </span>
        )}
      </div>

      {status === 'error' && <div className={styles.banner}>{error}</div>}

      {status === 'ready' && simulation && (
        <div className={styles.readout}>
          <div className={styles.sectionLabel}>Final sample</div>
          {Object.entries(simulation.series)
            .map(([name, values]) => `${name} = ${values[values.length - 1].toFixed(4)}`)
            .join('\n')}

          <div className={styles.sectionLabel}>First 5 samples</div>
          {formatPreview(simulation.times, simulation.series)}
        </div>
      )}
    </div>
  );
}

function formatPreview(
  times: number[],
  series: Record<string, number[]>,
): string {
  const names = Object.keys(series);
  const header = ['t', ...names].join('\t');
  const rows = times.slice(0, 5).map((t, i) =>
    [t, ...names.map((n) => series[n][i].toFixed(4))].join('\t'),
  );
  return [header, ...rows].join('\n');
}
