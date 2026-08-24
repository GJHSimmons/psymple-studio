import { useRoutes } from 'react-router-dom';
import { routes } from './app/routes';

export function App() {
  return useRoutes(routes);
}
