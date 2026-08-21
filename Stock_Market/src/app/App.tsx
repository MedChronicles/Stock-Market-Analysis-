import { RouterProvider } from 'react-router';
import { TradingProvider } from './context/TradingContext';
import { router } from './routes';

export default function App() {
  return (
    <TradingProvider>
      <RouterProvider router={router} />
    </TradingProvider>
  );
}