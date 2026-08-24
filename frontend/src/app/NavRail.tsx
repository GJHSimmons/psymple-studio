import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from '../ui/Icon';
import { useAppStore } from '../store/useAppStore';
import styles from './NavRail.module.css';

interface NavDestination {
  to: string;
  label: string;
  icon: IconName;
}

const DESTINATIONS: NavDestination[] = [
  { to: '/models', label: 'Models', icon: 'grid' },
  { to: '/builder', label: 'Builder', icon: 'network' },
  { to: '/compilation', label: 'Compilation', icon: 'sigma' },
  { to: '/simulation', label: 'Simulation', icon: 'chart' },
];

export function NavRail() {
  const railCollapsed = useAppStore((state) => state.railCollapsed);
  const toggleRail = useAppStore((state) => state.toggleRail);

  return (
    <aside className={[styles.rail, railCollapsed ? styles.collapsed : ''].filter(Boolean).join(' ')}>
      <div className={styles.brand}>
        <div className={styles.brandMark} />
        <span className={styles.brandName}>Psymple Studio</span>
      </div>

      <nav className={styles.nav}>
        {DESTINATIONS.map((destination) => (
          <NavLink
            key={destination.to}
            to={destination.to}
            title={destination.label}
            className={({ isActive }) => [styles.navItem, isActive ? styles.active : ''].filter(Boolean).join(' ')}
          >
            <Icon name={destination.icon} />
            <span className={styles.navLabel}>{destination.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.toggle}
          onClick={toggleRail}
          title={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon name="collapse" size={16} />
          <span className={styles.toggleLabel}>Collapse</span>
        </button>
        <div className={styles.version}>
          <span className={styles.versionDot} />
          research prototype · v0.4
        </div>
      </div>
    </aside>
  );
}
