// src/components/Navbar.tsx
import { Link } from 'react-router-dom';

interface NavbarProps {
  token: string | null;
  role: 'user' | 'admin' | null;
  onLogout: () => void;
}

export default function Navbar({ token, role, onLogout }: NavbarProps) {
  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        borderBottom: '1px solid #ccc',
      }}
    >
      <Link to="/" style={{ fontWeight: 600, fontSize: '1.2rem' }}>
        ✂️ BarberBooking
      </Link>

      <div style={{ display: 'flex', gap: '1rem' }}>
        {!token && <Link to="/login">Login</Link>}
        {token && role === 'user' && <Link to="/dashboard">My Bookings</Link>}
        {token && role === 'admin' && <Link to="/admin/bookings">Admin</Link>}
        {token && (
          <button onClick={onLogout} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
