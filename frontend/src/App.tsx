import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminBookingsPage from './pages/Admin/AdminBookingsPage';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<'user' | 'admin' | null>(
    (localStorage.getItem('role') as 'user' | 'admin' | null) || null
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {/* Background accent */}
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100/30 text-neutral-900">
          <Navbar token={token} role={role} onLogout={handleLogout} />

          <main className="max-w-6xl mx-auto px-6 py-10">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/login"
                element={<LoginPage onLogin={(t, r) => { setToken(t); setRole(r); }} />}
              />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/admin/bookings" element={<AdminBookingsPage />} />
            </Routes>
          </main>

          <footer className="border-t border-neutral-200 mt-12 py-6 text-center text-sm text-neutral-500">
            © {new Date().getFullYear()} BarberBooking. Crafted with ✂️ and care.
          </footer>
        </div>
      </Router>
    </QueryClientProvider>
  );
}
