import { BusinessProvider, useBusiness } from './context/BusinessContext';
import { LayoutShell } from './components/LayoutShell';
import { AuthAndOnboarding } from './components/AuthAndOnboarding';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { PricingCalculatorView } from './components/PricingCalculatorView';
import { OrdersView } from './components/OrdersView';
import { InventoryView } from './components/InventoryView';
import { CustomersView } from './components/CustomersView';
import { ExpensesView } from './components/ExpensesView';
import { FinanceView } from './components/FinanceView';
import { GoalsView } from './components/GoalsView';
import { ReportsView } from './components/ReportsView';
import { BusinessAdvisorView } from './components/BusinessAdvisorView';
import { SettingsView } from './components/SettingsView';

function MainRouter() {
  const { activeSection } = useBusiness();

  switch (activeSection) {
    case 'dashboard':
      return <DashboardView />;
    case 'products':
      return <ProductsView />;
    case 'pricing':
      return <PricingCalculatorView />;
    case 'orders':
      return <OrdersView />;
    case 'inventory':
      return <InventoryView />;
    case 'customers':
      return <CustomersView />;
    case 'expenses':
      return <ExpensesView />;
    case 'finance':
      return <FinanceView />;
    case 'goals':
      return <GoalsView />;
    case 'reports':
      return <ReportsView />;
    case 'advisor':
      return <BusinessAdvisorView />;
    case 'settings':
      return <SettingsView />;
    default:
      return <DashboardView />;
  }
}

export default function App() {
  return (
    <BusinessProvider>
      <LayoutShell>
        <MainRouter />
      </LayoutShell>
      <AuthAndOnboarding />
    </BusinessProvider>
  );
}
