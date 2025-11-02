// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminBookingsPage from './pages/AdminBookingsPage';
import Navbar from './components/Navbar';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<'user' | 'admin' | null>(null);

  useEffect(() => {
    // Decode role from token (naive version)
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setRole(payload.role);
      } catch {
        setRole(null);
      }
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setRole(null);
  };

  return (
    <BrowserRouter>
      <Navbar token={token} role={role} onLogout={handleLogout} />

      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage setToken={setToken} />} />
          <Route
            path="/dashboard"
            element={token ? <DashboardPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin/bookings"
            element={
              token && role === 'admin' ? (
                <AdminBookingsPage />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
