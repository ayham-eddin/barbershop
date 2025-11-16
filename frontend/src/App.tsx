import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminBookingsPage from './pages/Admin/AdminBookingsPage';
import AdminUsersPage from './pages/Admin/AdminUsersPage';
import BookingPage from './pages/BookingPage';
import AdminServicesPage from './pages/Admin/AdminServicesPage';
import AdminTimeOffPage from './pages/Admin/AdminTimeOffPage';
import AdminBarbersPage from './pages/Admin/AdminBarbersPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import { useState, useEffect } from 'react';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<'user' | 'admin' | null>(
    (localStorage.getItem('role') as 'user' | 'admin' | null) || null,
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
              path="/profile"
              element={token ? <ProfilePage /> : <Navigate to="/login" />}
            />
            <Route 
              path="/about" 
              element={<AboutPage />} 
            />
            <Route 
              path="/contact" 
              element={<ContactPage />} 
            />

            <Route
              path="/admin/bookings"
              element={token && role === 'admin' ? <AdminBookingsPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/services"
              element={token && role === 'admin' ? <AdminServicesPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/barbers"
              element={token && role === 'admin' ? <AdminBarbersPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/users"
              element={token && role === 'admin' ? <AdminUsersPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/timeoff"
              element={token && role === 'admin' ? <AdminTimeOffPage /> : <Navigate to="/login" />}
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <footer className="border-t border-neutral-200 mt-12 py-6 text-center text-sm text-neutral-500">
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-4">
              <Link
                to="/about"
                className="hover:text-neutral-800 underline underline-offset-4 decoration-neutral-300"
              >
                About
              </Link>
              <Link
                to="/contact"
                className="hover:text-neutral-800 underline underline-offset-4 decoration-neutral-300"
              >
                Contact
              </Link>
            </div>
            <p>
              © {new Date().getFullYear()} BarberBooking. Crafted with ✂️ and care.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
