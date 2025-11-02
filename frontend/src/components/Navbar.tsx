import { Link } from 'react-router-dom';

interface NavbarProps {
  token: string | null;
  role: 'user' | 'admin' | null;
  onLogout: () => void;
}

export default function Navbar({ token, role, onLogout }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-semibold text-lg tracking-tight text-gray-900">
          <span className="mr-2">✂️</span> BarberBooking
        </Link>

        <div className="flex items-center gap-4">
          {!token && (
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Login
            </Link>
          )}

          {token && role === 'user' && (
            <Link
              to="/dashboard"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              My Bookings
            </Link>
          )}

          {token && role === 'admin' && (
            <Link
              to="/admin/bookings"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Admin
            </Link>
          )}

          {token && (
            <button
              onClick={onLogout}
              className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg px-3 py-1.5"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
