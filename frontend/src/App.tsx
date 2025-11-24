import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from 'react-router-dom';
import { useState, useEffect, type ReactNode } from 'react';

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
import Footer from './components/Footer';

type Role = 'user' | 'admin' | null;

/* --------------------------- Route guards --------------------------- */

function RequireAuth({
  token,
  children,
}: {
  token: string | null;
  children: ReactNode;
}) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RequireAdmin({
  token,
  role,
  children,
}: {
  token: string | null;
  role: Role;
  children: ReactNode;
}) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (role !== 'admin') {
    // logged in but not admin → send to home
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

/* ------------------------------- App ------------------------------- */

const App = () => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token'),
  );
  const [role, setRole] = useState<Role>(
    (localStorage.getItem('role') as Role) || null,
  );
  // listen to localStorage changes (multi-tab support)
  useEffect(() => {
    const onStorage = () => {
      setToken(localStorage.getItem('token'));
      setRole((localStorage.getItem('role') as Role) || null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
  };

  return (
    <Router>
      <div className="min-h-screen from-amber-50 via-white to-amber-100/30 text-white">
        <Navbar token={token} role={role} onLogout={handleLogout} />

        <main className="max-w-6xl mx-auto px-6 py-10">
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />

            <Route
              path="/login"
              element={
                <LoginPage
                  onLogin={(t, r) => {
                    setToken(t);
                    setRole(r);
                  }}
                />
              }
            />

            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* User-only */}
            <Route
              path="/book"
              element={
                <RequireAuth token={token}>
                  <BookingPage />
                </RequireAuth>
              }
            />

            <Route
              path="/dashboard"
              element={
                <RequireAuth token={token}>
                  <DashboardPage />
                </RequireAuth>
              }
            />

            <Route
              path="/profile"
              element={
                <RequireAuth token={token}>
                  <ProfilePage />
                </RequireAuth>
              }
            />

            {/* Admin-only */}
            <Route
              path="/admin/bookings"
              element={
                <RequireAdmin token={token} role={role}>
                  <AdminBookingsPage />
                </RequireAdmin>
              }
            />

            <Route
              path="/admin/services"
              element={
                <RequireAdmin token={token} role={role}>
                  <AdminServicesPage />
                </RequireAdmin>
              }
            />

            <Route
              path="/admin/barbers"
              element={
                <RequireAdmin token={token} role={role}>
                  <AdminBarbersPage />
                </RequireAdmin>
              }
            />

            <Route
              path="/admin/users"
              element={
                <RequireAdmin token={token} role={role}>
                  <AdminUsersPage />
                </RequireAdmin>
              }
            />

            <Route
              path="/admin/timeoff"
              element={
                <RequireAdmin token={token} role={role}>
                  <AdminTimeOffPage />
                </RequireAdmin>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer className='text-white bg-black'>
          <div className="flex gap-4 text-white">
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
              © {new Date().getFullYear()} Ayham Eddin. Crafted with ✂️ and
              care.
            </p>
        </Footer>
      </div>
    </Router>
  );
}
export default App;
