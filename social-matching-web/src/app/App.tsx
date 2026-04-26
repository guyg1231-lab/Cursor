import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import { ScrollToTopOnNavigation } from './router/ScrollToTopOnNavigation';
import { AppRouter } from './router/AppRouter';

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <ScrollToTopOnNavigation />
        <AppRouter />
      </BrowserRouter>
    </AppProviders>
  );
}
