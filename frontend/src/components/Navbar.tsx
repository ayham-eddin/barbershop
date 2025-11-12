import { Link, NavLink } from 'react-router-dom';

interface NavbarProps {
  token: string | null;
  role: 'user' | 'admin' | null;
  onLogout: () => void;
}

export default function Navbar({ token, role, onLogout }: NavbarProps) {
  const linkClass = 'text-sm font-medium text-gray-300 hover:text-white transition-colors';

  return (
    <nav className="sticky top-0 z-10 bg-neutral-900/90 backdrop-blur border-b border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="group inline-flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-amber-500/90 flex items-center justify-center ring-1 ring-amber-400/50">
            <span className="text-xs font-bold text-neutral-900">✂️</span>
          </div>
          <span className="font-semibold text-white tracking-tight">
            Barber<span className="text-amber-400">Booking</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {(!token || role === 'user') && (
            <NavLink
              to="/book"
              className="text-sm font-semibold text-neutral-900 bg-amber-400 hover:bg-amber-300 rounded-lg px-3 py-1.5 transition"
            >
              Book
            </NavLink>
          )}

          {token && role === 'admin' && (
            <>
              <NavLink to="/admin/bookings" className={linkClass}>
                Bookings
              </NavLink>
              <NavLink to="/admin/services" className={linkClass}>
                Services
              </NavLink>
              <NavLink to="/admin/users" className={linkClass}>
                Users
              </NavLink>
            </>
          )}

          {token && role === 'user' && (
            <NavLink to="/dashboard" className={linkClass}>
              My Bookings
            </NavLink>
          )}

          {token && (
            <NavLink to="/profile" className={linkClass}>
              Profile
            </NavLink>
          )}

          {!token && <NavLink to="/login" className={linkClass}>Login</NavLink>}

          {token && (
            <button
              onClick={onLogout}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
