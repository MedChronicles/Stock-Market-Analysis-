import { createBrowserRouter } from 'react-router';
import LoginRegister from './screens/LoginRegister';
import Dashboard from './screens/Dashboard';
import BrowseCompanies from './screens/BrowseCompanies';
import OrderBook from './screens/OrderBook';
import BuyStock from './screens/BuyStock';
import SellStock from './screens/SellStock';
import Portfolio from './screens/Portfolio';
import TradeHistory from './screens/TradeHistory';
import AdminPanel from './screens/AdminPanel';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginRegister />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/companies',
    element: <BrowseCompanies />,
  },
  {
    path: '/orderbook',
    element: <OrderBook />,
  },
  {
    path: '/buy',
    element: <BuyStock />,
  },
  {
    path: '/sell',
    element: <SellStock />,
  },
  {
    path: '/portfolio',
    element: <Portfolio />,
  },
  {
    path: '/history',
    element: <TradeHistory />,
  },
  {
    path: '/admin',
    element: <AdminPanel />,
  },
]);
