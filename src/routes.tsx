import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ClientesListPage from './pages/ClientesListPage';
import ClienteDetailPage from './pages/ClienteDetailPage';
import ClienteFormPage from './pages/ClienteFormPage';
import FuncionariosPage from './pages/FuncionariosPage';
import ObraDetailPage from './pages/ObraDetailPage';
import ObraFormPage from './pages/ObraFormPage';
import ObrasListPage from './pages/ObrasListPage';
import MateriaisPage from './pages/MateriaisPage';
import FinancialDashboardPage from './pages/FinancialDashboardPage';
import NotFound from './pages/NotFound';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Dashboard',
    path: '/',
    element: <DashboardPage />
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />
  },
  {
    name: 'Clientes',
    path: '/clientes',
    element: <ClientesListPage />
  },
  {
    name: 'Cliente Detail',
    path: '/clientes/:id',
    element: <ClienteDetailPage />
  },
  {
    name: 'Novo Cliente',
    path: '/clientes/novo',
    element: <ClienteFormPage />
  },
  {
    name: 'Editar Cliente',
    path: '/clientes/:id/editar',
    element: <ClienteFormPage />
  },
  {
    name: 'Obras',
    path: '/obras',
    element: <ObrasListPage />
  },
  {
    name: 'Obra Detail',
    path: '/obras/:id',
    element: <ObraDetailPage />
  },
  {
    name: 'Nova Obra',
    path: '/obras/nova',
    element: <ObraFormPage />
  },
  {
    name: 'Editar Obra',
    path: '/obras/:id/editar',
    element: <ObraFormPage />
  },
  {
    name: 'Funcionários',
    path: '/funcionarios',
    element: <FuncionariosPage />
  },
  {
    name: 'Materiais',
    path: '/materiais',
    element: <MateriaisPage />
  },
  {
    name: 'Financeiro',
    path: '/financeiro',
    element: <FinancialDashboardPage />
  },
  {
    name: 'Not Found',
    path: '*',
    element: <NotFound />
  }
];

export default routes;
