import { Navigate, type RouteObject } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ModelsScreen, BuilderScreen, CompilationScreen, SimulationScreen } from '../screens';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/models" replace /> },
      { path: 'models', element: <ModelsScreen /> },
      { path: 'builder', element: <BuilderScreen /> },
      { path: 'compilation', element: <CompilationScreen /> },
      { path: 'simulation', element: <SimulationScreen /> },
    ],
  },
];
