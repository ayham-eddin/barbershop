// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminBookingsPage from './pages/Admin/AdminBookingsPage';
import BookingPage from './pages/BookingPage';
import AdminServicesPage from './pages/Admin/AdminServicesPage'; // ⬅️ add this
import { useState, useEffect } from 'react';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<'user' | 'admin' | null>(
    (localStorage.getItem('role') as 'user' | 'admin' | null) || null
  );

  useEffect(() => {
    const onStorage = () => {
      setToken(localStorage.getItem('token'));
      setRole((localStorage.getItem('role') as 'user' | 'admin' | null) || null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100/30 text-neutral-900">
        <Navbar token={token} role={role} onLogout={handleLogout} />

        <main className="max-w-6xl mx-auto px-6 py-10">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/login"
              element={<LoginPage onLogin={(t, r) => { setToken(t); setRole(r); }} />}
            />
            <Route
              path="/book"
              element={token ? <BookingPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/dashboard"
              element={token ? <DashboardPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/bookings"
              element={token && role === 'admin' ? <AdminBookingsPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/services"   // ⬅️ new route
              element={token && role === 'admin' ? <AdminServicesPage /> : <Navigate to="/login" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <footer className="border-t border-neutral-200 mt-12 py-6 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} BarberBooking. Crafted with ✂️ and care.
        </footer>
      </div>
    </Router>
  );
}
