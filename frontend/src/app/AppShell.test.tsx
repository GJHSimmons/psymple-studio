import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, beforeEach } from 'vitest';
import { useRoutes } from 'react-router-dom';
import { routes } from './routes';
import { useAppStore } from '../store/useAppStore';

function App() {
  return useRoutes(routes);
}

function renderApp(initialPath = '/models') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    useAppStore.setState({ railCollapsed: false });
  });

  it('renders all four nav destinations', () => {
    renderApp();
    expect(screen.getByRole('link', { name: /models/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /builder/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /compilation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /simulation/i })).toBeInTheDocument();
  });

  it('redirects the index route to Models and shows its placeholder', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { name: 'Models' })).toBeInTheDocument();
  });

  it('routes to the Simulation placeholder screen', () => {
    renderApp('/simulation');
    expect(screen.getByRole('heading', { name: 'Simulation' })).toBeInTheDocument();
  });

  it('collapses and expands the rail via the toggle', async () => {
    const user = userEvent.setup();
    renderApp();
    const toggle = screen.getByTitle('Collapse sidebar');
    await user.click(toggle);
    expect(useAppStore.getState().railCollapsed).toBe(true);
    expect(screen.getByTitle('Expand sidebar')).toBeInTheDocument();
  });
});
