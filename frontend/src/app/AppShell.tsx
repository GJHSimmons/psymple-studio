import { Outlet } from 'react-router-dom';
import { NavRail } from './NavRail';
import styles from './AppShell.module.css';

export function AppShell() {
  return (
    <div className={styles.root}>
      <NavRail />
      <div className={styles.main}>
        <div className={styles.scroll}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
