import React from 'react';
import AOS from "aos";
import "aos/dist/aos.css";
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppToaster from './components/Toaster';
import App from './App.tsx';
import './index.css';


AOS.init({ duration: 700, once: true });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* Bottom-right notifications */}
      <AppToaster />
    </QueryClientProvider>
  </React.StrictMode>,
);
