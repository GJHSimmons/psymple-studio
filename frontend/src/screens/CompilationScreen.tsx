import { Button } from '../ui/Button';
import { useModelStore } from '../store/useModelStore';
import styles from './EngineDemo.module.css';

/**
 * PROVISIONAL demonstrator (issue #4, Engine stream). Proves the seed model
 * compiles through the real psymple backend and exercises the loading/error
 * path. The Screens stream replaces this body with the real Compilation view
 * (mapping tabs, KaTeX-rendered ODEs); it consumes the same `useModelStore` API.
 */
export function CompilationScreen() {
  const compile = useModelStore((s) => s.compile);
  const status = useModelStore((s) => s.compileStatus);
  const compiled = useModelStore((s) => s.compiled);
  const error = useModelStore((s) => s.compileError);

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>ecosystem → simulable system</p>
        <h1 className={styles.title}>Compilation</h1>
        <p className={styles.provisional}>
          Provisional engine demonstrator (#4). Compiles the seed ecosystem via
          the backend. The Screens stream replaces this with the real view.
        </p>
      </div>

      <div className={styles.controls}>
        <Button
          variant="primary"
          onClick={() => void compile()}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Compiling…' : 'Compile seed model'}
        </Button>
        {status === 'ready' && (
          <span className={styles.status}>
            {compiled?.odes.length} ODEs · {Object.keys(compiled?.context ?? {}).length}{' '}
            params · {Object.keys(compiled?.functions ?? {}).length} functions
          </span>
        )}
      </div>

      {status === 'error' && <div className={styles.banner}>{error}</div>}

      {status === 'ready' && compiled && (
        <div className={styles.readout}>
          <div className={styles.sectionLabel}>ODEs</div>
          {compiled.odes.map((ode) => `d(${ode.variable})/dt = ${ode.expression}`).join('\n')}

          <div className={styles.sectionLabel}>Context (resolved parameters)</div>
          {formatMap(mapNumbers(compiled.context))}

          <div className={styles.sectionLabel}>Functions (parameters over inputs)</div>
          {Object.keys(compiled.functions).length ? formatMap(compiled.functions) : '(none)'}

          <div className={styles.sectionLabel}>Required inputs</div>
          {compiled.requiredInputs.length ? compiled.requiredInputs.join(', ') : '(none)'}

          <div className={styles.sectionLabel}>Variable mappings</div>
          {formatMap(compiled.variableMappings)}

          <div className={styles.sectionLabel}>Parameter mappings</div>
          {formatMap(compiled.parameterMappings)}
        </div>
      )}
    </div>
  );
}

function mapNumbers(map: Record<string, number>): Record<string, string> {
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, String(v)]));
}

function formatMap(map: Record<string, string>): string {
  const entries = Object.entries(map);
  if (!entries.length) return '(none)';
  return entries.map(([k, v]) => `${k} → ${v}`).join('\n');
}
